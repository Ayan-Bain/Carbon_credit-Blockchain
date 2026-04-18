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
        bytes32 stateDigest; // Hash of (producer, quantity, metadataHash)
        uint256 quantity;    // Stored for convenience, must match digest
        uint256 submittedAt;
        bool verified;
        bool isInvalid;      // Poison pill flag
    }

    uint256 public nextBatchId = 1;
    uint256 public totalRetiredUnits; // Global counter for all retirements
    mapping(uint256 => CreditBatch) public batches;
    mapping(uint256 => uint256) public batchRetiredUnits; // Mapping for retirements per batch

    event BatchApproved(uint256 indexed batchId, uint256 quantity, string metadataHash);
    event BatchVerified(uint256 indexed batchId, address indexed producer, uint256 amount);
    event CreditsTransferred(uint256 indexed batchId, address indexed from, address indexed to, uint256 amount);
    event CreditsRetired(uint256 indexed batchId, address indexed account, uint256 amount);
    event TamperingDetected(uint256 indexed batchId, bytes32 expectedDigest, bytes32 actualDigest);

    constructor(address _accessControlAddress, address _tokenAddress) {
        accessControl = CarbonAccessControl(_accessControlAddress);
        token = CarbonCreditToken(_tokenAddress);
    }

    modifier onlyMinter() {
        require(accessControl.hasRole(accessControl.MINTER_ROLE(), msg.sender), "Caller is not a minter");
        _;
    }

    modifier onlyRegulator() {
        require(accessControl.hasRole(accessControl.REGULATOR_ROLE(), msg.sender), "Caller is not a regulator");
        _;
    }

    /**
     * @dev Modifier to verify that the provided DB values match the on-chain State Lock.
     * If a mismatch is detected, the batch is permanently invalidated (Poison Pill).
     */
    modifier verifyIntegrity(uint256 _batchId, uint256 _providedQuantity, string memory _providedMetadataHash) {
        CreditBatch storage batch = batches[_batchId];
        require(!batch.isInvalid, "Batch has been permanently invalidated due to tampering detection");
        
        bytes32 calculatedDigest = keccak256(abi.encodePacked(batch.producer, _providedQuantity, _providedMetadataHash));
        
        if (calculatedDigest != batch.stateDigest) {
            batch.isInvalid = true; // Permanent lock
            emit TamperingDetected(_batchId, batch.stateDigest, calculatedDigest);
            revert("Integrity Failure: DB values mismatch on-chain record. Batch permanently locked.");
        }
        _;
    }

    /**
     * @dev Step 1 of Secure Issuance: Regulator locks the batch details on-chain.
     * This creates the "Gold Standard" record that cannot be tampered with between approval and minting.
     */
    function recordApproval(
        address _producer, 
        uint256 _quantity, 
        string calldata _metadataHash
    ) external onlyRegulator returns (uint256) {
        require(_quantity > 0, "Quantity must be positive");
        
        uint256 batchId = nextBatchId++;
        bytes32 digest = keccak256(abi.encodePacked(_producer, _quantity, _metadataHash));
        
        batches[batchId] = CreditBatch({
            id: batchId,
            producer: _producer,
            stateDigest: digest,
            quantity: _quantity,
            submittedAt: block.timestamp,
            verified: true,
            isInvalid: false
        });

        emit BatchApproved(batchId, _quantity, _metadataHash);
        return batchId;
    }

    /**
     * @dev Regulator manually poisons a batch on-chain if fraud is detected off-chain.
     * This is a permanent lock that prevents any further interactions with the batch.
     */
    function invalidateBatch(uint256 _batchId) external onlyRegulator {
        CreditBatch storage batch = batches[_batchId];
        require(batch.id != 0, "Batch does not exist");
        require(!batch.isInvalid, "Batch is already invalidated");
        
        batch.isInvalid = true;
        emit TamperingDetected(_batchId, batch.stateDigest, 0x0); // Emit with 0x0 to indicate manual invalidation
    }

    /**
     * @dev Step 2 of Secure Issuance: Minter triggers the final token issuance.
     * Performs a final integrity check against the provided DB values.
     */
    function executeMinting(
        uint256 _batchId,
        uint256 _providedQuantity,
        string calldata _providedMetadataHash
    ) external onlyMinter verifyIntegrity(_batchId, _providedQuantity, _providedMetadataHash) {
        CreditBatch storage batch = batches[_batchId];
        
        // Ensure we only mint once
        require(token.balanceOf(batch.producer, _batchId) == 0, "Batch already minted");

        // Mint credits as tokens to the producer
        token.mint(batch.producer, _batchId, batch.quantity, "");

        emit BatchVerified(_batchId, batch.producer, batch.quantity);
    }



    function retireCredits(
        uint256 _batchId, 
        address _account, 
        uint256 _amount,
        uint256 _providedQuantity,
        string calldata _providedMetadataHash
    ) external onlyRegulator verifyIntegrity(_batchId, _providedQuantity, _providedMetadataHash) {
        CreditBatch storage batch = batches[_batchId];
        require(batch.id != 0, "Batch does not exist");
        require(batch.verified, "Batch is not verified");
        require(_account != address(0), "Invalid account");
        require(_amount > 0, "Amount must be greater than zero");

        token.burnFrom(_account, _batchId, _amount);
        
        totalRetiredUnits += _amount;
        batchRetiredUnits[_batchId] += _amount;

        emit CreditsRetired(_batchId, _account, _amount);
    }

    function transferCredits(
        uint256 _batchId,
        address _from,
        address _to,
        uint256 _amount,
        uint256 _providedQuantity,
        string calldata _providedMetadataHash
    ) external onlyRegulator verifyIntegrity(_batchId, _providedQuantity, _providedMetadataHash) {
        CreditBatch storage batch = batches[_batchId];
        require(batch.id != 0, "Batch does not exist");
        require(batch.verified, "Batch is not verified");
        require(_from != address(0), "Invalid sender");
        require(_to != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be greater than zero");
        
        require(
            !accessControl.hasRole(accessControl.PRODUCER_ROLE(), _to),
            "Trade Restricted: Recipient holds PRODUCER role"
        );

        token.transferByRegulator(_from, _to, _batchId, _amount, "");

        emit CreditsTransferred(_batchId, _from, _to, _amount);
    }

    /**
     * @dev Internal helper to recover the singer of a message.
     */
    function _recoverSigner(bytes32 _hash, bytes memory _signature) internal pure returns (address) {
        if (_signature.length != 65) return address(0);

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }

        if (v < 27) v += 27;
        if (v != 27 && v != 28) return address(0);

        return ecrecover(_hash, v, r, s);
    }
}
