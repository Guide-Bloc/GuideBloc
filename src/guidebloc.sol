// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

import {IGuideBloc} from "./interfaces/IGuideBloc.sol";

/**
 * @title GuideBloc
 * @notice Immutable, non-upgradeable escrow for a tour-guide marketplace on Avalanche C-Chain (V3).
 *
 * @dev Design summary
 *  - `bookingId` is the EIP-712 digest of a guide-signed `Quote`; it is never caller supplied.
 *  - Payouts follow a pull pattern: settlement only credits `claimable[account][token]`.
 *  - Every payout goes through the single internal `_settle` path.
 *  - There is NO rescue, sweep or arbitrary-transfer function. Tokens leave the contract only
 *    through `withdraw` / `withdrawFor`, and only up to the caller's own `claimable` balance.
 *  - No proxies, no delegatecall, no selfdestruct, no inline assembly.
 *
 * Rounding policy (documented, applied consistently):
 *  - The tourist share of any split is `amount * touristBps / 10_000`, rounded DOWN.
 *  - The guide gross share is the exact remainder `amount - touristShare` (so no dust is created or lost).
 *  - Commission is `guideGross * commissionBps / 10_000`, rounded DOWN (the guide keeps the remainder).
 *  - The dispute bond is `max(MIN_DISPUTE_BOND, amount * disputeBondBps / 10_000)`, rounded DOWN before the floor.
 *
 * Token support: 6-decimal stablecoins only (USDC, USDT). Fee-on-transfer, rebasing and ERC-777 tokens are
 * rejected by an exact balance-delta check on every pull.
 */
