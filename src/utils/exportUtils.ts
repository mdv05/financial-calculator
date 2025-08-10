import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import type { ProjectionResults, CalculatorInputs } from './calculations';

export function exportToCSV(data: ProjectionResults): void {
  // Helper function to escape CSV values
  const escapeCSV = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    const stringValue = value.toString();
    // If the value contains comma, newline, or quotes, wrap it in quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const headers = [
    'Age',
    'Year',
    'Salary',
    'Monthly Contribution',
    'Employer Match',
    'Total Contribution',
    'Total Savings',
    'Inflation Adjusted Savings',
    'Interest Earned'
  ];
  
  const rows = data.yearlyData.map(year => [
    year.age.toString(),
    year.year.toString(),
    year.salary.toFixed(2),
    year.monthlyContribution.toFixed(2),
    year.employerMatch.toFixed(2),
    year.totalContribution.toFixed(2),
    year.totalSavings.toFixed(2),
    year.totalSavingsInflationAdjusted.toFixed(2),
    year.interestEarned.toFixed(2)
  ]);
  
  // Create summary section with proper alignment
  const summaryRows = [
    ['', '', '', '', '', '', '', '', ''], // Empty row for separation
    ['SUMMARY', '', '', '', '', '', '', '', ''], // Summary header
    ['Metric', 'Value', '', '', '', '', '', '', ''], // Sub-headers
    ['Retirement Value', data.retirementValue.toFixed(2), '', '', '', '', '', '', ''],
    ['Retirement Value (Inflation Adjusted)', data.retirementValueInflationAdjusted.toFixed(2), '', '', '', '', '', '', ''],
    ['Monthly Retirement Income', data.monthlyRetirementIncome.toFixed(2), '', '', '', '', '', '', ''],
    ['Total Contributions', data.totalContributions.toFixed(2), '', '', '', '', '', '', ''],
    ['Total Interest Earned', data.totalInterestEarned.toFixed(2), '', '', '', '', '', '', ''],
    ['Replacement Ratio', (data.replacementRatio * 100).toFixed(1) + '%', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''], // Empty row
    ['Created by Mariana Duong-Vazquez', '', '', '', '', '', '', '', ''],
    [`Generated on ${format(new Date(), 'MMMM dd, yyyy')}`, '', '', '', '', '', '', '', '']
  ];
  
  // Build CSV content with proper escaping
  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(',')),
    ...summaryRows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `retirement-projection-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}

export async function exportToPDF(
  chartElement: HTMLElement | null,
  data: ProjectionResults,
  inputs: CalculatorInputs
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FutureScope', pageWidth / 2, 18, { align: 'center' });
  
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Financial Projection Report', pageWidth / 2, 28, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy')}`, pageWidth / 2, 38, { align: 'center' });
  
  let yPosition = 55;
  
  pdf.setFontSize(14);
  pdf.text('Input Parameters', 20, yPosition);
  yPosition += 10;
  
  pdf.setFontSize(10);
  const inputDetails = [
    `Current Age: ${inputs.currentAge}`,
    `Retirement Age: ${inputs.retirementAge}`,
    `Current Salary: $${inputs.currentSalary.toLocaleString()}`,
    `Current Savings: $${inputs.currentSavings.toLocaleString()}`,
    `Monthly Contribution: $${inputs.monthlyContribution.toLocaleString()}`,
    `Expected Return: ${(inputs.expectedReturn * 100).toFixed(1)}%`,
    `Inflation Rate: ${(inputs.inflationRate * 100).toFixed(1)}%`
  ];
  
  inputDetails.forEach(detail => {
    pdf.text(detail, 25, yPosition);
    yPosition += 7;
  });
  
  yPosition += 10;
  pdf.setFontSize(14);
  pdf.text('Projection Results', 20, yPosition);
  yPosition += 10;
  
  pdf.setFontSize(10);
  const results = [
    `Retirement Value: $${data.retirementValue.toLocaleString()}`,
    `Inflation Adjusted Value: $${data.retirementValueInflationAdjusted.toLocaleString()}`,
    `Monthly Retirement Income: $${data.monthlyRetirementIncome.toLocaleString()}`,
    `Total Contributions: $${data.totalContributions.toLocaleString()}`,
    `Total Interest Earned: $${data.totalInterestEarned.toLocaleString()}`,
    `Income Replacement Ratio: ${(data.replacementRatio * 100).toFixed(1)}%`
  ];
  
  results.forEach(result => {
    pdf.text(result, 25, yPosition);
    yPosition += 7;
  });
  
  if (chartElement) {
    try {
      const canvas = await html2canvas(chartElement, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      if (yPosition + imgHeight > pdf.internal.pageSize.getHeight() - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
    } catch (error) {
      console.error('Error capturing chart:', error);
    }
  }
  
  // Add footer with copyright
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);
  pdf.text(`Created by Mariana Duong-Vazquez`, pageWidth / 2, pageHeight - 15, { align: 'center' });
  pdf.text(`© ${new Date().getFullYear()} All rights reserved`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  pdf.save(`retirement-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export function generateShareableLink(inputs: CalculatorInputs): string {
  const params = new URLSearchParams();
  
  Object.entries(inputs).forEach(([key, value]) => {
    params.append(key, value.toString());
  });
  
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

export function parseShareableLink(queryString: string): Partial<CalculatorInputs> {
  const params = new URLSearchParams(queryString);
  const inputs: Partial<CalculatorInputs> = {};
  
  params.forEach((value, key) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      (inputs as Record<string, number>)[key] = numValue;
    }
  });
  
  return inputs;
}