export enum CreditBatchStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  LISTED = 'LISTED',
  SOLD_OUT = 'SOLD_OUT'
}

export interface CreditBatch {
  id: string; // UUID
  onChainBatchId: number; // uint256
  producerId: string; // FK -> Company
  status: CreditBatchStatus;
  quantity: number;
  remainingQuantity: number;
  metadataIPFSHash: string;
  submittedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string; // FK -> Regulator
  txHash: string;
}
