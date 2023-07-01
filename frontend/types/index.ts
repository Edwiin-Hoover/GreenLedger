// Carbon Credit Types
export interface CarbonCredit {
  id: string;
  tokenId: number;
  issuer: string;
  owner: string;
  amount: number; // CO2 equivalent in tons
  projectType: ProjectType;
  verificationStatus: VerificationStatus;
  issueDate: Date;
  expiryDate?: Date;
  metadata: CarbonCreditMetadata;
  transactionHash: string;
}

export interface CarbonCreditMetadata {
  name: string;
  description: string;
  image: string;
  projectName: string;
  location: string;
  methodology: string;
  verificationBody: string;
  additionalData?: Record<string, any>;
}

export enum ProjectType {
  RENEWABLE_ENERGY = 'renewable_energy',
  ENERGY_EFFICIENCY = 'energy_efficiency',
  FOREST_CONSERVATION = 'forest_conservation',
  REFORESTATION = 'reforestation',
  CARBON_CAPTURE = 'carbon_capture',
  WASTE_MANAGEMENT = 'waste_management',
  TRANSPORTATION = 'transportation',
  OTHER = 'other'
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

// User Types
export interface User {
  address: string;
  name?: string;
  email?: string;
  organization?: string;
  role: UserRole;
  kycStatus: KYCStatus;
  totalCredits: number;
  totalReductions: number;
  joinDate: Date;
}

export enum UserRole {
  INDIVIDUAL = 'individual',
  ORGANIZATION = 'organization',
  VERIFIER = 'verifier',
  ISSUER = 'issuer',
  ADMIN = 'admin'
}

export enum KYCStatus {
  NOT_STARTED = 'not_started',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

// Transaction Types
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  type: TransactionType;
  amount: number;
  timestamp: Date;
  status: TransactionStatus;
  gasUsed: number;
  gasPrice: number;
}

export enum TransactionType {
  ISSUE = 'issue',
  TRANSFER = 'transfer',
  BURN = 'burn',
  APPROVE = 'approve'
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed'
}

// Dashboard Types
export interface DashboardStats {
  totalCredits: number;
  totalReductions: number;
  activeProjects: number;
  monthlyReduction: number;
  carbonFootprint: number;
  creditsHeld: number;
  creditsIssued: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
  }[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Contract Types
export interface ContractConfig {
  address: string;
  abi: any[];
  chainId: number;
}

export interface ContractEvent {
  event: string;
  args: any[];
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
}

// Wallet Types
export interface WalletInfo {
  address: string;
  balance: string;
  chainId: number;
  isConnected: boolean;
}

// Form Types
export interface IssueCreditForm {
  projectName: string;
  description: string;
  amount: number;
  projectType: ProjectType;
  location: string;
  methodology: string;
  verificationBody: string;
  expiryDate?: Date;
  image?: File;
}

export interface TransferCreditForm {
  to: string;
  tokenId: number;
  amount: number;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Environment Types
export interface EnvironmentConfig {
  NEXT_PUBLIC_CHAIN_ID: string;
  NEXT_PUBLIC_RPC_URL: string;
  NEXT_PUBLIC_IPFS_GATEWAY: string;
  NEXT_PUBLIC_CONTRACT_ADDRESS: string;
  NEXT_PUBLIC_FACTORY_ADDRESS: string;
}
