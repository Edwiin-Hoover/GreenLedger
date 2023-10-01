import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletConnect } from '@/components/WalletConnect';

// Mock the useWallet hook
jest.mock('@/hooks/useWallet', () => ({
  useWallet: jest.fn(),
}));

import { useWallet } from '@/hooks/useWallet';

describe('WalletConnect Component', () => {
  const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders connect button when wallet is not connected', () => {
    mockUseWallet.mockReturnValue({
      walletInfo: null,
      isConnected: false,
      isConnecting: false,
      connectError: null,
      getFormattedAddress: jest.fn().mockReturnValue(''),
      getCurrentChainName: jest.fn().mockReturnValue(''),
      isWalletConnected: jest.fn().mockReturnValue(false),
      getAvailableConnectors: jest.fn().mockReturnValue([]),
      connectWallet: jest.fn(),
      disconnectWallet: jest.fn(),
      address: null,
      balance: null,
      chainId: 1,
      connector: null,
    });

    render(<WalletConnect />);

    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows connecting state when wallet is connecting', () => {
    mockUseWallet.mockReturnValue({
      walletInfo: null,
      isConnected: false,
      isConnecting: true,
      connectError: null,
      getFormattedAddress: jest.fn().mockReturnValue(''),
      getCurrentChainName: jest.fn().mockReturnValue(''),
      isWalletConnected: jest.fn().mockReturnValue(false),
      getAvailableConnectors: jest.fn().mockReturnValue([]),
      connectWallet: jest.fn(),
      disconnectWallet: jest.fn(),
      address: null,
      balance: null,
      chainId: 1,
      connector: null,
    });

    render(<WalletConnect />);

    expect(screen.getByText('Connecting...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders connected wallet info when wallet is connected', () => {
    const mockWalletInfo = {
      address: '0x1234567890123456789012345678901234567890',
      balance: '1.0000',
      chainId: 1,
      isConnected: true,
    };

    mockUseWallet.mockReturnValue({
      walletInfo: mockWalletInfo,
      isConnected: true,
      isConnecting: false,
      connectError: null,
      getFormattedAddress: jest.fn().mockReturnValue('0x1234...7890'),
      getCurrentChainName: jest.fn().mockReturnValue('Ethereum'),
      isWalletConnected: jest.fn().mockReturnValue(true),
      getAvailableConnectors: jest.fn().mockReturnValue([]),
      connectWallet: jest.fn(),
      disconnectWallet: jest.fn(),
      address: mockWalletInfo.address,
      balance: mockWalletInfo.balance,
      chainId: mockWalletInfo.chainId,
      connector: { id: 'metaMask', name: 'MetaMask' },
    });

    render(<WalletConnect />);

    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
    expect(screen.getByText('Disconnect')).toBeInTheDocument();
  });

  it('calls disconnectWallet when disconnect button is clicked', async () => {
    const mockDisconnectWallet = jest.fn();
    const mockWalletInfo = {
      address: '0x1234567890123456789012345678901234567890',
      balance: '1.0000',
      chainId: 1,
      isConnected: true,
    };

    mockUseWallet.mockReturnValue({
      walletInfo: mockWalletInfo,
      isConnected: true,
      isConnecting: false,
      connectError: null,
      getFormattedAddress: jest.fn().mockReturnValue('0x1234...7890'),
      getCurrentChainName: jest.fn().mockReturnValue('Ethereum'),
      isWalletConnected: jest.fn().mockReturnValue(true),
      getAvailableConnectors: jest.fn().mockReturnValue([]),
      connectWallet: jest.fn(),
      disconnectWallet: mockDisconnectWallet,
      address: mockWalletInfo.address,
      balance: mockWalletInfo.balance,
      chainId: mockWalletInfo.chainId,
      connector: { id: 'metaMask', name: 'MetaMask' },
    });

    render(<WalletConnect />);

    const disconnectButton = screen.getByText('Disconnect');
    fireEvent.click(disconnectButton);

    await waitFor(() => {
      expect(mockDisconnectWallet).toHaveBeenCalledTimes(1);
    });
  });

  it('displays connection error when present', () => {
    const mockError = new Error('Connection failed');

    mockUseWallet.mockReturnValue({
      walletInfo: null,
      isConnected: false,
      isConnecting: false,
      connectError: mockError,
      getFormattedAddress: jest.fn().mockReturnValue(''),
      getCurrentChainName: jest.fn().mockReturnValue(''),
      isWalletConnected: jest.fn().mockReturnValue(false),
      getAvailableConnectors: jest.fn().mockReturnValue([]),
      connectWallet: jest.fn(),
      disconnectWallet: jest.fn(),
      address: null,
      balance: null,
      chainId: 1,
      connector: null,
    });

    render(<WalletConnect />);

    expect(screen.getByText('Connection failed')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    mockUseWallet.mockReturnValue({
      walletInfo: null,
      isConnected: false,
      isConnecting: false,
      connectError: null,
      getFormattedAddress: jest.fn().mockReturnValue(''),
      getCurrentChainName: jest.fn().mockReturnValue(''),
      isWalletConnected: jest.fn().mockReturnValue(false),
      getAvailableConnectors: jest.fn().mockReturnValue([]),
      connectWallet: jest.fn(),
      disconnectWallet: jest.fn(),
      address: null,
      balance: null,
      chainId: 1,
      connector: null,
    });

    const { container } = render(<WalletConnect className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows wallet icon in connect button', () => {
    mockUseWallet.mockReturnValue({
      walletInfo: null,
      isConnected: false,
      isConnecting: false,
      connectError: null,
      getFormattedAddress: jest.fn().mockReturnValue(''),
      getCurrentChainName: jest.fn().mockReturnValue(''),
      isWalletConnected: jest.fn().mockReturnValue(false),
      getAvailableConnectors: jest.fn().mockReturnValue([]),
      connectWallet: jest.fn(),
      disconnectWallet: jest.fn(),
      address: null,
      balance: null,
      chainId: 1,
      connector: null,
    });

    render(<WalletConnect />);

    // Check for wallet icon (SVG element)
    const walletIcon = document.querySelector('svg');
    expect(walletIcon).toBeInTheDocument();
  });

  it('shows spinner when connecting', () => {
    mockUseWallet.mockReturnValue({
      walletInfo: null,
      isConnected: false,
      isConnecting: true,
      connectError: null,
      getFormattedAddress: jest.fn().mockReturnValue(''),
      getCurrentChainName: jest.fn().mockReturnValue(''),
      isWalletConnected: jest.fn().mockReturnValue(false),
      getAvailableConnectors: jest.fn().mockReturnValue([]),
      connectWallet: jest.fn(),
      disconnectWallet: jest.fn(),
      address: null,
      balance: null,
      chainId: 1,
      connector: null,
    });

    render(<WalletConnect />);

    // Check for spinner element
    const spinner = document.querySelector('.spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('displays correct wallet address format', () => {
    const mockWalletInfo = {
      address: '0x1234567890123456789012345678901234567890',
      balance: '1.0000',
      chainId: 1,
      isConnected: true,
    };

    mockUseWallet.mockReturnValue({
      walletInfo: mockWalletInfo,
      isConnected: true,
      isConnecting: false,
      connectError: null,
      getFormattedAddress: jest.fn().mockReturnValue('0x1234...7890'),
      getCurrentChainName: jest.fn().mockReturnValue('Ethereum'),
      isWalletConnected: jest.fn().mockReturnValue(true),
      getAvailableConnectors: jest.fn().mockReturnValue([]),
      connectWallet: jest.fn(),
      disconnectWallet: jest.fn(),
      address: mockWalletInfo.address,
      balance: mockWalletInfo.balance,
      chainId: mockWalletInfo.chainId,
      connector: { id: 'metaMask', name: 'MetaMask' },
    });

    render(<WalletConnect />);

    expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
  });

  it('shows chain name when connected', () => {
    const mockWalletInfo = {
      address: '0x1234567890123456789012345678901234567890',
      balance: '1.0000',
      chainId: 137,
      isConnected: true,
    };

    mockUseWallet.mockReturnValue({
      walletInfo: mockWalletInfo,
      isConnected: true,
      isConnecting: false,
      connectError: null,
      getFormattedAddress: jest.fn().mockReturnValue('0x1234...7890'),
      getCurrentChainName: jest.fn().mockReturnValue('Polygon'),
      isWalletConnected: jest.fn().mockReturnValue(true),
      getAvailableConnectors: jest.fn().mockReturnValue([]),
      connectWallet: jest.fn(),
      disconnectWallet: jest.fn(),
      address: mockWalletInfo.address,
      balance: mockWalletInfo.balance,
      chainId: mockWalletInfo.chainId,
      connector: { id: 'metaMask', name: 'MetaMask' },
    });

    render(<WalletConnect />);

    expect(screen.getByText('Polygon')).toBeInTheDocument();
  });
});
