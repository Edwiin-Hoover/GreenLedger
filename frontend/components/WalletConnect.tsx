import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWallet } from '@/hooks/useWallet';
import { formatAddress } from '@/utils/wallet';

interface WalletConnectProps {
  className?: string;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ className = '' }) => {
  const { 
    walletInfo, 
    isConnected, 
    isConnecting, 
    connectError,
    getFormattedAddress,
    getCurrentChainName,
    disconnectWallet 
  } = useWallet();

  if (isConnected && walletInfo) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {getCurrentChainName()}
          </span>
        </div>
        
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
          <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {walletInfo.address.slice(2, 4).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {getFormattedAddress()}
          </span>
        </div>
        
        <button
          onClick={disconnectWallet}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== 'loading';
          const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                style: {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="btn-primary flex items-center space-x-2"
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <>
                          <div className="spinner w-4 h-4"></div>
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span>Connect Wallet</span>
                        </>
                      )}
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="btn-primary bg-red-600 hover:bg-red-700"
                    >
                      Wrong network
                    </button>
                  );
                }

                return (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={openChainModal}
                      className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 20,
                            height: 20,
                            borderRadius: 999,
                            overflow: 'hidden',
                            marginRight: 4,
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{ width: 20, height: 20 }}
                            />
                          )}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {chain.name}
                      </span>
                    </button>

                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {account.address.slice(2, 4).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatAddress(account.address)}
                      </span>
                    </button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
      
      {connectError && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          {connectError.message}
        </div>
      )}
    </div>
  );
};
