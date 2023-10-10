# GreenLedger API Documentation

This document provides comprehensive documentation for the GreenLedger API endpoints.

## Table of Contents

- [Authentication](#authentication)
- [Base URL](#base-url)
- [Error Handling](#error-handling)
- [Carbon Credits API](#carbon-credits-api)
- [Users API](#users-api)
- [Dashboard API](#dashboard-api)
- [Projects API](#projects-api)
- [Analytics API](#analytics-api)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## Authentication

The GreenLedger API uses JWT (JSON Web Tokens) for authentication. To authenticate:

1. **Connect your wallet** to the frontend application
2. **Sign a message** to prove wallet ownership
3. **Receive a JWT token** for API access
4. **Include the token** in the Authorization header

### Authentication Header

```http
Authorization: Bearer <your-jwt-token>
```

### Wallet Authentication Endpoint

```http
POST /api/auth/wallet
Content-Type: application/json

{
  "address": "0x1234567890123456789012345678901234567890",
  "message": "Welcome to GreenLedger!...",
  "signature": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "address": "0x1234567890123456789012345678901234567890",
      "role": "individual",
      "kycStatus": "approved"
    }
  }
}
```

## Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://api.greenledger.app/api`

## Error Handling

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Carbon Credits API

### Get All Carbon Credits

```http
GET /api/carbon-credits?page=1&limit=20&owner=0x123...&issuer=0x456...&projectType=renewable_energy&status=verified
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `owner` (optional): Filter by owner address
- `issuer` (optional): Filter by issuer address
- `projectType` (optional): Filter by project type
- `status` (optional): Filter by verification status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "tokenId": 1,
      "issuer": "0x1234567890123456789012345678901234567890",
      "owner": "0x0987654321098765432109876543210987654321",
      "amount": 100,
      "projectType": "renewable_energy",
      "verificationStatus": "verified",
      "issueDate": "2023-01-01T00:00:00.000Z",
      "expiryDate": "2024-01-01T00:00:00.000Z",
      "metadata": {
        "name": "Solar Farm Credit",
        "description": "Carbon credit from solar farm project",
        "image": "QmTestImage123",
        "projectName": "Solar Farm Project",
        "location": "California, USA",
        "methodology": "VCS Methodology VM0001",
        "verificationBody": "Verra"
      },
      "transactionHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "hasMore": true
}
```

### Get Carbon Credit by ID

```http
GET /api/carbon-credits/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "tokenId": 1,
    "issuer": "0x1234567890123456789012345678901234567890",
    "owner": "0x0987654321098765432109876543210987654321",
    "amount": 100,
    "projectType": "renewable_energy",
    "verificationStatus": "verified",
    "issueDate": "2023-01-01T00:00:00.000Z",
    "expiryDate": "2024-01-01T00:00:00.000Z",
    "metadata": { ... },
    "transactionHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
  }
}
```

### Get Credits by Owner

```http
GET /api/carbon-credits/owner/0x0987654321098765432109876543210987654321?page=1&limit=20
```

### Get Credits by Issuer

```http
GET /api/carbon-credits/issuer/0x1234567890123456789012345678901234567890?page=1&limit=20
```

### Issue Carbon Credit

```http
POST /api/carbon-credits/issue
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectName": "Solar Farm Project",
  "description": "Large-scale solar energy generation",
  "amount": 100,
  "projectType": "renewable_energy",
  "location": "California, USA",
  "methodology": "VCS Methodology VM0001",
  "verificationBody": "Verra",
  "metadataHash": "QmTestHash123",
  "expiryDate": "2024-01-01T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "tokenId": 1,
    "issuer": "0x1234567890123456789012345678901234567890",
    "owner": "0x0987654321098765432109876543210987654321",
    "amount": 100,
    "projectType": "renewable_energy",
    "verificationStatus": "pending",
    "issueDate": "2023-01-01T00:00:00.000Z",
    "expiryDate": "2024-01-01T00:00:00.000Z",
    "metadataHash": "QmTestHash123",
    "transactionHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
  },
  "message": "Carbon credit issued successfully"
}
```

### Transfer Carbon Credit

```http
POST /api/carbon-credits/transfer
Authorization: Bearer <token>
Content-Type: application/json

{
  "tokenId": 1,
  "to": "0x9876543210987654321098765432109876543210",
  "amount": 50
}
```

### Burn Carbon Credit

```http
POST /api/carbon-credits/burn
Authorization: Bearer <token>
Content-Type: application/json

{
  "tokenId": 1,
  "amount": 25
}
```

### Verify Carbon Credit

```http
POST /api/carbon-credits/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "tokenId": 1,
  "verified": true
}
```

## Users API

### Get User Profile

```http
GET /api/users/0x1234567890123456789012345678901234567890
```

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x1234567890123456789012345678901234567890",
    "name": "John Doe",
    "email": "john@example.com",
    "organization": "Green Energy Corp",
    "role": "individual",
    "kycStatus": "approved",
    "totalCredits": 100,
    "totalReductions": 50,
    "joinDate": "2023-01-01T00:00:00.000Z"
  }
}
```

### Update User Profile

```http
PUT /api/users/0x1234567890123456789012345678901234567890
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "organization": "Updated Organization"
}
```

### Start KYC Process

```http
POST /api/users/0x1234567890123456789012345678901234567890/kyc
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "organization": "Green Energy Corp",
  "documents": ["QmDoc1", "QmDoc2"]
}
```

### Get KYC Status

```http
GET /api/users/0x1234567890123456789012345678901234567890/kyc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "approved",
    "message": "KYC verification completed successfully"
  }
}
```

### Register as Issuer

```http
POST /api/users/0x1234567890123456789012345678901234567890/issuer
Authorization: Bearer <token>
Content-Type: application/json

{
  "organizationName": "Green Energy Corp",
  "description": "Leading renewable energy company",
  "website": "https://greenenergy.com",
  "documents": ["QmCert1", "QmCert2"]
}
```

## Dashboard API

### Get Dashboard Stats

```http
GET /api/dashboard/stats/0x1234567890123456789012345678901234567890
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCredits": 100,
    "totalReductions": 50,
    "activeProjects": 3,
    "monthlyReduction": 10,
    "carbonFootprint": 40,
    "creditsHeld": 100,
    "creditsIssued": 50
  }
}
```

### Get Reduction History

```http
GET /api/dashboard/reductions/0x1234567890123456789012345678901234567890?period=month
```

**Query Parameters:**
- `period`: `week`, `month`, or `year` (default: `month`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2023-01-01",
      "amount": 10
    },
    {
      "date": "2023-01-02",
      "amount": 15
    }
  ]
}
```

