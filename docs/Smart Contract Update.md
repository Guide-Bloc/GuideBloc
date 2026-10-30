# Task: Build `guidebloc.sol` (GuideBloc Escrow V3)

You are a senior Solidity engineer and smart contract security reviewer. Build a production-grade, immutable, non-upgradeable escrow contract for a tour-guide marketplace on **Avalanche C-Chain**. It replaces `GuideBlocEscrowV2.sol`, which has confirmed design flaws (see "Why V3 exists").

Output file: `src/guidebloc.sol`, main contract name `GuideBloc`.

**Build this as a brand-new contract from scratch.** Do not inherit from, import, copy code from, or write migration logic for `GuideBlocEscrowV2`. Delete the old file(s) and replace them (see section 0).

If something in this spec is ambiguous or contradictory, stop and ask instead of guessing silently. Never invent contract addresses; make them configurable and flag them for human verification.

---

## Execution protocol (READ FIRST: staged, gated work)

This is a large job. Do **not** try to produce everything in one response. Work in the stages below. At the end of each stage, stop, report, and wait for the human to say "continue" before starting the next stage. Do not pre-emptively start later stages.

**Quality rules for every stage**
- Every file must be complete. No `// TODO`, `// implement later`, `...`, pseudo-code, or "rest unchanged" placeholders. If you cannot finish something in the current response, say exactly what is missing and stop; never fake it.
- If a file is too large for one response, split it into logical parts (e.g., split test suites into several files) rather than shrinking quality.
- Keep a running `docs/PROGRESS.md` (stage status, decisions, open questions, spec deviations) updated at the end of each stage so work can resume in a fresh session.

**Stage 0: Plan (no code).** Short plan, assumptions, open questions. Confirm storage layout (section 4) on paper. Wait for approval.

**Stage 1: Contract.** Delete V2 (section 0). Write `src/guidebloc.sol` and `src/interfaces/` to completion. Gate: `forge build` passes, `forge inspect GuideBloc storage-layout` confirms the Booking packing target (section 4), `slither .` run with findings triaged. No tests yet except a trivial compile/smoke test.

**Stage 2: Tests** (split into sub-steps, each reported separately)
- 2a: mocks + unit tests + regression tests + boundary/time tests.
- 2b: signature tests (EOA, ERC-1271) + fuzz tests.
- 2c: invariant tests with handler.
- 2d: fork tests against Avalanche.
Gate: `forge test` green, `forge coverage` reported honestly. If a test exposes a contract bug, fix the contract and note it in `PROGRESS.md`; do not weaken the test or the spec.

**Stage 3: Deployment and docs.** `script/Deploy.s.sol`, `docs/THREAT_MODEL.md`, `docs/STATE_MACHINE.md`, final report (section 8).

---

## 0. Repository handling (replace, do not keep)

1. Delete `GuideBlocEscrowV2.sol` (and any old V2 tests, scripts, ABIs, and docs that reference it) from the repo.
2. Create `src/guidebloc.sol` as the only escrow contract. Update imports, deploy scripts, README, and any ABI/frontend references to point to `GuideBloc`.
3. Do not leave dead code, commented-out V2 logic, or compatibility shims.
4. Note for humans: the V2 contract already deployed on-chain cannot be deleted. Remove it from the app/frontend and settle its remaining ACTIVE bookings separately. Mention this in the final report.

---

## 1. Why V3 exists (V2 flaws that MUST NOT be reproduced)

An external reviewer (KupiaSec) reported, and we confirmed by reading the source:

1. **No time or completion gating.** In V2, `release()` could be called by the guide right after the tourist's `deposit()`, paying out 90% before the tour. `refund()` could be called by the tourist after the tour. Whoever acts first wins.
2. **Owner backdoor.** `emergencyRescue()` moved any amount of any token, including funds of ACTIVE bookings. V3 must have **no rescue, sweep, or arbitrary-transfer function of any kind**.
3. **Booking ID squatting.** `deposit()` accepted a caller-chosen `bookingId`, so anyone could front-run and block a real booking.

Additional V2 weaknesses to fix: no expiry (funds can be stuck forever), push payments (a USDC/USDT-blacklisted recipient makes release revert), arbitrary tokens, `tourist == guide` allowed, guide address chosen unilaterally by the tourist, owner could unilaterally release/refund any booking, treasury changeable mid-booking, no dispute mechanism.

Each of these must have a dedicated regression test.

---

## 2. Technical constraints

