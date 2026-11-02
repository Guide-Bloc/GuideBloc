// Auto-generated artifact for GuideBloc (V3)
export const ESCROW_V2_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "admin",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "treasury_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "arbitrator",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "pauser",
        "type": "address"
      },
      {
        "components": [
          {
            "internalType": "address",
            "name": "token",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "permitSupported",
            "type": "bool"
          },
          {
            "internalType": "uint128",
            "name": "minAmount",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "perBookingCap",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "tvlCap",
            "type": "uint128"
          }
        ],
        "internalType": "struct IGuideBloc.TokenInit[]",
        "name": "initialTokens",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "AccessControlBadConfirmation",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "neededRole",
        "type": "bytes32"
      }
    ],
    "name": "AccessControlUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "AmountOutOfBounds",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ArbitrationWindowClosed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ArbitrationWindowOpen",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "BalanceDeltaMismatch",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "BookingAlreadyExists",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "DeadlineExpired",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "DisputeWindowClosed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EnforcedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ExpectedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "FinalizationTooEarly",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InsufficientAllowance",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidBookingId",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidBps",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidParty",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidShortString",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidSignature",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "enum IGuideBloc.Status",
        "name": "current",
        "type": "uint8"
      }
    ],
    "name": "InvalidStatus",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidTimestamps",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidTokenConfig",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NoPendingChange",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotGuide",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotParty",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotPendingTreasury",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotTourist",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NothingToWithdraw",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "PayoutChangeNotReady",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "PerBookingCapExceeded",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "PermitNotSupported",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "QuoteExpired",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "QuoteIsCancelled",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "bits",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "SafeCastOverflowedUintDowncast",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "SafeERC20FailedOperation",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SameTouristAndGuide",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "str",
        "type": "string"
      }
    ],
    "name": "StringTooLong",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TokenNotAllowed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TourAlreadyStarted",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TourNotStarted",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TvlCapExceeded",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "UnsupportedTokenDecimals",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ValueOutOfBounds",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAddress",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "oldWindow",
        "type": "uint32"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "newWindow",
        "type": "uint32"
      }
    ],
    "name": "ArbitrationWindowUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "BondSettled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "oldBps",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "newBps",
        "type": "uint16"
      }
    ],
    "name": "CommissionBpsUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Credited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "oldBps",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "newBps",
        "type": "uint16"
      }
    ],
    "name": "DefaultDisputeTouristBpsUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "tourist",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "guide",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "tourStart",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "tourEnd",
        "type": "uint64"
      }
    ],
    "name": "Deposited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "oldBps",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "newBps",
        "type": "uint16"
      }
    ],
    "name": "DisputeBondBpsUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "opener",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "bondAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "disputedAt",
        "type": "uint64"
      }
    ],
    "name": "DisputeOpened",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "resolver",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "touristBps",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "expired",
        "type": "bool"
      }
    ],
    "name": "DisputeResolved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "oldWindow",
        "type": "uint32"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "newWindow",
        "type": "uint32"
      }
    ],
    "name": "DisputeWindowUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [],
    "name": "EIP712DomainChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "submitter",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "evidenceHash",
        "type": "bytes32"
      }
    ],
    "name": "EvidenceSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Paused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "guide",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "cancelledAddress",
        "type": "address"
      }
    ],
    "name": "PayoutChangeCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "guide",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newAddress",
        "type": "address"
      }
    ],
    "name": "PayoutChangeConfirmed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "guide",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "readyAt",
        "type": "uint64"
      }
    ],
    "name": "PayoutChangeRequested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "guide",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "quoteDigest",
        "type": "bytes32"
      }
    ],
    "name": "QuoteCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "previousAdminRole",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "newAdminRole",
        "type": "bytes32"
      }
    ],
    "name": "RoleAdminChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "RoleGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "RoleRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "enum IGuideBloc.Status",
        "name": "finalStatus",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "touristPayout",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "guidePayout",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "commission",
        "type": "uint256"
      }
    ],
    "name": "Settled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "enabled",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "permitSupported",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint128",
        "name": "minAmount",
        "type": "uint128"
      },
      {
        "indexed": false,
        "internalType": "uint128",
        "name": "perBookingCap",
        "type": "uint128"
      },
      {
        "indexed": false,
        "internalType": "uint128",
        "name": "tvlCap",
        "type": "uint128"
      }
    ],
    "name": "TokenConfigUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "currentTreasury",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "proposedTreasury",
        "type": "address"
      }
    ],
    "name": "TreasuryProposed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "oldTreasury",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newTreasury",
        "type": "address"
      }
    ],
    "name": "TreasuryUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Unpaused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Withdrawn",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "ARBITRATOR_ROLE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "BPS_DENOMINATOR",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "COMMISSION_BPS",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "DEFAULT_ADMIN_ROLE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_ARBITRATION_WINDOW",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_COMMISSION_BPS",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_DISPUTE_BOND_BPS",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_DISPUTE_WINDOW",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_ARBITRATION_WINDOW",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_DISPUTE_BOND",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_DISPUTE_BOND_BPS",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_DISPUTE_WINDOW",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MUTUAL_SETTLE_TYPEHASH",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "PAUSER_ROLE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "PAYOUT_CHANGE_DELAY",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "QUOTE_TYPEHASH",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "SUPPORTED_TOKEN_DECIMALS",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "acceptTreasury",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "adminTreasury",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "arbitrationWindow",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      }
    ],
    "name": "bookings",
    "outputs": [
      {
        "internalType": "address",
        "name": "tourist",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "guide",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "enum IGuideBloc.Status",
        "name": "status",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      }
    ],
    "name": "cancelByGuide",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      }
    ],
    "name": "cancelByTourist",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "cancelPayoutChange",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "quoteDigest",
        "type": "bytes32"
      }
    ],
    "name": "cancelQuote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "claimable",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "commissionBps",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      }
    ],
    "name": "confirmCompletion",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "confirmPayoutChange",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "defaultDisputeTouristBps",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "tourist",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "guide",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "token",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint64",
            "name": "tourStart",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "tourEnd",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "fullRefundDeadline",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "partialRefundDeadline",
            "type": "uint64"
          },
          {
            "internalType": "uint16",
            "name": "partialRefundBps",
            "type": "uint16"
          },
          {
            "internalType": "uint64",
            "name": "quoteExpiry",
            "type": "uint64"
          },
          {
            "internalType": "bytes32",
            "name": "salt",
            "type": "bytes32"
          }
        ],
        "internalType": "struct IGuideBloc.Quote",
        "name": "q",
        "type": "tuple"
      },
      {
        "internalType": "bytes",
        "name": "guideSig",
        "type": "bytes"
      }
    ],
    "name": "deposit",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "guide",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "deposit",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "tourist",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "guide",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "token",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint64",
            "name": "tourStart",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "tourEnd",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "fullRefundDeadline",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "partialRefundDeadline",
            "type": "uint64"
          },
          {
            "internalType": "uint16",
            "name": "partialRefundBps",
            "type": "uint16"
          },
          {
            "internalType": "uint64",
            "name": "quoteExpiry",
            "type": "uint64"
          },
          {
            "internalType": "bytes32",
            "name": "salt",
            "type": "bytes32"
          }
        ],
        "internalType": "struct IGuideBloc.Quote",
        "name": "q",
        "type": "tuple"
      },
      {
        "internalType": "bytes",
        "name": "guideSig",
        "type": "bytes"
      },
      {
        "internalType": "uint256",
        "name": "permitDeadline",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "v",
        "type": "uint8"
      },
      {
        "internalType": "bytes32",
        "name": "r",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "s",
        "type": "bytes32"
      }
    ],
    "name": "depositWithPermit",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "disputeBondBps",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "disputeWindow",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "eip712Domain",
    "outputs": [
      {
        "internalType": "bytes1",
        "name": "fields",
        "type": "bytes1"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "version",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "chainId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "verifyingContract",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "salt",
        "type": "bytes32"
      },
      {
        "internalType": "uint256[]",
        "name": "extensions",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      }
    ],
    "name": "finalize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      }
    ],
    "name": "getBooking",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "tourist",
            "type": "address"
          },
          {
            "internalType": "uint64",
            "name": "tourStart",
            "type": "uint64"
          },
          {
            "internalType": "uint16",
            "name": "partialRefundBps",
            "type": "uint16"
          },
          {
            "internalType": "enum IGuideBloc.Status",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "bool",
            "name": "disputeOpenedByGuide",
            "type": "bool"
          },
          {
            "internalType": "address",
            "name": "guide",
            "type": "address"
          },
          {
            "internalType": "uint64",
            "name": "tourEnd",
            "type": "uint64"
          },
          {
            "internalType": "uint16",
            "name": "commissionBps",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "disputeBondBps",
            "type": "uint16"
          },
          {
            "internalType": "address",
            "name": "token",
            "type": "address"
          },
          {
            "internalType": "uint64",
            "name": "fullRefundDeadline",
            "type": "uint64"
          },
          {
            "internalType": "uint32",
            "name": "disputeWindow",
            "type": "uint32"
          },
          {
            "internalType": "uint64",
            "name": "partialRefundDeadline",
            "type": "uint64"
          },
          {
            "internalType": "uint32",
            "name": "arbitrationWindow",
            "type": "uint32"
          },
          {
            "internalType": "uint64",
            "name": "disputedAt",
            "type": "uint64"
          },
          {
            "internalType": "uint16",
            "name": "defaultDisputeTouristBps",
            "type": "uint16"
          },
          {
            "internalType": "uint128",
            "name": "amount",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "bondAmount",
            "type": "uint128"
          }
        ],
        "internalType": "struct IGuideBloc.Booking",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      }
    ],
    "name": "getRoleAdmin",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "grantRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "hasRole",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      },
      {
        "internalType": "uint16",
        "name": "touristBps",
        "type": "uint16"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      }
    ],
    "name": "hashMutualSettle",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "tourist",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "guide",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "token",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint64",
            "name": "tourStart",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "tourEnd",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "fullRefundDeadline",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "partialRefundDeadline",
            "type": "uint64"
          },
          {
            "internalType": "uint16",
            "name": "partialRefundBps",
            "type": "uint16"
          },
          {
            "internalType": "uint64",
            "name": "quoteExpiry",
            "type": "uint64"
          },
          {
            "internalType": "bytes32",
            "name": "salt",
            "type": "bytes32"
          }
        ],
        "internalType": "struct IGuideBloc.Quote",
        "name": "q",
        "type": "tuple"
      }
    ],
    "name": "hashQuote",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      },
      {
        "internalType": "uint16",
        "name": "touristBps",
        "type": "uint16"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "touristSig",
        "type": "bytes"
      },
      {
        "internalType": "bytes",
        "name": "guideSig",
        "type": "bytes"
      }
    ],
    "name": "mutualSettle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      }
    ],
    "name": "openDispute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "payoutAddress",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "pendingPayoutChange",
    "outputs": [
      {
        "internalType": "address",
        "name": "newAddress",
        "type": "address"
      },
      {
        "internalType": "uint64",
        "name": "readyAt",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pendingTreasury",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newTreasury",
        "type": "address"
      }
    ],
    "name": "proposeTreasury",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "guide",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "quoteDigest",
        "type": "bytes32"
      }
    ],
    "name": "quoteCancelled",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      }
    ],
    "name": "refund",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      }
    ],
    "name": "refundTourist",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      }
    ],
    "name": "release",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      }
    ],
    "name": "releaseToGuide",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "callerConfirmation",
        "type": "address"
      }
    ],
    "name": "renounceRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newAddress",
        "type": "address"
      }
    ],
    "name": "requestPayoutChange",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      },
      {
        "internalType": "uint16",
        "name": "touristBps",
        "type": "uint16"
      }
    ],
    "name": "resolveDispute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      }
    ],
    "name": "resolveExpiredDispute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "revokeRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "newWindow",
        "type": "uint32"
      }
    ],
    "name": "setArbitrationWindow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint16",
        "name": "newBps",
        "type": "uint16"
      }
    ],
    "name": "setCommissionBps",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint16",
        "name": "newBps",
        "type": "uint16"
      }
    ],
    "name": "setDefaultDisputeTouristBps",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint16",
        "name": "newBps",
        "type": "uint16"
      }
    ],
    "name": "setDisputeBondBps",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "newWindow",
        "type": "uint32"
      }
    ],
    "name": "setDisputeWindow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "enabled",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "permitSupported",
        "type": "bool"
      },
      {
        "internalType": "uint128",
        "name": "minAmount",
        "type": "uint128"
      },
      {
        "internalType": "uint128",
        "name": "perBookingCap",
        "type": "uint128"
      },
      {
        "internalType": "uint128",
        "name": "tvlCap",
        "type": "uint128"
      }
    ],
    "name": "setTokenConfig",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "evidenceHash",
        "type": "bytes32"
      }
    ],
    "name": "submitEvidence",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "interfaceId",
        "type": "bytes4"
      }
    ],
    "name": "supportsInterface",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "tokenConfigs",
    "outputs": [
      {
        "internalType": "bool",
        "name": "enabled",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "permitSupported",
        "type": "bool"
      },
      {
        "internalType": "uint128",
        "name": "minAmount",
        "type": "uint128"
      },
      {
        "internalType": "uint128",
        "name": "perBookingCap",
        "type": "uint128"
      },
      {
        "internalType": "uint128",
        "name": "tvlCap",
        "type": "uint128"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "totalLocked",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "treasury",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "withdrawFor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const GUIDEBLOC_ESCROW_ARTIFACT = {
  contractName: "GuideBloc",
  abi: ESCROW_V2_ABI,
  bytecode: "0x610160604052600b80546001600160701b0319166d1388000546000003f48001f403e817905534801562000031575f80fd5b5060405162005a1338038062005a1383398101604081905262000054916200072a565b604051806040016040528060098152602001684775696465426c6f6360b81b815250604051806040016040528060018152602001603160f81b8152506001620000a9620000a6620002d860201b60201c565b90565b55620000b7826002620002fc565b61012052620000c8816003620002fc565b61014052815160208084019190912060e052815190820120610100524660a0526200015560e05161010051604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60208201529081019290925260608201524660808201523060a08201525f9060c00160405160208183030381529060405280519060200120905090565b60805250503060c0526001600160a01b03851615806200017c57506001600160a01b038416155b156200019b5760405163d92e233d60e01b815260040160405180910390fd5b620001a75f8662000334565b506001600160a01b03831615620001e657620001e47f16ceee8289685dd2a02b9c8ae81d2df373176ce53519e6284e2a2950d6546ffa8462000334565b505b6001600160a01b038216156200022457620002227f65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a8362000334565b505b600c80546001600160a01b0319166001600160a01b0386169081179091556040515f907f4ab5be82436d353e61ca18726e984e561f5c1cc7c6d38b29d2553c790434705a908290a35f5b8151811015620002cc575f8282815181106200028e576200028e6200089b565b60200260200101519050620002c2815f015160018360200151846040015185606001518660800151620003df60201b60201c565b506001016200026e565b50505050505062000aa0565b7f9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f0090565b5f6020835110156200031b5762000313836200063a565b90506200032e565b8162000328848262000939565b5060ff90505b92915050565b5f828152602081815260408083206001600160a01b038516845290915281205460ff16620003d7575f838152602081815260408083206001600160a01b03861684529091529020805460ff191660011790556200038e3390565b6001600160a01b0316826001600160a01b0316847f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45060016200032e565b505f6200032e565b6001600160a01b038616620004075760405163d92e233d60e01b815260040160405180910390fd5b841562000514576001600160801b0383161580620004365750816001600160801b0316836001600160801b0316115b80620004535750806001600160801b0316826001600160801b0316115b1562000472576040516303ff3dd760e11b815260040160405180910390fd5b856001600160a01b031663313ce5676040518163ffffffff1660e01b8152600401602060405180830381865afa925050508015620004cf575060408051601f3d908101601f19168201909252620004cc9181019062000a05565b60015b620004ed5760405163455de91560e01b815260040160405180910390fd5b60ff8116600614620005125760405163455de91560e01b815260040160405180910390fd5b505b6040805160a081018252861515815285151560208083019182526001600160801b0380881684860190815287821660608601908152878316608087019081526001600160a01b038e165f81815260059096529488902096518754965193518516620100000262010000600160901b03199415156101000261ff00199215159290921661ffff19909816979097171792909216949094178555925192518116600160801b0292169190911760019092019190915590517fac7c22ade7b66df38c1e983f7fcaa1322174e9dd76f96626c41f192a57ea9b6b906200062a9088908890889088908890941515855292151560208501526001600160801b0391821660408501528116606084015216608082015260a00190565b60405180910390a2505050505050565b5f80829050601f8151111562000670578260405163305a27a960e01b815260040162000667919062000a2e565b60405180910390fd5b80516200067d8262000a7c565b179392505050565b80516001600160a01b03811681146200069c575f80fd5b919050565b634e487b7160e01b5f52604160045260245ffd5b60405160a081016001600160401b0381118282101715620006da57620006da620006a1565b60405290565b604051601f8201601f191681016001600160401b03811182821017156200070b576200070b620006a1565b604052919050565b80516001600160801b03811681146200069c575f80fd5b5f805f805f60a086880312156200073f575f80fd5b6200074a8662000685565b945060206200075b81880162000685565b94506200076b6040880162000685565b935060606200077d6060890162000685565b608089810151919550906001600160401b03808211156200079c575f80fd5b818b0191508b601f830112620007b0575f80fd5b815181811115620007c557620007c5620006a1565b620007d5868260051b01620006e0565b818152868101925060a090910283018601908d821115620007f4575f80fd5b928601925b81841015620008875760a0848f03121562000812575f80fd5b6200081c620006b5565b620008278562000685565b81528785015180151581146200083b575f80fd5b818901526200084d6040860162000713565b60408201526200085f87860162000713565b878201526200087086860162000713565b81870152835260a0939093019291860191620007f9565b809750505050505050509295509295909350565b634e487b7160e01b5f52603260045260245ffd5b600181811c90821680620008c457607f821691505b602082108103620008e357634e487b7160e01b5f52602260045260245ffd5b50919050565b601f8211156200093457805f5260205f20601f840160051c81016020851015620009105750805b601f840160051c820191505b8181101562000931575f81556001016200091c565b50505b505050565b81516001600160401b03811115620009555762000955620006a1565b6200096d81620009668454620008af565b84620008e9565b602080601f831160018114620009a3575f84156200098b5750858301515b5f19600386901b1c1916600185901b178555620009fd565b5f85815260208120601f198616915b82811015620009d357888601518255948401946001909101908401620009b2565b5085821015620009f157878501515f19600388901b60f8161c191681555b505060018460011b0185555b505050505050565b5f6020828403121562000a16575f80fd5b815160ff8116811462000a27575f80fd5b9392505050565b5f602080835283518060208501525f5b8181101562000a5c5785810183015185820160400152820162000a3e565b505f604082860101526040601f19601f8301168501019250505092915050565b80516020808301519190811015620008e3575f1960209190910360031b1b16919050565b60805160a05160c05160e051610100516101205161014051614f2162000af25f395f61361501525f6135e301525f61419d01525f61417501525f6140d001525f6140fa01525f6141240152614f215ff3fe608060405234801561000f575f80fd5b5060043610610438575f3560e01c806384b0196e11610237578063cbeab51611610135578063e49d2a30116100bf578063f08ef6cb11610084578063f08ef6cb14610ae7578063f110ed6714610afa578063f4e96ddf14610b0d578063f52668c114610b20578063f758161514610b33575f80fd5b8063e49d2a3014610a89578063e5eb958414610a91578063e62977f814610aa4578063e63ab1e914610aad578063eb799f3b14610ad4575f80fd5b8063d547741f11610105578063d547741f14610a2d578063d6b4503814610a40578063d8fb933714610a4e578063da79a25e14610a6d578063e1a4521814610a80575f80fd5b8063cbeab516146109a5578063ce06a355146109c2578063cf9f42d4146109d6578063d4570c1c14610a03575f80fd5b8063a217fddf116101c1578063bbacc18711610186578063bbacc18714610906578063bc94f7f814610972578063be66708314610992578063c4e1ad93146109a5578063c5775c39146109af575f80fd5b8063a217fddf146108b2578063a5e7aae1146108b9578063adb5735c146108e1578063b301db4a146108f4578063b95a8276146108fc575f80fd5b806394db64ff1161020757806394db64ff1461084c57806396cad0db146108545780639a666664146108655780639cea0787146108785780639efa65081461089f575f80fd5b806384b0196e146107ff5780638f9d3c0e1461081a57806391d148541461082657806392584d8014610839575f80fd5b80634affb7ac116103445780636bfbb36e116102ce57806380cbc6fa1161029357806380cbc6fa146107be578063817bf2c5146107c857806382ca1625146107db5780638456cb59146107ee5780638469ca09146107f6575f80fd5b80636bfbb36e1461077b57806371fefefe146107855780637249fbb6146106965780637804d4af14610798578063806dc87d146107ab575f80fd5b80635754680d116103145780635754680d146107335780635c975abb1461074657806361d027b31461075157806364dd0c291461076457806367d42a8b146105c0575f80fd5b80634affb7ac146106c35780635143ad04146106eb57806351cff8d91461070d57806353082de314610720575f80fd5b8063248a9ca3116103c557806331c6934e1161039557806331c6934e1461065457806336568abe1461067b5780633f4ba83a1461068e578063405737851461069657806344192a90146106a9575f80fd5b8063248a9ca3146105d35780632ed6b75d146106035780632f2ff15d1461062e5780632f8ec32214610641575f80fd5b806317dfa44c1161040b57806317dfa44c146105075780631b69dc5f1461051a5780631cffff4d146105a557806320418a90146105b8578063209a85c7146105c0575f80fd5b80630175981b1461043c57806301ffc9a7146104a257806304815157146104c5578063117f5f92146104da575b5f80fd5b61047661044a36600461457c565b600a6020525f90815260409020546001600160a01b03811690600160a01b90046001600160401b031682565b604080516001600160a01b0390931683526001600160401b039091166020830152015b60405180910390f35b6104b56104b0366004614595565b610b5a565b6040519015158152602001610499565b6104d86104d336600461457c565b610b90565b005b600b546104f290640100000000900463ffffffff1681565b60405163ffffffff9091168152602001610499565b6104d86105153660046145bc565b610c65565b61056d61052836600461457c565b60056020525f90815260409020805460019091015460ff808316926101008104909116916001600160801b036201000090920482169181811691600160801b90041685565b60408051951515865293151560208601526001600160801b03928316938501939093528116606084015216608082015260a001610499565b6104d86105b33660046145ed565b610d47565b6104d8610df0565b6104d86105ce366004614606565b610eec565b6105f56105e1366004614606565b5f9081526020819052604090206001015490565b604051908152602001610499565b600d54610616906001600160a01b031681565b6040516001600160a01b039091168152602001610499565b6104d861063c36600461461d565b610f16565b6104d861064f366004614606565b610f40565b6105f57fe2ced3c46c3e5833e23ac23de53555471c0303e15beaafe61dc762a6963b09e181565b6104d861068936600461461d565b61106d565b6104d86110a5565b6104d86106a4366004614606565b6110d7565b6106b1600681565b60405160ff9091168152602001610499565b600b546106d890600160601b900461ffff1681565b60405161ffff9091168152602001610499565b6106f56202a30081565b6040516001600160401b039091168152602001610499565b6104d861071b36600461457c565b6110e8565b6104d861072e366004614647565b6110fb565b6104d8610741366004614606565b6111b7565b60015460ff166104b5565b600c54610616906001600160a01b031681565b600b546104f290600160401b900463ffffffff1681565b6104f262278d0081565b6104d8610793366004614647565b61127b565b6104d86107a6366004614606565b611334565b6105f56107b93660046146d3565b6113d7565b6104f26212750081565b6105f56107d6366004614757565b6115fe565b6105f56107e9366004614772565b611650565b6104d861168b565b6106d86107d081565b6108076116bd565b6040516104999796959493929190614806565b600b5461ffff166105f5565b6104b561083436600461461d565b6116ff565b6104d8610847366004614606565b611727565b6106d8606481565b600c546001600160a01b0316610616565b6104d861087336600461489d565b6117cf565b6105f57f16ceee8289685dd2a02b9c8ae81d2df373176ce53519e6284e2a2950d6546ffa81565b6104d86108ad3660046148e3565b6119b8565b6105f55f81565b6106166108c736600461457c565b60096020525f90815260409020546001600160a01b031681565b6104d86108ef366004614953565b6119d9565b6104d8611a25565b6105f56298968081565b610961610914366004614606565b5f90815260046020819052604090912080546001820154600283015492909301546001600160a01b0380831695948116949316926001600160801b0390911691600160f01b900460ff1690565b6040516104999594939291906149af565b610985610980366004614606565b611ad6565b60405161049991906149ed565b6105f56109a0366004614b5d565b611cd8565b6104f26201518081565b6104d86109bd366004614b8f565b611d2f565b600b546106d89062010000900461ffff1681565b6104b56109e4366004614c1b565b600860209081525f928352604080842090915290825290205460ff1681565b6105f5610a11366004614953565b600760209081525f928352604080842090915290825290205481565b6104d8610a3b36600461461d565b611f1e565b600b546106d89061ffff1681565b6105f5610a5c36600461457c565b60066020525f908152604090205481565b6104d8610a7b366004614606565b611f42565b6105f561271081565b6104d8612070565b6105f5610a9f366004614c43565b6120fd565b6106d86105dc81565b6105f57f65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a81565b6104d8610ae23660046145ed565b61256e565b6104d8610af5366004614606565b61260b565b6104d8610b0836600461457c565b612871565b6104d8610b1b366004614606565b6128f4565b6104d8610b2e3660046145ed565b612943565b6105f57f84aabb317767d9b37f50ddc4710aaca633d89ea1408f5312845b285b00575bff81565b5f6001600160e01b03198216637965db0b60e01b1480610b8a57506301ffc9a760e01b6001600160e01b03198316145b92915050565b6001600160a01b038116610bb75760405163d92e233d60e01b815260040160405180910390fd5b5f610bcd610bc86202a30042614c98565b6129cf565b6040805180820182526001600160a01b038581168083526001600160401b038581166020808601828152335f818152600a8452899020975188549251909516600160a01b026001600160e01b03199092169490961693909317929092179094559351928352939450917fb22eb25345401e81472f43a61aeaec0fcec6856b1a6ec2781c2a3973d5b79fb4910160405180910390a35050565b5f82815260046020526040902060028154600160f01b900460ff166004811115610c9157610c9161497b565b14610cc5578054604051633ba7bf8960e11b8152610cbc91600160f01b900460ff1690600401614cab565b60405180910390fd5b80546001600160a01b03163314801590610cec575060018101546001600160a01b03163314155b15610d0a5760405163c8ee2d1d60e01b815260040160405180910390fd5b604051828152339084907f4543e08408960bdc61f9796c9212f24c6c086541eb4f2c7717bdc01b53e5571d906020015b60405180910390a3505050565b5f610d5181612a08565b606461ffff83161080610d6957506107d061ffff8316115b15610d8757604051636d4d4a6760e11b815260040160405180910390fd5b600b546040805161ffff620100009093048316815291841660208301527fe6cbd2b7f57f6fc6d06431af2c043cecf33a43159fff8ede5bb704304c4b6499910160405180910390a150600b805461ffff909216620100000263ffff000019909216919091179055565b335f908152600a60209081526040918290208251808401909352546001600160a01b038116808452600160a01b9091046001600160401b031691830191909152610e4d5760405163147fde5f60e31b815260040160405180910390fd5b80602001516001600160401b0316421015610e7b5760405163303a24cf60e01b815260040160405180910390fd5b335f818152600a6020908152604080832080546001600160e01b03191690558451600990925280832080546001600160a01b0319166001600160a01b0393841617905584519051911692917f4370868eeba1d89732557f2f72d5c2a4432db1f81c061feea02878b12c9631dc91a350565b610ef4612a12565b610efd81612a2d565b610f1360015f80516020614ecc83398151915255565b50565b5f82815260208190526040902060010154610f3081612a08565b610f3a8383612b3a565b50505050565b5f81815260046020526040902060028154600160f01b900460ff166004811115610f6c57610f6c61497b565b14610f97578054604051633ba7bf8960e11b8152610cbc91600160f01b900460ff1690600401614cab565b6003810154610fc390600160401b810463ffffffff1690600160601b90046001600160401b0316614c98565b421015610fe357604051637637bf6560e01b815260040160405180910390fd5b60038101546004820154600160a01b90910461ffff169061101c9084908490611015906001600160801b031685612bc9565b6003612be1565b61102f838361102a85612d06565b612d39565b6040805161ffff8316815260016020820152339185917f3aabe6963c18973a7508f1915e39b168dc70c0ae2ae0ea5b1c75e5855928460f9101610d3a565b6001600160a01b03811633146110965760405163334bd91960e11b815260040160405180910390fd5b6110a08282612db3565b505050565b7f65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a6110cf81612a08565b610f13612e1c565b6110df612a12565b610efd81612e6e565b6110f0612a12565b610efd338233612f84565b5f61110581612a08565b6201518063ffffffff8316108061112457506212750063ffffffff8316115b1561114257604051636d4d4a6760e11b815260040160405180910390fd5b600b546040805163ffffffff6401000000009093048316815291841660208301527f331732f32938f3dae8ea2c7174b106b447543e9b68d97d2f0a928bc23a153f2d910160405180910390a150600b805463ffffffff9092166401000000000267ffffffff0000000019909216919091179055565b5f81815260046020526040902060018154600160f01b900460ff1660048111156111e3576111e361497b565b1461120e578054604051633ba7bf8960e11b8152610cbc91600160f01b900460ff1690600401614cab565b80546001600160a01b0316331461123857604051633df2aaf760e11b815260040160405180910390fd5b8054600160a01b90046001600160401b031642101561126a5760405163d4710b8160e01b815260040160405180910390fd5b61127782825f6003612be1565b5050565b5f61128581612a08565b6201518063ffffffff831610806112a4575062278d0063ffffffff8316115b156112c257604051636d4d4a6760e11b815260040160405180910390fd5b600b546040805163ffffffff600160401b9093048316815291841660208301527f03f61f5547e391847ec1379c4a767d4289d6346285c41378468a5086af51ed51910160405180910390a150600b805463ffffffff909216600160401b0263ffffffff60401b19909216919091179055565b5f81815260046020526040902060018154600160f01b900460ff1660048111156113605761136061497b565b1461138b578054604051633ba7bf8960e11b8152610cbc91600160f01b900460ff1690600401614cab565b60018101546001600160a01b031633146113b857604051630a09e1af60e01b815260040160405180910390fd5b60048082015461127791849184916001600160801b0390911690612be1565b5f6113e0612a12565b6113e8613083565b6113f5602089018961457c565b6001600160a01b0316336001600160a01b03161461142657604051633df2aaf760e11b815260040160405180910390fd5b5f60058161143a60608c0160408d0161457c565b6001600160a01b0316815260208101919091526040015f20805490915060ff166114775760405163514e24c360e11b815260040160405180910390fd5b8054610100900460ff1661149e576040516339d5351560e01b815260040160405180910390fd5b6114ae60608a0160408b0161457c565b60405163d505accf60e01b815233600482015230602482015260608b013560448201526064810188905260ff8716608482015260a4810186905260c481018590526001600160a01b03919091169063d505accf9060e4015f604051808303815f87803b15801561151c575f80fd5b505af192505050801561152d575060015b50606089018035906115429060408c0161457c565b604051636eb1769f60e11b81523360048201523060248201526001600160a01b03919091169063dd62ed3e90604401602060405180830381865afa15801561158c573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906115b09190614cb9565b10156115cf576040516313be252b60e01b815260040160405180910390fd5b6115da8989896130a9565b9150506115f360015f80516020614ecc83398151915255565b979650505050505050565b5f610b8a7f84aabb317767d9b37f50ddc4710aaca633d89ea1408f5312845b285b00575bff83604051602001611635929190614ce6565b60405160208183030381529060405280519060200120613575565b5f611659612a12565b611661613083565b61166c8484846130a9565b905061168460015f80516020614ecc83398151915255565b9392505050565b7f65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a6116b581612a08565b610f136135a1565b5f6060805f805f60606116ce6135dc565b6116d661360e565b604080515f80825260208201909252600f60f81b9b939a50919850469750309650945092509050565b5f918252602082815260408084206001600160a01b0393909316845291905290205460ff1690565b5f81815260046020526040902060018154600160f01b900460ff1660048111156117535761175361497b565b1461177e578054604051633ba7bf8960e11b8152610cbc91600160f01b900460ff1690600401614cab565b600281015460018201546117af91600160e01b900463ffffffff1690600160a01b90046001600160401b0316614c98565b42101561126a57604051631b6a7b5360e31b815260040160405180910390fd5b7f16ceee8289685dd2a02b9c8ae81d2df373176ce53519e6284e2a2950d6546ffa6117f981612a08565b5f83815260046020526040902060028154600160f01b900460ff1660048111156118255761182561497b565b14611850578054604051633ba7bf8960e11b8152610cbc91600160f01b900460ff1690600401614cab565b6127108361ffff1611156118775760405163c6cc5d7f60e01b815260040160405180910390fd5b60038101546118a390600160401b810463ffffffff1690600160601b90046001600160401b0316614c98565b42106118c2576040516351c99ee160e11b815260040160405180910390fd5b80546004820154600160f81b90910460ff16906118f49086908490611015906001600160801b031661ffff8916612bc9565b5f81611904578461ffff16611914565b61191461ffff8616612710614e1c565b90505f61192084612d06565b90505f8361193b5760018501546001600160a01b0316611947565b84546001600160a01b03165b905061196d888661195b6002612710614e2f565b86116119675783612d39565b84612d39565b6040805161ffff891681525f602082015233918a917f3aabe6963c18973a7508f1915e39b168dc70c0ae2ae0ea5b1c75e5855928460f91015b60405180910390a35050505050505050565b5f6119c281612a08565b6119d087878787878761363b565b50505050505050565b6119e1612a12565b6001600160a01b038083165f908152600960205260409020541680611a035750815b611a0e838383612f84565b5061127760015f80516020614ecc83398151915255565b335f908152600a60209081526040918290208251808401909352546001600160a01b038116808452600160a01b9091046001600160401b031691830191909152611a825760405163147fde5f60e31b815260040160405180910390fd5b335f818152600a602052604080822080546001600160e01b0319169055835190516001600160a01b0390911692917f48ad3d9230390d1de9d4294bd2d8442611ed7e78e0374413babc7f7bd8f80bc991a350565b60408051610240810182525f80825260208201819052918101829052606081018290526080810182905260a0810182905260c0810182905260e08101829052610100810182905261012081018290526101408101829052610160810182905261018081018290526101a081018290526101c081018290526101e0810182905261020081018290526102208101919091525f8281526004602081815260409283902083516102408101855281546001600160a01b0381168252600160a01b81046001600160401b031693820193909352600160e01b830461ffff1694810194909452916060840191600160f01b900460ff1690811115611bd757611bd761497b565b6004811115611be857611be861497b565b8152815460ff600160f81b909104161515602082015260018201546001600160a01b0380821660408401526001600160401b03600160a01b8084048216606086015261ffff600160e01b80860482166080880152600160f01b909504811660a0870152600287015493841660c0870152818404831660e087015263ffffffff9490930484166101008601526003860154808316610120870152600160401b8104909416610140860152600160601b8404909116610160850152909104166101808201526004909101546001600160801b038082166101a0840152600160801b909104166101c09091015292915050565b604080517fe2ced3c46c3e5833e23ac23de53555471c0303e15beaafe61dc762a6963b09e1602082015290810184905261ffff83166060820152608081018290525f90611d279060a001611635565b949350505050565b5f8781526004602052604090208054600160f01b900460ff166001816004811115611d5c57611d5c61497b565b14158015611d7c57506002816004811115611d7957611d7961497b565b14155b15611d9c5780604051633ba7bf8960e11b8152600401610cbc9190614cab565b6127108861ffff161115611dc35760405163c6cc5d7f60e01b815260040160405180910390fd5b86421115611de457604051631ab7da6b60e01b815260040160405180910390fd5b5f611df08a8a8a611cd8565b8354604080516020601f8b01819004810282018101909252898152929350611e3f926001600160a01b039092169184918b908b90819084018382808284375f9201919091525061389492505050565b611e5c57604051638baa579f60e01b815260040160405180910390fd5b6001830154604080516020601f8801819004810282018101909252868152611eaa926001600160a01b03169184919089908990819084018382808284375f9201919091525061389492505050565b611ec757604051638baa579f60e01b815260040160405180910390fd5b6004830154611eeb908b908590611015906001600160801b031661ffff8e16612bc9565b6002826004811115611eff57611eff61497b565b03611f1257611f128a8461102a86612d06565b50505050505050505050565b5f82815260208190526040902060010154611f3881612a08565b610f3a8383612db3565b5f81815260046020526040902060018154600160f01b900460ff166004811115611f6e57611f6e61497b565b14611f99578054604051633ba7bf8960e11b8152610cbc91600160f01b900460ff1690600401614cab565b80546001600160a01b03163314611fc357604051633df2aaf760e11b815260040160405180910390fd5b8054600160a01b90046001600160401b03164210611ff4576040516309f575f560e01b815260040160405180910390fd5b60028101545f90600160a01b90046001600160401b0316421015612026575060048101546001600160801b0316612063565b60038201546001600160401b03164210156120635760048201548254612060916001600160801b031690600160e01b900461ffff16612bc9565b90505b6110a08383836004612be1565b600d546001600160a01b031633141580612088575033155b156120a657604051630627014560e41b815260040160405180910390fd5b600c5460405133916001600160a01b0316907f4ab5be82436d353e61ca18726e984e561f5c1cc7c6d38b29d2553c790434705a905f90a3600c80546001600160a01b03199081163317909155600d80549091169055565b5f612106612a12565b61210e613083565b8461212c5760405163bb9fac2160e01b815260040160405180910390fd5b6001600160a01b038416158061214a5750336001600160a01b038516145b15612168576040516352c97e0760e11b815260040160405180910390fd5b5f858152600460208190526040822054600160f01b900460ff16908111156121925761219261497b565b146121b057604051633c0d7b3d60e21b815260040160405180910390fd5b6001600160a01b0383165f908152600560205260409020805460ff166121e95760405163514e24c360e11b815260040160405180910390fd5b80546201000090046001600160801b031683101561221a576040516327466a8f60e11b815260040160405180910390fd5b60018101546001600160801b0316831115612248576040516303c9c8cb60e61b815260040160405180910390fd5b60018101546001600160a01b0385165f90815260066020526040902054600160801b9091046001600160801b031690612282908590614c98565b11156122a15760405163161ca4c760e31b815260040160405180910390fd5b5f8681526004602052604090208054336001600160a01b031991821617825560018201805482166001600160a01b03898116919091179091556002830180549092169087161790556122f284613904565b6004820180546001600160801b0319166001600160801b03929092169190911790558054600190829060ff60f01b1916600160f01b830217905550600b8054600183018054600160e01b61ffff938416810261ffff60e01b198316811784558554600160f01b620100009091048616026001600160f01b039091166001600160e01b039384161717909255835460028601805463ffffffff6401000000009093048316909402939092169290921790558254600385018054600160401b9283900490931690910263ffffffff60401b198316811782559354600160a01b600160601b909104909316830261ffff60a01b1990941675ffff0000000000000000ffffffff000000000000000019909216919091179290921790915581546001600160401b034290811690920267ffffffffffffffff60a01b1990911617825561243d9062278d00614c98565b6001820180546001600160401b03928316600160a01b90810267ffffffffffffffff60a01b199283161790925560028401805442909416928302939091169290921790915560038201805467ffffffffffffffff19169091179055805461ffff60e01b191681556001600160a01b0385165f90815260066020526040812080548692906124cb908490614c98565b909155506124dc9050853386613937565b80546001820154604080516001600160a01b038981168252602082018990526001600160401b03600160a01b958690048116938301939093529390920416606082015290871690339089907fbbd6bd4b00e595b2fc250c472ff25c2cc49229d922956c995d43cfafcd63ff3f9060800160405180910390a4505060015f80516020614ecc833981519152555083611d27565b5f61257881612a08565b6127108261ffff16111561259f5760405163c6cc5d7f60e01b815260040160405180910390fd5b600b546040805161ffff600160601b9093048316815291841660208301527f535acdcea9446f438d44fd0a139ab9cc75844266dec394ff5874dec2bc916888910160405180910390a150600b805461ffff909216600160601b0261ffff60601b19909216919091179055565b612613612a12565b5f81815260046020526040902060018154600160f01b900460ff16600481111561263f5761263f61497b565b1461266a578054604051633ba7bf8960e11b8152610cbc91600160f01b900460ff1690600401614cab565b80546001600160a01b03163314801590612691575060018101546001600160a01b03163314155b156126af5760405163c8ee2d1d60e01b815260040160405180910390fd5b8054600160a01b90046001600160401b03164210806126fe5750600281015460018201546126fa91600160e01b900463ffffffff1690600160a01b90046001600160401b0316614c98565b4210155b1561271c576040516321ad1e7f60e11b815260040160405180910390fd5b5f61272682613a44565b825460ff60f01b1916600160f11b1783559050612742426129cf565b60038301805467ffffffffffffffff60601b1916600160601b6001600160401b039390931692909202919091179055600182015482546001600160f81b03166001600160a01b039091163314600160f81b021782556127a081613904565b6004830180546001600160801b03928316600160801b02921691909117905560028201546001600160a01b03165f90815260066020526040812080548392906127ea908490614c98565b90915550506002820154612808906001600160a01b03163383613937565b600382015460408051838152600160601b9092046001600160401b03166020830152339185917f1a7066608b3185e477081f186a17e27a161390f95ff3f50adb9db85e43753442910160405180910390a35050610f1360015f80516020614ecc83398151915255565b5f61287b81612a08565b6001600160a01b0382166128a25760405163d92e233d60e01b815260040160405180910390fd5b600d80546001600160a01b0319166001600160a01b03848116918217909255600c54604051919216907f9745945724579b0c42c077e39e88287155952650b2dbb9fde023042588ca2457905f90a35050565b335f818152600860209081526040808320858452909152808220805460ff19166001179055518392917f58e3d0daf3e157d3df1e07bfb688b7c3a4fbf0720e582ce240611c17b884812e91a350565b5f61294d81612a08565b6105dc61ffff8316111561297457604051636d4d4a6760e11b815260040160405180910390fd5b600b546040805161ffff928316815291841660208301527f9a59612be6fc436fedf99f5465fbf3f835c330cbe77bc6338dc9e9fb8165a5b4910160405180910390a150600b805461ffff191661ffff92909216919091179055565b5f6001600160401b03821115612a0457604080516306dfcc6560e41b8152600481019190915260248101839052604401610cbc565b5090565b610f138133613a9c565b612a1a613ad5565b60025f80516020614ecc83398151915255565b5f81815260046020526040902060018154600160f01b900460ff166004811115612a5957612a5961497b565b14612a84578054604051633ba7bf8960e11b8152610cbc91600160f01b900460ff1690600401614cab565b80546001600160a01b03163314801590612aa55750612aa35f336116ff565b155b15612b2d5760018101546001600160a01b03163303612b145760028101546001820154612aef91600160e01b900463ffffffff1690600160a01b90046001600160401b0316614c98565b421015612b0f57604051631b6a7b5360e31b815260040160405180910390fd5b612b2d565b60405163c8ee2d1d60e01b815260040160405180910390fd5b61127782825f6003613b04565b5f612b4583836116ff565b612bc2575f838152602081815260408083206001600160a01b03861684529091529020805460ff19166001179055612b7a3390565b6001600160a01b0316826001600160a01b0316847f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a4506001610b8a565b505f610b8a565b5f612710612bd78385614e4e565b6116849190614e2f565b60048301545f90612bfc9084906001600160801b0316614e1c565b60018501549091505f9061271090612c1f90600160e01b900461ffff1684614e4e565b612c299190614e2f565b90505f612c368284614e1c565b86549091508490879060ff60f01b1916600160f01b836004811115612c5d57612c5d61497b565b0217905550600286015486546001600160a01b0391821691612c829183911688613c09565b6001870154612c9c9082906001600160a01b031684613c09565b600c54612cb49082906001600160a01b031685613c09565b846004811115612cc657612cc661497b565b604080518881526020810185905290810185905289907f0fe341708b716b02eb8b2ce76ab0cb7e5ae39642c641b780926089f3c6e86163906060016119a6565b80545f90600160f81b900460ff16612d285781546001600160a01b0316610b8a565b50600101546001600160a01b031690565b60048201546002830154600160801b9091046001600160801b031690612d69906001600160a01b03168383613c09565b816001600160a01b0316847f3f9de55cfeee4cc16a8500bdc30ede83a376b6f30627b3277e3545edb476249d83604051612da591815260200190565b60405180910390a350505050565b5f612dbe83836116ff565b15612bc2575f838152602081815260408083206001600160a01b0386168085529252808320805460ff1916905551339286917ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b9190a4506001610b8a565b612e24613c97565b6001805460ff191690557f5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa335b6040516001600160a01b03909116815260200160405180910390a1565b5f81815260046020526040902060018154600160f01b900460ff166004811115612e9a57612e9a61497b565b14612ec5578054604051633ba7bf8960e11b8152610cbc91600160f01b900460ff1690600401614cab565b80546001600160a01b03163314801590612eec575060018101546001600160a01b03163314155b8015612eff5750612efd5f336116ff565b155b15612f1d5760405163c8ee2d1d60e01b815260040160405180910390fd5b80546001600160a01b031633148015612f4757508054600160a01b90046001600160401b03164210155b15612f65576040516309f575f560e01b815260040160405180910390fd5b60048082015461127791849184916001600160801b0390911690613b04565b6001600160a01b038084165f90815260076020908152604080832093861683529290529081205490819003612fcc57604051630686827b60e51b815260040160405180910390fd5b6001600160a01b038085165f908152600760209081526040808320938716835292815282822082905560069052908120805483929061300c908490614e1c565b9091555061302690506001600160a01b0384168383613cba565b826001600160a01b0316826001600160a01b0316856001600160a01b03167fa4195c37c2947bbe89165f03e320b6903116f0b10d8cfdb522330f7ce6f9fa248460405161307591815260200190565b60405180910390a450505050565b60015460ff16156130a75760405163d93c066560e01b815260040160405180910390fd5b565b5f6130b7602085018561457c565b6001600160a01b0316336001600160a01b0316146130e857604051633df2aaf760e11b815260040160405180910390fd5b6130f1846115fe565b90506130fd8482613cef565b8115801590613158575061315661311a604086016020870161457c565b8285858080601f0160208091040260200160405190810160405280939291908181526020018383808284375f9201919091525061389492505050565b155b1561317657604051638baa579f60e01b815260040160405180910390fd5b5f818152600460209081526040909120906131939086018661457c565b81546001600160a01b0319166001600160a01b03919091161781556131be60a0860160808701614e65565b81546001600160401b0391909116600160a01b0267ffffffffffffffff60a01b199091161781556131f7610120860161010087016145ed565b815461ffff91909116600160e01b0260ff60f01b191662ffffff60e01b1990911617600160f01b178155613231604086016020870161457c565b6001820180546001600160a01b0319166001600160a01b039290921691909117905561326360c0860160a08701614e65565b60018201805467ffffffffffffffff60a01b198116600160a01b6001600160401b0394909416939093029283178255600b805469ffffffffffffffffffff60a01b1990921661ffff60e01b199094169390931761ffff918216600160e01b021780835592546001600160f01b039093166201000090930416600160f01b029190911790556132f7606086016040870161457c565b6002820180546001600160a01b0319166001600160a01b039290921691909117905561332960e0860160c08701614e65565b6002820180546001600160401b0392909216600160a01b0267ffffffffffffffff60a01b19831681178255600b54600160e01b63ffffffff64010000000090920491909116026001600160e01b039091166001600160a01b03909316929092179190911790556133a0610100860160e08701614e65565b60038201805467ffffffffffffffff1981166001600160401b03939093169283178255600b80546bffffffffffffffffffffffff19909216909317600160401b9182900463ffffffff1690910217808255915461ffff60a01b19909216600160601b90920461ffff16600160a01b029190911790556134226060860135613904565b6004820180546001600160801b0319166001600160801b0392909216919091179055606085018035906006905f9061345d9060408a0161457c565b6001600160a01b03166001600160a01b031681526020019081526020015f205f82825461348a9190614c98565b909155506134ae90506134a3606087016040880161457c565b338760600135613937565b6134be604086016020870161457c565b6001600160a01b03166134d4602087018761457c565b6001600160a01b0316837fbbd6bd4b00e595b2fc250c472ff25c2cc49229d922956c995d43cfafcd63ff3f61350f60608a0160408b0161457c565b60608a013561352460a08c0160808d01614e65565b61353460c08d0160a08e01614e65565b604080516001600160a01b0395909516855260208501939093526001600160401b0391821684840152166060830152519081900360800190a4509392505050565b5f610b8a6135816140c4565b8360405161190160f01b8152600281019290925260228201526042902090565b6135a9613083565b6001805460ff1916811790557f62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a25833612e51565b60606136097f000000000000000000000000000000000000000000000000000000000000000060026141ed565b905090565b60606136097f000000000000000000000000000000000000000000000000000000000000000060036141ed565b6001600160a01b0386166136625760405163d92e233d60e01b815260040160405180910390fd5b8415613766576001600160801b038316158061368f5750816001600160801b0316836001600160801b0316115b806136ab5750806001600160801b0316826001600160801b0316115b156136c9576040516303ff3dd760e11b815260040160405180910390fd5b856001600160a01b031663313ce5676040518163ffffffff1660e01b8152600401602060405180830381865afa925050508015613723575060408051601f3d908101601f1916820190925261372091810190614e7e565b60015b6137405760405163455de91560e01b815260040160405180910390fd5b60ff81166006146137645760405163455de91560e01b815260040160405180910390fd5b505b6040805160a081018252861515815285151560208083019182526001600160801b0380881684860190815287821660608601908152878316608087019081526001600160a01b038e165f81815260059096529488902096518754965193518516620100000271ffffffffffffffffffffffffffffffff0000199415156101000261ff00199215159290921661ffff19909816979097171792909216949094178555925192518116600160801b0292169190911760019092019190915590517fac7c22ade7b66df38c1e983f7fcaa1322174e9dd76f96626c41f192a57ea9b6b906138849088908890889088908890941515855292151560208501526001600160801b0391821660408501528116606084015216608082015260a00190565b60405180910390a2505050505050565b5f836001600160a01b03163b5f036138f2575f806138b28585614296565b5090925090505f8160038111156138cb576138cb61497b565b1480156138e95750856001600160a01b0316826001600160a01b0316145b92505050611684565b6138fd8484846142df565b9050611684565b5f6001600160801b03821115612a04576040516306dfcc6560e41b81526080600482015260248101839052604401610cbc565b6040516370a0823160e01b81523060048201525f906001600160a01b038516906370a0823190602401602060405180830381865afa15801561397b573d5f803e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061399f9190614cb9565b90506139b66001600160a01b038516843085614330565b6139c08282614c98565b6040516370a0823160e01b81523060048201526001600160a01b038616906370a0823190602401602060405180830381865afa158015613a02573d5f803e3d5ffd5b505050506040513d601f19601f82011682018060405250810190613a269190614cb9565b14610f3a5760405163517570bd60e01b815260040160405180910390fd5b600181015460048201545f91829161271091613a7591600160f01b90910461ffff16906001600160801b0316614e4e565b613a7f9190614e2f565b9050629896808110613a915780611684565b629896809392505050565b613aa682826116ff565b6112775760405163e2517d3f60e01b81526001600160a01b038216600482015260248101839052604401610cbc565b5f80516020614ecc833981519152546002036130a757604051633ee5aeb560e01b815260040160405180910390fd5b6002830154835460018501546001600160a01b03928316929182169116613b2d87878787612be1565b8415613b3e57613b3e828484612f84565b6001600160a01b038082165f908152600760209081526040808320938716835292905220548015613bb9576001600160a01b038281165f90815260096020526040812054909116613b8f5782613baa565b6001600160a01b038084165f90815260096020526040902054165b9050613bb7838683612f84565b505b600c546001600160a01b039081165f908152600760209081526040808320938816835292905220548015613bfe57600c54613bfe906001600160a01b03168681612f84565b505050505050505050565b805f03613c1557505050565b6001600160a01b038083165f90815260076020908152604080832093871683529290529081208054839290613c4b908490614c98565b92505081905550826001600160a01b0316826001600160a01b03167f4e45da441832cf53bdaa69235704fc0575e68210f459ee1562911024b12967d583604051610d3a91815260200190565b60015460ff166130a757604051638dfc202b60e01b815260040160405180910390fd5b613cc78383836001614366565b6110a057604051635274afe760e01b81526001600160a01b0384166004820152602401610cbc565b5f613cfd602084018461457c565b6001600160a01b03161480613d2957505f613d1e604084016020850161457c565b6001600160a01b0316145b15613d475760405163d92e233d60e01b815260040160405180910390fd5b613d57604083016020840161457c565b6001600160a01b0316613d6d602084018461457c565b6001600160a01b031603613d945760405163266227bf60e21b815260040160405180910390fd5b613da661014083016101208401614e65565b6001600160401b03164210613dce57604051638727a7f960e01b815260040160405180910390fd5b60085f613de1604085016020860161457c565b6001600160a01b0316815260208082019290925260409081015f90812084825290925290205460ff1615613e2857604051638e453c5960e01b815260040160405180910390fd5b5f818152600460208190526040822054600160f01b900460ff1690811115613e5257613e5261497b565b14613e7057604051633c0d7b3d60e21b815260040160405180910390fd5b5f600581613e84606086016040870161457c565b6001600160a01b0316815260208101919091526040015f20805490915060ff16613ec15760405163514e24c360e11b815260040160405180910390fd5b80546201000090046001600160801b031660608401351015613ef6576040516327466a8f60e11b815260040160405180910390fd5b60018101546001600160801b031660608401351115613f28576040516303c9c8cb60e61b815260040160405180910390fd5b6001810154600160801b90046001600160801b0316606084018035906006905f90613f56906040890161457c565b6001600160a01b03166001600160a01b031681526020019081526020015f2054613f809190614c98565b1115613f9f5760405163161ca4c760e31b815260040160405180910390fd5b613faf60e0840160c08501614e65565b6001600160401b031642108015613ff75750613fd2610100840160e08501614e65565b6001600160401b0316613feb60e0850160c08601614e65565b6001600160401b031611155b8015614034575061400e60a0840160808501614e65565b6001600160401b0316614028610100850160e08601614e65565b6001600160401b031611155b801561406f575061404b60c0840160a08501614e65565b6001600160401b031661406460a0850160808601614e65565b6001600160401b0316105b61408c5760405163d22806e360e01b815260040160405180910390fd5b6127106140a1610120850161010086016145ed565b61ffff1611156110a05760405163c6cc5d7f60e01b815260040160405180910390fd5b5f306001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614801561411c57507f000000000000000000000000000000000000000000000000000000000000000046145b1561414657507f000000000000000000000000000000000000000000000000000000000000000090565b613609604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60208201527f0000000000000000000000000000000000000000000000000000000000000000918101919091527f000000000000000000000000000000000000000000000000000000000000000060608201524660808201523060a08201525f9060c00160405160208183030381529060405280519060200120905090565b606060ff831461420757614200836143c8565b9050610b8a565b81805461421390614e99565b80601f016020809104026020016040519081016040528092919081815260200182805461423f90614e99565b801561428a5780601f106142615761010080835404028352916020019161428a565b820191905f5260205f20905b81548152906001019060200180831161426d57829003601f168201915b50505050509050610b8a565b5f805f83516041036142cd576020840151604085015160608601515f1a6142bf88828585614405565b9550955095505050506142d8565b505081515f91506002905b9250925092565b805160408051630b135d3f60e11b8082526004820186905260248201929092525f92906020820185604483015e60205f60648401838a5afa9050825f5114601f3d1116811693505050509392505050565b61433e8484848460016144cd565b610f3a57604051635274afe760e01b81526001600160a01b0385166004820152602401610cbc565b60405163a9059cbb60e01b5f8181526001600160a01b038616600452602485905291602083604481808b5af1925060015f511483166143bc5783831516156143b0573d5f823e3d81fd5b5f873b113d1516831692505b60405250949350505050565b60605f6143d48361453a565b6040805160208082528183019092529192505f91906020820181803683375050509182525060208101929092525090565b5f80807f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a084111561443e57505f915060039050826144c3565b604080515f808252602082018084528a905260ff891692820192909252606081018790526080810186905260019060a0016020604051602081039080840390855afa15801561448f573d5f803e3d5ffd5b5050604051601f1901519150506001600160a01b0381166144ba57505f9250600191508290506144c3565b92505f91508190505b9450945094915050565b6040516323b872dd60e01b5f8181526001600160a01b038781166004528616602452604485905291602083606481808c5af1925060015f5114831661452957838315161561451d573d5f823e3d81fd5b5f883b113d1516831692505b604052505f60605295945050505050565b5f60ff8216601f811115610b8a57604051632cd44ac360e21b815260040160405180910390fd5b80356001600160a01b0381168114614577575f80fd5b919050565b5f6020828403121561458c575f80fd5b61168482614561565b5f602082840312156145a5575f80fd5b81356001600160e01b031981168114611684575f80fd5b5f80604083850312156145cd575f80fd5b50508035926020909101359150565b803561ffff81168114614577575f80fd5b5f602082840312156145fd575f80fd5b611684826145dc565b5f60208284031215614616575f80fd5b5035919050565b5f806040838503121561462e575f80fd5b8235915061463e60208401614561565b90509250929050565b5f60208284031215614657575f80fd5b813563ffffffff81168114611684575f80fd5b5f610160828403121561467b575f80fd5b50919050565b5f8083601f840112614691575f80fd5b5081356001600160401b038111156146a7575f80fd5b6020830191508360208285010111156146be575f80fd5b9250929050565b60ff81168114610f13575f80fd5b5f805f805f805f610200888a0312156146ea575f80fd5b6146f4898961466a565b96506101608801356001600160401b0381111561470f575f80fd5b61471b8a828b01614681565b90975095505061018088013593506101a0880135614738816146c5565b969995985093969295946101c084013594506101e09093013592915050565b5f6101608284031215614768575f80fd5b611684838361466a565b5f805f6101808486031215614785575f80fd5b61478f858561466a565b92506101608401356001600160401b038111156147aa575f80fd5b6147b686828701614681565b9497909650939450505050565b5f81518084525f5b818110156147e7576020818501810151868301820152016147cb565b505f602082860101526020601f19601f83011685010191505092915050565b60ff60f81b881681525f602060e0602084015261482660e084018a6147c3565b8381036040850152614838818a6147c3565b606085018990526001600160a01b038816608086015260a0850187905284810360c0860152855180825260208088019350909101905f5b8181101561488b5783518352928401929184019160010161486f565b50909c9b505050505050505050505050565b5f80604083850312156148ae575f80fd5b8235915061463e602084016145dc565b80358015158114614577575f80fd5b80356001600160801b0381168114614577575f80fd5b5f805f805f8060c087890312156148f8575f80fd5b61490187614561565b955061490f602088016148be565b945061491d604088016148be565b935061492b606088016148cd565b9250614939608088016148cd565b915061494760a088016148cd565b90509295509295509295565b5f8060408385031215614964575f80fd5b61496d83614561565b915061463e60208401614561565b634e487b7160e01b5f52602160045260245ffd5b600581106149ab57634e487b7160e01b5f52602160045260245ffd5b9052565b6001600160a01b0386811682528581166020830152841660408201526060810183905260a081016149e3608083018461498f565b9695505050505050565b81516001600160a01b0316815261024081016020830151614a1960208401826001600160401b03169052565b506040830151614a2f604084018261ffff169052565b506060830151614a42606084018261498f565b506080830151614a56608084018215159052565b5060a0830151614a7160a08401826001600160a01b03169052565b5060c0830151614a8c60c08401826001600160401b03169052565b5060e0830151614aa260e084018261ffff169052565b506101008381015161ffff90811691840191909152610120808501516001600160a01b031690840152610140808501516001600160401b03908116918501919091526101608086015163ffffffff90811691860191909152610180808701518316908601526101a080870151909116908501526101c080860151909116908401526101e08085015190911690830152610200808401516001600160801b03908116918401919091526102209384015116929091019190915290565b5f805f60608486031215614b6f575f80fd5b83359250614b7f602085016145dc565b9150604084013590509250925092565b5f805f805f805f60a0888a031215614ba5575f80fd5b87359650614bb5602089016145dc565b95506040880135945060608801356001600160401b0380821115614bd7575f80fd5b614be38b838c01614681565b909650945060808a0135915080821115614bfb575f80fd5b50614c088a828b01614681565b989b979a50959850939692959293505050565b5f8060408385031215614c2c575f80fd5b614c3583614561565b946020939093013593505050565b5f805f8060808587031215614c56575f80fd5b84359350614c6660208601614561565b9250614c7460408601614561565b9396929550929360600135925050565b634e487b7160e01b5f52601160045260245ffd5b80820180821115610b8a57610b8a614c84565b60208101610b8a828461498f565b5f60208284031215614cc9575f80fd5b5051919050565b80356001600160401b0381168114614577575f80fd5b8281526101808101614d0b60208301614cfe85614561565b6001600160a01b03169052565b614d1760208401614561565b6001600160a01b038116604084015250614d3360408401614561565b6001600160a01b03811660608401525060608301356080830152614d5960808401614cd0565b6001600160401b03811660a084015250614d7560a08401614cd0565b6001600160401b03811660c084015250614d9160c08401614cd0565b6001600160401b03811660e084015250614dad60e08401614cd0565b610100614dc4818501836001600160401b03169052565b614dcf8186016145dc565b915050610120614de48185018361ffff169052565b614def818601614cd0565b915050610140614e09818501836001600160401b03169052565b8085013561016085015250509392505050565b81810381811115610b8a57610b8a614c84565b5f82614e4957634e487b7160e01b5f52601260045260245ffd5b500490565b8082028115828204841417610b8a57610b8a614c84565b5f60208284031215614e75575f80fd5b61168482614cd0565b5f60208284031215614e8e575f80fd5b8151611684816146c5565b600181811c90821680614ead57607f821691505b60208210810361467b57634e487b7160e01b5f52602260045260245ffdfe9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00a26469706673582212206602ce068c5617cd16da77a79657230e10103bc6099b87f30aec3e25842cdbef64736f6c63430008180033",
} as const;

export default GUIDEBLOC_ESCROW_ARTIFACT;
