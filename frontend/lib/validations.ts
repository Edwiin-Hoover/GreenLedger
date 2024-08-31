import * as z from 'zod';

// Common validation schemas
export const addressSchema = z.string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format');

export const emailSchema = z.string()
  .email('Invalid email format')
  .max(255, 'Email must be less than 255 characters');

export const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional();

export const urlSchema = z.string()
  .url('Invalid URL format')
  .optional();

// Carbon credit validation schemas
export const carbonCreditSchema = z.object({
  projectName: z.string()
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must be less than 100 characters'),
  
  projectDescription: z.string()
    .min(10, 'Project description must be at least 10 characters')
    .max(1000, 'Project description must be less than 1000 characters'),
  
  category: z.enum([
    'RENEWABLE_ENERGY',
    'FOREST_CONSERVATION',
    'WASTE_MANAGEMENT',
    'AGRICULTURE',
    'TRANSPORTATION',
    'INDUSTRIAL',
    'CARBON_CAPTURE',
    'BLUE_CARBON'
  ], {
    errorMap: () => ({ message: 'Please select a valid category' })
  }),
  
  methodology: z.string()
    .min(5, 'Methodology must be at least 5 characters')
    .max(200, 'Methodology must be less than 200 characters'),
  
  verificationStandard: z.enum([
    'VCS',
    'CDM',
    'GOLD_STANDARD',
    'CAR',
    'ACR',
    'PLAN_VIVO',
    'CCBS',
    'SBTi'
  ], {
    errorMap: () => ({ message: 'Please select a valid verification standard' })
  }),
  
  location: z.object({
    country: z.string().min(2, 'Country is required'),
    region: z.string().min(2, 'Region is required'),
    coordinates: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180)
    }).optional()
  }),
  
  carbonCredits: z.number()
    .min(1, 'Must issue at least 1 carbon credit')
    .max(1000000, 'Cannot issue more than 1,000,000 credits at once'),
  
  pricePerCredit: z.number()
    .min(0.01, 'Price must be at least $0.01')
    .max(10000, 'Price cannot exceed $10,000'),
  
  vintage: z.number()
    .min(2000, 'Vintage year must be 2000 or later')
    .max(new Date().getFullYear(), 'Vintage year cannot be in the future'),
  
  additionalData: z.record(z.any()).optional(),
  
  documents: z.array(z.object({
    name: z.string().min(1, 'Document name is required'),
    type: z.enum(['verification', 'monitoring', 'baseline', 'other']),
    hash: z.string().min(1, 'Document hash is required'),
    url: urlSchema
  })).optional()
});

// User profile validation schemas
export const userProfileSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  
  email: emailSchema,
  
  phone: phoneSchema,
  
  organization: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be less than 100 characters')
    .optional(),
  
  role: z.enum(['individual', 'business', 'ngo', 'government'], {
    errorMap: () => ({ message: 'Please select a valid role' })
  }),
  
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  
  website: urlSchema,
  
  socialMedia: z.object({
    twitter: z.string().max(100).optional(),
    linkedin: z.string().max(100).optional(),
    github: z.string().max(100).optional()
  }).optional(),
  
  address: z.object({
    street: z.string().min(5, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State/Province is required'),
    postalCode: z.string().min(3, 'Postal code is required'),
    country: z.string().min(2, 'Country is required')
  }).optional(),
  
  preferences: z.object({
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(false),
      sms: z.boolean().default(false)
    }).optional(),
    privacy: z.object({
      profileVisible: z.boolean().default(true),
      showEmail: z.boolean().default(false),
      showPhone: z.boolean().default(false)
    }).optional(),
    theme: z.enum(['light', 'dark', 'auto']).default('auto')
  }).optional()
});

// KYC validation schemas
export const kycSchema = z.object({
  documentType: z.enum(['passport', 'driver_license', 'national_id'], {
    errorMap: () => ({ message: 'Please select a valid document type' })
  }),
  
  documentNumber: z.string()
    .min(5, 'Document number must be at least 5 characters')
    .max(50, 'Document number must be less than 50 characters'),
  
  documentExpiry: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => new Date(date) > new Date(), 'Document must not be expired'),
  
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const age = new Date().getFullYear() - new Date(date).getFullYear();
      return age >= 18;
    }, 'Must be at least 18 years old'),
  
  nationality: z.string()
    .min(2, 'Nationality is required'),
  
  documents: z.array(z.object({
    type: z.enum(['front', 'back', 'selfie']),
    file: z.any().refine((file) => file instanceof File, 'File is required'),
    hash: z.string().optional()
  })).min(2, 'At least 2 documents are required'),
  
  termsAccepted: z.boolean()
    .refine((val) => val === true, 'You must accept the terms and conditions'),
  
  privacyAccepted: z.boolean()
    .refine((val) => val === true, 'You must accept the privacy policy')
});

