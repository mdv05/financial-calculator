import { ProjectionResults } from './calculations';

export interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

export function prepareTableData(data: ProjectionResults): TableData {
  const headers = [
    'Age',
    'Year',
    'Annual Salary',
    'Monthly Contribution',
    'Employer Match',
    'Annual Contribution',
    'Total Savings',
    'Inflation Adjusted',
    'Interest Earned'
  ];

  const rows = data.yearlyData.map(year => [
    year.age,
    year.year,
    `$${year.salary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `$${year.monthlyContribution.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `$${year.employerMatch.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `$${year.totalContribution.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `$${year.totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `$${year.totalSavingsInflationAdjusted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `$${year.interestEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  ]);

  return { headers, rows };
}

export function exportToFormattedCSV(data: ProjectionResults): void {
  const tableData = prepareTableData(data);
  
  // Create a properly formatted CSV with BOM for Excel compatibility
  const BOM = '\uFEFF';
  
  // Format headers
  const csvHeaders = tableData.headers.join(',');
  
  // Format rows - remove $ and commas for proper number formatting in Excel
  const csvRows = data.yearlyData.map(year => [
    year.age,
    year.year,
    year.salary.toFixed(2),
    year.monthlyContribution.toFixed(2),
    year.employerMatch.toFixed(2),
    year.totalContribution.toFixed(2),
    year.totalSavings.toFixed(2),
    year.totalSavingsInflationAdjusted.toFixed(2),
    year.interestEarned.toFixed(2)
  ].join(','));
  
  // Add summary section
  const summarySection = [
    '',
    '',
    'FINANCIAL PROJECTION SUMMARY',
    '=============================',
    '',
    `Retirement Value,${data.retirementValue.toFixed(2)}`,
    `Retirement Value (Inflation Adjusted),${data.retirementValueInflationAdjusted.toFixed(2)}`,
    `Monthly Retirement Income,${data.monthlyRetirementIncome.toFixed(2)}`,
    `Total Contributions,${data.totalContributions.toFixed(2)}`,
    `Total Interest Earned,${data.totalInterestEarned.toFixed(2)}`,
    `Income Replacement Ratio,${(data.replacementRatio * 100).toFixed(1)}%`,
    '',
    'Created by Mariana Duong-Vazquez',
    `Generated on ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`
  ];
  
  // Combine all parts
  const csvContent = BOM + [
    csvHeaders,
    ...csvRows,
    ...summarySection
  ].join('\n');
  
  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `financial-projection-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}