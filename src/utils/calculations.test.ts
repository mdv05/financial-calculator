import { describe, it, expect } from 'vitest';
import type { CalculatorInputs } from './calculations';
import {
  futureValue,
  presentValue,
  inflationAdjustedValue,
  sustainableWithdrawalRate,
  salaryProjection,
  taxAdjustedContribution,
  calculateEmployerMatch,
  calculateRequiredSavings,
  calculateProjections,
  calculateScenarios,
  monteCarloSimulation,
  optimizeContributions,
  calculateSocialSecurity
} from './calculations';

describe('Financial Calculation Functions', () => {
  describe('futureValue', () => {
    it('should calculate future value with compound interest', () => {
      const result = futureValue(10000, 500, 0.07, 10);
      expect(result).toBeCloseTo(106639.02, 2);
    });

    it('should handle zero interest rate', () => {
      const result = futureValue(10000, 500, 0, 10);
      expect(result).toBe(70000);
    });

    it('should handle zero monthly payment', () => {
      const result = futureValue(10000, 0, 0.07, 10);
      expect(result).toBeCloseTo(20096.61, 2);
    });
  });

  describe('presentValue', () => {
    it('should calculate present value with discount rate', () => {
      const result = presentValue(100000, 0.05, 10);
      expect(result).toBeCloseTo(61391.33, 2);
    });

    it('should handle zero discount rate', () => {
      const result = presentValue(100000, 0, 10);
      expect(result).toBe(100000);
    });
  });

  describe('inflationAdjustedValue', () => {
    it('should calculate inflation adjusted value', () => {
      const result = inflationAdjustedValue(100000, 0.03, 10);
      expect(result).toBeCloseTo(74409.39, 2);
    });

    it('should handle zero inflation', () => {
      const result = inflationAdjustedValue(100000, 0, 10);
      expect(result).toBe(100000);
    });
  });

  describe('sustainableWithdrawalRate', () => {
    it('should calculate monthly withdrawal amount', () => {
      const result = sustainableWithdrawalRate(1000000, 30, 0.04);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(5000);
    });

    it('should handle zero return rate', () => {
      const result = sustainableWithdrawalRate(1000000, 30, 0);
      expect(result).toBeCloseTo(2777.78, 2);
    });
  });

  describe('salaryProjection', () => {
    it('should project salary growth', () => {
      const result = salaryProjection(50000, 0.03, 10);
      expect(result).toBeCloseTo(67195.82, 2);
    });

    it('should handle zero growth rate', () => {
      const result = salaryProjection(50000, 0, 10);
      expect(result).toBe(50000);
    });
  });

  describe('taxAdjustedContribution', () => {
    it('should calculate pre-tax contribution after tax', () => {
      const result = taxAdjustedContribution(1000, 0.22, true);
      expect(result).toBe(780);
    });

    it('should handle post-tax contribution', () => {
      const result = taxAdjustedContribution(1000, 0.22, false);
      expect(result).toBe(1000);
    });
  });

  describe('calculateEmployerMatch', () => {
    it('should calculate employer match within limit', () => {
      const result = calculateEmployerMatch(5000, 300, 0.5, 0.06);
      expect(result).toBe(150);
    });

    it('should cap employer match at limit', () => {
      const result = calculateEmployerMatch(5000, 500, 1.0, 0.06);
      expect(result).toBe(300);
    });

    it('should handle zero match percent', () => {
      const result = calculateEmployerMatch(5000, 300, 0, 0.06);
      expect(result).toBe(0);
    });
  });

  describe('calculateRequiredSavings', () => {
    it('should calculate required monthly savings', () => {
      const result = calculateRequiredSavings(1000000, 100000, 0.07, 20, 0.03);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(3000);
    });

    it('should return 0 if target is already met', () => {
      const result = calculateRequiredSavings(100000, 200000, 0.07, 20, 0.03);
      expect(result).toBe(0);
    });
  });

  describe('calculateProjections', () => {
    const testInputs: CalculatorInputs = {
      currentAge: 30,
      retirementAge: 65,
      lifeExpectancy: 90,
      currentSalary: 75000,
      salaryGrowthRate: 0.03,
      currentSavings: 50000,
      monthlyContribution: 500,
      contributionIncreaseRate: 0.03,
      employerMatchPercent: 0.5,
      employerMatchLimit: 0.06,
      expectedReturn: 0.07,
      inflationRate: 0.03,
      taxRate: 0.22,
      retirementTaxRate: 0.15,
      desiredRetirementIncome: 5000,
      socialSecurityBenefit: 2000,
    };

    it('should calculate complete projection results', () => {
      const result = calculateProjections(testInputs);
      
      expect(result.yearlyData).toHaveLength(36);
      expect(result.retirementValue).toBeGreaterThan(testInputs.currentSavings);
      expect(result.monthlyRetirementIncome).toBeGreaterThan(0);
      expect(result.totalContributions).toBeGreaterThan(0);
      expect(result.totalInterestEarned).toBeGreaterThan(0);
      expect(result.replacementRatio).toBeGreaterThan(0);
      expect(result.replacementRatio).toBeLessThan(2);
    });

    it('should handle edge case with retirement age equal to current age', () => {
      const inputs = { ...testInputs, retirementAge: 30 };
      const result = calculateProjections(inputs);
      
      expect(result.yearlyData).toHaveLength(1);
      expect(result.retirementValue).toBeGreaterThanOrEqual(testInputs.currentSavings);
    });
  });

  describe('calculateScenarios', () => {
    const testInputs: CalculatorInputs = {
      currentAge: 30,
      retirementAge: 65,
      lifeExpectancy: 90,
      currentSalary: 75000,
      salaryGrowthRate: 0.03,
      currentSavings: 50000,
      monthlyContribution: 500,
      contributionIncreaseRate: 0.03,
      employerMatchPercent: 0.5,
      employerMatchLimit: 0.06,
      expectedReturn: 0.07,
      inflationRate: 0.03,
      taxRate: 0.22,
      retirementTaxRate: 0.15,
      desiredRetirementIncome: 5000,
      socialSecurityBenefit: 2000,
    };

    it('should calculate three different scenarios', () => {
      const result = calculateScenarios(testInputs);
      
      expect(result.conservative).toBeDefined();
      expect(result.moderate).toBeDefined();
      expect(result.aggressive).toBeDefined();
      
      expect(result.conservative.retirementValue).toBeLessThan(result.moderate.retirementValue);
      expect(result.moderate.retirementValue).toBeLessThan(result.aggressive.retirementValue);
    });
  });

  describe('monteCarloSimulation', () => {
    const testInputs: CalculatorInputs = {
      currentAge: 30,
      retirementAge: 65,
      lifeExpectancy: 90,
      currentSalary: 75000,
      salaryGrowthRate: 0.03,
      currentSavings: 50000,
      monthlyContribution: 500,
      contributionIncreaseRate: 0.03,
      employerMatchPercent: 0.5,
      employerMatchLimit: 0.06,
      expectedReturn: 0.07,
      inflationRate: 0.03,
      taxRate: 0.22,
      retirementTaxRate: 0.15,
      desiredRetirementIncome: 5000,
      socialSecurityBenefit: 2000,
    };

    it('should run Monte Carlo simulation', () => {
      const result = monteCarloSimulation(testInputs, 100);
      
      expect(result.median).toBeGreaterThan(0);
      expect(result.percentile25).toBeLessThan(result.median);
      expect(result.median).toBeLessThan(result.percentile75);
      expect(result.percentile75).toBeLessThan(result.percentile95);
      expect(result.successRate).toBeGreaterThanOrEqual(0);
      expect(result.successRate).toBeLessThanOrEqual(1);
    });
  });

  describe('optimizeContributions', () => {
    const testInputs: CalculatorInputs = {
      currentAge: 30,
      retirementAge: 65,
      lifeExpectancy: 90,
      currentSalary: 75000,
      salaryGrowthRate: 0.03,
      currentSavings: 50000,
      monthlyContribution: 500,
      contributionIncreaseRate: 0.03,
      employerMatchPercent: 0.5,
      employerMatchLimit: 0.06,
      expectedReturn: 0.07,
      inflationRate: 0.03,
      taxRate: 0.22,
      retirementTaxRate: 0.15,
      desiredRetirementIncome: 5000,
      socialSecurityBenefit: 2000,
    };

    it('should optimize contribution allocation', () => {
      const result = optimizeContributions(testInputs, 1000, 500, 300);
      
      expect(result.optimal401k).toBeGreaterThanOrEqual(0);
      expect(result.optimalRothIRA).toBeGreaterThanOrEqual(0);
      expect(result.optimalTaxable).toBeGreaterThanOrEqual(0);
      expect(result.totalTaxSavings).toBeGreaterThanOrEqual(0);
    });

    it('should respect contribution limits', () => {
      const result = optimizeContributions(testInputs, 5000, 1000, 500);
      
      expect(result.optimal401k).toBeLessThanOrEqual(23000 / 12);
      expect(result.optimalRothIRA).toBeLessThanOrEqual(7000 / 12);
    });
  });

  describe('calculateSocialSecurity', () => {
    it('should calculate Social Security benefit', () => {
      const result = calculateSocialSecurity(3000, 67, 67);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(3000);
    });

    it('should reduce benefit for early claiming', () => {
      const fullBenefit = calculateSocialSecurity(3000, 67, 67);
      const earlyBenefit = calculateSocialSecurity(3000, 67, 62);
      expect(earlyBenefit).toBeLessThan(fullBenefit);
    });

    it('should increase benefit for delayed claiming', () => {
      const fullBenefit = calculateSocialSecurity(3000, 67, 67);
      const delayedBenefit = calculateSocialSecurity(3000, 67, 70);
      expect(delayedBenefit).toBeGreaterThan(fullBenefit);
    });
  });
});