// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CarbonAccessControl.sol";
import "./CarbonCreditToken.sol";

contract CreditRegistry {
    CarbonAccessControl public accessControl;
    CarbonCreditToken public token;

    struct CreditBatch {
        uint256 id;
        address producer;
        string metadataHash;
        uint256 quantity; // Total credits in this batch
        uint256 submittedAt;
        bool verified;
    }

    uint256 public nextBatchId = 1;
    mapping(uint256 => CreditBatch) public batches;

    event BatchSubmitted(uint256 indexed batchId, address indexed producer, string metadataHash);
    event BatchVerified(uint256 indexed batchId, address indexed producer, uint256 amount);
    event CreditsTransferred(uint256 indexed batchId, address indexed from, address indexed to, uint256 amount);
    event CreditsRetired(uint256 indexed batchId, address indexed account, uint256 amount);

    constructor(address _accessControlAddress, address _tokenAddress) {
        accessControl = CarbonAccessControl(_accessControlAddress);
        token = CarbonCreditToken(_tokenAddress);
    }

    modifier onlyProducer() {
        require(accessControl.hasRole(accessControl.PRODUCER_ROLE(), msg.sender), "Caller is not a producer");
        _;
    }

    modifier onlyRegulator() {
        require(accessControl.hasRole(accessControl.REGULATOR_ROLE(), msg.sender), "Caller is not a regulator");
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
            quantity: 0,
            submittedAt: block.timestamp,
            verified: false
        });

        emit BatchSubmitted(batchId, msg.sender, _metadataHash);
        
        return batchId;
    }

    /**
     * @dev Allows a regulator to verify a batch and mint tokens to the producer.
     * @param _batchId The ID of the batch to verify.
     * @param _quantity The quantity of credits to mint.
     */
    function verifyBatch(uint256 _batchId, uint256 _quantity) external onlyRegulator {
        CreditBatch storage batch = batches[_batchId];
        require(batch.id != 0, "Batch does not exist");
        require(!batch.verified, "Batch already verified");
        require(_quantity > 0, "Quantity must be greater than zero");

        batch.verified = true;
        batch.quantity = _quantity;

        // Mint credits as tokens to the producer
        // Note: For this to work, the CreditRegistry contract must have the REGULATOR_ROLE 
        // in the token contract, or the token contract must allow this call.
        token.mint(batch.producer, _batchId, _quantity, "");

        emit BatchVerified(_batchId, batch.producer, _quantity);
    }

    /**
     * @dev Allows a regulator to retire credits by burning the buyer's batch tokens.
     * @param _batchId The ID of the verified batch.
     * @param _account The token holder whose credits should be retired.
     * @param _amount The number of credits to retire.
     */
    function retireCredits(uint256 _batchId, address _account, uint256 _amount) external onlyRegulator {
        CreditBatch storage batch = batches[_batchId];
        require(batch.id != 0, "Batch does not exist");
        require(batch.verified, "Batch is not verified");
        require(_account != address(0), "Invalid account");
        require(_amount > 0, "Amount must be greater than zero");

        token.burnFrom(_account, _batchId, _amount);

        emit CreditsRetired(_batchId, _account, _amount);
    }

    /**
     * @dev Allows a regulator to transfer verified batch tokens between accounts.
     * @param _batchId The ID of the verified batch.
     * @param _from The current token holder.
     * @param _to The recipient.
     * @param _amount The amount to transfer.
     */
    function transferCredits(
        uint256 _batchId,
        address _from,
        address _to,
        uint256 _amount
    ) external onlyRegulator {
        CreditBatch storage batch = batches[_batchId];
        require(batch.id != 0, "Batch does not exist");
        require(batch.verified, "Batch is not verified");
        require(_from != address(0), "Invalid sender");
        require(_to != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be greater than zero");

        token.transferByRegulator(_from, _to, _batchId, _amount, "");

        emit CreditsTransferred(_batchId, _from, _to, _amount);
    }
}
