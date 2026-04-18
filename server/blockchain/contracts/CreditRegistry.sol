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
    uint256 public totalRetiredUnits; // Global counter for all retirements
    mapping(uint256 => CreditBatch) public batches;
    mapping(uint256 => uint256) public batchRetiredUnits; // Mapping for retirements per batch

    event BatchSubmitted(uint256 indexed batchId, address indexed producer, string metadataHash);
    event BatchVerified(uint256 indexed batchId, address indexed producer, uint256 amount);
    event CreditsTransferred(uint256 indexed batchId, address indexed from, address indexed to, uint256 amount);
    event CreditsRetired(uint256 indexed batchId, address indexed account, uint256 amount);

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
     * @dev Allows a minter to create a verified batch and mint tokens using a regulator's permission signature.
     * This prevents DB tampering where a producer might increase the quantity after verification.
     * @param _producer The address of the producer who owns the credits.
     * @param _metadataHash The IPFS hash of the off-chain metadata.
     * @param _quantity The amount of credits to mint.
     * @param _signature The cryptographic signature from a verified Regulator confirming the quantity.
     * @return batchId The newly generated ID for this credit batch.
     */
    function mintBatch(
        address _producer, 
        string memory _metadataHash, 
        uint256 _quantity,
        bytes memory _signature
    ) external onlyMinter returns (uint256) {
        // 1. Verify that the quantity was signed by a Regulator
        bytes32 messageHash = keccak256(abi.encodePacked(_producer, _metadataHash, _quantity));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        
        address signer = _recoverSigner(ethSignedMessageHash, _signature);
        require(accessControl.hasRole(accessControl.REGULATOR_ROLE(), signer), "Audit Failure: Invalid Regulator signature for this quantity");

        uint256 batchId = nextBatchId++;
        
        batches[batchId] = CreditBatch({
            id: batchId,
            producer: _producer,
            metadataHash: _metadataHash,
            quantity: _quantity,
            submittedAt: block.timestamp,
            verified: true
        });

        // Mint credits as tokens to the producer
        token.mint(_producer, batchId, _quantity, "");

        emit BatchSubmitted(batchId, _producer, _metadataHash);
        emit BatchVerified(batchId, _producer, _quantity);
        
        return batchId;
    }

    function verifyBatch(uint256 _batchId, uint256 _quantity) external onlyRegulator {
        CreditBatch storage batch = batches[_batchId];
        require(batch.id != 0, "Batch does not exist");
        require(!batch.verified, "Batch already verified");
        require(_quantity > 0, "Quantity must be greater than zero");

        batch.verified = true;
        batch.quantity = _quantity;

        // Mint credits as tokens to the producer
        token.mint(batch.producer, _batchId, _quantity, "");

        emit BatchVerified(_batchId, batch.producer, _quantity);
    }

    function retireCredits(uint256 _batchId, address _account, uint256 _amount) external onlyRegulator {
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
        uint256 _amount
    ) external onlyRegulator {
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
