export interface CalculatorInputs {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  currentSalary: number;
  salaryGrowthRate: number;
  currentSavings: number;
  monthlyContribution: number;
  contributionIncreaseRate: number;
  employerMatchPercent: number;
  employerMatchLimit: number;
  expectedReturn: number;
  inflationRate: number;
  taxRate: number;
  retirementTaxRate: number;
  desiredRetirementIncome: number;
  socialSecurityBenefit: number;
}

export interface YearlyProjection {
  age: number;
  year: number;
  salary: number;
  monthlyContribution: number;
  employerMatch: number;
  totalContribution: number;
  totalSavings: number;
  totalSavingsInflationAdjusted: number;
  interestEarned: number;
}

export interface ProjectionResults {
  yearlyData: YearlyProjection[];
  retirementValue: number;
  retirementValueInflationAdjusted: number;
  monthlyRetirementIncome: number;
  monthlyRetirementIncomeInflationAdjusted: number;
  totalContributions: number;
  totalInterestEarned: number;
  yearsOfRetirement: number;
  retirementShortfall: number;
  recommendedMonthlySavings: number;
  replacementRatio: number;
}

export interface ScenarioComparison {
  conservative: ProjectionResults;
  moderate: ProjectionResults;
  aggressive: ProjectionResults;
}

export function futureValue(
  principal: number,
  monthlyPayment: number,
  annualRate: number,
  years: number
): number {
  const monthlyRate = annualRate / 12;
  const months = years * 12;
  
  if (monthlyRate === 0) {
    return principal + (monthlyPayment * months);
  }
  
  const futureValueOfPrincipal = principal * Math.pow(1 + monthlyRate, months);
  const futureValueOfPayments = monthlyPayment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  
  return futureValueOfPrincipal + futureValueOfPayments;
}

export function presentValue(
  futureValue: number,
  annualRate: number,
  years: number
): number {
  if (annualRate === 0) return futureValue;
  return futureValue / Math.pow(1 + annualRate, years);
}

export function inflationAdjustedValue(
  amount: number,
  inflationRate: number,
  years: number
): number {
  return amount / Math.pow(1 + inflationRate, years);
}