- Solidity `^0.8.24`, Foundry project, OpenZeppelin Contracts v5.x.
- Use: `AccessControl`, `Pausable`, `ReentrancyGuard`, `SafeERC20`, `EIP712`, `SignatureChecker` (must support ERC-1271 contract wallets), `IERC20Permit`.
- **No** proxies, upgradeability, `delegatecall`, `selfdestruct`, or inline assembly unless clearly justified in a comment.
- Custom errors instead of revert strings. Complete NatSpec on every external function. Rich events for every state transition.
- Follow checks-effects-interactions even with `nonReentrant`.
- Supported tokens: 6-decimal stablecoins (USDC and USDT on Avalanche). Do not hardcode addresses; use an admin-managed allowlist. Fee-on-transfer, rebasing, and ERC-777 tokens are unsupported and must be rejected via a balance-delta check on deposit.
- **Non-standard ERC-20 handling (USDT-style tokens).** Do not assume any token returns a boolean or behaves like OpenZeppelin's ERC-20. Some Tether deployments return nothing from `transfer`/`transferFrom` and require allowance to be reset to `0` before a new non-zero approval. Which exact behavior the USDT deployed on Avalanche C-Chain has must be **verified by a human from the verified contract source**; the code must be correct for both behaviors:
  - ALL token movements go through OpenZeppelin `SafeERC20` (`safeTransfer`, `safeTransferFrom`) exclusively. No raw `IERC20.transfer/transferFrom/approve` calls anywhere.
  - The contract itself never needs to call `approve` (users approve the contract; the contract only pulls with `transferFrom`). If any internal approval is ever required, use `forceApprove`. Document in `docs/` that the **frontend** must reset allowance to `0` before approving a new amount for USDT-style tokens.
  - **Permit is optional per token.** USDC (native, Circle) supports EIP-2612 `permit`; do not assume USDT does. `depositWithPermit` is only meaningful for permit-capable tokens: if the token does not implement permit, the call must revert with a clear custom error (e.g., `PermitNotSupported`), and the plain `deposit` path (approve + transferFrom) must work for every allowlisted token. Do not infer permit support from the token's name or address; detect via a guarded call and/or an explicit admin-set `permitSupported` flag in the token config. Document that permit is only expected to operate for USDC.

---

## 3. Roles and powers

Use `AccessControl`. The default admin is expected to be a multisig behind a timelock, deployed outside this contract.

| Role | Can | Can NEVER |
|---|---|---|
| `DEFAULT_ADMIN_ROLE` | grant/revoke roles, set treasury (2-step), set fee for future bookings, manage token allowlist and caps | move ANY tokens out of the contract, release/refund any booking, change terms of existing bookings |
| `ARBITRATOR_ROLE` | resolve disputes by splitting between tourist and guide | send funds to any third party, act on non-disputed bookings |
| `PAUSER_ROLE` | pause/unpause **new deposits only** | block claims, withdrawals, cancellations, disputes, or resolutions |

The owner/admin must have no ability to release or refund a booking, and no function that lets any role withdraw tokens other than through the normal settlement and `withdraw` paths.

---

## 4. Data model

```solidity
enum Status { NONE, FUNDED, DISPUTED, SETTLED, CANCELLED }

struct Quote {                 // EIP-712 typed data, signed by the guide
    address tourist;           // bound to one specific tourist
    address guide;
    address token;
    uint256 amount;
    uint64  tourStart;
    uint64  tourEnd;
    uint64  fullRefundDeadline;     // tourist cancel before this => 100% refund
    uint64  partialRefundDeadline;  // tourist cancel before this => partialRefundBps refund
    uint16  partialRefundBps;       // e.g. 5000 = 50%
    uint64  quoteExpiry;            // deposit must happen before this
    bytes32 salt;                   // uniqueness / invalidation
}

struct Booking {
    // slot 1 (31 bytes)
    address tourist;
    uint64  tourStart;
    uint16  partialRefundBps;
    Status  status;                 // uint8 enum
    bool    disputeOpenedByGuide;   // replaces a full address for disputeOpener
    // slot 2 (32 bytes)
    address guide;
    uint64  tourEnd;
    uint16  commissionBps;          // SNAPSHOT at deposit, never changes afterwards
    uint16  disputeBondBps;         // SNAPSHOT at deposit
    // slot 3 (32 bytes)
    address token;
    uint64  fullRefundDeadline;
    uint32  disputeWindow;          // SNAPSHOT at deposit (seconds)
    // slot 4 (22 bytes)
    uint64  partialRefundDeadline;
    uint32  arbitrationWindow;      // SNAPSHOT at deposit (seconds)
    uint64  disputedAt;
    uint16  defaultDisputeTouristBps; // SNAPSHOT at deposit
    // slot 5 (32 bytes)
    uint128 amount;
    uint128 bondAmount;
}
```

