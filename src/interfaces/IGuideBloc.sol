// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IGuideBloc
 * @notice Shared types, events and errors for the GuideBloc escrow (V3).
 * @dev Contains no function declarations on purpose: the contract itself is the
 *      single source of truth for its external API (see NatSpec in `GuideBloc`).
 */
interface IGuideBloc {
    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------

    /// @notice Lifecycle of a booking. `SETTLED` and `CANCELLED` are terminal.
    enum Status {
        NONE,
        FUNDED,
        DISPUTED,
        SETTLED,
        CANCELLED
    }

    /// @notice EIP-712 typed data signed by the guide. Field order MUST match `QUOTE_TYPEHASH`.
    struct Quote {
        address tourist;
        address guide;
        address token;
        uint256 amount;
        uint64 tourStart;
        uint64 tourEnd;
        uint64 fullRefundDeadline;
        uint64 partialRefundDeadline;
        uint16 partialRefundBps;
        uint64 quoteExpiry;
        bytes32 salt;
    }

    /// @notice Stored booking. Field order is deliberate: it packs into exactly 5 storage slots.
    struct Booking {
        // slot 1
        address tourist;
        uint64 tourStart;
        uint16 partialRefundBps;
        Status status;
        bool disputeOpenedByGuide;
        // slot 2
        address guide;
        uint64 tourEnd;
        uint16 commissionBps;
        uint16 disputeBondBps;
        // slot 3
        address token;
        uint64 fullRefundDeadline;
        uint32 disputeWindow;
        // slot 4
        uint64 partialRefundDeadline;
        uint32 arbitrationWindow;
        uint64 disputedAt;
        uint16 defaultDisputeTouristBps;
        // slot 5
        uint128 amount;
        uint128 bondAmount;
    }

    /// @notice Per-token allowlist entry and limits.
    struct TokenConfig {
        bool enabled;
        bool permitSupported;
        uint128 minAmount;
        uint128 perBookingCap;
        uint128 tvlCap;
    }

    /// @notice Constructor helper for the initial token allowlist.
    struct TokenInit {
        address token;
        bool permitSupported;
        uint128 minAmount;
        uint128 perBookingCap;
        uint128 tvlCap;
    }

    /// @notice A guide payout address change waiting for its delay to elapse.
    struct PendingPayoutChange {
        address newAddress;
        uint64 readyAt;
    }

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event Deposited(
        bytes32 indexed bookingId,
        address indexed tourist,
        address indexed guide,
        address token,
        uint256 amount,
        uint64 tourStart,
        uint64 tourEnd
    );
    event Settled(
        bytes32 indexed bookingId,
        Status indexed finalStatus,
        uint256 touristPayout,
        uint256 guidePayout,
        uint256 commission
    );
    event Credited(address indexed account, address indexed token, uint256 amount);
    event Withdrawn(address indexed account, address indexed to, address indexed token, uint256 amount);

    event QuoteCancelled(address indexed guide, bytes32 indexed quoteDigest);

    event DisputeOpened(bytes32 indexed bookingId, address indexed opener, uint256 bondAmount, uint64 disputedAt);
    event EvidenceSubmitted(bytes32 indexed bookingId, address indexed submitter, bytes32 evidenceHash);
    event DisputeResolved(bytes32 indexed bookingId, address indexed resolver, uint16 touristBps, bool expired);
    event BondSettled(bytes32 indexed bookingId, address indexed recipient, uint256 amount);

    event PayoutChangeRequested(address indexed guide, address indexed newAddress, uint64 readyAt);
    event PayoutChangeConfirmed(address indexed guide, address indexed newAddress);
    event PayoutChangeCancelled(address indexed guide, address indexed cancelledAddress);

    event TokenConfigUpdated(
        address indexed token,
        bool enabled,
        bool permitSupported,
        uint128 minAmount,
        uint128 perBookingCap,
        uint128 tvlCap
    );
    event CommissionBpsUpdated(uint16 oldBps, uint16 newBps);
    event DisputeBondBpsUpdated(uint16 oldBps, uint16 newBps);
    event DisputeWindowUpdated(uint32 oldWindow, uint32 newWindow);
    event ArbitrationWindowUpdated(uint32 oldWindow, uint32 newWindow);
    event DefaultDisputeTouristBpsUpdated(uint16 oldBps, uint16 newBps);
    event TreasuryProposed(address indexed currentTreasury, address indexed proposedTreasury);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error ZeroAddress();
    error NotTourist();
    error NotGuide();
    error NotParty();
    error SameTouristAndGuide();
    error InvalidSignature();
    error QuoteExpired();
    error QuoteIsCancelled();
    error BookingAlreadyExists();
    error TokenNotAllowed();
    error PermitNotSupported();
    error InsufficientAllowance();
    error AmountOutOfBounds();
    error PerBookingCapExceeded();
    error TvlCapExceeded();
    error InvalidTimestamps();
    error InvalidBps();
    error InvalidStatus(Status current);
    error BalanceDeltaMismatch();
    error TourNotStarted();
    error TourAlreadyStarted();
    error FinalizationTooEarly();
    error DisputeWindowClosed();
    error ArbitrationWindowClosed();
    error ArbitrationWindowOpen();
    error DeadlineExpired();
    error NothingToWithdraw();
    error NoPendingChange();
    error PayoutChangeNotReady();
    error NotPendingTreasury();
    error ValueOutOfBounds();
    error UnsupportedTokenDecimals();
    error InvalidTokenConfig();
}
