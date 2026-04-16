// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

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

    /**
     * @dev Burns carbon credit tokens from a specific account and batch.
     * The caller must hold the REGULATOR_ROLE.
     */
    function burnFrom(address from, uint256 batchId, uint256 amount) external onlyRegulator {
        _burn(from, batchId, amount);
    }

    /**
     * @dev Transfers carbon credit tokens between accounts under regulator control.
     */
    function transferByRegulator(
        address from,
        address to,
        uint256 batchId,
        uint256 amount,
        bytes memory data
    ) external onlyRegulator {
        _safeTransferFrom(from, to, batchId, amount, data);
    }
}
