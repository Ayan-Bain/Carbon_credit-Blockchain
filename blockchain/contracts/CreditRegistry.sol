// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControl.sol";

contract CreditRegistry {
    CarbonAccessControl public accessControl;

    struct CreditBatch {
        uint256 id;
        address producer;
        string metadataHash; // IPFS metadata hash pointing to documents
        uint256 submittedAt;
        bool verified;
    }

    uint256 public nextBatchId = 1;
    mapping(uint256 => CreditBatch) public batches;

    event BatchSubmitted(uint256 indexed batchId, address indexed producer, string metadataHash);

    constructor(address _accessControlAddress) {
        accessControl = CarbonAccessControl(_accessControlAddress);
    }

    modifier onlyProducer() {
        require(accessControl.hasRole(accessControl.PRODUCER_ROLE(), msg.sender), "Caller is not a producer");
        _;
    }

    /**
     * @dev Allows a producer to submit a new batch of carbon credits.
     * @param _metadataHash The IPFS hash of the off-chain metadata (e.g., certificates).
     * @return batchId The newly generated ID for this credit batch.
     */
    function submitBatch(string memory _metadataHash) external onlyProducer returns (uint256) {
        uint256 batchId = nextBatchId++;
        
        batches[batchId] = CreditBatch({
            id: batchId,
            producer: msg.sender,
            metadataHash: _metadataHash,
            submittedAt: block.timestamp,
            verified: false
        });

        emit BatchSubmitted(batchId, msg.sender, _metadataHash);
        
        return batchId;
    }
}