// Transaction validation schemas
export const transactionSchema = z.object({
  type: z.enum(['mint', 'transfer', 'retire', 'verify']),
  
  tokenId: z.string()
    .min(1, 'Token ID is required'),
  
  from: addressSchema.optional(),
  
  to: addressSchema.optional(),
  
  amount: z.number()
    .min(1, 'Amount must be at least 1')
    .optional(),
  
  reason: z.string()
    .max(500, 'Reason must be less than 500 characters')
    .optional(),
  
  metadata: z.record(z.any()).optional()
});

// Search and filter validation schemas
export const searchSchema = z.object({
  query: z.string()
    .max(100, 'Search query must be less than 100 characters')
    .optional(),
  
  category: z.enum([
    'RENEWABLE_ENERGY',
    'FOREST_CONSERVATION',
    'WASTE_MANAGEMENT',
    'AGRICULTURE',
    'TRANSPORTATION',
    'INDUSTRIAL',
    'CARBON_CAPTURE',
    'BLUE_CARBON',
    'ALL'
  ]).optional(),
  
  priceRange: z.object({
    min: z.number().min(0).optional(),
    max: z.number().max(10000).optional()
  }).optional(),
  
  vintage: z.object({
    min: z.number().min(2000).optional(),
    max: z.number().max(new Date().getFullYear()).optional()
  }).optional(),
  
  location: z.object({
    country: z.string().optional(),
    region: z.string().optional()
  }).optional(),
  
  status: z.enum(['active', 'retired', 'pending', 'all']).optional(),
  
  sortBy: z.enum(['price', 'vintage', 'created', 'name']).optional(),
  
  sortOrder: z.enum(['asc', 'desc']).optional(),
  
  page: z.number().min(1).optional(),
  
  limit: z.number().min(1).max(100).optional()
});

// File upload validation schemas
export const fileUploadSchema = z.object({
  file: z.any()
    .refine((file) => file instanceof File, 'File is required')
    .refine((file) => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
    .refine((file) => {
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
        'text/csv',
        'application/json'
      ];
      return allowedTypes.includes(file.type);
    }, 'File type not supported'),
  
  category: z.enum(['verification', 'monitoring', 'baseline', 'profile', 'kyc', 'other']),
  
  description: z.string()
    .max(200, 'Description must be less than 200 characters')
    .optional()
});

// API response validation schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  timestamp: z.string().optional()
});

export const paginatedResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean()
  }),
  error: z.string().optional(),
  message: z.string().optional()
});

// Wallet connection validation
export const walletConnectionSchema = z.object({
  address: addressSchema,
  chainId: z.number().min(1),
  signature: z.string().min(1, 'Signature is required'),
  message: z.string().min(1, 'Message is required'),
  timestamp: z.number().min(1)
});

// Utility functions for validation
export const validateCarbonCredit = (data: unknown) => {
  return carbonCreditSchema.safeParse(data);
};

export const validateUserProfile = (data: unknown) => {
  return userProfileSchema.safeParse(data);
};

export const validateKYC = (data: unknown) => {
  return kycSchema.safeParse(data);
};

export const validateTransaction = (data: unknown) => {
  return transactionSchema.safeParse(data);
};

export const validateSearch = (data: unknown) => {
  return searchSchema.safeParse(data);
};

export const validateFileUpload = (data: unknown) => {
  return fileUploadSchema.safeParse(data);
};

export const validateWalletConnection = (data: unknown) => {
  return walletConnectionSchema.safeParse(data);
};

// Type exports
export type CarbonCreditInput = z.infer<typeof carbonCreditSchema>;
export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type KYCInput = z.infer<typeof kycSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type WalletConnectionInput = z.infer<typeof walletConnectionSchema>;
export type ApiResponse = z.infer<typeof apiResponseSchema>;
export type PaginatedResponse = z.infer<typeof paginatedResponseSchema>;