**Storage packing is mandatory and order-sensitive.** The Solidity compiler does not reorder struct fields, so declare them **exactly in the order above** (the grouping by slot is deliberate). Target: `Booking` occupies **5 storage slots**. Verify with `forge inspect GuideBloc storage-layout` (or `forge inspect GuideBloc storageLayout`) and include the output in the Stage 1 report; add a test that fails if the layout grows. Use OpenZeppelin `SafeCast` for every downcast (`uint256` to `uint128/uint64/uint32/uint16`); never use unchecked narrowing. Packing must not compromise readability or correctness beyond this layout. The `Quote` struct (calldata/EIP-712 only) is not stored, so keep its field order matching its `TYPEHASH` string exactly instead.

Note: `claimable[account][token]` is a plain mapping and settlement has no unbounded loops, so there is no gas-DoS surface from claimable accounting; keep it that way (no iteration over users, bookings, or tokens in any state-changing function).

**`bookingId` = the EIP-712 digest of the `Quote`.** It is never caller-supplied, so ID squatting is impossible. A quote is single-use because a booking with that ID can only be created once (`status == NONE`).

---

## 5. Required functions and behavior

### 5.1 Deposit
- `deposit(Quote calldata q, bytes calldata guideSig)` and `depositWithPermit(Quote calldata q, bytes calldata guideSig, uint256 permitDeadline, uint8 v, bytes32 r, bytes32 s)`.
- `msg.sender` must equal `q.tourist`. Verify `guideSig` with `SignatureChecker` against `q.guide` (EOA and ERC-1271).
- Validate: quote not expired, not cancelled by guide, `q.tourist != q.guide`, neither is `address(0)`, token allowlisted, `minAmount <= amount <= perBookingCap`, total locked after deposit `<= tvlCap[token]`, timestamps consistent (`now < fullRefundDeadline <= partialRefundDeadline <= tourStart < tourEnd`), `partialRefundBps <= 10000`. Contract must not be paused.
- `depositWithPermit`: revert with `PermitNotSupported` for tokens not flagged/detected as permit-capable. The `permit` call must be wrapped in `try/catch` so a front-run permit (griefing) does not make the deposit fail if the allowance is already sufficient; if allowance is still insufficient after the attempt, revert.
- Pull funds, verify balance delta equals `amount` exactly, snapshot current config into the booking, set `FUNDED`, increase `totalLocked[token]`, emit `Deposited`.

### 5.2 Release paths (the payout rules)
1. **Tourist confirms**: `confirmCompletion(bookingId)`. Only the tourist, only when `FUNDED` and `block.timestamp >= tourStart`. Settles 100% to the guide (minus commission).
2. **Permissionless finalize**: `finalize(bookingId)`. Anyone may call when **`status == Status.FUNDED` strictly** (so a `DISPUTED`, `SETTLED`, or `CANCELLED` booking can NEVER be finalized permissionlessly) and `block.timestamp >= tourEnd + disputeWindow`. Settles to the guide. This lets keepers or the guide trigger it and the guide never needs to rely on the tourist.
3. **Mutual settlement**: `mutualSettle(bookingId, touristBps, deadline, touristSig, guideSig)` with EIP-712 signatures from both parties (ERC-1271 supported), valid only while `FUNDED` or `DISPUTED`, used for custom splits (partial tour, weather, reschedule outcomes). Replay-protected by booking status and deadline.
4. There must be **no path** where the guide alone can pull funds before `tourEnd + disputeWindow`, and **no path** where the tourist alone can refund after `tourStart` other than via dispute or mutual settlement.

