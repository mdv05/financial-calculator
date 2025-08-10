import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { ProjectionResults, CalculatorInputs } from './calculations';

export function exportToExcel(data: ProjectionResults, inputs: CalculatorInputs): void {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Prepare projection data
  const projectionData = data.yearlyData.map(year => ({
    'Age': year.age,
    'Year': year.year,
    'Annual Salary': year.salary,
    'Monthly Contribution': year.monthlyContribution,
    'Employer Match': year.employerMatch,
    'Annual Contribution': year.totalContribution,
    'Total Savings': year.totalSavings,
    'Inflation Adjusted': year.totalSavingsInflationAdjusted,
    'Interest Earned': year.interestEarned
  }));

  // Create projection worksheet
  const wsProjection = XLSX.utils.json_to_sheet(projectionData);

  // Set column widths for better readability
  const colWidths = [
    { wch: 8 },   // Age
    { wch: 10 },  // Year
    { wch: 15 },  // Annual Salary
    { wch: 18 },  // Monthly Contribution
    { wch: 15 },  // Employer Match
    { wch: 18 },  // Annual Contribution
    { wch: 15 },  // Total Savings
    { wch: 18 },  // Inflation Adjusted
    { wch: 15 }   // Interest Earned
  ];
  wsProjection['!cols'] = colWidths;

  // Format currency columns
  const range = XLSX.utils.decode_range(wsProjection['!ref'] || 'A1');
  for (let row = 1; row <= range.e.r; row++) {
    // Format salary columns (C, D, E, F, G, H, I)
    for (let col = 2; col <= 8; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (wsProjection[cellAddress]) {
        wsProjection[cellAddress].z = '$#,##0.00';
      }
    }
  }

  // Add projection worksheet
  XLSX.utils.book_append_sheet(wb, wsProjection, 'Projections');

  // Create summary data
  const summaryData = [
    ['FutureScope Financial Projection Summary'],
    [''],
    ['Created by', 'Mariana Duong-Vazquez'],
    ['Generated on', format(new Date(), 'MMMM dd, yyyy')],
    [''],
    ['Input Parameters'],
    ['Current Age', inputs.currentAge],
    ['Retirement Age', inputs.retirementAge],
    ['Life Expectancy', inputs.lifeExpectancy],
    ['Current Salary', inputs.currentSalary],
    ['Salary Growth Rate', `${(inputs.salaryGrowthRate * 100).toFixed(1)}%`],
    ['Current Savings', inputs.currentSavings],
    ['Monthly Contribution', inputs.monthlyContribution],
    ['Expected Return', `${(inputs.expectedReturn * 100).toFixed(1)}%`],
    ['Inflation Rate', `${(inputs.inflationRate * 100).toFixed(1)}%`],
    ['Tax Rate', `${(inputs.taxRate * 100).toFixed(1)}%`],
    [''],
    ['Projection Results'],
    ['Retirement Value', data.retirementValue],
    ['Retirement Value (Inflation Adjusted)', data.retirementValueInflationAdjusted],
    ['Monthly Retirement Income', data.monthlyRetirementIncome],
    ['Monthly Income (Inflation Adjusted)', data.monthlyRetirementIncomeInflationAdjusted],
    ['Total Contributions', data.totalContributions],
    ['Total Interest Earned', data.totalInterestEarned],
    ['Income Replacement Ratio', `${(data.replacementRatio * 100).toFixed(1)}%`],
    ['Years in Retirement', data.yearsOfRetirement],
    [''],
    ['Analysis'],
    ['Retirement Status', data.retirementShortfall > 0 ? 'SHORTFALL' : 'ON TRACK'],
    ['Shortfall Amount', data.retirementShortfall > 0 ? data.retirementShortfall : 0],
    ['Recommended Monthly Savings', data.recommendedMonthlySavings]
  ];

  // Create summary worksheet
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

  // Style the summary sheet
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 25 }];
  
  // Merge title cell
  wsSummary['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }
  ];

  // Format currency cells in summary
  const currencyRows = [9, 11, 12, 18, 19, 20, 21, 22, 23, 29, 30];
  currencyRows.forEach(row => {
    const cellAddress = `B${row + 1}`;
    if (wsSummary[cellAddress]) {
      wsSummary[cellAddress].z = '$#,##0.00';
    }
  });

  // Add summary worksheet
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Create charts data worksheet
  const chartData = data.yearlyData.filter((_, index) => index % 5 === 0 || index === data.yearlyData.length - 1);
  const chartDataFormatted = chartData.map(year => ({
    'Age': year.age,
    'Total Savings': year.totalSavings,
    'Contributions': year.totalContribution,
    'Interest': year.interestEarned,
    'Inflation Adjusted': year.totalSavingsInflationAdjusted
  }));

  const wsCharts = XLSX.utils.json_to_sheet(chartDataFormatted);
  wsCharts['!cols'] = [
    { wch: 10 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 }
  ];

  // Format currency columns in charts data
  const chartRange = XLSX.utils.decode_range(wsCharts['!ref'] || 'A1');
  for (let row = 1; row <= chartRange.e.r; row++) {
    for (let col = 1; col <= 4; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (wsCharts[cellAddress]) {
        wsCharts[cellAddress].z = '$#,##0.00';
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, wsCharts, 'Chart Data');

  // Generate Excel file
  const wbout = XLSX.write(wb, { 
    bookType: 'xlsx', 
    type: 'array',
    bookSST: false,
    compression: true
  });

  // Create blob and download
  const blob = new Blob([wbout], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `FutureScope-Financial-Projection-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function createDetailedExcelReport(data: ProjectionResults, inputs: CalculatorInputs): void {
  const wb = XLSX.utils.book_new();

  // Add multiple detailed sheets
  // 1. Complete yearly projections
  const yearlySheet = XLSX.utils.json_to_sheet(data.yearlyData.map(year => ({
    'Age': year.age,
    'Year': year.year,
    'Annual Salary': year.salary,
    'Salary Growth': year.salary - (data.yearlyData[Math.max(0, data.yearlyData.indexOf(year) - 1)]?.salary || inputs.currentSalary),
    'Monthly Contribution': year.monthlyContribution,
    'Annual Contribution': year.monthlyContribution * 12,
    'Employer Match Monthly': year.employerMatch,
    'Employer Match Annual': year.employerMatch * 12,
    'Total Annual Contribution': year.totalContribution,
    'Beginning Balance': data.yearlyData[Math.max(0, data.yearlyData.indexOf(year) - 1)]?.totalSavings || inputs.currentSavings,
    'Interest Earned': year.interestEarned,
    'Ending Balance': year.totalSavings,
    'Real Value (Inflation Adj.)': year.totalSavingsInflationAdjusted,
    'Cumulative Contributions': data.yearlyData.slice(0, data.yearlyData.indexOf(year) + 1)
      .reduce((sum, y) => sum + y.totalContribution, 0),
    'Cumulative Interest': data.yearlyData.slice(0, data.yearlyData.indexOf(year) + 1)
      .reduce((sum, y) => sum + y.interestEarned, 0)
  })));

  // Set column widths
  yearlySheet['!cols'] = Array(15).fill({ wch: 18 });

  // Format all currency columns
  const range = XLSX.utils.decode_range(yearlySheet['!ref'] || 'A1');
  for (let row = 1; row <= range.e.r; row++) {
    for (let col = 2; col <= 14; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (yearlySheet[cellAddress] && typeof yearlySheet[cellAddress].v === 'number') {
        yearlySheet[cellAddress].z = '$#,##0.00';
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, yearlySheet, 'Detailed Projections');

  // 2. Retirement Analysis Sheet
  const retirementAnalysis = [
    ['FutureScope Retirement Analysis Report'],
    [''],
    ['Key Metrics'],
    ['Years to Retirement', inputs.retirementAge - inputs.currentAge],
    ['Years in Retirement', inputs.lifeExpectancy - inputs.retirementAge],
    ['Final Working Year Salary', data.yearlyData[data.yearlyData.length - 1]?.salary || 0],
    [''],
    ['Retirement Readiness'],
    ['Target Monthly Income', inputs.desiredRetirementIncome],
    ['Projected Monthly Income', data.monthlyRetirementIncome],
    ['Income Gap/Surplus', data.monthlyRetirementIncome - inputs.desiredRetirementIncome],
    ['Social Security Benefit', inputs.socialSecurityBenefit],
    ['Income Replacement Ratio', `${(data.replacementRatio * 100).toFixed(1)}%`],
    [''],
    ['Wealth Accumulation'],
    ['Starting Balance', inputs.currentSavings],
    ['Total Contributions', data.totalContributions],
    ['Total Interest Earned', data.totalInterestEarned],
    ['Final Balance (Nominal)', data.retirementValue],
    ['Final Balance (Real)', data.retirementValueInflationAdjusted],
    ['Return on Investment', `${((data.totalInterestEarned / data.totalContributions) * 100).toFixed(1)}%`],
    [''],
    ['Recommendations'],
    ['Current Monthly Savings', inputs.monthlyContribution],
    ['Recommended Monthly Savings', data.recommendedMonthlySavings],
    ['Additional Savings Needed', Math.max(0, data.recommendedMonthlySavings - inputs.monthlyContribution)],
    ['Retirement Status', data.retirementShortfall > 0 ? 'ACTION NEEDED' : 'ON TRACK'],
    [''],
    ['Copyright © ' + new Date().getFullYear() + ' Mariana Duong-Vazquez. All rights reserved.']
  ];

  const wsRetirement = XLSX.utils.aoa_to_sheet(retirementAnalysis);
  wsRetirement['!cols'] = [{ wch: 30 }, { wch: 25 }];
  
  // Format currency cells
  const retirementCurrencyRows = [6, 9, 10, 11, 12, 16, 17, 18, 19, 20, 24, 25, 26];
  retirementCurrencyRows.forEach(row => {
    const cellAddress = `B${row}`;
    if (wsRetirement[cellAddress] && typeof wsRetirement[cellAddress].v === 'number') {
      wsRetirement[cellAddress].z = '$#,##0.00';
    }
  });

  XLSX.utils.book_append_sheet(wb, wsRetirement, 'Retirement Analysis');

  // Write and download
  const wbout = XLSX.write(wb, { 
    bookType: 'xlsx', 
    type: 'array',
    compression: true
  });

  const blob = new Blob([wbout], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `FutureScope-Financial-Analysis-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}