// Annuity pricing + actuarial product-economics engine.
//
// Models a Single Premium Immediate Annuity (SPIA) from two perspectives:
//   1. The client  — how much guaranteed lifetime income a premium buys, and
//      the value/return they get for it (payout rate, breakeven, money's-worth, buyer IRR).
//   2. The insurer — the product economics an actuary prices to: Value of New
//      Business (VNB), VNB margin, IRR, and the emerging profit signature.
//
// Mortality uses a Gompertz law (a standard, self-contained closed-form model).
// Assumptions are simplified and clearly parameterized — this is an illustrative
// tool, not a production pricing platform.

export interface AnnuityInputs {
  annuitantAge: number;          // age at annuitization
  premium: number;               // single premium (lump sum)
  pricingRate: number;           // interest rate used to price the income stream
  expenseLoad: number;           // total pricing load (expenses + profit margin), as a fraction of premium

  // Insurer / actuarial assumptions
  valuationRate: number;         // reserving interest rate
  earnedRate: number;            // rate assets are assumed to earn
  acquisitionExpenseRate: number;// one-time issue expense, as a fraction of premium
  maintenanceExpenseRate: number;// annual maintenance expense, as a fraction of the reserve
  hurdleRate: number;            // risk discount rate for VNB (PV of future profits)
  capitalRate: number;           // required capital, as a fraction of the reserve

  // Mortality (Gompertz)
  gompertzModal: number;         // modal age at death (m), ~88
  gompertzScale: number;         // dispersion (b), ~10
}

export interface AnnuityCumulativePoint {
  age: number;
  cumulativeIncome: number;      // running total of nominal income received
  premium: number;               // flat reference line = premium paid
  survivalPct: number;           // probability of surviving to this age (0-1)
}

export interface AnnuityClientResult {
  annualIncome: number;
  monthlyIncome: number;
  payoutRate: number;            // annualIncome / premium
  expectedPaymentYears: number;  // expected number of annual payments (a_x at 0%)
  breakevenYears: number;        // nominal years for cumulative income to repay premium
  breakevenAge: number;
  expectedTotalPayout: number;   // annualIncome * expectedPaymentYears
  moneysWorthRatio: number;      // PV(expected benefits at earned rate) / premium
  buyerIRR: number;              // rate where PV(expected benefits) = premium
  cumulative: AnnuityCumulativePoint[];
}

export interface ProfitYear {
  age: number;
  policyYear: number;
  reserve: number;               // expected reserve held (per policy issued)
  expectedProfit: number;        // emerging profit that year (per policy issued)
  discountedProfit: number;      // expectedProfit discounted to issue at the hurdle rate
}

export interface AnnuityInsurerResult {
  reserveAtIssue: number;
  dayOneResult: number;          // issue-date gain (+) or strain (-)
  vnb: number;                   // PV of all future profits at the hurdle rate
  vnbMargin: number;             // vnb / premium
  irr: number | null;            // IRR of shareholder cash flows (null if self-funding / no strain)
  signature: ProfitYear[];
}

export const OMEGA = 120; // limiting age

// One-year survival probability under Gompertz:
//   mu(x) = (1/b) * exp((x - m) / b);  p_x = exp(-(H(x+1) - H(x))), H(x) = exp((x - m)/b)
export function oneYearSurvival(age: number, modal: number, scale: number): number {
  const hx = Math.exp((age - modal) / scale);
  const hx1 = Math.exp((age + 1 - modal) / scale);
  return Math.exp(-(hx1 - hx));
}

// Survival curve from `age`: returns [1, p, 2p, ...] i.e. tPx for t = 0, 1, 2, ...
export function survivalCurve(age: number, modal: number, scale: number): number[] {
  const curve: number[] = [1];
  let s = 1;
  for (let a = age; a < OMEGA; a++) {
    s *= oneYearSurvival(a, modal, scale);
    curve.push(s);
  }
  return curve;
}

// Actuarial present value of a life annuity-immediate paying 1/yr at year-end while alive:
//   a_x = sum_{t>=1} v^t * tPx
export function annuityFactorImmediate(
  age: number,
  rate: number,
  modal: number,
  scale: number
): number {
  const tp = survivalCurve(age, modal, scale);
  const v = 1 / (1 + rate);
  let a = 0;
  for (let t = 1; t < tp.length; t++) {
    a += Math.pow(v, t) * tp[t];
  }
  return a;
}

