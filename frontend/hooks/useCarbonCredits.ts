import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { CarbonCredit, ProjectType, VerificationStatus } from '@/types';
import { carbonCreditApi } from '@/utils/api';
import { fetchFromIPFS } from '@/utils/ipfs';

export const useCarbonCredits = () => {
  const { address } = useAccount();
  const [credits, setCredits] = useState<CarbonCredit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch carbon credits
  const fetchCredits = useCallback(async (params?: {
    page?: number;
    limit?: number;
    owner?: string;
    issuer?: string;
    projectType?: ProjectType;
    status?: VerificationStatus;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await carbonCreditApi.getCredits(params);
      
      // Fetch metadata for each credit
      const creditsWithMetadata = await Promise.all(
        response.data.map(async (credit) => {
          try {
            const metadata = await fetchFromIPFS(credit.metadata.image);
            return {
              ...credit,
              metadata: {
                ...credit.metadata,
                ...metadata,
              },
            };
          } catch (err) {
            console.warn(`Failed to fetch metadata for credit ${credit.id}:`, err);
            return credit;
          }
        })
      );
      
      setCredits(creditsWithMetadata);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch carbon credits');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch credits by owner
  const fetchCreditsByOwner = useCallback(async (ownerAddress: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await carbonCreditApi.getCreditsByOwner(ownerAddress);
      
      const creditsWithMetadata = await Promise.all(
        response.data.map(async (credit) => {
          try {
            const metadata = await fetchFromIPFS(credit.metadata.image);
            return {
              ...credit,
              metadata: {
                ...credit.metadata,
                ...metadata,
              },
            };
          } catch (err) {
            console.warn(`Failed to fetch metadata for credit ${credit.id}:`, err);
            return credit;
          }
        })
      );
      
      setCredits(creditsWithMetadata);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch credits by owner');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch credits by issuer
  const fetchCreditsByIssuer = useCallback(async (issuerAddress: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await carbonCreditApi.getCreditsByIssuer(issuerAddress);
      
      const creditsWithMetadata = await Promise.all(
        response.data.map(async (credit) => {
          try {
            const metadata = await fetchFromIPFS(credit.metadata.image);
            return {
              ...credit,
              metadata: {
                ...credit.metadata,
                ...metadata,
              },
            };
          } catch (err) {
            console.warn(`Failed to fetch metadata for credit ${credit.id}:`, err);
            return credit;
          }
        })
      );
      
      setCredits(creditsWithMetadata);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch credits by issuer');
    } finally {
      setLoading(false);
    }
  }, []);

  // Issue new carbon credit
  const issueCredit = useCallback(async (data: {
    projectName: string;
    description: string;
    amount: number;
    projectType: ProjectType;
    location: string;
    methodology: string;
    verificationBody: string;
    metadataHash: string;
    expiryDate?: Date;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await carbonCreditApi.issueCredit(data);
      
      if (response.success && response.data) {
        // Add new credit to the list
        setCredits(prev => [response.data!, ...prev]);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to issue carbon credit');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to issue carbon credit');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Transfer carbon credit
  const transferCredit = useCallback(async (tokenId: number, to: string, amount: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await carbonCreditApi.transferCredit({ tokenId, to, amount });
      
      if (response.success) {
        // Update the credit in the list
        setCredits(prev => prev.map(credit => 
          credit.tokenId === tokenId 
            ? { ...credit, owner: to, amount: credit.amount - amount }
            : credit
        ));
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to transfer carbon credit');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to transfer carbon credit');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Burn carbon credit
  const burnCredit = useCallback(async (tokenId: number, amount: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await carbonCreditApi.burnCredit(tokenId, amount);
      
      if (response.success) {
        // Update the credit in the list
        setCredits(prev => prev.map(credit => 
          credit.tokenId === tokenId 
            ? { ...credit, amount: credit.amount - amount }
            : credit
        ));
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to burn carbon credit');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to burn carbon credit');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Verify carbon credit
  const verifyCredit = useCallback(async (tokenId: number, verified: boolean) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await carbonCreditApi.verifyCredit(tokenId, verified);
      
      if (response.success) {
        // Update the credit in the list
        setCredits(prev => prev.map(credit => 
          credit.tokenId === tokenId 
            ? { 
                ...credit, 
                verificationStatus: verified ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED 
              }
            : credit
        ));
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to verify carbon credit');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify carbon credit');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get credit by ID
  const getCreditById = useCallback(async (id: string): Promise<CarbonCredit | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await carbonCreditApi.getCreditById(id);
      
      if (response.success && response.data) {
        // Fetch metadata
        try {
          const metadata = await fetchFromIPFS(response.data.metadata.image);
          return {
            ...response.data,
            metadata: {
              ...response.data.metadata,
              ...metadata,
            },
          };
        } catch (err) {
          console.warn(`Failed to fetch metadata for credit ${id}:`, err);
          return response.data;
        }
      } else {
        throw new Error(response.error || 'Credit not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch credit');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter credits by status
  const getCreditsByStatus = useCallback((status: VerificationStatus) => {
    return credits.filter(credit => credit.verificationStatus === status);
  }, [credits]);

  // Filter credits by project type
  const getCreditsByProjectType = useCallback((projectType: ProjectType) => {
    return credits.filter(credit => credit.projectType === projectType);
  }, [credits]);

  // Get total credits amount
  const getTotalCreditsAmount = useCallback(() => {
    return credits.reduce((total, credit) => total + credit.amount, 0);
  }, [credits]);

  // Get verified credits
  const getVerifiedCredits = useCallback(() => {
    return credits.filter(credit => credit.verificationStatus === VerificationStatus.VERIFIED);
  }, [credits]);

  // Auto-fetch user's credits when address changes
  useEffect(() => {
    if (address) {
      fetchCreditsByOwner(address);
    }
  }, [address, fetchCreditsByOwner]);

  return {
    // State
    credits,
    loading,
    error,
    
    // Actions
    fetchCredits,
    fetchCreditsByOwner,
    fetchCreditsByIssuer,
    issueCredit,
    transferCredit,
    burnCredit,
    verifyCredit,
    getCreditById,
    
    // Utilities
    getCreditsByStatus,
    getCreditsByProjectType,
    getTotalCreditsAmount,
    getVerifiedCredits,
  };
};
