// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Test-only USDT-style token. Deliberately NON-standard:
///  - `transfer`, `transferFrom` and `approve` return NOTHING.
///  - `approve` reverts when changing a non-zero allowance to another non-zero value (reset to 0 first).
///  - No EIP-2612 `permit`.
contract MockUSDT {
    string public constant name = "Tether USD";
    string public constant symbol = "USDT";
    uint8 public constant decimals = 6;

    uint256 public totalSupply;
    mapping(address account => uint256) public balanceOf;
    mapping(address owner => mapping(address spender => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 value) external {
        require(!(value != 0 && allowance[msg.sender][spender] != 0), "USDT: reset allowance to 0 first");
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
    }

    function transfer(address to, uint256 value) external {
        _transfer(msg.sender, to, value);
    }

    function transferFrom(address from, address to, uint256 value) external {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= value, "USDT: insufficient allowance");
        allowance[from][msg.sender] = allowed - value;
        _transfer(from, to, value);
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(balanceOf[from] >= value, "USDT: insufficient balance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }
}
