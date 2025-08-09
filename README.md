# Financial Projection Calculator

A comprehensive retirement planning calculator that provides real-time financial projections, scenario analysis, and optimization recommendations.

## Features

### Core Capabilities
- **Real-time Projections**: Interactive calculations that update as you type
- **Scenario Analysis**: Compare conservative, moderate, and aggressive investment strategies
- **Monte Carlo Simulation**: Risk analysis with 500+ iterations for probability-based planning
- **Tax Optimization**: Smart allocation between 401(k), Roth IRA, and taxable accounts
- **Social Security Planning**: Optimization for claiming strategies
- **Export Functionality**: Generate PDF reports and CSV data exports
- **Shareable Links**: Save and share your financial scenarios via URL

### Calculations Include
- Future value with compound interest
- Inflation-adjusted projections
- Sustainable withdrawal rates
- Employer match optimization
- Required savings calculations
- Income replacement ratios

## Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production
```bash
# Build optimized production version
npm run build

# Preview production build
npm run preview
```

## Usage

### Input Parameters
1. **Personal Information**: Current age, retirement age, life expectancy
2. **Financial Position**: Current salary, savings, and contribution amounts
3. **Growth Assumptions**: Expected returns, inflation, salary growth
4. **Advanced Settings**: Tax rates, employer match, Social Security benefits

### Understanding Results
- **Retirement Value**: Total projected savings at retirement
- **Monthly Income**: Sustainable withdrawal amount in retirement
- **Replacement Ratio**: Percentage of final salary replaced in retirement
- **Scenario Comparison**: Side-by-side analysis of different return assumptions
- **Monte Carlo Results**: Probability of meeting retirement goals

### Optimization Tips
The calculator provides recommendations for:
- Optimal contribution allocation across account types
- Tax-efficient withdrawal strategies
- Social Security claiming optimization
- Required savings adjustments to meet goals

## Testing

```bash
# Run unit tests
npm test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Technology Stack

- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts for data visualization
- **Build Tool**: Vite for fast development
- **Testing**: Vitest for unit testing
- **Export**: jsPDF for PDF generation

## Project Structure

```
src/
├── components/
│   └── FinancialCalculator.tsx    # Main calculator UI
├── utils/
│   ├── calculations.ts             # Financial calculation engine
│   └── exportUtils.ts              # Export functionality
└── App.tsx                         # Root component
```

## Deployment

### Quick Deploy to Google Cloud Platform

This application is configured for automatic deployment to GCP App Engine via GitHub Actions.

1. **Setup GitHub Repository**: See [GITHUB_SETUP.md](GITHUB_SETUP.md)
2. **Configure GCP**: See [DEPLOYMENT.md](DEPLOYMENT.md)
3. **Push to deploy**: Every push to `main` triggers automatic deployment

### Manual Deployment
```bash
# Deploy to GCP (requires gcloud CLI)
npm run deploy [project-id]

# Or use the deploy script
./deploy.sh [project-id]
```

### Live Demo
Once deployed, the application will be available at:
- Production: `https://[PROJECT_ID].appspot.com`
- Pull Request Previews: `https://pr-[NUMBER]-dot-[PROJECT_ID].appspot.com`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new calculations
4. Ensure all tests pass
5. Submit a pull request

Pull requests automatically get preview deployments for testing.

## License

This is a proof-of-concept project for demonstration purposes.

## Disclaimer

This calculator is for educational and planning purposes only. Always consult with a qualified financial advisor for personalized retirement planning advice.