### Get Credit History

```http
GET /api/dashboard/credits/0x1234567890123456789012345678901234567890?period=month
```

## Projects API

### Get All Projects

```http
GET /api/projects?page=1&limit=20&type=renewable_energy&location=California
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `type` (optional): Filter by project type
- `location` (optional): Filter by location

### Get Project by ID

```http
GET /api/projects/1
```

### Create Project

```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Solar Farm Project",
  "description": "Large-scale solar energy generation",
  "projectType": "renewable_energy",
  "location": "California, USA",
  "methodology": "VCS Methodology VM0001",
  "estimatedReduction": 1000,
  "documents": ["QmDoc1", "QmDoc2"]
}
```

## Analytics API

### Get Global Stats

```http
GET /api/analytics/global
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCreditsIssued": 10000,
    "totalProjects": 500,
    "totalUsers": 1000,
    "totalReductions": 5000
  }
}
```

### Get Market Data

```http
GET /api/analytics/market
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "projectType": "renewable_energy",
      "count": 300,
      "totalAmount": 3000
    },
    {
      "projectType": "energy_efficiency",
      "count": 200,
      "totalAmount": 2000
    }
  ]
}
```

### Get Trending Projects

```http
GET /api/analytics/trending
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Rate Limit**: 100 requests per 15 minutes per IP
- **Headers**: Rate limit information is included in response headers
- **Exceeded**: Returns HTTP 429 with retry information

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Examples

### Complete Workflow Example

1. **Authenticate with wallet**:
```bash
curl -X POST http://localhost:3001/api/auth/wallet \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x1234567890123456789012345678901234567890",
    "message": "Welcome to GreenLedger!...",
    "signature": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
  }'
```

2. **Create a project**:
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Solar Farm Project",
    "description": "Large-scale solar energy generation",
    "projectType": "renewable_energy",
    "location": "California, USA",
    "methodology": "VCS Methodology VM0001",
    "estimatedReduction": 1000,
    "documents": ["QmDoc1", "QmDoc2"]
  }'
```

3. **Issue carbon credits**:
```bash
curl -X POST http://localhost:3001/api/carbon-credits/issue \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Solar Farm Project",
    "description": "Carbon credit from solar farm project",
    "amount": 100,
    "projectType": "renewable_energy",
    "location": "California, USA",
    "methodology": "VCS Methodology VM0001",
    "verificationBody": "Verra",
    "metadataHash": "QmTestHash123",
    "expiryDate": "2024-01-01T00:00:00.000Z"
  }'
```

4. **Get dashboard stats**:
```bash
curl -X GET http://localhost:3001/api/dashboard/stats/0x1234567890123456789012345678901234567890 \
  -H "Authorization: Bearer <token>"
```

### Error Handling Example

```bash
curl -X POST http://localhost:3001/api/carbon-credits/issue \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "",
    "amount": -100
  }'
```

**Response:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "projectName",
      "message": "Project name cannot be empty"
    },
    {
      "field": "amount",
      "message": "Amount must be greater than zero"
    }
  ]
}
```

---

For more information, please refer to the [Contributing Guide](CONTRIBUTING.md) or open an issue on GitHub.
