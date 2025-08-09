# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A comprehensive financial projection calculator for retirement planning built with React, TypeScript, and Tailwind CSS. The application provides real-time financial projections, scenario analysis, Monte Carlo simulations, and optimization recommendations for retirement planning.

## Commands

### Development
- `npm run dev` - Start the development server on http://localhost:5173
- `npm run build` - Build the production-ready application
- `npm run preview` - Preview the production build locally

### Testing
- `npm test` - Run unit tests with Vitest
- `npm run test:ui` - Run tests with interactive UI
- `npm run test:coverage` - Generate test coverage report

### Code Quality
- `npm run lint` - Run ESLint to check code quality
- `npm run typecheck` - Run TypeScript compiler to check types (via `tsc -b`)

## Architecture

### Project Structure
```
src/
├── components/
│   └── FinancialCalculator.tsx    # Main calculator component with UI
├── utils/
│   ├── calculations.ts             # Core financial calculation engine
│   ├── calculations.test.ts       # Unit tests for calculations
│   └── exportUtils.ts             # PDF/CSV export utilities
├── App.tsx                        # Root application component
├── main.tsx                       # Application entry point
└── index.css                      # Tailwind CSS imports
```

### Key Technologies
- **Frontend Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts for data visualization
- **Build Tool**: Vite for fast development and optimized builds
- **Testing**: Vitest for unit testing
- **Export**: jsPDF and html2canvas for PDF generation

### Core Features
1. **Real-time Calculations**: Updates projections as users modify inputs
2. **Scenario Analysis**: Conservative, moderate, and aggressive projections
3. **Monte Carlo Simulation**: Risk analysis with 500+ iterations
4. **Tax Optimization**: Pre-tax vs post-tax contribution strategies
5. **Export Capabilities**: PDF reports and CSV data export
6. **Shareable Links**: URL-based parameter sharing

### Financial Calculations
The calculation engine (`src/utils/calculations.ts`) implements:
- Future value with compound interest
- Present value calculations
- Inflation adjustments
- Sustainable withdrawal rates
- Social Security optimization
- Tax-efficient contribution strategies
- Employer match calculations

## Development Guidelines

### Adding New Features
1. Financial calculations go in `src/utils/calculations.ts`
2. UI components should be added to the main calculator or split into separate components
3. Always write unit tests for new calculation functions
4. Use TypeScript interfaces for data structures

### Testing
- All financial calculations must have comprehensive unit tests
- Test edge cases (zero values, negative returns, etc.)
- Verify calculation accuracy against known formulas

### Performance Considerations
- Calculations are debounced by 500ms to prevent excessive recalculation
- Monte Carlo simulations limited to 500 iterations for performance
- Charts use filtered data (every 5th year) for large datasets

## Important Notes

- Financial calculations use monthly compounding for accuracy
- All monetary values are stored as numbers (not strings) to prevent precision issues
- Inflation adjustments use real returns formula: ((1 + nominal) / (1 + inflation)) - 1
- Social Security calculations based on 2024 bend points
- Tax calculations assume marginal tax rates