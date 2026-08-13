import { describe, it, expect } from 'vitest';
import {
  oneYearSurvival,
  survivalCurve,
  annuityFactorImmediate,
  priceAnnuity,
  insurerEconomics,
  irr,
  defaultAnnuityInputs,
} from './annuities';

const M = 88;
const B = 10;

describe('mortality', () => {
  it('one-year survival is a probability that falls with age', () => {
    const p50 = oneYearSurvival(50, M, B);
    const p85 = oneYearSurvival(85, M, B);
    expect(p50).toBeGreaterThan(0);
    expect(p50).toBeLessThanOrEqual(1);
    expect(p85).toBeGreaterThan(0);
    expect(p85).toBeLessThan(p50);
  });

  it('survival curve starts at 1 and is monotonically decreasing', () => {
    const curve = survivalCurve(65, M, B);
    expect(curve[0]).toBe(1);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i]).toBeLessThanOrEqual(curve[i - 1]);
      expect(curve[i]).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('annuity factor', () => {
  it('is positive and decreases as the interest rate rises', () => {
    const low = annuityFactorImmediate(65, 0.02, M, B);
    const high = annuityFactorImmediate(65, 0.08, M, B);
    expect(low).toBeGreaterThan(0);
    expect(high).toBeGreaterThan(0);
    expect(high).toBeLessThan(low);
  });

  it('is smaller for older ages (fewer expected payments)', () => {
    const at65 = annuityFactorImmediate(65, 0.05, M, B);
    const at80 = annuityFactorImmediate(80, 0.05, M, B);
    expect(at80).toBeLessThan(at65);
  });
});

describe('priceAnnuity (client view)', () => {
  const res = priceAnnuity(defaultAnnuityInputs);

  it('produces a sensible payout rate for a 65-year-old', () => {
    expect(res.annualIncome).toBeGreaterThan(0);
    expect(res.payoutRate).toBeGreaterThan(0.04);
    expect(res.payoutRate).toBeLessThan(0.12);
    expect(res.monthlyIncome).toBeCloseTo(res.annualIncome / 12, 5);
  });

  it("buyer's IRR is below the pricing rate because of the expense load", () => {
    expect(res.buyerIRR).toBeLessThan(defaultAnnuityInputs.pricingRate);
  });

  it("money's-worth ratio is below 1 (load + insurer margin)", () => {
    expect(res.moneysWorthRatio).toBeGreaterThan(0.5);
    expect(res.moneysWorthRatio).toBeLessThan(1);
  });

  it('builds a cumulative-income curve that eventually passes the premium', () => {
    const last = res.cumulative[res.cumulative.length - 1];
    expect(last.cumulativeIncome).toBeGreaterThan(defaultAnnuityInputs.premium);
    expect(res.cumulative[0].survivalPct).toBe(1);
  });
});

describe('insurerEconomics (actuarial view)', () => {
  const client = priceAnnuity(defaultAnnuityInputs);
  const ins = insurerEconomics(defaultAnnuityInputs, client.annualIncome);

  it('reports a positive VNB when there is a load and an investment spread', () => {
    expect(ins.vnb).toBeGreaterThan(0);
    expect(ins.vnbMargin).toBeGreaterThan(0);
    expect(ins.vnbMargin).toBeLessThan(0.5);
  });

  it('sets up a reserve close to the net premium at issue', () => {
    expect(ins.reserveAtIssue).toBeGreaterThan(0);
    expect(ins.reserveAtIssue).toBeLessThan(defaultAnnuityInputs.premium);
  });

  it('produces a profit signature starting at issue', () => {
    expect(ins.signature.length).toBeGreaterThan(1);
    expect(ins.signature[0].policyYear).toBe(0);
  });

  it('IRR is either null (self-funding) or a finite number', () => {
    expect(ins.irr === null || Number.isFinite(ins.irr)).toBe(true);
  });

  it('a wider investment spread increases VNB', () => {
    const widerSpread = insurerEconomics(
      { ...defaultAnnuityInputs, earnedRate: 0.08 },
      client.annualIncome
    );
    expect(widerSpread.vnb).toBeGreaterThan(ins.vnb);
  });
});

describe('irr solver', () => {
  it('solves a simple two-flow stream', () => {
    const r = irr([-100, 110]);
    expect(r).not.toBeNull();
    expect(r as number).toBeCloseTo(0.1, 4);
  });

  it('returns null when there is no sign change', () => {
    expect(irr([100, 110])).toBeNull();
  });
});
