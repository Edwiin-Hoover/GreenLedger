# GreenLedger

A decentralized carbon footprint tracking and carbon credit issuance platform built on blockchain technology.

## Overview

GreenLedger enables enterprises, organizations, and individuals to track and verify their carbon emissions and carbon reduction activities. The platform generates carbon credit certificates (Carbon Credit NFTs/SBTs) through smart contracts and stores data on-chain to ensure transparency and traceability.

## Features

### User Features
- Wallet-based authentication (MetaMask, WalletConnect)
- View personal or enterprise carbon emission and reduction records
- Receive carbon credit certificates (NFT/SBT) issued by certified institutions
- Transfer carbon credit certificates on-chain or use for DAO governance

### Carbon Credit Issuers (Certification Bodies)
- Register and complete identity verification
- Generate carbon credit certificates through smart contracts
- Bind carbon reduction data with certificates (renewable energy usage, carbon capture project data)
- Batch issue carbon credit certificates to users or enterprises

### Verifiers / Third Parties
- Verify authenticity and validity of carbon credit certificates by entering address or certificate ID
- Trace carbon credit origin and historical records on-chain without relying on single institutions

## Technology Stack

### Frontend
- **Framework**: React + Next.js
- **Wallet Integration**: wagmi, rainbowkit
- **Dashboard**: User carbon emission data, held carbon credit certificates, carbon reduction behavior visualization
- **Certificate Display**: NFT gallery-style card display for carbon credit certificates

### Smart Contracts
- **CarbonCreditFactory.sol**: Deploys new carbon credit certificate contracts
- **CarbonCredit.sol**: Carbon credit certificate contract supporting NFT or SBT format
- **Data Storage**:
  - Core summary (Hash) of carbon reduction records stored on-chain
  - Detailed carbon data and proof files (energy reports, audit reports) stored on IPFS/Arweave

### Data Sources & Verification
- Support IoT devices (smart meters, carbon sensors) reporting data and automatically writing to chain
- Certification bodies sign and endorse data to increase credibility
- Use Oracle services (Chainlink) to synchronize external carbon data

## Security & Compliance
- Certificates are immutable once issued
- Enterprise or institutional identity requires KYC/certification to prevent false data
- Compliant with ISO carbon emission accounting standards, supporting future integration with government/enterprise carbon trading markets

## Future Expansion
1. **Carbon Trading Market**: Support users trading carbon credit certificates within the platform
2. **DAO Governance**: Green project DAOs can use certificates for voting to allocate funds
3. **Cross-chain Support**: Multi-chain deployment (Polygon, Arbitrum, Optimism, Celo, etc.)
4. **Mobile App**: Provide real-time carbon footprint tracking tools for enterprises and individuals
5. **Incentive Mechanism**: Users can earn token rewards through emission reduction for exchanging goods or offsetting services

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask or compatible wallet

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Edwiin-Hoover/GreenLedger.git
cd GreenLedger
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- Project Link: [https://github.com/Edwiin-Hoover/GreenLedger](https://github.com/Edwiin-Hoover/GreenLedger)
- Issues: [https://github.com/Edwiin-Hoover/GreenLedger/issues](https://github.com/Edwiin-Hoover/GreenLedger/issues)
