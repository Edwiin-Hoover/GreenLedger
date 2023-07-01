import { createConfig, http } from 'wagmi';
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { metaMask, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// Supported chains
export const supportedChains = [mainnet, polygon, arbitrum, optimism];

// Wallet connectors
export const connectors = [
  metaMask({
    dappMetadata: {
      name: 'GreenLedger',
      description: 'Decentralized Carbon Credit Platform',
      url: 'https://greenledger.app',
      iconUrl: 'https://greenledger.app/icon.png',
    },
  }),
  walletConnect({
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  }),
  coinbaseWallet({
    appName: 'GreenLedger',
    appLogoUrl: 'https://greenledger.app/icon.png',
  }),
];

// Wagmi config
export const config = createConfig({
  chains: supportedChains,
  connectors,
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
  },
});

// RainbowKit config
export const rainbowKitConfig = getDefaultConfig({
  appName: 'GreenLedger',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: supportedChains,
  connectors,
});

// Utility functions
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatBalance = (balance: string, decimals: number = 18): string => {
  const num = parseFloat(balance) / Math.pow(10, decimals);
  return num.toFixed(4);
};

export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const getChainName = (chainId: number): string => {
  const chain = supportedChains.find(c => c.id === chainId);
  return chain?.name || 'Unknown Chain';
};

export const getExplorerUrl = (chainId: number, hash: string): string => {
  const chain = supportedChains.find(c => c.id === chainId);
  if (!chain?.blockExplorers?.default) return '';
  return `${chain.blockExplorers.default.url}/tx/${hash}`;
};

export const getContractExplorerUrl = (chainId: number, address: string): string => {
  const chain = supportedChains.find(c => c.id === chainId);
  if (!chain?.blockExplorers?.default) return '';
  return `${chain.blockExplorers.default.url}/address/${address}`;
};

// Network switching utilities
export const switchToChain = async (chainId: number) => {
  try {
    await window.ethereum?.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error: any) {
    if (error.code === 4902) {
      // Chain not added to wallet
      const chain = supportedChains.find(c => c.id === chainId);
      if (chain) {
        await window.ethereum?.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${chainId.toString(16)}`,
              chainName: chain.name,
              nativeCurrency: chain.nativeCurrency,
              rpcUrls: [chain.rpcUrls.default.http[0]],
              blockExplorerUrls: chain.blockExplorers?.default?.url ? [chain.blockExplorers.default.url] : undefined,
            },
          ],
        });
      }
    }
  }
};

// Contract interaction utilities
export const getContractAddress = (chainId: number): string => {
  const addresses: Record<number, string> = {
    1: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET || '',
    137: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_POLYGON || '',
    42161: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ARBITRUM || '',
    10: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_OPTIMISM || '',
  };
  return addresses[chainId] || '';
};

export const getFactoryAddress = (chainId: number): string => {
  const addresses: Record<number, string> = {
    1: process.env.NEXT_PUBLIC_FACTORY_ADDRESS_MAINNET || '',
    137: process.env.NEXT_PUBLIC_FACTORY_ADDRESS_POLYGON || '',
    42161: process.env.NEXT_PUBLIC_FACTORY_ADDRESS_ARBITRUM || '',
    10: process.env.NEXT_PUBLIC_FACTORY_ADDRESS_OPTIMISM || '',
  };
  return addresses[chainId] || '';
};
