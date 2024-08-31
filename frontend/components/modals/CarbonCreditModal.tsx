import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CarbonCredit } from '../../types';
import { LeafIcon, VerifiedIcon, GlobeIcon } from '../icons';

interface CarbonCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  carbonCredit: CarbonCredit | null;
  onRetire?: (creditId: string) => void;
  onTransfer?: (creditId: string, toAddress: string) => void;
}

const CarbonCreditModal: React.FC<CarbonCreditModalProps> = ({
  isOpen,
  onClose,
  carbonCredit,
  onRetire,
  onTransfer,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'history'>('details');
  const [transferAddress, setTransferAddress] = useState('');
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showRetireConfirm, setShowRetireConfirm] = useState(false);

  if (!carbonCredit) return null;

  const handleRetire = () => {
    if (onRetire) {
      onRetire(carbonCredit.id);
      setShowRetireConfirm(false);
      onClose();
    }
  };

  const handleTransfer = () => {
    if (onTransfer && transferAddress) {
      onTransfer(carbonCredit.id, transferAddress);
      setTransferAddress('');
      setShowTransferForm(false);
      onClose();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'retired':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <LeafIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900"
                      >
                        {carbonCredit.projectName}
                      </Dialog.Title>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(carbonCredit.status)}`}>
                          {carbonCredit.status}
                        </span>
                        {carbonCredit.verified && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <VerifiedIcon className="w-4 h-4" />
                            <span className="text-xs">Verified</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {[
                      { key: 'details', name: 'Details' },
                      { key: 'documents', name: 'Documents' },
                      { key: 'history', name: 'History' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab.key
                            ? 'border-green-500 text-green-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab.name}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Content */}
                <div className="min-h-[400px]">
                  {activeTab === 'details' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Project Information</h4>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Category:</span>
                              <span className="text-sm font-medium">{carbonCredit.category}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Methodology:</span>
                              <span className="text-sm font-medium">{carbonCredit.methodology}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Standard:</span>
                              <span className="text-sm font-medium">{carbonCredit.verificationStandard}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Vintage:</span>
                              <span className="text-sm font-medium">{carbonCredit.vintage}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Location</h4>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <GlobeIcon className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-medium">
                                {carbonCredit.location.region}, {carbonCredit.location.country}
                              </span>
                            </div>
                            {carbonCredit.location.coordinates && (
                              <div className="text-xs text-gray-600">
                                Lat: {carbonCredit.location.coordinates.latitude}, 
                                Lng: {carbonCredit.location.coordinates.longitude}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Credit Information</h4>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Total Credits:</span>
                              <span className="text-sm font-medium">{carbonCredit.totalCredits} tCO₂e</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Available:</span>
                              <span className="text-sm font-medium">{carbonCredit.availableCredits} tCO₂e</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Price:</span>
                              <span className="text-sm font-medium">${carbonCredit.pricePerCredit}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Token ID:</span>
                              <span className="text-sm font-mono">{carbonCredit.tokenId}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-700">{carbonCredit.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'documents' && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-900">Project Documents</h4>
                      {carbonCredit.documents && carbonCredit.documents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {carbonCredit.documents.map((doc, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-gray-900">{doc.name}</h5>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {doc.type}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">
                                Hash: <span className="font-mono">{doc.hash}</span>
                              </p>
                              {doc.url && (
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                                >
                                  View Document →
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No documents available for this carbon credit.
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'history' && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-900">Transaction History</h4>
                      <div className="space-y-3">
                        {carbonCredit.transactionHistory?.map((tx, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900 capitalize">{tx.type}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(tx.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              {tx.from && <div>From: <span className="font-mono">{tx.from}</span></div>}
                              {tx.to && <div>To: <span className="font-mono">{tx.to}</span></div>}
                              {tx.amount && <div>Amount: {tx.amount} tCO₂e</div>}
                              <div>Tx Hash: <span className="font-mono">{tx.txHash}</span></div>
                            </div>
                          </div>
                        )) || (
                          <div className="text-center py-8 text-gray-500">
                            No transaction history available.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {carbonCredit.status === 'verified' && (
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowTransferForm(true)}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRetireConfirm(true)}
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Retire
                    </button>
                  </div>
                )}

                {/* Transfer Form */}
                {showTransferForm && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-3">Transfer Carbon Credit</h5>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Recipient Address
                        </label>
                        <input
                          type="text"
                          value={transferAddress}
                          onChange={(e) => setTransferAddress(e.target.value)}
                          placeholder="0x..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowTransferForm(false)}
                          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleTransfer}
                          disabled={!transferAddress}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          Transfer
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Retire Confirmation */}
                {showRetireConfirm && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg">
                    <h5 className="font-medium text-red-900 mb-2">Retire Carbon Credit</h5>
                    <p className="text-sm text-red-700 mb-3">
                      Are you sure you want to retire this carbon credit? This action cannot be undone.
                    </p>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowRetireConfirm(false)}
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleRetire}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                      >
                        Retire
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CarbonCreditModal;
