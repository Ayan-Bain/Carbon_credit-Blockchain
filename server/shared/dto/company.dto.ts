export enum CompanyRole {
  PRODUCER = 'PRODUCER',
  BUYER = 'BUYER',
  BOTH = 'BOTH'
}

export interface Company {
  id: string; // UUID
  name: string;
  walletAddress: string;
  role: CompanyRole;
  kycVerified: boolean;
}
