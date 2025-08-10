import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import { exportToPDF, generateShareableLink, parseShareableLink } from '../utils/exportUtils';
import { exportToExcel } from '../utils/excelExport';

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
  const [monteCarloResults, setMonteCarloResults] = useState<{
    median: number;
    percentile25: number;
    percentile75: number;
    percentile95: number;
    successRate: number;
  } | null>(null);
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
  }, [inputs, handleCalculate]);

  const handleCalculate = useCallback(() => {
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
  }, [inputs]);

  const handleInputChange = (field: keyof CalculatorInputs, value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputs(prev => ({ ...prev, [field]: numValue }));
  };

  const handleExportExcel = () => {
    if (results) {
      exportToExcel(results, inputs);
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
    const data: Array<{ age: number; conservative: number; moderate: number; aggressive: number }> = [];
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <header className="text-center">
            <h1 className="mb-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600" 
                    style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: '2.5rem', letterSpacing: '0.05em', display: 'block' }}>
                FutureScope
              </span>
              <span className="text-2xl text-gray-700 mt-2 block" style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600 }}>
                Financial Projection Calculator
              </span>
            </h1>
            <p className="text-gray-600 mt-3 text-base max-w-2xl mx-auto">
              Professional retirement planning with institutional-grade projections and analysis
            </p>
          </header>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap gap-3 mb-6 border-b border-gray-200 pb-4">
            <button
              onClick={() => setActiveTab('inputs')}
              className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                activeTab === 'inputs'
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              style={activeTab === 'inputs' ? { backgroundColor: '#1E3A8A' } : {}}
            >
              Input Parameters
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                activeTab === 'results'
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              style={activeTab === 'results' ? { backgroundColor: '#1E3A8A' } : {}}
            >
              Projection Results
            </button>
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                activeTab === 'scenarios'
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              style={activeTab === 'scenarios' ? { backgroundColor: '#1E3A8A' } : {}}
            >
              Scenario Analysis
            </button>
            <button
              onClick={() => setActiveTab('optimization')}
              className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                activeTab === 'optimization'
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              style={activeTab === 'optimization' ? { backgroundColor: '#1E3A8A' } : {}}
            >
              Optimization
            </button>
          </div>

          {activeTab === 'inputs' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Age
                  </label>
                  <input
                    type="number"
                    value={inputs.currentAge}
                    onChange={(e) => handleInputChange('currentAge', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Retirement Age
                  </label>
                  <input
                    type="number"
                    value={inputs.retirementAge}
                    onChange={(e) => handleInputChange('retirementAge', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Life Expectancy
                  </label>
                  <input
                    type="number"
                    value={inputs.lifeExpectancy}
                    onChange={(e) => handleInputChange('lifeExpectancy', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Salary ($)
                  </label>
                  <input
                    type="number"
                    value={inputs.currentSalary}
                    onChange={(e) => handleInputChange('currentSalary', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Salary Growth Rate (%)
                  </label>
                  <input
                    type="number"
                    value={inputs.salaryGrowthRate * 100}
                    onChange={(e) => handleInputChange('salaryGrowthRate', (parseFloat(e.target.value) / 100).toString())}
                    step="0.1"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Savings ($)
                  </label>
                  <input
                    type="number"
                    value={inputs.currentSavings}
                    onChange={(e) => handleInputChange('currentSavings', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Monthly Contribution ($)
                  </label>
                  <input
                    type="number"
                    value={inputs.monthlyContribution}
                    onChange={(e) => handleInputChange('monthlyContribution', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Expected Return (%)
                  </label>
                  <input
                    type="number"
                    value={inputs.expectedReturn * 100}
                    onChange={(e) => handleInputChange('expectedReturn', (parseFloat(e.target.value) / 100).toString())}
                    step="0.1"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Inflation Rate (%)
                  </label>
                  <input
                    type="number"
                    value={inputs.inflationRate * 100}
                    onChange={(e) => handleInputChange('inflationRate', (parseFloat(e.target.value) / 100).toString())}
                    step="0.1"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contribution Increase Rate (%)
                    </label>
                    <input
                      type="number"
                      value={inputs.contributionIncreaseRate * 100}
                      onChange={(e) => handleInputChange('contributionIncreaseRate', (parseFloat(e.target.value) / 100).toString())}
                      step="0.1"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Employer Match (%)
                    </label>
                    <input
                      type="number"
                      value={inputs.employerMatchPercent * 100}
                      onChange={(e) => handleInputChange('employerMatchPercent', (parseFloat(e.target.value) / 100).toString())}
                      step="0.1"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Employer Match Limit (%)
                    </label>
                    <input
                      type="number"
                      value={inputs.employerMatchLimit * 100}
                      onChange={(e) => handleInputChange('employerMatchLimit', (parseFloat(e.target.value) / 100).toString())}
                      step="0.1"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Current Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      value={inputs.taxRate * 100}
                      onChange={(e) => handleInputChange('taxRate', (parseFloat(e.target.value) / 100).toString())}
                      step="0.1"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Retirement Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      value={inputs.retirementTaxRate * 100}
                      onChange={(e) => handleInputChange('retirementTaxRate', (parseFloat(e.target.value) / 100).toString())}
                      step="0.1"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Desired Monthly Income ($)
                    </label>
                    <input
                      type="number"
                      value={inputs.desiredRetirementIncome}
                      onChange={(e) => handleInputChange('desiredRetirementIncome', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Social Security Benefit ($)
                    </label>
                    <input
                      type="number"
                      value={inputs.socialSecurityBenefit}
                      onChange={(e) => handleInputChange('socialSecurityBenefit', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && results && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                  <div className="text-sm font-medium text-gray-600 mb-1">Retirement Value</div>
                  <div className="text-2xl font-bold text-green-700" style={{ color: '#059669' }}>{formatCurrency(results.retirementValue)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatCurrency(results.retirementValueInflationAdjusted)} inflation adjusted
                  </div>
                </div>

                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                  <div className="text-sm font-medium text-gray-600 mb-1">Monthly Income</div>
                  <div className="text-2xl font-bold text-green-700" style={{ color: '#059669' }}>{formatCurrency(results.monthlyRetirementIncome)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatCurrency(results.monthlyRetirementIncomeInflationAdjusted)} inflation adjusted
                  </div>
                </div>

                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                  <div className="text-sm font-medium text-gray-600 mb-1">Replacement Ratio</div>
                  <div className="text-2xl font-bold text-gray-900">{formatPercent(results.replacementRatio)}</div>
                  <div className="text-xs text-gray-500 mt-1">of final salary</div>
                </div>

                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                  <div className="text-sm font-medium text-gray-600 mb-1">Total Contributions</div>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(results.totalContributions)}</div>
                  <div className="text-xs text-gray-500 mt-1">over {inputs.retirementAge - inputs.currentAge} years</div>
                </div>

                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                  <div className="text-sm font-medium text-gray-600 mb-1">Interest Earned</div>
                  <div className="text-2xl font-bold text-green-700" style={{ color: '#059669' }}>{formatCurrency(results.totalInterestEarned)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatPercent(results.totalInterestEarned / (results.totalContributions + 0.01))} return
                  </div>
                </div>

                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                  <div className="text-sm font-medium text-gray-600 mb-1">Retirement Status</div>
                  <div className={`text-2xl font-bold ${
                    results.retirementShortfall > 0 ? 'text-red-600' : 'text-green-700'
                  }`} style={results.retirementShortfall <= 0 ? { color: '#059669' } : {}}>
                    {results.retirementShortfall > 0 ? 'Shortfall' : 'On Track'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {results.retirementShortfall > 0
                      ? `Need ${formatCurrency(results.recommendedMonthlySavings)}/month`
                      : 'Meeting retirement goals'}
                  </div>
                </div>
              </div>

              <div ref={chartRef} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>Wealth Accumulation Timeline</h3>
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
                    <div className="text-xs text-gray-400 mt-1">per month</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90">Roth IRA</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(optimizationResults.optimalRothIRA)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">per month</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90">Annual Tax Savings</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(optimizationResults.totalTaxSavings)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">from pre-tax contributions</div>
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

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Export & Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center gap-2 shadow-sm"
              style={{ backgroundColor: '#059669' }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M15.8,20H14L12,13.2L10,20H8.2L6.6,15.6L8.1,12L6.8,8.4L8.6,4H10.4L12,10.8L13.6,4H15.4L13.1,12L15.8,20M13,9V3.5L18.5,9H13Z" />
              </svg>
              Export to Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2L20,8V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2H14M18,20V9H13V4H6V20H18M10.92,12.31C10.68,11.54 10.15,9.08 11.55,9.04C12.95,9 12.03,12.16 12.03,12.16C12.42,11.5 13.05,11.34 13.5,11.34C14.22,11.34 14.97,11.74 14.97,12.76C14.97,13.78 13.74,14.29 13.05,14.29C12.36,14.29 11.97,14 11.72,13.63C11.5,13.97 11.03,14.58 10.32,14.58C9.61,14.58 9,14.05 9,13.27C9,12.5 9.61,12.15 10.24,12.15C10.87,12.15 10.92,12.31 10.92,12.31M12.5,13.88C12.97,13.88 13.34,13.64 13.34,13.08C13.34,12.5 13,12.39 12.66,12.39C12.32,12.39 11.97,12.69 11.82,13.08C11.87,13.5 12.03,13.88 12.5,13.88M10.71,13C10.55,12.61 10.39,12.61 10.24,12.61C10.08,12.61 9.89,12.75 9.89,13.03C9.89,13.31 10.08,13.5 10.29,13.5C10.5,13.5 10.66,13.41 10.71,13Z" />
              </svg>
              Export to PDF
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.35C15.11,18.56 15.08,18.78 15.08,19C15.08,20.61 16.39,21.92 18,21.92C19.61,21.92 20.92,20.61 20.92,19A2.92,2.92 0 0,0 18,16.08Z" />
              </svg>
              Share Link
            </button>
            <button
              onClick={() => setInputs(defaultInputs)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,4C14.74,4 17.31,5 19.31,6.69L17.89,8.11C16.27,6.5 14.19,5.58 12,5.58C9.81,5.58 7.73,6.5 6.11,8.11L4.69,6.69C6.69,5 9.26,4 12,4M12,8C13.66,8 15.22,8.56 16.44,9.56L15,11C14.22,10.22 13.16,9.78 12,9.78C10.84,9.78 9.78,10.22 9,11L7.56,9.56C8.78,8.56 10.34,8 12,8M12,12A2,2 0 0,1 14,14A2,2 0 0,1 12,16A2,2 0 0,1 10,14A2,2 0 0,1 12,12M7,18L12,13L17,18H13V22H11V18H7Z" />
              </svg>
              Reset
            </button>
          </div>
        </div>

        <footer className="mt-12 py-8 bg-white border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm font-semibold mb-2" style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.05em', background: 'linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              FUTURESCOPE™
            </p>
            <p className="text-sm text-gray-600 mb-1">
              Created by Mariana Duong-Vazquez
            </p>
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} All rights reserved • Professional Financial Planning Solutions
            </p>
            <div className="mt-4 text-xs text-gray-500 italic">
              Proof-of-concept application • No data persistence • Your personal information is never stored
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};