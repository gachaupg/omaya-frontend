import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart, CartesianGrid } from 'recharts';
import { ChevronDown } from 'lucide-react';

// Dummy data for different views
const allData = [
  { month: 'JAN', deposits: 5000, withdrawals: 4500 },
  { month: 'FEB', deposits: 3500, withdrawals: 5500 },
  { month: 'MAR', deposits: 7000, withdrawals: 4000 },
  { month: 'APR', deposits: 6500, withdrawals: 6000 },
  { month: 'MAY', deposits: 4000, withdrawals: 3500 },
  { month: 'JUN', deposits: 3000, withdrawals: 2500 },
  { month: 'JUL', deposits: 6000, withdrawals: 4500 },
  { month: 'AUG', deposits: 5500, withdrawals: 5000 },
  { month: 'SEP', deposits: 2500, withdrawals: 2000 },
  { month: 'OCT', deposits: 3000, withdrawals: 1500 },
  { month: 'NOV', deposits: 4500, withdrawals: 3500 },
  { month: 'DEC', deposits: 7500, withdrawals: 6500 }
];

const depositsData = allData.map(item => ({
  month: item.month,
  value: item.deposits
}));

const withdrawalsData = allData.map(item => ({
  month: item.month,
  value: item.withdrawals
}));

type TabType = 'All' | 'Deposits' | 'Withdrawals';

const TransactionOverviewChart: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('All');

  const renderChart = () => {
    if (activeTab === 'All') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={allData} margin={{top: 20, right: 30, left: 0, bottom: 32}}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              horizontal={true} 
              vertical={false}
            />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(1)}K`}
              domain={[1000, 10000]}
              ticks={[1000, 2500, 5000, 7500, 10000]}
            />
            <Line
              type="monotone"
              dataKey="deposits"
              stroke="#1D8751"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="withdrawals"
              stroke="#E23D3A"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    } else if (activeTab === 'Deposits') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={depositsData}>
            <defs>
              <linearGradient id="singleDepositsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1D8751" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#1D8751" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              horizontal={true} 
              vertical={false}
            />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(1)}K`}
              domain={[1000, 10000]}
              ticks={[1000, 2500, 5000, 7500, 10000]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#1D8751"
              strokeWidth={2}
              fill="url(#singleDepositsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={withdrawalsData}>
            <defs>
              <linearGradient id="singleWithdrawalsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E23D3A" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#E23D3A" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              horizontal={true} 
              vertical={false}
            />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(1)}K`}
              domain={[1000, 10000]}
              ticks={[1000, 2500, 5000, 7500, 10000]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#E23D3A"
              strokeWidth={2}
              fill="url(#singleWithdrawalsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <div className="bg-[#1D1D23] rounded-lg p-4 sm:p-6 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h2 className="text-lg font-medium">Transaction Overview (USD)</h2>
          <div className="flex flex-wrap gap-2">
            {(['All', 'Deposits', 'Withdrawals'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-sm font-medium transition-colors border border-[#1D8751] ${
                  activeTab === tab
                    ? tab === 'All'
                      ? 'bg-red-600 text-white'
                      : tab === 'Deposits'
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                    : 'text-[#1D8751] hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-400 cursor-pointer self-start sm:self-auto">
          <span className="text-sm">Month</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      <div className="h-64 sm:h-70">
        {renderChart()}
      </div>
    </div>
  );
};

export default TransactionOverviewChart;