### 5.3 Cancellation
- `cancelByTourist(bookingId)`: only the tourist, only `FUNDED`, only `block.timestamp < tourStart`.
  - before `fullRefundDeadline`: 100% refund to tourist.
  - before `partialRefundDeadline`: `partialRefundBps` refunded to tourist; the remainder goes to the guide (commission applies to the guide's portion).
  - otherwise (between `partialRefundDeadline` and `tourStart`): 0% refund, all goes to the guide minus commission.
- `cancelByGuide(bookingId)`: only the guide, `FUNDED` or before finalization, any time: 100% refund to tourist, no commission.

### 5.4 Disputes
- `openDispute(bookingId)`: tourist or guide, only `FUNDED`, only while `block.timestamp >= tourStart` **and** `block.timestamp < tourEnd + disputeWindow` (half-open interval `[tourStart, tourEnd + disputeWindow)`). Opener posts a **bond** of `amount * disputeBondBps / 10000` (same token, pulled with `SafeERC20`, balance-delta checked, counted in `totalLocked`). Status becomes `DISPUTED`, store `disputedAt` and `disputeOpenedByGuide`.
- `resolveDispute(bookingId, touristBps)`: only `ARBITRATOR_ROLE`, only `DISPUTED`, only while `block.timestamp < disputedAt + arbitrationWindow`. `touristBps` in `[0, 10000]` defines the share of the escrow amount going to the tourist; the rest goes to the guide minus commission (commission applies only to the guide's portion). Bond rule: if the opener receives strictly more than 50% of the amount, the bond is returned to the opener; otherwise it goes to the counterparty (credited to claimable).
- `resolveExpiredDispute(bookingId)`: anyone, only `DISPUTED` and `block.timestamp >= disputedAt + arbitrationWindow`. Applies a default split (`defaultDisputeTouristBps`, default 5000, admin-configurable for future bookings only, snapshotted) and returns the bond to the opener.
- Both parties may emit `EvidenceSubmitted(bookingId, submitter, bytes32 evidenceHash)` while `DISPUTED`. Data stays off-chain; only the hash goes on-chain.

**Strict boundary rules (no ambiguity at the exact timestamp).** The two windows are complementary half-open intervals, so at any single `block.timestamp` exactly one of them applies:
- `openDispute` requires `block.timestamp < tourEnd + disputeWindow`.
- `finalize` requires `block.timestamp >= tourEnd + disputeWindow`.
- `resolveDispute` requires `block.timestamp < disputedAt + arbitrationWindow`; `resolveExpiredDispute` requires `block.timestamp >= disputedAt + arbitrationWindow`.
At the exact boundary timestamp, `finalize` wins and `openDispute` reverts. Add tests at `boundary - 1`, `boundary`, and `boundary + 1` for every one of these.

### 5.5 Payments: pull pattern
- Never push tokens to users during settlement. Credit `claimable[account][token]` instead and keep `totalLocked[token]` accurate.
- `withdraw(token)`: withdraws caller's claimable to caller. `withdrawFor(account, token)`: permissionless, but always pays `account` (or its registered payout address, see 5.6) and never anyone else.
- A single blacklisted recipient must never block settlement for other parties.

### 5.6 Guide payout address
- A guide may register a payout address separate from the signing key: `requestPayoutChange(newAddr)`, then `confirmPayoutChange()` after a **48 hour** delay, cancellable via `cancelPayoutChange()`. The payout address is resolved at withdrawal time. Emit events for all three.

### 5.7 Quote invalidation
- `cancelQuote(bytes32 quoteDigest)` by the guide in advance of deposit (the digest is the future `bookingId`). Deposits against a cancelled quote revert.
- Provide a view helper `hashQuote(Quote calldata)` that returns the EIP-712 digest for off-chain use.

### 5.8 Admin and safety
- Token allowlist: `setTokenConfig(token, enabled, permitSupported, minAmount, perBookingCap, tvlCap)`.
- Fee: `setCommissionBps(bps)` with a hard constant maximum (`MAX_COMMISSION_BPS = 1500`). Applies to **future** bookings only.
- Dispute/timing config setters with hard min/max bounds as constants; also future bookings only.
- Treasury: 2-step change (`proposeTreasury`, `acceptTreasury`). Commission is credited to the treasury address at settlement time.
- **No rescue function.** There is no `emergencyRescue`, `rescueSurplus`, `sweep`, or any other admin-triggered token transfer. Tokens sent to the contract by mistake are intentionally unrecoverable; document this in the threat model.
- `pause()` / `unpause()`: affect `deposit` and `depositWithPermit` only.

---

## 6. Invariants (must hold at all times)

1. `IERC20(token).balanceOf(address(this)) >= totalLocked[token]` for every token.
2. `totalLocked[token]` equals the sum of: amounts of `FUNDED`/`DISPUTED` bookings + bonds held + all `claimable` balances for that token.
3. Terminal statuses (`SETTLED`, `CANCELLED`) never change again; funds for a booking are distributed exactly once.
4. For any settled booking: `tourist payout + guide payout + commission + bond movements == amount + bond` (no dust created or lost beyond documented rounding; rounding favors the guide/tourist consistently and is documented).
5. No admin or arbitrator function can reduce funds owed to a tourist or guide of an existing booking, and no function exists to extract tokens outside settlement/`withdraw`.
6. Commission never exceeds `MAX_COMMISSION_BPS` of the guide's portion.

---

## 7. Testing requirements (Foundry)

- **Unit tests** for every function, every revert, every role restriction, every state transition.
- **Regression tests** named after the V2 flaws:
  - `test_GuideCannotReleaseBeforeTourEnds`
  - `test_TouristCannotRefundAfterTourStart`
  - `test_NoAdminFunctionCanMoveTokens` (assert no privileged function transfers tokens out; include a test that scans the ABI/function selectors for any rescue/sweep-style function)
  - `test_BookingIdCannotBeSquatted` (a third party cannot create or block a booking; a quote only works for its named tourist)
  - `test_BlacklistedRecipientDoesNotBlockOthers`
  - `test_FeeChangeDoesNotAffectExistingBookings`
  - `test_TreasuryChangeIsTwoStep`
- **Fuzz tests** for amounts, commission splits, cancellation tiers, and dispute splits (`touristBps` 0..10000).
- **Invariant tests** (handler-based, with multiple actors: tourists, guides, arbitrator, admin, keeper) for invariants 1-6 above.
- **EIP-712 / signature tests**: EOA and ERC-1271 mock wallet, expired quotes, cancelled quotes, wrong tourist, tampered fields, replay attempts.
- **Time tests** with `vm.warp` around every boundary (`tourStart`, `tourEnd`, `disputeWindow`, `arbitrationWindow`, refund deadlines).
- **Boundary tests** at `boundary - 1 / boundary / boundary + 1` for `tourStart`, `tourEnd + disputeWindow`, `disputedAt + arbitrationWindow`, `fullRefundDeadline`, `partialRefundDeadline`, `quoteExpiry`; plus `test_DisputedBookingCanNeverBeFinalized`.
- **Storage layout test**: fails if `Booking` exceeds 5 slots.
- **USDT-style mock**: a mock token with no return value on `transfer`/`transferFrom` and a "reset allowance to 0 first" rule on `approve`; full deposit/settle/withdraw flows must work with it via `SafeERC20`. Also a mock token without `permit` to prove `depositWithPermit` reverts with `PermitNotSupported` while `deposit` works.
- **Token behavior tests**: a mock fee-on-transfer token must be rejected; a mock blacklistable USDC-like token must not break settlement for other parties.
- **Fork test** against Avalanche C-Chain with real native USDC and USDT (take addresses from the user or verify them from official sources; do not guess), including `permit` on USDC only. For USDT on the fork, test the plain approve + `deposit` path (including the approve-to-0 sequence if the real token requires it) and assert `depositWithPermit` is not usable for it unless the token genuinely supports permit.
- Target: 100% line and branch coverage on `guidebloc.sol` (`forge coverage`).

---

## 8. Deliverables (produced across the stages in the Execution protocol)

1. `src/guidebloc.sol` (contract `GuideBloc`), with interfaces in `src/interfaces/` if useful.
2. `test/` with the suites above and mocks (mock ERC-20, fee-on-transfer, blacklist token, ERC-1271 wallet).
3. `script/Deploy.s.sol` with constructor params clearly documented (admin, treasury, initial config) and Fuji and mainnet configs separated.
4. `docs/THREAT_MODEL.md`: assets, actors, trust assumptions, every privileged action, known limitations (e.g., arbitrator trust, off-chain evidence, stablecoin issuer blacklist/freeze risk, tokens sent by mistake are permanently stuck because there is no rescue function).
5. `docs/STATE_MACHINE.md`: transitions, who may trigger each, and time conditions.
6. A final report listing: what was built, what was NOT built, assumptions, deviations from this spec with reasons, tool output summaries.

## 9. Verification before you report each stage done

Run and show real results appropriate to the stage (do not claim success without running):

```
forge build
forge test -vvv
forge coverage
forge fmt --check
slither .
```

Fix all high/medium findings or explain precisely why a finding is a false positive. If any command cannot run in your environment, say so explicitly instead of skipping silently.

## 10. Out of scope for V3 (do not build, but design so they can be added)

Multi-milestone payments, group bookings, guide staking/slashing, on-chain reputation, tipping, gas sponsorship (ERC-4337/ERC-2771), fee tiers and referrals. Keep the code modular enough that these can be added in a later version without changing core settlement logic.

## 11. Ground rules

- Security and correctness over cleverness and gas golf.
- Prefer small, readable functions; one internal `_settle` path that every payout goes through so accounting lives in one place.
- No hidden privileges: no backdoors, no admin transfer functions, no upgrade hooks, no owner-controlled arbitrary calls.
- Do not add features not listed here without asking.
- Do not weaken any constraint in this document to make a test pass; if a test and the spec conflict, report it.
