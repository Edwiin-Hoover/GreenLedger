import React from 'react';
import { CarbonCredit, VerificationStatus, ProjectType } from '@/types';
import { formatAddress } from '@/utils/wallet';
import { getIPFSUrl } from '@/utils/ipfs';

interface CarbonCreditCardProps {
  credit: CarbonCredit;
  onTransfer?: (credit: CarbonCredit) => void;
  onBurn?: (credit: CarbonCredit) => void;
  onView?: (credit: CarbonCredit) => void;
  className?: string;
}

export const CarbonCreditCard: React.FC<CarbonCreditCardProps> = ({
  credit,
  onTransfer,
  onBurn,
  onView,
  className = '',
}) => {
  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.VERIFIED:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case VerificationStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case VerificationStatus.REJECTED:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case VerificationStatus.EXPIRED:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getProjectTypeIcon = (type: ProjectType) => {
    switch (type) {
      case ProjectType.RENEWABLE_ENERGY:
        return '⚡';
      case ProjectType.ENERGY_EFFICIENCY:
        return '💡';
      case ProjectType.FOREST_CONSERVATION:
        return '🌲';
      case ProjectType.REFORESTATION:
        return '🌱';
      case ProjectType.CARBON_CAPTURE:
        return '🌫️';
      case ProjectType.WASTE_MANAGEMENT:
        return '♻️';
      case ProjectType.TRANSPORTATION:
        return '🚗';
      default:
        return '🌍';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString()} tons CO₂`;
  };

  return (
    <div className={`card hover:shadow-xl transition-all duration-300 cursor-pointer group ${className}`}>
      {/* Image */}
      <div className="relative mb-4">
        <img
          src={getIPFSUrl(credit.metadata.image)}
          alt={credit.metadata.name}
          className="w-full h-48 object-cover rounded-lg"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/api/placeholder/400/300';
          }}
        />
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(credit.verificationStatus)}`}>
            {credit.verificationStatus.charAt(0).toUpperCase() + credit.verificationStatus.slice(1)}
          </span>
        </div>
        
        {/* Project Type Icon */}
        <div className="absolute top-3 left-3">
          <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-lg">{getProjectTypeIcon(credit.projectType)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Title and Amount */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {credit.metadata.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {credit.metadata.projectName}
          </p>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {formatAmount(credit.amount)}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Token ID: #{credit.tokenId}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Location:</span>
            <span>{credit.metadata.location}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="font-medium">Methodology:</span>
            <span>{credit.metadata.methodology}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="font-medium">Issued:</span>
            <span>{formatDate(credit.issueDate)}</span>
          </div>
          
          {credit.expiryDate && (
            <div className="flex items-center space-x-2">
              <span className="font-medium">Expires:</span>
              <span>{formatDate(credit.expiryDate)}</span>
            </div>
          )}
        </div>

        {/* Owner and Issuer */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Owner:</span>
              <span className="ml-1 font-mono text-gray-900 dark:text-white">
                {formatAddress(credit.owner)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm mt-1">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Issuer:</span>
              <span className="ml-1 font-mono text-gray-900 dark:text-white">
                {formatAddress(credit.issuer)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-3">
          {onView && (
            <button
              onClick={() => onView(credit)}
              className="flex-1 btn-secondary text-sm"
            >
              View Details
            </button>
          )}
          
          {onTransfer && credit.verificationStatus === VerificationStatus.VERIFIED && (
            <button
              onClick={() => onTransfer(credit)}
              className="flex-1 btn-primary text-sm"
            >
              Transfer
            </button>
          )}
          
          {onBurn && credit.verificationStatus === VerificationStatus.VERIFIED && (
            <button
              onClick={() => onBurn(credit)}
              className="px-3 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Burn
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
