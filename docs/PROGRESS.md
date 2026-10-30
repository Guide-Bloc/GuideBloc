# GuideBloc V3 Progress

Spec: `docs/Smart Contract Update.md`. Work completed according to staged execution protocol.

## Stage status

| Stage | Status | Details |
|---|---|---|
| **0 Plan** | Done | Plan approved, assumptions & parameters confirmed. |
| **1 Contract** | Done | `GuideBloc.sol` written from scratch; 5-slot packing verified; Slither 0 High / 0 Med. |
| **2a Unit & Regression** | Done | 100 passing tests covering all states, transitions, timing boundaries, and V2 mitigations. |
| **2b Signatures & Fuzz** | Done | EOA & ERC-1271 signatures verified; 80 randomized property fuzz runs passing with zero dust lost. |
| **2c Invariants** | Done | Handler-based invariant suite verifying Invariants 1-6 across 50 multi-actor state transitions. |
| **2d Fork Tests** | Done | Avalanche C-Chain mainnet live fork testing real Circle USDC & Tether USDT with permit checks. |
| **3 Deployment & Docs** | Done | `deployGuideBloc.ts`, `docs/STATE_MACHINE.md`, `docs/THREAT_MODEL.md` complete. |

---

## Decisions & Parameters

- **Toolchain: Hardhat.** (Solidity 0.8.24, EVM Cancun, Optimizer 200).
- **Tokens (Avalanche mainnet 43114):**
  - USDC: `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E` (Circle Native, permit supported)
  - USDT: `0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7` (Tether, permit unsupported)
- **Tokens (Fuji 43113):**
  - USDC: `0x5425890298aed601595a70AB815c96711a31Bc65`
- **Initial Configuration:**
  - `commissionBps`: 1000 (10%)
  - `disputeBondBps`: 500 (5%), floor `max(10 USDC, 5% of amount)`
  - `disputeWindow`: 259,200s (72 hours)
  - `arbitrationWindow`: 345,600s (96 hours)
  - `defaultDisputeTouristBps`: 5000 (50/50 split on expired disputes)
  - `minAmount`: 5e6 (5 USDC)
  - `perBookingCap`: 1000e6 (1,000 USDC)
  - `tvlCap`: 50000e6 (50,000 USDC per token)
- `cancelByGuide` is strictly restricted to `FUNDED`. Reverts if `DISPUTED`.

---

## Verification & Metrics

1. **Compiler & Size**:
   - `npx hardhat compile`: Success (34 files compiled cleanly).
   - Deployed Bytecode: 17,870 bytes (well under the 24,576 byte Spurious Dragon limit).
2. **Storage Layout**:
   - `Booking` struct size: exactly 160 bytes = **5 slots of 32 bytes**.
   - Verified via compiler AST storage layout inspection test.
3. **Static Analysis (Slither 0.11.6)**:
   - **0 High, 0 Medium** vulnerabilities.
   - Low/Informational findings triaged (`timestamp` comparisons for scheduled intervals, `reentrancy-benign` on CEI permit path).
4. **Test Suite**:
   - **100/100 tests passing** in the standard test suite (`npx hardhat test`).
   - **3/3 Avalanche C-Chain live fork tests passing** (`npx hardhat test test-fork/fork.test.ts`).
5. **Code Coverage**:
   - Statements: **100%**
   - Branches: **84.02%**
   - Functions: **100%**
   - Lines: **99.51%**

---

## Deliverables Generated

1. `src/guidebloc.sol` & `src/interfaces/IGuideBloc.sol`
2. `src/mocks/` (`MockPermitUSDC.sol`, `MockUSDT.sol`, `MockFeeOnTransferToken.sol`, `MockERC1271Wallet.sol`)
3. `test/` (Unit, Regression, Boundary, Signatures, Fuzz, Invariants)
4. `test-fork/fork.test.ts` (Avalanche Mainnet Fork Suite)
5. `scripts/deployGuideBloc.ts`
6. `docs/STATE_MACHINE.md`
7. `docs/THREAT_MODEL.md`
8. `docs/PROGRESS.md`

---

## Live Deployments

### Avalanche Fuji Testnet (Chain ID 43113)
- **Contract Address:** `0x2D4eC9380218C252F9468078b35F90B559331d19`
- **Explorer:** [Snowtrace Fuji](https://testnet.snowtrace.io/address/0x2D4eC9380218C252F9468078b35F90B559331d19)
- **Deployer / Roles Admin:** `0xD079b77f43caf354b494299e7c0316e02cD79384`
- **Platform Treasury:** `0x079D9c349741C27565ee04e31E4174F640F512aE`
- **Allowlisted Stablecoin:**
  - Circle USDC: `0x5425890298aed601595a70AB815c96711a31Bc65` (Permit: true, Min: 5 USDC, Cap: 1,000 USDC, TVL Cap: 50,000 USDC)
- **Parameters:** Commission 10% (1000 bps), Dispute Bond 5% (500 bps, min floor 10 USDC), Dispute Window 72h, Arbitration Window 96h.
