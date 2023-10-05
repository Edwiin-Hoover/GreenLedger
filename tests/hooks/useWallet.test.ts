import { renderHook, act } from '@testing-library/react';
import { useWallet } from '@/hooks/useWallet';

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  useConnect: jest.fn(),
  useDisconnect: jest.fn(),
  useBalance: jest.fn(),
  useChainId: jest.fn(),
}));

import { useAccount, useConnect, useDisconnect, useBalance, useChainId } from 'wagmi';

describe('useWallet Hook', () => {
  const mockUseAccount = useAccount as jest.MockedFunction<typeof useAccount>;
  const mockUseConnect = useConnect as jest.MockedFunction<typeof useConnect>;
  const mockUseDisconnect = useDisconnect as jest.MockedFunction<typeof useDisconnect>;
  const mockUseBalance = useBalance as jest.MockedFunction<typeof useBalance>;
  const mockUseChainId = useChainId as jest.MockedFunction<typeof useChainId>;

  const mockConnect = jest.fn();
  const mockDisconnect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseConnect.mockReturnValue({
      connect: mockConnect,
      connectors: [
        { id: 'metaMask', name: 'MetaMask', icon: 'metaMaskIcon' },
        { id: 'walletConnect', name: 'WalletConnect', icon: 'walletConnectIcon' },
      ],
      error: null,
      isLoading: false,
    });

    mockUseDisconnect.mockReturnValue({
      disconnect: mockDisconnect,
    });

    mockUseBalance.mockReturnValue({
      data: {
        value: '1000000000000000000', // 1 ETH
        decimals: 18,
        symbol: 'ETH',
      },
    });

    mockUseChainId.mockReturnValue(1);
  });

  it('returns correct initial state when not connected', () => {
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
      connector: null,
    });

    const { result } = renderHook(() => useWallet());

    expect(result.current.walletInfo).toBeNull();
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.connectError).toBeNull();
    expect(result.current.address).toBeUndefined();
    expect(result.current.balance).toBeDefined();
    expect(result.current.chainId).toBe(1);
  });

  it('returns correct state when connected', () => {
    const mockAddress = '0x1234567890123456789012345678901234567890';
    
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      connector: { id: 'metaMask', name: 'MetaMask' },
    });

    const { result } = renderHook(() => useWallet());

    expect(result.current.walletInfo).toEqual({
      address: mockAddress,
      balance: '1.0000',
      chainId: 1,
      isConnected: true,
    });
    expect(result.current.isConnected).toBe(true);
    expect(result.current.address).toBe(mockAddress);
  });

  it('formats address correctly', () => {
    const mockAddress = '0x1234567890123456789012345678901234567890';
    
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      connector: { id: 'metaMask', name: 'MetaMask' },
    });

    const { result } = renderHook(() => useWallet());

    expect(result.current.getFormattedAddress()).toBe('0x1234...7890');
  });

  it('returns correct chain name', () => {
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      connector: { id: 'metaMask', name: 'MetaMask' },
    });

    mockUseChainId.mockReturnValue(137); // Polygon

    const { result } = renderHook(() => useWallet());

    expect(result.current.getCurrentChainName()).toBe('Polygon');
  });

  it('checks wallet connection correctly', () => {
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      connector: { id: 'metaMask', name: 'MetaMask' },
    });

    const { result } = renderHook(() => useWallet());

    expect(result.current.isWalletConnected()).toBe(true);
  });

  it('returns available connectors', () => {
    const { result } = renderHook(() => useWallet());

    const connectors = result.current.getAvailableConnectors();
    expect(connectors).toEqual([
      { id: 'metaMask', name: 'MetaMask', icon: 'metaMaskIcon' },
      { id: 'walletConnect', name: 'WalletConnect', icon: 'walletConnectIcon' },
    ]);
  });

  it('calls connect with correct connector', async () => {
    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connectWallet('metaMask');
    });

    expect(mockConnect).toHaveBeenCalledWith({ connector: expect.objectContaining({ id: 'metaMask' }) });
  });

  it('handles connect error', async () => {
    const mockError = new Error('Connection failed');
    mockConnect.mockRejectedValue(mockError);

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      try {
        await result.current.connectWallet('metaMask');
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });
  });

  it('calls disconnect correctly', async () => {
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      connector: { id: 'metaMask', name: 'MetaMask' },
    });

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.disconnectWallet();
    });

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('handles disconnect error', async () => {
    const mockError = new Error('Disconnect failed');
    mockDisconnect.mockRejectedValue(mockError);

    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      connector: { id: 'metaMask', name: 'MetaMask' },
    });

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      try {
        await result.current.disconnectWallet();
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });
  });

  it('shows connecting state', () => {
    mockUseConnect.mockReturnValue({
      connect: mockConnect,
      connectors: [],
      error: null,
      isLoading: true,
    });

    const { result } = renderHook(() => useWallet());

    expect(result.current.isConnecting).toBe(true);
  });

  it('shows connect error', () => {
    const mockError = new Error('Connection failed');
    
    mockUseConnect.mockReturnValue({
      connect: mockConnect,
      connectors: [],
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => useWallet());

    expect(result.current.connectError).toBe(mockError);
  });

  it('updates wallet info when connection status changes', () => {
    const mockAddress = '0x1234567890123456789012345678901234567890';
    
    // Start disconnected
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
      connector: null,
    });

    const { result, rerender } = renderHook(() => useWallet());

    expect(result.current.walletInfo).toBeNull();

    // Connect wallet
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      connector: { id: 'metaMask', name: 'MetaMask' },
    });

    rerender();

    expect(result.current.walletInfo).toEqual({
      address: mockAddress,
      balance: '1.0000',
      chainId: 1,
      isConnected: true,
    });
  });

  it('handles different chain IDs', () => {
    const testCases = [
      { chainId: 1, expectedName: 'Ethereum' },
      { chainId: 137, expectedName: 'Polygon' },
      { chainId: 42161, expectedName: 'Arbitrum One' },
      { chainId: 10, expectedName: 'Optimism' },
      { chainId: 999, expectedName: 'Unknown Chain' },
    ];

    testCases.forEach(({ chainId, expectedName }) => {
      mockUseChainId.mockReturnValue(chainId);
      
      const { result } = renderHook(() => useWallet());
      
      expect(result.current.getCurrentChainName()).toBe(expectedName);
    });
  });

  it('handles missing connector', () => {
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      connector: null,
    });

    const { result } = renderHook(() => useWallet());

    expect(result.current.connector).toBeNull();
  });

  it('handles zero balance', () => {
    mockUseBalance.mockReturnValue({
      data: {
        value: '0',
        decimals: 18,
        symbol: 'ETH',
      },
    });

    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      connector: { id: 'metaMask', name: 'MetaMask' },
    });

    const { result } = renderHook(() => useWallet());

    expect(result.current.walletInfo?.balance).toBe('0.0000');
  });

  it('handles large balance', () => {
    mockUseBalance.mockReturnValue({
      data: {
        value: '1000000000000000000000', // 1000 ETH
        decimals: 18,
        symbol: 'ETH',
      },
    });

    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      connector: { id: 'metaMask', name: 'MetaMask' },
    });

    const { result } = renderHook(() => useWallet());

    expect(result.current.walletInfo?.balance).toBe('1000.0000');
  });

  it('handles different token decimals', () => {
    mockUseBalance.mockReturnValue({
      data: {
        value: '1000000', // 1 USDC (6 decimals)
        decimals: 6,
        symbol: 'USDC',
      },
    });

    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      connector: { id: 'metaMask', name: 'MetaMask' },
    });

    const { result } = renderHook(() => useWallet());

    expect(result.current.walletInfo?.balance).toBe('1.0000');
  });
});
