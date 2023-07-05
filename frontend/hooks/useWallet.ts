import { useAccount, useConnect, useDisconnect, useBalance, useChainId } from 'wagmi';
import { useCallback, useEffect, useState } from 'react';
import { WalletInfo } from '@/types';
import { formatBalance, getChainName } from '@/utils/wallet';

export const useWallet = () => {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, error: connectError, isLoading: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const chainId = useChainId();
  
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);

  // Update wallet info when connection status changes
  useEffect(() => {
    if (isConnected && address && balance) {
      setWalletInfo({
        address,
        balance: formatBalance(balance.value.toString(), balance.decimals),
        chainId,
        isConnected: true,
      });
    } else {
      setWalletInfo(null);
    }
  }, [isConnected, address, balance, chainId]);

  // Connect wallet
  const connectWallet = useCallback(async (connectorId: string) => {
    try {
      const connector = connectors.find(c => c.id === connectorId);
      if (connector) {
        await connect({ connector });
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }, [connect, connectors]);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      await disconnect();
      setWalletInfo(null);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    }
  }, [disconnect]);

  // Get formatted address
  const getFormattedAddress = useCallback(() => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  // Get chain name
  const getCurrentChainName = useCallback(() => {
    return getChainName(chainId);
  }, [chainId]);

  // Check if wallet is connected
  const isWalletConnected = useCallback(() => {
    return isConnected && !!address;
  }, [isConnected, address]);

  // Get available connectors
  const getAvailableConnectors = useCallback(() => {
    return connectors.map(connector => ({
      id: connector.id,
      name: connector.name,
      icon: connector.icon,
    }));
  }, [connectors]);

  return {
    // State
    walletInfo,
    isConnected,
    isConnecting,
    connectError,
    
    // Actions
    connectWallet,
    disconnectWallet,
    
    // Utilities
    getFormattedAddress,
    getCurrentChainName,
    isWalletConnected,
    getAvailableConnectors,
    
    // Raw data
    address,
    balance,
    chainId,
    connector,
  };
};
