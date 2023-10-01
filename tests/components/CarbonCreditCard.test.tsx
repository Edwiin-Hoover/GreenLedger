import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CarbonCreditCard } from '@/components/CarbonCreditCard';
import { CarbonCredit, VerificationStatus, ProjectType } from '@/types';

describe('CarbonCreditCard Component', () => {
  const mockCredit: CarbonCredit = {
    id: '1',
    tokenId: 1,
    issuer: '0x1234567890123456789012345678901234567890',
    owner: '0x0987654321098765432109876543210987654321',
    amount: 100,
    projectType: ProjectType.RENEWABLE_ENERGY,
    verificationStatus: VerificationStatus.VERIFIED,
    issueDate: new Date('2023-01-01'),
    expiryDate: new Date('2024-01-01'),
    metadata: {
      name: 'Solar Farm Credit',
      description: 'Carbon credit from solar farm project',
      image: 'QmTestImage123',
      projectName: 'Solar Farm Project',
      location: 'California, USA',
      methodology: 'VCS Methodology VM0001',
      verificationBody: 'Verra',
    },
    transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  };

  const defaultProps = {
    credit: mockCredit,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders carbon credit information correctly', () => {
    render(<CarbonCreditCard {...defaultProps} />);

    expect(screen.getByText('Solar Farm Credit')).toBeInTheDocument();
    expect(screen.getByText('Solar Farm Project')).toBeInTheDocument();
    expect(screen.getByText('100 tons CO₂')).toBeInTheDocument();
    expect(screen.getByText('Token ID: #1')).toBeInTheDocument();
    expect(screen.getByText('California, USA')).toBeInTheDocument();
    expect(screen.getByText('VCS Methodology VM0001')).toBeInTheDocument();
    expect(screen.getByText('Verra')).toBeInTheDocument();
  });

  it('displays verified status badge', () => {
    render(<CarbonCreditCard {...defaultProps} />);

    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('displays pending status badge', () => {
    const pendingCredit = {
      ...mockCredit,
      verificationStatus: VerificationStatus.PENDING,
    };

    render(<CarbonCreditCard {...defaultProps} credit={pendingCredit} />);

    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('displays rejected status badge', () => {
    const rejectedCredit = {
      ...mockCredit,
      verificationStatus: VerificationStatus.REJECTED,
    };

    render(<CarbonCreditCard {...defaultProps} credit={rejectedCredit} />);

    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('displays expired status badge', () => {
    const expiredCredit = {
      ...mockCredit,
      verificationStatus: VerificationStatus.EXPIRED,
    };

    render(<CarbonCreditCard {...defaultProps} credit={expiredCredit} />);

    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('shows correct project type icon', () => {
    render(<CarbonCreditCard {...defaultProps} />);

    // Renewable energy should show ⚡ icon
    expect(screen.getByText('⚡')).toBeInTheDocument();
  });

  it('shows energy efficiency icon for energy efficiency projects', () => {
    const energyEfficiencyCredit = {
      ...mockCredit,
      projectType: ProjectType.ENERGY_EFFICIENCY,
    };

    render(<CarbonCreditCard {...defaultProps} credit={energyEfficiencyCredit} />);

    expect(screen.getByText('💡')).toBeInTheDocument();
  });

  it('shows forest conservation icon for forest conservation projects', () => {
    const forestCredit = {
      ...mockCredit,
      projectType: ProjectType.FOREST_CONSERVATION,
    };

    render(<CarbonCreditCard {...defaultProps} credit={forestCredit} />);

    expect(screen.getByText('🌲')).toBeInTheDocument();
  });

  it('shows reforestation icon for reforestation projects', () => {
    const reforestationCredit = {
      ...mockCredit,
      projectType: ProjectType.REFORESTATION,
    };

    render(<CarbonCreditCard {...defaultProps} credit={reforestationCredit} />);

    expect(screen.getByText('🌱')).toBeInTheDocument();
  });

  it('shows carbon capture icon for carbon capture projects', () => {
    const carbonCaptureCredit = {
      ...mockCredit,
      projectType: ProjectType.CARBON_CAPTURE,
    };

    render(<CarbonCreditCard {...defaultProps} credit={carbonCaptureCredit} />);

    expect(screen.getByText('🌫️')).toBeInTheDocument();
  });

  it('shows waste management icon for waste management projects', () => {
    const wasteCredit = {
      ...mockCredit,
      projectType: ProjectType.WASTE_MANAGEMENT,
    };

    render(<CarbonCreditCard {...defaultProps} credit={wasteCredit} />);

    expect(screen.getByText('♻️')).toBeInTheDocument();
  });

  it('shows transportation icon for transportation projects', () => {
    const transportCredit = {
      ...mockCredit,
      projectType: ProjectType.TRANSPORTATION,
    };

    render(<CarbonCreditCard {...defaultProps} credit={transportCredit} />);

    expect(screen.getByText('🚗')).toBeInTheDocument();
  });

  it('shows default icon for other project types', () => {
    const otherCredit = {
      ...mockCredit,
      projectType: ProjectType.OTHER,
    };

    render(<CarbonCreditCard {...defaultProps} credit={otherCredit} />);

    expect(screen.getByText('🌍')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(<CarbonCreditCard {...defaultProps} />);

    expect(screen.getByText('Jan 1, 2023')).toBeInTheDocument(); // Issue date
    expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument(); // Expiry date
  });

  it('formats addresses correctly', () => {
    render(<CarbonCreditCard {...defaultProps} />);

    expect(screen.getByText('0x0987...4321')).toBeInTheDocument(); // Owner
    expect(screen.getByText('0x1234...7890')).toBeInTheDocument(); // Issuer
  });

  it('calls onView when view details button is clicked', () => {
    const mockOnView = jest.fn();
    
    render(<CarbonCreditCard {...defaultProps} onView={mockOnView} />);

    const viewButton = screen.getByText('View Details');
    fireEvent.click(viewButton);

    expect(mockOnView).toHaveBeenCalledWith(mockCredit);
  });

  it('calls onTransfer when transfer button is clicked', () => {
    const mockOnTransfer = jest.fn();
    
    render(<CarbonCreditCard {...defaultProps} onTransfer={mockOnTransfer} />);

    const transferButton = screen.getByText('Transfer');
    fireEvent.click(transferButton);

    expect(mockOnTransfer).toHaveBeenCalledWith(mockCredit);
  });

  it('calls onBurn when burn button is clicked', () => {
    const mockOnBurn = jest.fn();
    
    render(<CarbonCreditCard {...defaultProps} onBurn={mockOnBurn} />);

    const burnButton = screen.getByText('Burn');
    fireEvent.click(burnButton);

    expect(mockOnBurn).toHaveBeenCalledWith(mockCredit);
  });

  it('does not show transfer and burn buttons for unverified credits', () => {
    const unverifiedCredit = {
      ...mockCredit,
      verificationStatus: VerificationStatus.PENDING,
    };

    render(<CarbonCreditCard {...defaultProps} credit={unverifiedCredit} />);

    expect(screen.queryByText('Transfer')).not.toBeInTheDocument();
    expect(screen.queryByText('Burn')).not.toBeInTheDocument();
  });

  it('does not show transfer and burn buttons for rejected credits', () => {
    const rejectedCredit = {
      ...mockCredit,
      verificationStatus: VerificationStatus.REJECTED,
    };

    render(<CarbonCreditCard {...defaultProps} credit={rejectedCredit} />);

    expect(screen.queryByText('Transfer')).not.toBeInTheDocument();
    expect(screen.queryByText('Burn')).not.toBeInTheDocument();
  });

  it('does not show transfer and burn buttons for expired credits', () => {
    const expiredCredit = {
      ...mockCredit,
      verificationStatus: VerificationStatus.EXPIRED,
    };

    render(<CarbonCreditCard {...defaultProps} credit={expiredCredit} />);

    expect(screen.queryByText('Transfer')).not.toBeInTheDocument();
    expect(screen.queryByText('Burn')).not.toBeInTheDocument();
  });

  it('handles missing expiry date', () => {
    const creditWithoutExpiry = {
      ...mockCredit,
      expiryDate: undefined,
    };

    render(<CarbonCreditCard {...defaultProps} credit={creditWithoutExpiry} />);

    // Should not show expiry date
    expect(screen.queryByText(/Expires:/)).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CarbonCreditCard {...defaultProps} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('displays image with correct src', () => {
    render(<CarbonCreditCard {...defaultProps} />);

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'https://ipfs.io/ipfs/QmTestImage123');
    expect(image).toHaveAttribute('alt', 'Solar Farm Credit');
  });

  it('handles image load error', () => {
    render(<CarbonCreditCard {...defaultProps} />);

    const image = screen.getByRole('img');
    
    // Simulate image load error
    fireEvent.error(image);

    // Should fallback to placeholder
    expect(image).toHaveAttribute('src', '/api/placeholder/400/300');
  });

  it('shows correct amount formatting for large numbers', () => {
    const largeAmountCredit = {
      ...mockCredit,
      amount: 1000000,
    };

    render(<CarbonCreditCard {...defaultProps} credit={largeAmountCredit} />);

    expect(screen.getByText('1,000,000 tons CO₂')).toBeInTheDocument();
  });

  it('shows correct amount formatting for decimal numbers', () => {
    const decimalAmountCredit = {
      ...mockCredit,
      amount: 100.5,
    };

    render(<CarbonCreditCard {...defaultProps} credit={decimalAmountCredit} />);

    expect(screen.getByText('100.5 tons CO₂')).toBeInTheDocument();
  });

  it('has hover effects', () => {
    const { container } = render(<CarbonCreditCard {...defaultProps} />);

    const card = container.firstChild;
    expect(card).toHaveClass('hover:shadow-xl');
  });

  it('is clickable', () => {
    const { container } = render(<CarbonCreditCard {...defaultProps} />);

    const card = container.firstChild;
    expect(card).toHaveClass('cursor-pointer');
  });
});
