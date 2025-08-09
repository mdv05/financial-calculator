import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import type {
  CalculatorInputs, ProjectionResults, ScenarioComparison
} from '../utils/calculations';
import {
  calculateProjections, calculateScenarios, monteCarloSimulation,
  optimizeContributions, calculateSocialSecurity
} from '../utils/calculations';
import { exportToCSV, exportToPDF, generateShareableLink, parseShareableLink } from '../utils/exportUtils';
import { exportToFormattedCSV } from '../utils/tableExport';

const defaultInputs: CalculatorInputs = {
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

const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  tertiary: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
};

export const FinancialCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<CalculatorInputs>(defaultInputs);
  const [results, setResults] = useState<ProjectionResults | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioComparison | null>(null);
  const [monteCarloResults, setMonteCarloResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'inputs' | 'results' | 'scenarios' | 'optimization'>('inputs');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.toString()) {
      const parsedInputs = parseShareableLink(params.toString());
      setInputs(prev => ({ ...prev, ...parsedInputs }));
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputs) {
        handleCalculate();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [inputs]);

  const handleCalculate = () => {
    try {
      const projectionResults = calculateProjections(inputs);
      setResults(projectionResults);
      
      const scenarioResults = calculateScenarios(inputs);
      setScenarios(scenarioResults);
      
      const mcResults = monteCarloSimulation(inputs, 500);
      setMonteCarloResults(mcResults);
    } catch (error) {
      console.error('Calculation error:', error);
    }
  };

  const handleInputChange = (field: keyof CalculatorInputs, value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputs(prev => ({ ...prev, [field]: numValue }));
  };

  const handleExportCSV = () => {
    if (results) {
      exportToFormattedCSV(results);
    }
  };

  const handleExportPDF = async () => {
    if (results && chartRef.current) {
      await exportToPDF(chartRef.current, results, inputs);
    }
  };

  const handleShare = () => {
    const link = generateShareableLink(inputs);
    navigator.clipboard.writeText(link);
    alert('Share link copied to clipboard!');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return (value * 100).toFixed(1) + '%';
  };

  const optimizationResults = useMemo(() => {
    if (!inputs) return null;
    return optimizeContributions(
      inputs,
      inputs.monthlyContribution * 0.6,
      inputs.monthlyContribution * 0.3,
      inputs.monthlyContribution * 0.1
    );
  }, [inputs]);

  const socialSecurityEstimate = useMemo(() => {
    const averageMonthlyEarnings = inputs.currentSalary / 12;
    return calculateSocialSecurity(averageMonthlyEarnings, 67, inputs.retirementAge);
  }, [inputs]);

  const chartData = useMemo(() => {
    if (!results) return [];
    return results.yearlyData.filter((_, index) => index % 5 === 0 || index === results.yearlyData.length - 1);
  }, [results]);

  const scenarioChartData = useMemo(() => {
    if (!scenarios) return [];
    const data: any[] = [];
    const years = scenarios.moderate.yearlyData.length;
    
    for (let i = 0; i < years; i += 5) {
      data.push({
        age: scenarios.moderate.yearlyData[i].age,
        conservative: scenarios.conservative.yearlyData[i].totalSavings,
        moderate: scenarios.moderate.yearlyData[i].totalSavings,
        aggressive: scenarios.aggressive.yearlyData[i].totalSavings,
      });
    }
    return data;
  }, [scenarios]);

  const allocationData = [
    { name: '401(k)', value: optimizationResults?.optimal401k || 0, color: CHART_COLORS.primary },
    { name: 'Roth IRA', value: optimizationResults?.optimalRothIRA || 0, color: CHART_COLORS.secondary },
    { name: 'Taxable', value: optimizationResults?.optimalTaxable || 0, color: CHART_COLORS.tertiary },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Financial Projection Calculator
          </h1>
          <p className="text-gray-600">
            Plan your path to financial independence with accurate projections and scenario analysis
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveTab('inputs')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'inputs'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Input Parameters
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'results'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Projection Results
            </button>
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'scenarios'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Scenario Analysis
            </button>
            <button
              onClick={() => setActiveTab('optimization')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'optimization'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Optimization
            </button>
          </div>

          {activeTab === 'inputs' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Age
                  </label>
                  <input
                    type="number"
                    value={inputs.currentAge}
                    onChange={(e) => handleInputChange('currentAge', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Retirement Age
                  </label>
                  <input
                    type="number"
                    value={inputs.retirementAge}
                    onChange={(e) => handleInputChange('retirementAge', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Life Expectancy
                  </label>
                  <input
                    type="number"
                    value={inputs.lifeExpectancy}
                    onChange={(e) => handleInputChange('lifeExpectancy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Salary ($)
                  </label>
                  <input
                    type="number"
                    value={inputs.currentSalary}
                    onChange={(e) => handleInputChange('currentSalary', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary Growth Rate (%)
                  </label>
                  <input
                    type="number"
                    value={inputs.salaryGrowthRate * 100}
                    onChange={(e) => handleInputChange('salaryGrowthRate', (parseFloat(e.target.value) / 100).toString())}
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Savings ($)
                  </label>
                  <input
                    type="number"
                    value={inputs.currentSavings}
                    onChange={(e) => handleInputChange('currentSavings', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Contribution ($)
                  </label>
                  <input
                    type="number"
                    value={inputs.monthlyContribution}
                    onChange={(e) => handleInputChange('monthlyContribution', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Return (%)
                  </label>
                  <input
                    type="number"
                    value={inputs.expectedReturn * 100}
                    onChange={(e) => handleInputChange('expectedReturn', (parseFloat(e.target.value) / 100).toString())}
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inflation Rate (%)
                  </label>
                  <input
                    type="number"
                    value={inputs.inflationRate * 100}
                    onChange={(e) => handleInputChange('inflationRate', (parseFloat(e.target.value) / 100).toString())}
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
                </button>
              </div>

              {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contribution Increase Rate (%)
                    </label>
                    <input
                      type="number"
                      value={inputs.contributionIncreaseRate * 100}
                      onChange={(e) => handleInputChange('contributionIncreaseRate', (parseFloat(e.target.value) / 100).toString())}
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employer Match (%)
                    </label>
                    <input
                      type="number"
                      value={inputs.employerMatchPercent * 100}
                      onChange={(e) => handleInputChange('employerMatchPercent', (parseFloat(e.target.value) / 100).toString())}
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employer Match Limit (%)
                    </label>
                    <input
                      type="number"
                      value={inputs.employerMatchLimit * 100}
                      onChange={(e) => handleInputChange('employerMatchLimit', (parseFloat(e.target.value) / 100).toString())}
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      value={inputs.taxRate * 100}
                      onChange={(e) => handleInputChange('taxRate', (parseFloat(e.target.value) / 100).toString())}
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Retirement Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      value={inputs.retirementTaxRate * 100}
                      onChange={(e) => handleInputChange('retirementTaxRate', (parseFloat(e.target.value) / 100).toString())}
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Desired Monthly Income ($)
                    </label>
                    <input
                      type="number"
                      value={inputs.desiredRetirementIncome}
                      onChange={(e) => handleInputChange('desiredRetirementIncome', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Social Security Benefit ($)
                    </label>
                    <input
                      type="number"
                      value={inputs.socialSecurityBenefit}
                      onChange={(e) => handleInputChange('socialSecurityBenefit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && results && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                  <div className="text-sm opacity-90">Retirement Value</div>
                  <div className="text-2xl font-bold">{formatCurrency(results.retirementValue)}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {formatCurrency(results.retirementValueInflationAdjusted)} inflation adjusted
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                  <div className="text-sm opacity-90">Monthly Income</div>
                  <div className="text-2xl font-bold">{formatCurrency(results.monthlyRetirementIncome)}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {formatCurrency(results.monthlyRetirementIncomeInflationAdjusted)} inflation adjusted
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                  <div className="text-sm opacity-90">Replacement Ratio</div>
                  <div className="text-2xl font-bold">{formatPercent(results.replacementRatio)}</div>
                  <div className="text-xs opacity-75 mt-1">of final salary</div>
                </div>

                <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg p-4 text-white">
                  <div className="text-sm opacity-90">Total Contributions</div>
                  <div className="text-2xl font-bold">{formatCurrency(results.totalContributions)}</div>
                  <div className="text-xs opacity-75 mt-1">over {inputs.retirementAge - inputs.currentAge} years</div>
                </div>

                <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg p-4 text-white">
                  <div className="text-sm opacity-90">Interest Earned</div>
                  <div className="text-2xl font-bold">{formatCurrency(results.totalInterestEarned)}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {formatPercent(results.totalInterestEarned / (results.totalContributions + 0.01))} return
                  </div>
                </div>

                <div className={`rounded-lg p-4 text-white ${
                  results.retirementShortfall > 0
                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                    : 'bg-gradient-to-r from-teal-500 to-teal-600'
                }`}>
                  <div className="text-sm opacity-90">Retirement Status</div>
                  <div className="text-2xl font-bold">
                    {results.retirementShortfall > 0 ? 'Shortfall' : 'On Track'}
                  </div>
                  <div className="text-xs opacity-75 mt-1">
                    {results.retirementShortfall > 0
                      ? `Need ${formatCurrency(results.recommendedMonthlySavings)}/month`
                      : 'Meeting retirement goals'}
                  </div>
                </div>
              </div>

              <div ref={chartRef} className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Wealth Accumulation Timeline</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => `Age ${label}`}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="totalSavings"
                      name="Total Savings"
                      stroke={CHART_COLORS.primary}
                      fill={CHART_COLORS.primary}
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalSavingsInflationAdjusted"
                      name="Inflation Adjusted"
                      stroke={CHART_COLORS.secondary}
                      fill={CHART_COLORS.secondary}
                      fillOpacity={0.4}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Annual Contributions Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="totalContribution" name="Total Contribution" fill={CHART_COLORS.tertiary} />
                    <Bar dataKey="interestEarned" name="Interest Earned" fill={CHART_COLORS.purple} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <h3 className="text-lg font-semibold mb-4">Detailed Projection Data</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Contrib.</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Employer Match</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Savings</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Earned</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.yearlyData.filter((_, index) => index % 5 === 0 || index === results.yearlyData.length - 1).map((year, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{year.age}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{year.year}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(year.salary)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(year.monthlyContribution)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(year.employerMatch)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(year.totalSavings)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(year.interestEarned)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100">
                    <tr>
                      <td colSpan={5} className="px-3 py-2 text-sm font-medium text-gray-900">Final Values</td>
                      <td className="px-3 py-2 text-sm font-bold text-gray-900 text-right">{formatCurrency(results.retirementValue)}</td>
                      <td className="px-3 py-2 text-sm font-bold text-gray-900 text-right">{formatCurrency(results.totalInterestEarned)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'scenarios' && scenarios && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Conservative</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Return:</span>
                      <span className="font-medium">4%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Final Value:</span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(scenarios.conservative.retirementValue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Monthly Income:</span>
                      <span className="font-medium">
                        {formatCurrency(scenarios.conservative.monthlyRetirementIncome)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
                  <h3 className="font-semibold text-gray-700 mb-2">Moderate (Current)</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Return:</span>
                      <span className="font-medium">7%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Final Value:</span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(scenarios.moderate.retirementValue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Monthly Income:</span>
                      <span className="font-medium">
                        {formatCurrency(scenarios.moderate.monthlyRetirementIncome)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Aggressive</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Return:</span>
                      <span className="font-medium">10%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Final Value:</span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(scenarios.aggressive.retirementValue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Monthly Income:</span>
                      <span className="font-medium">
                        {formatCurrency(scenarios.aggressive.monthlyRetirementIncome)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Scenario Comparison</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={scenarioChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => `Age ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="conservative"
                      name="Conservative"
                      stroke={CHART_COLORS.danger}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="moderate"
                      name="Moderate"
                      stroke={CHART_COLORS.primary}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="aggressive"
                      name="Aggressive"
                      stroke={CHART_COLORS.secondary}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {monteCarloResults && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Monte Carlo Analysis</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">5th Percentile</div>
                      <div className="text-lg font-semibold text-red-600">
                        {formatCurrency(monteCarloResults.percentile25)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">25th Percentile</div>
                      <div className="text-lg font-semibold text-amber-600">
                        {formatCurrency(monteCarloResults.percentile25)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Median</div>
                      <div className="text-lg font-semibold text-blue-600">
                        {formatCurrency(monteCarloResults.median)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">75th Percentile</div>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(monteCarloResults.percentile75)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Success Rate</div>
                      <div className="text-lg font-semibold text-purple-600">
                        {formatPercent(monteCarloResults.successRate)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'optimization' && optimizationResults && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
                <h3 className="text-xl font-semibold mb-4">Optimized Contribution Strategy</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm opacity-90">401(k) Contribution</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(optimizationResults.optimal401k)}
                    </div>
                    <div className="text-xs opacity-75 mt-1">per month</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90">Roth IRA</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(optimizationResults.optimalRothIRA)}
                    </div>
                    <div className="text-xs opacity-75 mt-1">per month</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90">Annual Tax Savings</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(optimizationResults.totalTaxSavings)}
                    </div>
                    <div className="text-xs opacity-75 mt-1">from pre-tax contributions</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Allocation Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: $${(entry.value || 0).toFixed(0)}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Social Security Optimization</h4>
                <p className="text-blue-800">
                  Estimated Social Security benefit: <span className="font-bold">{formatCurrency(socialSecurityEstimate)}</span> per month
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  Consider delaying Social Security to age 70 for a {formatPercent(0.08 * 3)} increase in benefits.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">Recommendations</h4>
                <div className="space-y-2">
                  {results && results.retirementShortfall > 0 && (
                    <div className="flex items-start space-x-2">
                      <span className="text-red-500 mt-1">⚠️</span>
                      <p className="text-sm text-gray-600">
                        Increase monthly savings to {formatCurrency(results.recommendedMonthlySavings)} to meet retirement goals
                      </p>
                    </div>
                  )}
                  <div className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <p className="text-sm text-gray-600">
                      Maximize employer 401(k) match for free money
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <p className="text-sm text-gray-600">
                      Consider Roth conversions in low-income years
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <p className="text-sm text-gray-600">
                      Review and rebalance portfolio annually
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Export to CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Export to PDF
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Share Link
            </button>
            <button
              onClick={() => setInputs(defaultInputs)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        <footer className="mt-8 py-4 text-center text-sm text-gray-600">
          <p>
            Created by Mariana Duong-Vazquez
          </p>
          <p className="mt-1">
            © {new Date().getFullYear()} All rights reserved
          </p>
        </footer>
      </div>
    </div>
  );
};