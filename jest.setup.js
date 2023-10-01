import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
    connector: { id: 'metaMask', name: 'MetaMask' },
  }),
  useConnect: () => ({
    connect: jest.fn(),
    connectors: [
      { id: 'metaMask', name: 'MetaMask' },
      { id: 'walletConnect', name: 'WalletConnect' },
    ],
    error: null,
    isLoading: false,
  }),
  useDisconnect: () => ({
    disconnect: jest.fn(),
  }),
  useBalance: () => ({
    data: {
      value: '1000000000000000000', // 1 ETH
      decimals: 18,
      symbol: 'ETH',
    },
  }),
  useChainId: () => 1,
}));

// Mock RainbowKit
jest.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({ children }) => children({}),
  },
}));

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart" />,
  Bar: () => <div data-testid="bar-chart" />,
  Doughnut: () => <div data-testid="doughnut-chart" />,
}));

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  BarElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  ArcElement: {},
}));

// Mock IPFS functions
jest.mock('@/utils/ipfs', () => ({
  uploadToIPFS: jest.fn().mockResolvedValue('QmTestHash123'),
  uploadJSONToIPFS: jest.fn().mockResolvedValue('QmTestHash456'),
  getIPFSUrl: jest.fn((hash) => `https://ipfs.io/ipfs/${hash}`),
  fetchFromIPFS: jest.fn().mockResolvedValue({
    name: 'Test Carbon Credit',
    description: 'Test description',
    image: 'QmTestImage123',
  }),
  uploadCarbonCreditMetadata: jest.fn().mockResolvedValue('QmTestMetadata123'),
  uploadProjectDocumentation: jest.fn().mockResolvedValue(['QmDoc1', 'QmDoc2']),
  pinToIPFS: jest.fn().mockResolvedValue(true),
  unpinFromIPFS: jest.fn().mockResolvedValue(true),
  getIPFSFileSize: jest.fn().mockResolvedValue(1024),
  isValidIPFSHash: jest.fn().mockReturnValue(true),
  hashToCID: jest.fn((hash) => hash),
  cidToIPFSUrl: jest.fn((cid) => `https://ipfs.io/ipfs/${cid}`),
}));

// Mock API functions
jest.mock('@/utils/api', () => ({
  api: {
    get: jest.fn().mockResolvedValue({ success: true, data: [] }),
    post: jest.fn().mockResolvedValue({ success: true, data: {} }),
    put: jest.fn().mockResolvedValue({ success: true, data: {} }),
    delete: jest.fn().mockResolvedValue({ success: true, data: {} }),
  },
  carbonCreditApi: {
    getCredits: jest.fn().mockResolvedValue({ data: [], total: 0, hasMore: false }),
    getCreditById: jest.fn().mockResolvedValue({ success: true, data: {} }),
    getCreditsByOwner: jest.fn().mockResolvedValue({ data: [], total: 0, hasMore: false }),
    getCreditsByIssuer: jest.fn().mockResolvedValue({ data: [], total: 0, hasMore: false }),
    issueCredit: jest.fn().mockResolvedValue({ success: true, data: {} }),
    transferCredit: jest.fn().mockResolvedValue({ success: true, data: {} }),
    burnCredit: jest.fn().mockResolvedValue({ success: true, data: {} }),
    verifyCredit: jest.fn().mockResolvedValue({ success: true, data: {} }),
  },
  userApi: {
    getUser: jest.fn().mockResolvedValue({ success: true, data: {} }),
    updateUser: jest.fn().mockResolvedValue({ success: true, data: {} }),
    startKYC: jest.fn().mockResolvedValue({ success: true, data: {} }),
    getKYCStatus: jest.fn().mockResolvedValue({ success: true, data: { status: 'approved' } }),
    registerIssuer: jest.fn().mockResolvedValue({ success: true, data: {} }),
  },
  dashboardApi: {
    getStats: jest.fn().mockResolvedValue({ success: true, data: {} }),
    getReductionHistory: jest.fn().mockResolvedValue({ success: true, data: [] }),
    getCreditHistory: jest.fn().mockResolvedValue({ success: true, data: [] }),
  },
  projectApi: {
    getProjects: jest.fn().mockResolvedValue({ data: [], total: 0, hasMore: false }),
    getProject: jest.fn().mockResolvedValue({ success: true, data: {} }),
    createProject: jest.fn().mockResolvedValue({ success: true, data: {} }),
    updateProject: jest.fn().mockResolvedValue({ success: true, data: {} }),
    submitForVerification: jest.fn().mockResolvedValue({ success: true, data: {} }),
  },
  analyticsApi: {
    getGlobalStats: jest.fn().mockResolvedValue({ success: true, data: {} }),
    getMarketData: jest.fn().mockResolvedValue({ success: true, data: {} }),
    getTrendingProjects: jest.fn().mockResolvedValue({ success: true, data: [] }),
  },
  handleApiError: jest.fn((error) => error.message || 'An error occurred'),
  isApiError: jest.fn().mockReturnValue(false),
  uploadFile: jest.fn().mockResolvedValue('https://example.com/file.jpg'),
}));

// Mock wallet utilities
jest.mock('@/utils/wallet', () => ({
  formatAddress: jest.fn((address) => `${address.slice(0, 6)}...${address.slice(-4)}`),
  formatBalance: jest.fn((balance, decimals = 18) => (parseFloat(balance) / Math.pow(10, decimals)).toFixed(4)),
  isValidAddress: jest.fn().mockReturnValue(true),
  getChainName: jest.fn().mockReturnValue('Ethereum'),
  getExplorerUrl: jest.fn().mockReturnValue('https://etherscan.io/tx/0x123'),
  getContractExplorerUrl: jest.fn().mockReturnValue('https://etherscan.io/address/0x123'),
  switchToChain: jest.fn().mockResolvedValue(undefined),
  getContractAddress: jest.fn().mockReturnValue('0x1234567890123456789012345678901234567890'),
  getFactoryAddress: jest.fn().mockReturnValue('0x1234567890123456789012345678901234567890'),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_CHAIN_ID = '1';
process.env.NEXT_PUBLIC_RPC_URL = 'https://mainnet.infura.io/v3/test';
process.env.NEXT_PUBLIC_IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';
process.env.NEXT_PUBLIC_FACTORY_ADDRESS = '0x1234567890123456789012345678901234567890';

// Global test utilities
global.mockCarbonCredit = {
  id: '1',
  tokenId: 1,
  issuer: '0x1234567890123456789012345678901234567890',
  owner: '0x0987654321098765432109876543210987654321',
  amount: 100,
  projectType: 'renewable_energy',
  verificationStatus: 'verified',
  issueDate: new Date('2023-01-01'),
  expiryDate: new Date('2024-01-01'),
  metadata: {
    name: 'Solar Farm Credit',
    description: 'Carbon credit from solar farm project',
    image: 'QmTestImage123',
    projectName: 'Solar Farm Project',
    location: 'California, USA',
    methodology: 'VCS Methodology VM0001',
    verificationBody: 'Verra',
  },
  transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
};

global.mockUser = {
  address: '0x1234567890123456789012345678901234567890',
  name: 'Test User',
  email: 'test@example.com',
  organization: 'Test Organization',
  role: 'individual',
  kycStatus: 'approved',
  totalCredits: 100,
  totalReductions: 50,
  joinDate: new Date('2023-01-01'),
};

global.mockDashboardStats = {
  totalCredits: 100,
  totalReductions: 50,
  activeProjects: 3,
  monthlyReduction: 10,
  carbonFootprint: 40,
  creditsHeld: 100,
  creditsIssued: 50,
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Suppress console warnings in tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});
