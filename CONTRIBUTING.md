# Contributing to GreenLedger

Thank you for your interest in contributing to GreenLedger! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/GreenLedger.git
   cd GreenLedger
   ```
3. **Add the upstream repository**:
   ```bash
   git remote add upstream https://github.com/Edwiin-Hoover/GreenLedger.git
   ```
4. **Create a new branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- A code editor (VS Code recommended)
- MetaMask or compatible wallet for testing

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Run tests**:
   ```bash
   npm test
   ```

### Smart Contract Development

1. **Install Hardhat dependencies**:
   ```bash
   cd contracts
   npm install
   ```

2. **Compile contracts**:
   ```bash
   npm run compile
   ```

3. **Run contract tests**:
   ```bash
   npm test
   ```

4. **Deploy to local network**:
   ```bash
   npm run deploy:local
   ```

## Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- **Bug fixes**: Fix issues in existing code
- **Features**: Add new functionality
- **Documentation**: Improve or add documentation
- **Tests**: Add or improve test coverage
- **Performance**: Optimize existing code
- **UI/UX**: Improve user interface and experience
- **Smart Contracts**: Enhance or add smart contract functionality

### Before Contributing

1. **Check existing issues** to see if your contribution is already being worked on
2. **Create an issue** for significant changes to discuss the approach
3. **Ensure your changes align** with the project's goals and architecture

### Development Workflow

1. **Create a feature branch** from `main`
2. **Make your changes** following our coding standards
3. **Write tests** for new functionality
4. **Update documentation** as needed
5. **Run tests** to ensure everything works
6. **Commit your changes** with clear commit messages
7. **Push to your fork** and create a pull request

## Pull Request Process

### Before Submitting

- [ ] Code follows the project's coding standards
- [ ] Tests pass locally
- [ ] New features have appropriate tests
- [ ] Documentation is updated
- [ ] No merge conflicts with main branch
- [ ] Commit messages are clear and descriptive

### Pull Request Template

When creating a pull request, please include:

1. **Description**: Clear description of changes
2. **Type**: Bug fix, feature, documentation, etc.
3. **Testing**: How you tested the changes
4. **Screenshots**: For UI changes
5. **Breaking Changes**: Any breaking changes
6. **Related Issues**: Link to related issues

### Review Process

1. **Automated checks** must pass (tests, linting, etc.)
2. **Code review** by maintainers
3. **Testing** in different environments
4. **Approval** from at least one maintainer
5. **Merge** to main branch

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

- **Environment**: OS, Node.js version, browser
- **Steps to reproduce**: Clear, numbered steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: If applicable
- **Error messages**: Full error messages and stack traces

### Feature Requests

For feature requests, please include:

- **Use case**: Why this feature is needed
- **Proposed solution**: How you think it should work
- **Alternatives**: Other solutions you've considered
- **Additional context**: Any other relevant information

## Coding Standards

### General Guidelines

- **Use TypeScript** for all new code
- **Follow ESLint rules** configured in the project
- **Use Prettier** for code formatting
- **Write meaningful variable and function names**
- **Add comments** for complex logic
- **Keep functions small** and focused

### React/Next.js Guidelines

- **Use functional components** with hooks
- **Implement proper error boundaries**
- **Use TypeScript interfaces** for props
- **Follow Next.js best practices**
- **Optimize for performance**

### Smart Contract Guidelines

- **Follow Solidity style guide**
- **Use OpenZeppelin contracts** when possible
- **Implement proper access controls**
- **Add comprehensive tests**
- **Document contract interfaces**

### File Organization

```
frontend/
├── components/     # Reusable UI components
├── pages/         # Next.js pages
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
├── types/         # TypeScript type definitions
└── styles/        # CSS and styling files

contracts/
├── contracts/     # Smart contracts
├── scripts/       # Deployment scripts
└── test/          # Contract tests

backend/
├── api/           # API routes
├── models/        # Data models
└── middleware/    # Express middleware
```

## Testing

### Frontend Testing

- **Unit tests** for components and hooks
- **Integration tests** for user flows
- **E2E tests** for critical paths
- **Accessibility tests** for UI components

### Smart Contract Testing

- **Unit tests** for all contract functions
- **Integration tests** for contract interactions
- **Gas optimization tests**
- **Security tests** for vulnerabilities

### Running Tests

```bash
# Frontend tests
npm test

# Contract tests
cd contracts && npm test

# All tests
npm run test:all
```

## Documentation

### Code Documentation

- **JSDoc comments** for functions and classes
- **README files** for each major component
- **Inline comments** for complex logic
- **Type definitions** for all interfaces

### User Documentation

- **API documentation** with examples
- **User guides** for key features
- **Deployment guides** for different environments
- **Troubleshooting guides** for common issues

## Community

### Communication

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For general questions and ideas
- **Pull Requests**: For code contributions
- **Discord**: For real-time community chat (if available)

### Recognition

Contributors will be recognized in:
- **CONTRIBUTORS.md** file
- **Release notes** for significant contributions
- **Project documentation**

## Getting Help

If you need help:

1. **Check the documentation** first
2. **Search existing issues** for similar problems
3. **Ask in GitHub Discussions** for general questions
4. **Create an issue** for bugs or feature requests
5. **Join our Discord** for real-time help (if available)

## License

By contributing to GreenLedger, you agree that your contributions will be licensed under the MIT License.

## Thank You

Thank you for contributing to GreenLedger! Your contributions help make carbon credit tracking more accessible and transparent for everyone.

---

For any questions about contributing, please open an issue or start a discussion.
