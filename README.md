# FutureScope

A retirement planning web app that shows a realistic range of outcomes instead of a single guess.

**Live app:** https://mdv05.github.io/financial-calculator/

I started FutureScope after my Segal internship (summer 2025) to keep building on our winning intern project, [RetireHub](https://github.com/mdv05/RetirementHub). It has become my answer whenever people learn I study actuarial science and ask for help planning.

## Features
- **Projections:** savings growth with compound interest, salary growth, employer match and inflation-adjusted values
- **Monte Carlo simulation:** 500 randomized return paths, showing the 5th to 95th percentile range and the chance of reaching your income goal
- **Scenarios:** conservative, moderate and aggressive return assumptions side by side
- **Guaranteed income:** shows what a single premium immediate annuity pays (payout rate, breakeven age), using a Gompertz mortality model. The engine behind it (`annuities.ts`) also models the insurer's side: reserves, value of new business and IRR
- **Planning tools:** 401(k), Roth IRA and taxable allocation, and Social Security claiming age
- **Export and share:** PDF report, Excel workbook, and a shareable link with your inputs

All assumptions are simplified and editable. This is an educational tool, not financial advice.

## Run it locally
```bash
npm install
npm run dev     # http://localhost:5173
npm test        # unit tests for the calculation and annuity engines
```

## Tech
React 19, TypeScript, Tailwind CSS 3, Recharts and Vite, with Vitest for tests. Deployed to GitHub Pages on every push to `main`.

## Project structure
```
src/
├── components/FinancialCalculator.tsx   # UI and tabs
└── utils/
    ├── calculations.ts                   # projections, Monte Carlo, Social Security
    ├── annuities.ts                      # annuity pricing and insurer economics
    └── excelExport.ts, exportUtils.ts    # Excel, PDF and share links
```
