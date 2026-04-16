// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { AccessControl as OZAccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";

contract CarbonAccessControl is OZAccessControl {
    bytes32 public constant PRODUCER_ROLE = keccak256("PRODUCER_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");
    bytes32 public constant BUYER_ROLE = keccak256("BUYER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() {
        // Grant the contract deployer the default admin role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
}
