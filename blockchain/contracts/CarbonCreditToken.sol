// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC1155 } from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "./CarbonAccessControl.sol";

contract CarbonCreditToken is ERC1155 {
    CarbonAccessControl public accessControl;

    constructor(address _accessControlAddress, string memory _uri) ERC1155(_uri) {
        accessControl = CarbonAccessControl(_accessControlAddress);
    }

    /**
     * @dev Restricts access to identities with the REGULATOR_ROLE.
     */
    modifier onlyRegulator() {
        require(
            accessControl.hasRole(accessControl.REGULATOR_ROLE(), msg.sender),
            "Caller is not a regulator"
        );
        _;
    }

    /**
     * @dev Mints carbon credit tokens for a specific batch.
     * @param to The address to receive the tokens (usually the producer).
     * @param batchId The ID of the batch from the CreditRegistry (serves as Token ID).
     * @param amount The amount of carbon credits to mint.
     * @param data Additional data to pass to the receiver.
     */
    function mint(address to, uint256 batchId, uint256 amount, bytes memory data) external onlyRegulator {
        _mint(to, batchId, amount, data);
    }
}