export function sustainableWithdrawalRate(
  totalSavings: number,
  yearsInRetirement: number,
  annualReturn: number = 0.04
): number {
  if (annualReturn === 0) {
    return totalSavings / (yearsInRetirement * 12);
  }
  
  const monthlyRate = annualReturn / 12;
  const months = yearsInRetirement * 12;
  
  const monthlyPayment = (totalSavings * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  return monthlyPayment;
}

export function salaryProjection(
  currentSalary: number,
  growthRate: number,
  years: number
): number {
  return currentSalary * Math.pow(1 + growthRate, years);
}

export function taxAdjustedContribution(
  grossContribution: number,
  taxRate: number,
  isPreTax: boolean = true
): number {
  if (isPreTax) {
    return grossContribution * (1 - taxRate);
  }
  return grossContribution;
}

export function calculateEmployerMatch(
  monthlySalary: number,
  employeeContribution: number,
  matchPercent: number,
  matchLimit: number
): number {
  const maxMatchAmount = monthlySalary * matchLimit;
  const matchAmount = employeeContribution * matchPercent;
  return Math.min(matchAmount, maxMatchAmount);
}

export function calculateRequiredSavings(
  targetAmount: number,
  currentSavings: number,
  annualReturn: number,
  years: number,
  inflationRate: number
): number {
  const realReturn = ((1 + annualReturn) / (1 + inflationRate)) - 1;
  const monthlyRate = realReturn / 12;
  const months = years * 12;
  
  if (monthlyRate === 0) {
    return (targetAmount - currentSavings) / months;
  }
  
  const futureValueOfCurrent = currentSavings * Math.pow(1 + monthlyRate, months);
  const remainingNeeded = targetAmount - futureValueOfCurrent;
  
  if (remainingNeeded <= 0) return 0;
  
  return remainingNeeded * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
}

export function calculateProjections(inputs: CalculatorInputs): ProjectionResults {
  const yearlyData: YearlyProjection[] = [];
  const yearsToRetirement = inputs.retirementAge - inputs.currentAge;
  const yearsOfRetirement = inputs.lifeExpectancy - inputs.retirementAge;
  
  let currentSalary = inputs.currentSalary;
  let totalSavings = inputs.currentSavings;
  let monthlyContribution = inputs.monthlyContribution;
  let totalContributions = 0;
  let totalInterestEarned = 0;
  
  for (let year = 0; year <= yearsToRetirement; year++) {
    const age = inputs.currentAge + year;
    const currentYear = new Date().getFullYear() + year;
    
    if (year > 0) {
      currentSalary = salaryProjection(inputs.currentSalary, inputs.salaryGrowthRate, year);
      monthlyContribution = inputs.monthlyContribution * Math.pow(1 + inputs.contributionIncreaseRate, year);
    }
    
    const monthlyEmployerMatch = calculateEmployerMatch(
      currentSalary / 12,
      monthlyContribution,
      inputs.employerMatchPercent,
      inputs.employerMatchLimit
    );
    
    const totalMonthlyContribution = monthlyContribution + monthlyEmployerMatch;
    const annualContribution = totalMonthlyContribution * 12;
    
    const previousBalance = totalSavings;
    const interestEarned = previousBalance * inputs.expectedReturn;
    totalSavings = previousBalance + annualContribution + interestEarned;
    
    totalContributions += annualContribution;
    totalInterestEarned += interestEarned;
    
    const inflationAdjustedSavings = inflationAdjustedValue(
      totalSavings,
      inputs.inflationRate,
      year
    );
    
    yearlyData.push({
      age,
      year: currentYear,
      salary: currentSalary,
      monthlyContribution,
      employerMatch: monthlyEmployerMatch,
      totalContribution: annualContribution,
      totalSavings,
      totalSavingsInflationAdjusted: inflationAdjustedSavings,
      interestEarned
    });
  }
  
  const retirementValue = totalSavings;
  const retirementValueInflationAdjusted = inflationAdjustedValue(
    retirementValue,
    inputs.inflationRate,
    yearsToRetirement
  );
  
  const monthlyRetirementIncome = sustainableWithdrawalRate(
    retirementValue,
    yearsOfRetirement,
    inputs.expectedReturn * 0.5
  ) + inputs.socialSecurityBenefit;
  
  const monthlyRetirementIncomeInflationAdjusted = inflationAdjustedValue(
    monthlyRetirementIncome,
    inputs.inflationRate,
    yearsToRetirement
  );
  
  const finalSalary = salaryProjection(
    inputs.currentSalary,
    inputs.salaryGrowthRate,
    yearsToRetirement
  );
  
  const replacementRatio = (monthlyRetirementIncome * 12) / finalSalary;
  
  const desiredAnnualIncome = inputs.desiredRetirementIncome * 12;
  const actualAnnualIncome = monthlyRetirementIncome * 12;
  const retirementShortfall = Math.max(0, desiredAnnualIncome - actualAnnualIncome);
  
  let recommendedMonthlySavings = inputs.monthlyContribution;
  if (retirementShortfall > 0) {
    const additionalNeeded = retirementShortfall * yearsOfRetirement;
    recommendedMonthlySavings = calculateRequiredSavings(
      additionalNeeded + retirementValue,
      inputs.currentSavings,
      inputs.expectedReturn,
      yearsToRetirement,
      inputs.inflationRate
    );
  }
  
  return {
    yearlyData,
    retirementValue,
    retirementValueInflationAdjusted,
    monthlyRetirementIncome,
    monthlyRetirementIncomeInflationAdjusted,
    totalContributions,
    totalInterestEarned,
    yearsOfRetirement,
    retirementShortfall,
    recommendedMonthlySavings,
    replacementRatio
  };
}

export function calculateScenarios(baseInputs: CalculatorInputs): ScenarioComparison {
  const conservativeInputs = {
    ...baseInputs,
    expectedReturn: 0.04,
    inflationRate: 0.035
  };
  
  const moderateInputs = {
    ...baseInputs,
    expectedReturn: 0.07,
    inflationRate: 0.03
  };
  
  const aggressiveInputs = {
    ...baseInputs,
    expectedReturn: 0.10,
    inflationRate: 0.025
  };
  
  return {
    conservative: calculateProjections(conservativeInputs),
    moderate: calculateProjections(moderateInputs),
    aggressive: calculateProjections(aggressiveInputs)
  };
}

export function monteCarloSimulation(
  inputs: CalculatorInputs,
  iterations: number = 1000
): {
  median: number;
  percentile25: number;
  percentile75: number;
  percentile95: number;
  successRate: number;
} {
  const results: number[] = [];
  const targetAmount = inputs.desiredRetirementIncome * 12 * (inputs.lifeExpectancy - inputs.retirementAge);
  
  for (let i = 0; i < iterations; i++) {
    const volatility = 0.15;
    const randomReturn = inputs.expectedReturn + (Math.random() - 0.5) * volatility;
    
    const simulationInputs = {
      ...inputs,
      expectedReturn: randomReturn
    };
    
    const projection = calculateProjections(simulationInputs);
    results.push(projection.retirementValue);
  }
  
  results.sort((a, b) => a - b);
  
  const successCount = results.filter(value => value >= targetAmount).length;
  
  return {
    median: results[Math.floor(iterations * 0.5)],
    percentile25: results[Math.floor(iterations * 0.25)],
    percentile75: results[Math.floor(iterations * 0.75)],
    percentile95: results[Math.floor(iterations * 0.95)],
    successRate: successCount / iterations
  };
}

export function optimizeContributions(
  inputs: CalculatorInputs,
  target401k: number,
  targetRothIRA: number,
  targetTaxable: number
): {
  optimal401k: number;
  optimalRothIRA: number;
  optimalTaxable: number;
  totalTaxSavings: number;
} {
  const max401k = 23000 / 12;
  const maxRothIRA = 7000 / 12;
  
  const optimal401k = Math.min(target401k, max401k);
  
  const optimalRothIRA = Math.min(targetRothIRA, maxRothIRA);
  const optimalTaxable = targetTaxable;
  
  const taxSavings401k = optimal401k * 12 * inputs.taxRate;
  const totalTaxSavings = taxSavings401k;
  
  return {
    optimal401k,
    optimalRothIRA,
    optimalTaxable,
    totalTaxSavings
  };
}

export function calculateSocialSecurity(
  averageIndexedMonthlyEarnings: number,
  fullRetirementAge: number,
  claimingAge: number
): number {
  const bend1 = 1174;
  const bend2 = 7078;
  
  let primaryInsuranceAmount = 0;
  
  if (averageIndexedMonthlyEarnings <= bend1) {
    primaryInsuranceAmount = averageIndexedMonthlyEarnings * 0.9;
  } else if (averageIndexedMonthlyEarnings <= bend2) {
    primaryInsuranceAmount = bend1 * 0.9 + (averageIndexedMonthlyEarnings - bend1) * 0.32;
  } else {
    primaryInsuranceAmount = bend1 * 0.9 + (bend2 - bend1) * 0.32 + (averageIndexedMonthlyEarnings - bend2) * 0.15;
  }
  
  const monthsEarly = (fullRetirementAge - claimingAge) * 12;
  const monthsLate = (claimingAge - fullRetirementAge) * 12;
  
  if (monthsEarly > 0) {
    const reduction = Math.min(36, monthsEarly) * 0.00555 + Math.max(0, monthsEarly - 36) * 0.00417;
    primaryInsuranceAmount *= (1 - reduction);
  } else if (monthsLate > 0) {
    const increase = monthsLate * 0.00667;
    primaryInsuranceAmount *= (1 + increase);
  }
  
  return primaryInsuranceAmount;
}