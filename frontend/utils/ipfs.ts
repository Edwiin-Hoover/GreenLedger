import { create } from 'ipfs-http-client';

// IPFS configuration
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
const IPFS_API_URL = process.env.NEXT_PUBLIC_IPFS_API_URL || 'https://ipfs.infura.io:5001';

// Initialize IPFS client
let ipfsClient: any = null;

const getIpfsClient = () => {
  if (!ipfsClient) {
    try {
      ipfsClient = create({
        url: IPFS_API_URL,
        headers: {
          authorization: process.env.NEXT_PUBLIC_IPFS_AUTH || '',
        },
      });
    } catch (error) {
      console.error('Failed to initialize IPFS client:', error);
      throw new Error('IPFS client initialization failed');
    }
  }
  return ipfsClient;
};

// Upload file to IPFS
export const uploadToIPFS = async (file: File): Promise<string> => {
  try {
    const client = getIpfsClient();
    const result = await client.add(file);
    return result.path;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error('Failed to upload file to IPFS');
  }
};

// Upload JSON data to IPFS
export const uploadJSONToIPFS = async (data: any): Promise<string> => {
  try {
    const client = getIpfsClient();
    const jsonString = JSON.stringify(data);
    const result = await client.add(jsonString);
    return result.path;
  } catch (error) {
    console.error('Error uploading JSON to IPFS:', error);
    throw new Error('Failed to upload JSON to IPFS');
  }
};

// Get IPFS URL
export const getIPFSUrl = (hash: string): string => {
  if (!hash) return '';
  if (hash.startsWith('http')) return hash;
  if (hash.startsWith('ipfs://')) {
    return hash.replace('ipfs://', IPFS_GATEWAY);
  }
  return `${IPFS_GATEWAY}${hash}`;
};

// Fetch data from IPFS
export const fetchFromIPFS = async (hash: string): Promise<any> => {
  try {
    const url = getIPFSUrl(hash);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return await response.json();
    } else if (contentType?.includes('text/')) {
      return await response.text();
    } else {
      return await response.blob();
    }
  } catch (error) {
    console.error('Error fetching from IPFS:', error);
    throw new Error('Failed to fetch data from IPFS');
  }
};

// Upload carbon credit metadata
export const uploadCarbonCreditMetadata = async (metadata: {
  name: string;
  description: string;
  image: string;
  projectName: string;
  location: string;
  methodology: string;
  verificationBody: string;
  additionalData?: Record<string, any>;
}): Promise<string> => {
  try {
    const metadataWithTimestamp = {
      ...metadata,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    
    return await uploadJSONToIPFS(metadataWithTimestamp);
  } catch (error) {
    console.error('Error uploading carbon credit metadata:', error);
    throw new Error('Failed to upload carbon credit metadata');
  }
};

// Upload project documentation
export const uploadProjectDocumentation = async (files: File[]): Promise<string[]> => {
  try {
    const uploadPromises = files.map(file => uploadToIPFS(file));
    const hashes = await Promise.all(uploadPromises);
    return hashes;
  } catch (error) {
    console.error('Error uploading project documentation:', error);
    throw new Error('Failed to upload project documentation');
  }
};

// Pin content to IPFS (for persistence)
export const pinToIPFS = async (hash: string): Promise<boolean> => {
  try {
    const client = getIpfsClient();
    await client.pin.add(hash);
    return true;
  } catch (error) {
    console.error('Error pinning to IPFS:', error);
    return false;
  }
};

// Unpin content from IPFS
export const unpinFromIPFS = async (hash: string): Promise<boolean> => {
  try {
    const client = getIpfsClient();
    await client.pin.rm(hash);
    return true;
  } catch (error) {
    console.error('Error unpinning from IPFS:', error);
    return false;
  }
};

// Get file size from IPFS
export const getIPFSFileSize = async (hash: string): Promise<number> => {
  try {
    const client = getIpfsClient();
    const stats = await client.files.stat(`/ipfs/${hash}`);
    return stats.size;
  } catch (error) {
    console.error('Error getting IPFS file size:', error);
    return 0;
  }
};

// Validate IPFS hash format
export const isValidIPFSHash = (hash: string): boolean => {
  // IPFS hashes are typically 46 characters long and start with 'Qm' or 'baf'
  const ipfsHashRegex = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z2-7]{56})$/;
  return ipfsHashRegex.test(hash);
};

// Convert IPFS hash to CID
export const hashToCID = (hash: string): string => {
  if (hash.startsWith('ipfs://')) {
    return hash.replace('ipfs://', '');
  }
  return hash;
};

// Convert CID to IPFS URL
export const cidToIPFSUrl = (cid: string): string => {
  return getIPFSUrl(cid);
};