contract GuideBloc is IGuideBloc, AccessControl, Pausable, ReentrancyGuard, EIP712 {
    using SafeERC20 for IERC20;
    using SafeCast for uint256;

    // ---------------------------------------------------------------------
    // Constants
    // ---------------------------------------------------------------------

    /// @notice Role that may resolve disputed bookings.
    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");
    /// @notice Role that may pause and unpause NEW deposits only.
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice EIP-712 type hash of `Quote`. Field order must match `IGuideBloc.Quote`.
    bytes32 public constant QUOTE_TYPEHASH = keccak256(
        "Quote(address tourist,address guide,address token,uint256 amount,uint64 tourStart,uint64 tourEnd,uint64 fullRefundDeadline,uint64 partialRefundDeadline,uint16 partialRefundBps,uint64 quoteExpiry,bytes32 salt)"
    );
    /// @notice EIP-712 type hash of the mutual settlement agreement.
    bytes32 public constant MUTUAL_SETTLE_TYPEHASH =
        keccak256("MutualSettle(bytes32 bookingId,uint16 touristBps,uint256 deadline)");

    uint256 public constant BPS_DENOMINATOR = 10_000;
    /// @notice Hard maximum commission (15%).
    uint16 public constant MAX_COMMISSION_BPS = 1500;
    uint16 public constant MIN_DISPUTE_BOND_BPS = 100;
    uint16 public constant MAX_DISPUTE_BOND_BPS = 2000;
    /// @notice Dust-griefing floor for the dispute bond, in token base units (10 USDC at 6 decimals).
    uint256 public constant MIN_DISPUTE_BOND = 10e6;
    uint32 public constant MIN_DISPUTE_WINDOW = 1 days;
    uint32 public constant MAX_DISPUTE_WINDOW = 14 days;
    uint32 public constant MIN_ARBITRATION_WINDOW = 1 days;
    uint32 public constant MAX_ARBITRATION_WINDOW = 30 days;
    /// @notice Delay between requesting and confirming a guide payout address change.
    uint64 public constant PAYOUT_CHANGE_DELAY = 48 hours;
    uint8 public constant SUPPORTED_TOKEN_DECIMALS = 6;

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    mapping(bytes32 bookingId => Booking) private _bookings;

    /// @notice Token allowlist and limits.
    mapping(address token => TokenConfig) public tokenConfigs;
    /// @notice Total tokens the contract owes for `token`: live bookings + bonds + all claimable balances.
    mapping(address token => uint256) public totalLocked;
    /// @notice Pull-payment balances.
    mapping(address account => mapping(address token => uint256)) public claimable;
    /// @notice Quotes invalidated by their guide (`guide => quoteDigest => cancelled`).
    mapping(address guide => mapping(bytes32 quoteDigest => bool)) public quoteCancelled;
    /// @notice Optional separate payout address registered by an account (usually a guide).
    mapping(address account => address) public payoutAddress;
    /// @notice Pending payout address changes.
    mapping(address account => PendingPayoutChange) public pendingPayoutChange;

    /// @notice Commission applied to FUTURE bookings (snapshotted at deposit).
    uint16 public commissionBps = 1000;
    /// @notice Dispute bond percentage for FUTURE bookings (snapshotted at deposit).
    uint16 public disputeBondBps = 500;
    /// @notice Seconds after `tourEnd` during which a dispute may be opened (snapshotted at deposit).
    uint32 public disputeWindow = 72 hours;
    /// @notice Seconds after a dispute is opened during which the arbitrator may resolve it (snapshotted).
    uint32 public arbitrationWindow = 96 hours;
    /// @notice Tourist share (bps) applied to expired disputes of FUTURE bookings (snapshotted).
    uint16 public defaultDisputeTouristBps = 5000;

    /// @notice Address credited with commission at settlement time.
    address public treasury;
    /// @notice Treasury proposed by the admin, awaiting acceptance.
    address public pendingTreasury;

    // ---------------------------------------------------------------------
    // Construction
    // ---------------------------------------------------------------------

    /**
     * @param admin Default admin (expected to be a multisig behind a timelock). Cannot move tokens.
     * @param treasury_ Initial treasury that receives commission.
     * @param arbitrator Optional initial arbitrator (zero address to skip).
     * @param pauser Optional initial pauser (zero address to skip).
     * @param initialTokens Initial token allowlist entries (all are enabled).
     */
    constructor(
        address admin,
        address treasury_,
        address arbitrator,
        address pauser,
        TokenInit[] memory initialTokens
    ) EIP712("GuideBloc", "1") {
        if (admin == address(0) || treasury_ == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        if (arbitrator != address(0)) _grantRole(ARBITRATOR_ROLE, arbitrator);
        if (pauser != address(0)) _grantRole(PAUSER_ROLE, pauser);
        treasury = treasury_;
        emit TreasuryUpdated(address(0), treasury_);

        for (uint256 i = 0; i < initialTokens.length; ++i) {
            TokenInit memory t = initialTokens[i];
            _setTokenConfig(t.token, true, t.permitSupported, t.minAmount, t.perBookingCap, t.tvlCap);
        }
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    /// @notice Returns the EIP-712 digest of `q`; this is also the future `bookingId`.
    function hashQuote(Quote calldata q) public view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(QUOTE_TYPEHASH, q)));
    }

    /// @notice Returns the EIP-712 digest both parties sign for `mutualSettle`.
    function hashMutualSettle(bytes32 bookingId, uint16 touristBps, uint256 deadline) public view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(MUTUAL_SETTLE_TYPEHASH, bookingId, touristBps, deadline)));
    }

    /// @notice Returns the stored booking for `bookingId`.
    function getBooking(bytes32 bookingId) external view returns (Booking memory) {
        return _bookings[bookingId];
    }

    // ---------------------------------------------------------------------
    // Deposit
    // ---------------------------------------------------------------------

    /**
     * @notice Fund a booking using a quote signed by the guide. Requires a prior ERC-20 allowance.
     * @param q The guide-signed quote. `msg.sender` must be `q.tourist`.
     * @param guideSig Guide signature over `hashQuote(q)` (EOA or ERC-1271).
     * @return bookingId The EIP-712 digest of `q`.
     */
    function deposit(Quote calldata q, bytes calldata guideSig)
        external
        nonReentrant
        whenNotPaused
        returns (bytes32 bookingId)
    {
        return _deposit(q, guideSig);
    }

    /**
     * @notice Fund a marketplace booking directly. msg.sender is the tourist.
     * @param bookingId The booking identifier (e.g. bytes32 string of DB booking id).
     * @param guide The tour guide address.
     * @param token The token to deposit (must be allowlisted).
     * @param amount The token amount (6 decimals).
     */
    function deposit(
        bytes32 bookingId,
        address guide,
        address token,
        uint256 amount
    ) external nonReentrant whenNotPaused returns (bytes32) {
        if (bookingId == bytes32(0)) revert InvalidBookingId();
        if (guide == address(0) || msg.sender == guide) revert InvalidParty();
        if (_bookings[bookingId].status != Status.NONE) revert BookingAlreadyExists();

        TokenConfig storage cfg = tokenConfigs[token];
        if (!cfg.enabled) revert TokenNotAllowed();
        if (amount < cfg.minAmount) revert AmountOutOfBounds();
        if (amount > cfg.perBookingCap) revert PerBookingCapExceeded();
        if (totalLocked[token] + amount > cfg.tvlCap) revert TvlCapExceeded();

        Booking storage b = _bookings[bookingId];
        b.tourist = msg.sender;
        b.guide = guide;
        b.token = token;
        b.amount = amount.toUint128();
        b.status = Status.FUNDED;
        b.commissionBps = commissionBps;
        b.disputeBondBps = disputeBondBps;
        b.disputeWindow = disputeWindow;
        b.arbitrationWindow = arbitrationWindow;
        b.defaultDisputeTouristBps = defaultDisputeTouristBps;
        b.tourStart = uint64(block.timestamp);
        b.tourEnd = uint64(block.timestamp + 30 days);
        b.fullRefundDeadline = uint64(block.timestamp);
        b.partialRefundDeadline = uint64(block.timestamp);
        b.partialRefundBps = 0;

        totalLocked[token] += amount;
        _pullExact(IERC20(token), msg.sender, amount);

        emit Deposited(bookingId, msg.sender, guide, token, amount, b.tourStart, b.tourEnd);
        return bookingId;
    }

    /**
     * @notice Same as `deposit`, but first submits an EIP-2612 permit for `q.amount`.
     * @dev Reverts with `PermitNotSupported` unless the token is flagged `permitSupported` by the admin.
     *      The permit call is wrapped in try/catch so a front-run permit does not break the deposit when the
     *      allowance is already sufficient. Expected to operate for USDC only.
     * @param q The guide-signed quote. `msg.sender` must be `q.tourist`.
     * @param guideSig Guide signature over `hashQuote(q)`.
     * @param permitDeadline Permit deadline.
     * @param v Permit signature v.
     * @param r Permit signature r.
     * @param s Permit signature s.
     * @return bookingId The EIP-712 digest of `q`.
     */
    function depositWithPermit(
        Quote calldata q,
        bytes calldata guideSig,
        uint256 permitDeadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant whenNotPaused returns (bytes32 bookingId) {
        if (msg.sender != q.tourist) revert NotTourist();
        TokenConfig storage cfg = tokenConfigs[q.token];
        if (!cfg.enabled) revert TokenNotAllowed();
        if (!cfg.permitSupported) revert PermitNotSupported();

        // A failed (or front-run) permit must not block the deposit if allowance is already enough.
        try IERC20Permit(q.token).permit(msg.sender, address(this), q.amount, permitDeadline, v, r, s) {} catch {}
        if (IERC20(q.token).allowance(msg.sender, address(this)) < q.amount) revert InsufficientAllowance();

        return _deposit(q, guideSig);
    }

    // ---------------------------------------------------------------------
    // Quote invalidation
    // ---------------------------------------------------------------------

    /**
     * @notice Invalidate one of the caller's own quotes before it is deposited.
     * @param quoteDigest The quote digest (future `bookingId`). Scoped to `msg.sender` as the guide.
     */
    function cancelQuote(bytes32 quoteDigest) external {
        quoteCancelled[msg.sender][quoteDigest] = true;
        emit QuoteCancelled(msg.sender, quoteDigest);
    }

    // ---------------------------------------------------------------------
    // Release paths
    // ---------------------------------------------------------------------

    /**
     * @notice Releases escrow funds to guide upon tour completion.
     *         Callable by tourist, guide (if dispute window elapsed), or admin.
     * @param bookingId The booking to release.
     */
    function release(bytes32 bookingId) external nonReentrant {
        _handleRelease(bookingId);
    }

    function releaseToGuide(bytes32 bookingId) external nonReentrant {
        _handleRelease(bookingId);
    }

    function _handleRelease(bytes32 bookingId) internal {
        Booking storage b = _bookings[bookingId];
        if (b.status != Status.FUNDED) revert InvalidStatus(b.status);
        if (msg.sender != b.tourist && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            if (msg.sender == b.guide) {
                if (block.timestamp < uint256(b.tourEnd) + b.disputeWindow) revert FinalizationTooEarly();
            } else {
                revert NotParty();
            }
        }
        _settleAndPayout(bookingId, b, 0, Status.SETTLED);
    }

    /**
     * @notice Tourist confirms the tour was completed; 100% goes to the guide minus commission.
     * @param bookingId The booking to settle. Only the tourist, only `FUNDED`, only from `tourStart`.
     */
    function confirmCompletion(bytes32 bookingId) external {
        Booking storage b = _bookings[bookingId];
        if (b.status != Status.FUNDED) revert InvalidStatus(b.status);
        if (msg.sender != b.tourist) revert NotTourist();
        if (block.timestamp < b.tourStart) revert TourNotStarted();
        _settle(bookingId, b, 0, Status.SETTLED);
    }

    /**
     * @notice Permissionless settlement to the guide once the dispute window has fully elapsed.
     * @dev Requires `status == FUNDED` strictly, so DISPUTED / SETTLED / CANCELLED can never be finalized here.
     *      At exactly `tourEnd + disputeWindow` this succeeds and `openDispute` reverts.
     * @param bookingId The booking to finalize.
     */
    function finalize(bytes32 bookingId) external {
        Booking storage b = _bookings[bookingId];
        if (b.status != Status.FUNDED) revert InvalidStatus(b.status);
        if (block.timestamp < uint256(b.tourEnd) + b.disputeWindow) revert FinalizationTooEarly();
        _settle(bookingId, b, 0, Status.SETTLED);
    }

    /**
     * @notice Settle with a custom split agreed and signed by both parties (EOA or ERC-1271).
     * @dev Valid while `FUNDED` or `DISPUTED`. Replay is prevented by the terminal booking status and the
     *      signed deadline. If the booking was disputed, the dispute bond is returned to the opener.
     * @param bookingId The booking to settle.
     * @param touristBps Tourist share of the escrowed amount in basis points (0..10_000).
     * @param deadline Last timestamp (inclusive) at which the signatures are valid.
     * @param touristSig Tourist signature over `hashMutualSettle(...)`.
     * @param guideSig Guide signature over `hashMutualSettle(...)`.
     */
    function mutualSettle(
        bytes32 bookingId,
        uint16 touristBps,
        uint256 deadline,
        bytes calldata touristSig,
        bytes calldata guideSig
    ) external {
        Booking storage b = _bookings[bookingId];
        Status current = b.status;
        if (current != Status.FUNDED && current != Status.DISPUTED) revert InvalidStatus(current);
        if (touristBps > BPS_DENOMINATOR) revert InvalidBps();
        if (block.timestamp > deadline) revert DeadlineExpired();

        bytes32 digest = hashMutualSettle(bookingId, touristBps, deadline);
        if (!SignatureChecker.isValidSignatureNow(b.tourist, digest, touristSig)) revert InvalidSignature();
        if (!SignatureChecker.isValidSignatureNow(b.guide, digest, guideSig)) revert InvalidSignature();

        _settle(bookingId, b, _touristShare(b.amount, touristBps), Status.SETTLED);
        if (current == Status.DISPUTED) {
            _creditBond(bookingId, b, _disputeOpener(b));
        }
    }

    // ---------------------------------------------------------------------
    // Cancellation
    // ---------------------------------------------------------------------

    /**
     * @notice Tourist cancels before the tour starts, with a tiered refund.
     * @dev Before `fullRefundDeadline`: 100% refund. Before `partialRefundDeadline`: `partialRefundBps`
     *      refund (remainder to the guide, commission on the guide portion). Afterwards, until `tourStart`: 0%.
     * @param bookingId The booking to cancel. Only the tourist, only `FUNDED`, only while `now < tourStart`.
     */
    function cancelByTourist(bytes32 bookingId) external {
        Booking storage b = _bookings[bookingId];
        if (b.status != Status.FUNDED) revert InvalidStatus(b.status);
        if (msg.sender != b.tourist) revert NotTourist();
        if (block.timestamp >= b.tourStart) revert TourAlreadyStarted();

        uint256 touristAmount = 0; // tier 3 (after partialRefundDeadline): no refund
        if (block.timestamp < b.fullRefundDeadline) {
            touristAmount = b.amount;
        } else if (block.timestamp < b.partialRefundDeadline) {
            touristAmount = _touristShare(b.amount, b.partialRefundBps);
        }
        _settle(bookingId, b, touristAmount, Status.CANCELLED);
    }

    /**
     * @notice Refunds 100% of escrow funds to tourist.
     *         Callable by tourist (before tour starts), guide, or admin.
     * @param bookingId The booking to refund.
     */
    function refund(bytes32 bookingId) external nonReentrant {
        _handleRefund(bookingId);
    }

    function refundTourist(bytes32 bookingId) external nonReentrant {
        _handleRefund(bookingId);
    }

    function _handleRefund(bytes32 bookingId) internal {
        Booking storage b = _bookings[bookingId];
        if (b.status != Status.FUNDED) revert InvalidStatus(b.status);
        if (msg.sender != b.tourist && msg.sender != b.guide && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert NotParty();
        }
        if (msg.sender == b.tourist && block.timestamp >= b.tourStart) {
            revert TourAlreadyStarted();
        }
        _settleAndPayout(bookingId, b, b.amount, Status.CANCELLED);
    }

    /**
     * @notice Guide cancels; the tourist gets a full refund and no commission is charged.
     * @param bookingId The booking to cancel. Only the guide, STRICTLY `FUNDED` (never `DISPUTED`).
     */
    function cancelByGuide(bytes32 bookingId) external {
        Booking storage b = _bookings[bookingId];
        if (b.status != Status.FUNDED) revert InvalidStatus(b.status);
        if (msg.sender != b.guide) revert NotGuide();
        _settle(bookingId, b, b.amount, Status.CANCELLED);
    }

    // ---------------------------------------------------------------------
    // Disputes
    // ---------------------------------------------------------------------

    /**
     * @notice Open a dispute and post the bond (`max(MIN_DISPUTE_BOND, amount * disputeBondBps / 10_000)`).
     * @dev Valid in the half-open interval `[tourStart, tourEnd + disputeWindow)`. Requires an allowance
     *      for the bond. Not affected by `pause()`.
     * @param bookingId The booking to dispute. Tourist or guide, only `FUNDED`.
     */
    function openDispute(bytes32 bookingId) external nonReentrant {
        Booking storage b = _bookings[bookingId];
        if (b.status != Status.FUNDED) revert InvalidStatus(b.status);
        if (msg.sender != b.tourist && msg.sender != b.guide) revert NotParty();
        if (block.timestamp < b.tourStart || block.timestamp >= uint256(b.tourEnd) + b.disputeWindow) {
            revert DisputeWindowClosed();
        }

        uint256 bond = _bondFor(b);
        b.status = Status.DISPUTED;
        b.disputedAt = block.timestamp.toUint64();
        b.disputeOpenedByGuide = msg.sender == b.guide;
        b.bondAmount = bond.toUint128();
        totalLocked[b.token] += bond;

        _pullExact(IERC20(b.token), msg.sender, bond);
        emit DisputeOpened(bookingId, msg.sender, bond, b.disputedAt);
    }

    /**
     * @notice Publish an off-chain evidence hash for a disputed booking.
     * @param bookingId The disputed booking. Tourist or guide, only `DISPUTED`.
     * @param evidenceHash Hash of the evidence stored off-chain.
     */
    function submitEvidence(bytes32 bookingId, bytes32 evidenceHash) external {
        Booking storage b = _bookings[bookingId];
        if (b.status != Status.DISPUTED) revert InvalidStatus(b.status);
        if (msg.sender != b.tourist && msg.sender != b.guide) revert NotParty();
        emit EvidenceSubmitted(bookingId, msg.sender, evidenceHash);
    }

    /**
     * @notice Arbitrator splits the escrow between tourist and guide.
     * @dev Only while `now < disputedAt + arbitrationWindow`. Commission applies to the guide portion only.
     *      The bond returns to the opener if the opener receives strictly more than 50% of the amount;
     *      otherwise it is credited to the counterparty.
     * @param bookingId The disputed booking.
     * @param touristBps Tourist share of the escrowed amount in basis points (0..10_000).
     */
    function resolveDispute(bytes32 bookingId, uint16 touristBps) external onlyRole(ARBITRATOR_ROLE) {
        Booking storage b = _bookings[bookingId];
        if (b.status != Status.DISPUTED) revert InvalidStatus(b.status);
        if (touristBps > BPS_DENOMINATOR) revert InvalidBps();
        if (block.timestamp >= uint256(b.disputedAt) + b.arbitrationWindow) revert ArbitrationWindowClosed();

        bool openedByGuide = b.disputeOpenedByGuide;
        _settle(bookingId, b, _touristShare(b.amount, touristBps), Status.SETTLED);

        uint256 openerBps = openedByGuide ? BPS_DENOMINATOR - touristBps : touristBps;
        address opener = _disputeOpener(b);
        address counterparty = openedByGuide ? b.tourist : b.guide;
        _creditBond(bookingId, b, openerBps > BPS_DENOMINATOR / 2 ? opener : counterparty);

        emit DisputeResolved(bookingId, msg.sender, touristBps, false);
    }

    /**
     * @notice Anyone may resolve a dispute once the arbitration window has elapsed, using the snapshotted
     *         default split. The bond is returned to the opener.
     * @param bookingId The disputed booking.
     */
    function resolveExpiredDispute(bytes32 bookingId) external {
        Booking storage b = _bookings[bookingId];
        if (b.status != Status.DISPUTED) revert InvalidStatus(b.status);
        if (block.timestamp < uint256(b.disputedAt) + b.arbitrationWindow) revert ArbitrationWindowOpen();

        uint16 touristBps = b.defaultDisputeTouristBps;
        _settle(bookingId, b, _touristShare(b.amount, touristBps), Status.SETTLED);
        _creditBond(bookingId, b, _disputeOpener(b));

        emit DisputeResolved(bookingId, msg.sender, touristBps, true);
    }

    // ---------------------------------------------------------------------
    // Withdrawals (pull pattern)
    // ---------------------------------------------------------------------

    /**
     * @notice Withdraw the caller's claimable balance of `token` to the caller.
     * @param token The token to withdraw.
     */
    function withdraw(address token) external nonReentrant {
        _withdraw(msg.sender, token, msg.sender);
    }

    /**
     * @notice Permissionless: pay `account` its claimable balance of `token`.
     * @dev Always pays `account`, or its registered payout address; never anyone else.
     * @param account The account whose balance is withdrawn.
     * @param token The token to withdraw.
     */
    function withdrawFor(address account, address token) external nonReentrant {
        address recipient = payoutAddress[account];
        if (recipient == address(0)) recipient = account;
        _withdraw(account, token, recipient);
    }

    // ---------------------------------------------------------------------
    // Guide payout address
    // ---------------------------------------------------------------------

    /**
     * @notice Request a separate payout address, effective after `PAYOUT_CHANGE_DELAY`.
     * @param newAddress The new payout address.
     */
    function requestPayoutChange(address newAddress) external {
        if (newAddress == address(0)) revert ZeroAddress();
        uint64 readyAt = (block.timestamp + PAYOUT_CHANGE_DELAY).toUint64();
        pendingPayoutChange[msg.sender] = PendingPayoutChange({newAddress: newAddress, readyAt: readyAt});
        emit PayoutChangeRequested(msg.sender, newAddress, readyAt);
    }

    /// @notice Confirm a pending payout address change after the delay has elapsed.
    function confirmPayoutChange() external {
        PendingPayoutChange memory p = pendingPayoutChange[msg.sender];
        if (p.newAddress == address(0)) revert NoPendingChange();
        if (block.timestamp < p.readyAt) revert PayoutChangeNotReady();
        delete pendingPayoutChange[msg.sender];
        payoutAddress[msg.sender] = p.newAddress;
        emit PayoutChangeConfirmed(msg.sender, p.newAddress);
    }

    /// @notice Cancel a pending payout address change.
    function cancelPayoutChange() external {
        PendingPayoutChange memory p = pendingPayoutChange[msg.sender];
        if (p.newAddress == address(0)) revert NoPendingChange();
        delete pendingPayoutChange[msg.sender];
        emit PayoutChangeCancelled(msg.sender, p.newAddress);
    }

    // ---------------------------------------------------------------------
    // Admin (cannot move tokens or touch existing bookings)
    // ---------------------------------------------------------------------

    /**
     * @notice Add or update a token allowlist entry. Affects only NEW deposits.
     * @param token The token address.
     * @param enabled Whether new deposits in this token are allowed.
     * @param permitSupported Whether `depositWithPermit` may be used for this token.
     * @param minAmount Minimum booking amount.
     * @param perBookingCap Maximum amount per booking.
     * @param tvlCap Maximum total locked for this token after a deposit.
     */
    function setTokenConfig(
        address token,
        bool enabled,
        bool permitSupported,
        uint128 minAmount,
        uint128 perBookingCap,
        uint128 tvlCap
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setTokenConfig(token, enabled, permitSupported, minAmount, perBookingCap, tvlCap);
    }

    /// @notice Set the commission for FUTURE bookings (max `MAX_COMMISSION_BPS`).
    function setCommissionBps(uint16 newBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newBps > MAX_COMMISSION_BPS) revert ValueOutOfBounds();
        emit CommissionBpsUpdated(commissionBps, newBps);
        commissionBps = newBps;
    }

    /// @notice Set the dispute bond percentage for FUTURE bookings.
    function setDisputeBondBps(uint16 newBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newBps < MIN_DISPUTE_BOND_BPS || newBps > MAX_DISPUTE_BOND_BPS) revert ValueOutOfBounds();
        emit DisputeBondBpsUpdated(disputeBondBps, newBps);
        disputeBondBps = newBps;
    }

    /// @notice Set the post-tour dispute window for FUTURE bookings.
    function setDisputeWindow(uint32 newWindow) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newWindow < MIN_DISPUTE_WINDOW || newWindow > MAX_DISPUTE_WINDOW) revert ValueOutOfBounds();
        emit DisputeWindowUpdated(disputeWindow, newWindow);
        disputeWindow = newWindow;
    }

    /// @notice Set the arbitration window for FUTURE bookings.
    function setArbitrationWindow(uint32 newWindow) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newWindow < MIN_ARBITRATION_WINDOW || newWindow > MAX_ARBITRATION_WINDOW) revert ValueOutOfBounds();
        emit ArbitrationWindowUpdated(arbitrationWindow, newWindow);
        arbitrationWindow = newWindow;
    }

    /// @notice Set the default tourist share for expired disputes of FUTURE bookings.
    function setDefaultDisputeTouristBps(uint16 newBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newBps > BPS_DENOMINATOR) revert InvalidBps();
        emit DefaultDisputeTouristBpsUpdated(defaultDisputeTouristBps, newBps);
        defaultDisputeTouristBps = newBps;
    }

    /// @notice Step 1 of the 2-step treasury change.
    function proposeTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newTreasury == address(0)) revert ZeroAddress();
        pendingTreasury = newTreasury;
        emit TreasuryProposed(treasury, newTreasury);
    }

    /// @notice Step 2 of the 2-step treasury change; must be called by the proposed treasury.
    function acceptTreasury() external {
        if (msg.sender != pendingTreasury || msg.sender == address(0)) revert NotPendingTreasury();
        emit TreasuryUpdated(treasury, msg.sender);
        treasury = msg.sender;
        pendingTreasury = address(0);
    }

    /// @notice Pause NEW deposits (`deposit`, `depositWithPermit`) only.
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /// @notice Unpause new deposits.
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ---------------------------------------------------------------------
    // Internal
    // ---------------------------------------------------------------------

    function _deposit(Quote calldata q, bytes calldata guideSig) internal returns (bytes32 bookingId) {
        if (msg.sender != q.tourist) revert NotTourist();
        bookingId = hashQuote(q);
        _validateQuote(q, bookingId);
        if (guideSig.length > 0 && !SignatureChecker.isValidSignatureNow(q.guide, bookingId, guideSig)) {
            revert InvalidSignature();
        }

        Booking storage b = _bookings[bookingId];
        b.tourist = q.tourist;
        b.tourStart = q.tourStart;
        b.partialRefundBps = q.partialRefundBps;
        b.status = Status.FUNDED;
        b.guide = q.guide;
        b.tourEnd = q.tourEnd;
        b.commissionBps = commissionBps;
        b.disputeBondBps = disputeBondBps;
        b.token = q.token;
        b.fullRefundDeadline = q.fullRefundDeadline;
        b.disputeWindow = disputeWindow;
        b.partialRefundDeadline = q.partialRefundDeadline;
        b.arbitrationWindow = arbitrationWindow;
        b.defaultDisputeTouristBps = defaultDisputeTouristBps;
        b.amount = q.amount.toUint128();
        totalLocked[q.token] += q.amount;

        _pullExact(IERC20(q.token), msg.sender, q.amount);

        emit Deposited(bookingId, q.tourist, q.guide, q.token, q.amount, q.tourStart, q.tourEnd);
    }

    function _validateQuote(Quote calldata q, bytes32 bookingId) internal view {
        if (q.tourist == address(0) || q.guide == address(0)) revert ZeroAddress();
        if (q.tourist == q.guide) revert SameTouristAndGuide();
        if (block.timestamp >= q.quoteExpiry) revert QuoteExpired();
        if (quoteCancelled[q.guide][bookingId]) revert QuoteIsCancelled();
        if (_bookings[bookingId].status != Status.NONE) revert BookingAlreadyExists();

        TokenConfig storage cfg = tokenConfigs[q.token];
        if (!cfg.enabled) revert TokenNotAllowed();
        if (q.amount < cfg.minAmount) revert AmountOutOfBounds();
        if (q.amount > cfg.perBookingCap) revert PerBookingCapExceeded();
        if (totalLocked[q.token] + q.amount > cfg.tvlCap) revert TvlCapExceeded();

        if (
            !(block.timestamp < q.fullRefundDeadline && q.fullRefundDeadline <= q.partialRefundDeadline
                    && q.partialRefundDeadline <= q.tourStart && q.tourStart < q.tourEnd)
        ) revert InvalidTimestamps();
        if (q.partialRefundBps > BPS_DENOMINATOR) revert InvalidBps();
    }

    /// @dev Pulls exactly `amount` from `from`; rejects fee-on-transfer / rebasing behavior.
    function _pullExact(IERC20 token, address from, uint256 amount) internal {
        uint256 balanceBefore = token.balanceOf(address(this));
        token.safeTransferFrom(from, address(this), amount);
        if (token.balanceOf(address(this)) != balanceBefore + amount) revert BalanceDeltaMismatch();
    }

    /**
     * @dev The single settlement path. Splits `b.amount` into the tourist share and the guide gross share,
     *      charges the snapshotted commission on the guide share only, and credits claimable balances.
     *      `totalLocked` is unchanged: funds only move from a live booking into claimable balances.
     */
    function _settle(bytes32 bookingId, Booking storage b, uint256 touristAmount, Status finalStatus) internal {
        uint256 guideGross = uint256(b.amount) - touristAmount;
        uint256 commission = (guideGross * b.commissionBps) / BPS_DENOMINATOR;
        uint256 guideNet = guideGross - commission;

        b.status = finalStatus;

        address token = b.token;
        _credit(token, b.tourist, touristAmount);
        _credit(token, b.guide, guideNet);
        _credit(token, treasury, commission);

        emit Settled(bookingId, finalStatus, touristAmount, guideNet, commission);
    }

    function _creditBond(bytes32 bookingId, Booking storage b, address recipient) internal {
        uint256 bond = b.bondAmount;
        _credit(b.token, recipient, bond);
        emit BondSettled(bookingId, recipient, bond);
    }

    function _credit(address token, address account, uint256 amount) internal {
        if (amount == 0) return;
        claimable[account][token] += amount;
        emit Credited(account, token, amount);
    }

    function _withdraw(address account, address token, address to) internal {
        uint256 amount = claimable[account][token];
        if (amount == 0) revert NothingToWithdraw();
        claimable[account][token] = 0;
        totalLocked[token] -= amount;
        IERC20(token).safeTransfer(to, amount);
        emit Withdrawn(account, to, token, amount);
    }

    function _touristShare(uint256 amount, uint256 touristBps) internal pure returns (uint256) {
        return (amount * touristBps) / BPS_DENOMINATOR;
    }

    function _bondFor(Booking storage b) internal view returns (uint256) {
        uint256 bond = (uint256(b.amount) * b.disputeBondBps) / BPS_DENOMINATOR;
        return bond < MIN_DISPUTE_BOND ? MIN_DISPUTE_BOND : bond;
    }

    function _disputeOpener(Booking storage b) internal view returns (address) {
        return b.disputeOpenedByGuide ? b.guide : b.tourist;
    }

    function _setTokenConfig(
        address token,
        bool enabled,
        bool permitSupported,
        uint128 minAmount,
        uint128 perBookingCap,
        uint128 tvlCap
    ) internal {
        if (token == address(0)) revert ZeroAddress();
        if (enabled) {
            if (minAmount == 0 || minAmount > perBookingCap || perBookingCap > tvlCap) revert InvalidTokenConfig();
            try IERC20Metadata(token).decimals() returns (uint8 decimals_) {
                if (decimals_ != SUPPORTED_TOKEN_DECIMALS) revert UnsupportedTokenDecimals();
            } catch {
                revert UnsupportedTokenDecimals();
            }
        }
        tokenConfigs[token] = TokenConfig({
            enabled: enabled,
            permitSupported: permitSupported,
            minAmount: minAmount,
            perBookingCap: perBookingCap,
            tvlCap: tvlCap
        });
        emit TokenConfigUpdated(token, enabled, permitSupported, minAmount, perBookingCap, tvlCap);
    }

    function _settleAndPayout(bytes32 bookingId, Booking storage b, uint256 touristAmount, Status finalStatus) internal {
        address token = b.token;
        address tourist = b.tourist;
        address guide = b.guide;
        _settle(bookingId, b, touristAmount, finalStatus);

        // Immediate payout to participants
        if (touristAmount > 0) {
            _withdraw(tourist, token, tourist);
        }
        uint256 guideBal = claimable[guide][token];
        if (guideBal > 0) {
            address recipient = payoutAddress[guide] != address(0) ? payoutAddress[guide] : guide;
            _withdraw(guide, token, recipient);
        }
        uint256 treasuryBal = claimable[treasury][token];
        if (treasuryBal > 0) {
            _withdraw(treasury, token, treasury);
        }
    }

    function bookings(bytes32 bookingId) external view returns (
        address tourist,
        address guide,
        address token,
        uint256 amount,
        Status status
    ) {
        Booking storage b = _bookings[bookingId];
        return (b.tourist, b.guide, b.token, uint256(b.amount), b.status);
    }

    function adminTreasury() external view returns (address) {
        return treasury;
    }

    function COMMISSION_BPS() external view returns (uint256) {
        return uint256(commissionBps);
    }
}