// Solve for the rate where income * a_x(rate) = premium (the buyer's internal rate of return).
// a_x is monotonically decreasing in rate, so bisection is stable.
function solveBuyerIRR(
  premium: number,
  annualIncome: number,
  age: number,
  modal: number,
  scale: number
): number {
  const f = (rate: number) => annualIncome * annuityFactorImmediate(age, rate, modal, scale) - premium;
  let lo = -0.5;
  let hi = 0.5;
  const flo = f(lo);
  const fhi = f(hi);
  if (flo === 0) return lo;
  if (fhi === 0) return hi;
  if (flo * fhi > 0) return NaN; // no sign change in range
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const fmid = f(mid);
    if (Math.abs(fmid) < 1e-6) return mid;
    if (flo * fmid < 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

// Generic IRR via bisection over a cash-flow stream (cf[0] at t=0). Returns null if no sign change.
export function irr(cashflows: number[]): number | null {
  const npv = (rate: number) =>
    cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);
  let lo = -0.9;
  let hi = 1.0;
  const nlo = npv(lo);
  const nhi = npv(hi);
  if (nlo === 0) return lo;
  if (nhi === 0) return hi;
  if (nlo * nhi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const nmid = npv(mid);
    if (Math.abs(nmid) < 1e-4) return mid;
    if (nlo * nmid < 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

export function priceAnnuity(inputs: AnnuityInputs): AnnuityClientResult {
  const { annuitantAge, premium, pricingRate, expenseLoad, earnedRate, gompertzModal, gompertzScale } = inputs;

  const axPricing = annuityFactorImmediate(annuitantAge, pricingRate, gompertzModal, gompertzScale);
  const annualIncome = axPricing > 0 ? (premium * (1 - expenseLoad)) / axPricing : 0;
  const monthlyIncome = annualIncome / 12;
  const payoutRate = premium > 0 ? annualIncome / premium : 0;

  // a_x at 0% = expected number of annual payments (curtate life expectancy at year-end).
  const expectedPaymentYears = annuityFactorImmediate(annuitantAge, 0, gompertzModal, gompertzScale);
  const expectedTotalPayout = annualIncome * expectedPaymentYears;

  // Money's-worth ratio: PV of expected benefits at the market/earned rate / premium.
  const axMarket = annuityFactorImmediate(annuitantAge, earnedRate, gompertzModal, gompertzScale);
  const moneysWorthRatio = premium > 0 ? (annualIncome * axMarket) / premium : 0;

  const buyerIRR = solveBuyerIRR(premium, annualIncome, annuitantAge, gompertzModal, gompertzScale);

  const breakevenYears = annualIncome > 0 ? premium / annualIncome : Infinity;
  const breakevenAge = annuitantAge + breakevenYears;

  const tp = survivalCurve(annuitantAge, gompertzModal, gompertzScale);
  const cumulative: AnnuityCumulativePoint[] = [];
  let running = 0;
  for (let t = 0; t < tp.length; t++) {
    if (t > 0) running += annualIncome; // income received at each year-end
    cumulative.push({
      age: annuitantAge + t,
      cumulativeIncome: running,
      premium,
      survivalPct: tp[t],
    });
  }

  return {
    annualIncome,
    monthlyIncome,
    payoutRate,
    expectedPaymentYears,
    breakevenYears,
    breakevenAge,
    expectedTotalPayout,
    moneysWorthRatio,
    buyerIRR,
    cumulative,
  };
}

export function insurerEconomics(inputs: AnnuityInputs, annualIncome: number): AnnuityInsurerResult {
  const {
    annuitantAge, premium, valuationRate, earnedRate,
    acquisitionExpenseRate, maintenanceExpenseRate, hurdleRate, capitalRate,
    gompertzModal, gompertzScale,
  } = inputs;

  const tp = survivalCurve(annuitantAge, gompertzModal, gompertzScale);
  const n = tp.length; // t = 0 .. n-1

  // Reserve per surviving policy at time t = PV of remaining benefits at the valuation rate.
  const reservePerSurvivor: number[] = [];
  for (let t = 0; t < n; t++) {
    reservePerSurvivor.push(
      annualIncome * annuityFactorImmediate(annuitantAge + t, valuationRate, gompertzModal, gompertzScale)
    );
  }

  const reserveAtIssue = reservePerSurvivor[0];
  const dayOneResult = premium - reserveAtIssue - acquisitionExpenseRate * premium;

  const vHurdle = 1 / (1 + hurdleRate);
  const signature: ProfitYear[] = [];

  // t = 0 issue result
  signature.push({
    age: annuitantAge,
    policyYear: 0,
    reserve: reserveAtIssue,
    expectedProfit: dayOneResult,
    discountedProfit: dayOneResult,
  });

  // Emerging profit for each in-force year (expected, per policy issued).
  // Profit sources: investment spread (earned - valuation) on the reserve, less maintenance expense.
  // Best-estimate mortality equals pricing mortality here, so there is no mortality margin.
  for (let t = 1; t < n; t++) {
    const inForceStart = tp[t - 1]; // prob still in force at start of the year
    const reserveStart = reservePerSurvivor[t - 1];
    const spread = (earnedRate - valuationRate) * reserveStart;
    const maintenance = maintenanceExpenseRate * reserveStart;
    const expectedProfit = inForceStart * (spread - maintenance);
    const discountedProfit = expectedProfit * Math.pow(vHurdle, t);
    signature.push({
      age: annuitantAge + t,
      policyYear: t,
      reserve: reserveStart * inForceStart,
      expectedProfit,
      discountedProfit,
    });
  }

  const vnb = signature.reduce((acc, y) => acc + y.discountedProfit, 0);
  const vnbMargin = premium > 0 ? vnb / premium : 0;

  // IRR of shareholder cash flows, including required capital that is posted at issue
  // and released as the reserve runs off.
  const expectedCapital: number[] = reservePerSurvivor.map((res, t) => capitalRate * res * tp[t]);
  const shareholderCFs: number[] = [];
  // t = 0: post capital, receive the day-one result
  shareholderCFs.push(dayOneResult - expectedCapital[0]);
  for (let t = 1; t < n; t++) {
    const profit = signature[t].expectedProfit;
    const capitalReleased = expectedCapital[t - 1] - expectedCapital[t];
    const interestOnCapital = earnedRate * expectedCapital[t - 1];
    shareholderCFs.push(profit + capitalReleased + interestOnCapital);
  }
  const computedIrr = irr(shareholderCFs);

  return {
    reserveAtIssue,
    dayOneResult,
    vnb,
    vnbMargin,
    irr: computedIrr,
    signature,
  };
}

export const defaultAnnuityInputs: AnnuityInputs = {
  annuitantAge: 65,
  premium: 500000,
  pricingRate: 0.05,
  expenseLoad: 0.08,
  valuationRate: 0.045,
  earnedRate: 0.06,
  acquisitionExpenseRate: 0.02,
  maintenanceExpenseRate: 0.001,
  hurdleRate: 0.09,
  capitalRate: 0.04,
  gompertzModal: 88,
  gompertzScale: 10,
};
