// Network configurations
export const SUPPORTED_NETWORKS = {
  ETHEREUM: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    blockExplorer: 'https://etherscan.io',
    color: '#627EEA',
  },
  POLYGON: {
    chainId: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-mainnet.infura.io/v3/',
    blockExplorer: 'https://polygonscan.com',
    color: '#8247E5',
  },
  ARBITRUM: {
    chainId: 42161,
    name: 'Arbitrum One',
    symbol: 'ETH',
    rpcUrl: 'https://arbitrum-mainnet.infura.io/v3/',
    blockExplorer: 'https://arbiscan.io',
    color: '#28A0F0',
  },
  OPTIMISM: {
    chainId: 10,
    name: 'Optimism',
    symbol: 'ETH',
    rpcUrl: 'https://optimism-mainnet.infura.io/v3/',
    blockExplorer: 'https://optimistic.etherscan.io',
    color: '#FF0420',
  },
  SEPOLIA: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    symbol: 'ETH',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    blockExplorer: 'https://sepolia.etherscan.io',
    color: '#627EEA',
  },
} as const;

// Carbon credit categories
export const CARBON_CREDIT_CATEGORIES = {
  RENEWABLE_ENERGY: 'Renewable Energy',
  FOREST_CONSERVATION: 'Forest Conservation',
  WASTE_MANAGEMENT: 'Waste Management',
  AGRICULTURE: 'Sustainable Agriculture',
  TRANSPORTATION: 'Clean Transportation',
  INDUSTRIAL: 'Industrial Efficiency',
  CARBON_CAPTURE: 'Carbon Capture & Storage',
  BLUE_CARBON: 'Blue Carbon (Ocean/Coastal)',
} as const;

// Verification standards
export const VERIFICATION_STANDARDS = {
  VCS: 'Verified Carbon Standard',
  CDM: 'Clean Development Mechanism',
  GOLD_STANDARD: 'Gold Standard',
  CAR: 'Climate Action Reserve',
  ACR: 'American Carbon Registry',
  PLAN_VIVO: 'Plan Vivo',
  CCBS: 'Climate, Community & Biodiversity Standards',
  SBTi: 'Science Based Targets initiative',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: '/api/auth',
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  PROFILE: '/api/auth/profile',
  
  // Carbon credits
  CARBON_CREDITS: '/api/carbon-credits',
  CARBON_CREDIT_BY_ID: (id: string) => `/api/carbon-credits/${id}`,
  VERIFY_CREDIT: (id: string) => `/api/carbon-credits/${id}/verify`,
  RETIRE_CREDIT: (id: string) => `/api/carbon-credits/${id}/retire`,
  
  // Users
  USERS: '/api/users',
  USER_BY_ID: (id: string) => `/api/users/${id}`,
  USER_KYC: '/api/users/kyc',
  
  // Dashboard
  DASHBOARD: '/api/dashboard',
  ANALYTICS: '/api/dashboard/analytics',
  STATISTICS: '/api/dashboard/statistics',
  
  // Projects
  PROJECTS: '/api/projects',
  PROJECT_BY_ID: (id: string) => `/api/projects/${id}`,
  
  // Transactions
  TRANSACTIONS: '/api/transactions',
  TRANSACTION_BY_HASH: (hash: string) => `/api/transactions/${hash}`,
  
  // IPFS
  IPFS_UPLOAD: '/api/ipfs/upload',
  IPFS_GET: (hash: string) => `/api/ipfs/${hash}`,
} as const;

// Contract addresses (to be updated with actual deployed addresses)
export const CONTRACT_ADDRESSES = {
  CARBON_CREDIT_FACTORY: {
    1: '0x0000000000000000000000000000000000000000', // Ethereum
    137: '0x0000000000000000000000000000000000000000', // Polygon
    42161: '0x0000000000000000000000000000000000000000', // Arbitrum
    10: '0x0000000000000000000000000000000000000000', // Optimism
    11155111: '0x0000000000000000000000000000000000000000', // Sepolia
  },
} as const;

// IPFS gateways
export const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.ipfs.io/ipfs/',
  'https://dweb.link/ipfs/',
] as const;

// File upload constraints
export const FILE_UPLOAD_CONSTRAINTS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/csv',
    'application/json',
  ],
  MAX_FILES: 5,
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Status constants
export const CARBON_CREDIT_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  RETIRED: 'retired',
  CANCELLED: 'cancelled',
} as const;

export const USER_ROLES = {
  USER: 'user',
  ISSUER: 'issuer',
  VERIFIER: 'verifier',
  ADMIN: 'admin',
} as const;

export const KYC_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const;

// Theme colors
export const THEME_COLORS = {
  PRIMARY: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  SECONDARY: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',
} as const;

// Animation durations
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  WALLET_CONNECTION: 'greenledger_wallet_connected',
  USER_PREFERENCES: 'greenledger_user_preferences',
  THEME: 'greenledger_theme',
  LANGUAGE: 'greenledger_language',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',
  NETWORK_NOT_SUPPORTED: 'This network is not supported',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  VALIDATION_ERROR: 'Please check your input and try again',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  NOT_FOUND: 'Resource not found',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully',
  TRANSACTION_SUBMITTED: 'Transaction submitted successfully',
  CREDIT_CREATED: 'Carbon credit created successfully',
  CREDIT_VERIFIED: 'Carbon credit verified successfully',
  CREDIT_RETIRED: 'Carbon credit retired successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  KYC_SUBMITTED: 'KYC information submitted successfully',
  FILE_UPLOADED: 'File uploaded successfully',
} as const;

// External links
export const EXTERNAL_LINKS = {
  DOCUMENTATION: 'https://docs.greenledger.io',
  GITHUB: 'https://github.com/Edwiin-Hoover/GreenLedger',
  TWITTER: 'https://twitter.com/greenledger',
  DISCORD: 'https://discord.gg/greenledger',
  BLOG: 'https://blog.greenledger.io',
  SUPPORT: 'mailto:support@greenledger.io',
} as const;

// Feature flags
export const FEATURES = {
  KYC_ENABLED: true,
  MULTI_CHAIN_ENABLED: true,
  IPFS_ENABLED: true,
  NOTIFICATIONS_ENABLED: true,
  ANALYTICS_ENABLED: true,
  BETA_FEATURES: false,
} as const;
