# GuideBloc (V3) Threat Model & Security Architecture

## 1. Executive Summary

GuideBloc V3 is an immutable, non-upgradeable decentralized escrow smart contract designed for peer-to-peer travel bookings settled in 6-decimal stablecoins on Avalanche C-Chain. V3 was designed from scratch to eliminate critical design flaws in V2 (unprotected early releases, admin backdoors, and booking ID front-running).

---

## 2. Protected Assets

1. **Escrow Principal**: Stablecoin deposits held for active bookings (`status == FUNDED | DISPUTED`).
2. **Dispute Bonds**: Collateral posted by the party initiating a dispute to prevent griefing.
3. **Claimable Balances**: Unwithdrawn earnings, refunds, and treasury commission accrued in `claimable[account][token]`.
4. **State Integrity**: Immutability of snapshotted booking terms, non-tamperable EIP-712 quotes, and accurate `totalLocked` tracking.

---

## 3. Actors & Trust Hierarchy

```
       [DEFAULT_ADMIN_ROLE]              [ARBITRATOR_ROLE]              [PAUSER_ROLE]
         (Multisig/Timelock)                 (Trusted 3rd Party)          (Security Bot/Admin)
                  |                                   |                              |
      Token Allowlist & Caps                     Resolve Disputes               Pause Deposits
      Set Fee (Future Bookings)                 Split Between Parties          (Unpause Deposits)
      Propose Treasury (2-Step)                       |
                  |                                   |                              |
===================================================================================================
                                  IMMUTABLE ESCROW CORE (GuideBloc)
===================================================================================================
                  |                                                                  |
              [Tourists]                                                          [Guides]
     Deposit with Quote / Permit                                         Sign Quotes (EOA/ERC-1271)
     Confirm Completion / Cancel                                         Finalize / Cancel Quote
     Open Dispute                                                        Register Payout Address
```

### Trust Assumptions

| Role | Assumptions & Constraints |
|---|---|
| `DEFAULT_ADMIN_ROLE` | Assumed to be an honest multisig behind a timelock. **Cannot move any tokens**, cannot release/refund any booking, and cannot alter existing booking terms. |
| `ARBITRATOR_ROLE` | Trusted to honestly evaluate off-chain evidence for disputes. **Cannot send funds to any third party** (only splits between tourist and guide). If compromised, blast radius is strictly limited to currently `DISPUTED` bookings. |
| `PAUSER_ROLE` | Can pause NEW deposits during emergencies. **Cannot block claims, withdrawals, cancellations, or disputes**. |
| `Keepers / Public` | Any party can permissionlessly call `finalize()`, `resolveExpiredDispute()`, and `withdrawFor()`. The contract relies on game-theoretic incentives (guides or automated bots triggering payouts). |

---

## 4. Threat Matrix & Mitigations

| Threat Vector | Severity in V2 | Mitigation in V3 |
|---|---|---|
| **Early Guide Release** | Critical | **Eliminated.** Guides cannot trigger payout before `tourEnd + disputeWindow`. Payout requires tourist confirmation or expiration of the dispute window. |
| **Post-Tour Tourist Refund** | Critical | **Eliminated.** `cancelByTourist` strictly reverts once `now >= tourStart`. |
| **Admin Backdoor / Rugpull** | Critical | **Eliminated.** There is NO `emergencyRescue`, `sweep`, or admin transfer function of any kind. Admin cannot extract tokens. |
| **Booking ID Squatting** | High | **Eliminated.** `bookingId` is the EIP-712 hash of the guide's quote. It cannot be chosen by callers. Deposits require `msg.sender == q.tourist`. |
| **Fee-on-Transfer / Rebasing Griefing** | Medium | **Eliminated.** All deposits and bonds enforce an exact balance delta check (`balanceAfter == balanceBefore + amount`). Defective tokens revert immediately. |
| **USDC/USDT Blacklist Griefing** | Medium | **Eliminated.** Payouts strictly follow a **pull-payment pattern** (`claimable`). If an address is blacklisted by Circle/Tether, only that specific address fails on `withdraw()`; all other parties and settlements remain unblocked. |
| **USDT Allowance Reset Revert** | Medium | **Eliminated.** The contract never calls `approve`. The contract pulls via `SafeERC20.safeTransferFrom`. |
| **Permit Front-Running (Griefing)** | Low | **Eliminated.** `depositWithPermit` wraps `permit` in `try/catch`. If front-run, the call proceeds as long as allowance is sufficient. |
| **Dust Griefing on Disputes** | Low | **Eliminated.** Dispute bonds enforce a hard minimum floor of `max(10 USDC, 5% of amount)` to prevent spam disputes on micro-bookings. |

---

## 5. Known Limitations & Accepted Risks

1. **Permanent Loss of Inadvertent Token Transfers**:
   Because GuideBloc has **zero rescue or sweep functions**, any ERC-20 tokens or native AVAX sent directly to the contract address via raw `transfer` without calling `deposit` or `openDispute` are **permanently and irreversibly locked**. This is an intentional security design trade-off to mathematically guarantee that no admin backdoor can ever touch user funds.
2. **Off-Chain Evidence Verification**:
   Evidence submitted during disputes (`submitEvidence`) is stored as an immutable cryptographic hash (`bytes32 evidenceHash`). The underlying documents, receipts, and photos live off-chain. The arbitrator evaluates this evidence off-chain.
3. **Stablecoin Issuer Freeze Risk**:
   If Circle or Tether freezes a tourist's or guide's wallet on-chain, GuideBloc cannot override the token issuer's blacklist. The user's claimable funds will remain safe inside the contract until the freeze is lifted, or the user can be paid via an authorized `payoutAddress` change if requested prior to the freeze.
