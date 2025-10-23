import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart, CartesianGrid } from 'recharts';
import { ChevronDown } from 'lucide-react';
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch} from "../../../store";
import { RootState } from '@/store/rootReducer';
import { fetchTransactions } from "../slices/exchangeSlice";
import { Transaction } from "../types";
import { storage } from '../../auth/utils/storage';

import { logger } from '@/lib/utils/logger';

type TabType = 'All' | 'Deposits' | 'Withdrawals';
type TimeFilterType = 'week' | 'month' | 'year';

const TransactionOverviewChart: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { transactions, loading } = useSelector((state: RootState) => state.exchange);
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('month');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Get user email from storage
  useEffect(() => {
    const profile = storage.getProfile();
    const email = profile?.user?.email || "";
    logger.debug('exchange', '=== USER PROFILE CHART ===', { profile, email });
    setUserEmail(email);
  }, []);

  // Fetch transactions when userEmail is set
  useEffect(() => {
    if (userEmail) {
      logger.debug('exchange', '=== FETCHING TRANSACTIONS CHART ===', { userEmail });
      dispatch(fetchTransactions());
    }
  }, [dispatch, userEmail]);

  const aggregateData = (txs: Transaction[]) => {
    if (!txs || !userEmail) {
      logger.debug('exchange', 'No transactions or user email available for chart:', { transactions: txs, userEmail });
      return [];
    }

    // Filter transactions for the current user
    const userTransactions = txs.filter(tx => tx.user_email === userEmail);
    logger.debug('exchange', 'Filtered transactions for chart:', {
      totalTransactions: txs.length,
      userTransactions: userTransactions.length,
      userEmail
    });

    const now = new Date();
    const currentYear = now.getFullYear();
    
    const filteredTxs = userTransactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      
      if (timeFilter === 'week') {
        // Get transactions from the last 7 days
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return txDate >= weekAgo && txDate <= now;
      } else if (timeFilter === 'month') {
        // Get transactions from the current month
        return txDate.getMonth() === now.getMonth() && 
               txDate.getFullYear() === currentYear;
      } else {
        // Year view - get all transactions from current year
        return txDate.getFullYear() === currentYear;
      }
    });

    if (timeFilter === 'week') {
      // For week view, group by day
      const dailyData: { [key: string]: { deposits: number; withdrawals: number } } = {};
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      
      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayName = days[date.getDay()];
        dailyData[dayName] = { deposits: 0, withdrawals: 0 };
      }

      filteredTxs.forEach(tx => {
        const txDate = new Date(tx.timestamp);
        const dayName = days[txDate.getDay()];
        const amount = tx.amount;

        if (tx.transaction_type === 'deposit') {
          dailyData[dayName].deposits += amount;
        } else if (tx.transaction_type === 'withdrawal') {
          dailyData[dayName].withdrawals += amount;
        }
      });

      return Object.entries(dailyData).map(([day, data]) => ({
        month: day,
        deposits: data.deposits,
        withdrawals: data.withdrawals,
      }));
    } else if (timeFilter === 'month') {
      const monthlyData: { [key: string]: { deposits: number; withdrawals: number } } = {};
      const daysInMonth = new Date(currentYear, now.getMonth() + 1, 0).getDate();
      
      for (let i = 1; i <= daysInMonth; i++) {
        monthlyData[i.toString()] = { deposits: 0, withdrawals: 0 };
      }

      filteredTxs.forEach(tx => {
        const txDate = new Date(tx.timestamp);
        const day = txDate.getDate().toString();
        const amount = tx.amount;

        if (tx.transaction_type === 'deposit') {
          monthlyData[day].deposits += amount;
        } else if (tx.transaction_type === 'withdrawal') {
          monthlyData[day].withdrawals += amount;
        }
      });

      return Object.entries(monthlyData).map(([day, data]) => ({
        month: day,
        deposits: data.deposits,
        withdrawals: data.withdrawals,
      }));
    } else {
    
      const yearlyData: { [key: string]: { deposits: number; withdrawals: number } } = {};
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Initialize all months
      monthNames.forEach(month => {
        yearlyData[month] = { deposits: 0, withdrawals: 0 };
      });

      filteredTxs.forEach(tx => {
        const txDate = new Date(tx.timestamp);
        const monthName = monthNames[txDate.getMonth()];
        const amount = tx.amount;

        if (tx.transaction_type === 'deposit') {
          yearlyData[monthName].deposits += amount;
        } else if (tx.transaction_type === 'withdrawal') {
          yearlyData[monthName].withdrawals += amount;
        }
      });

      return monthNames.map(month => ({
        month,
        deposits: yearlyData[month].deposits,
        withdrawals: yearlyData[month].withdrawals,
      }));
    }
  };

  const chartData = transactions ? aggregateData(transactions) : [];
  const depositsChartData = chartData.map(item => ({ month: item.month, value: item.deposits }));
  const withdrawalsChartData = chartData.map(item => ({ month: item.month, value: item.withdrawals }));

  // Calculate max Y-axis value dynamically
  const allChartValues = [...depositsChartData, ...withdrawalsChartData].map(item => item.value);
  const maxDataValue = Math.max(...allChartValues, 0); // Ensure it's at least 0

  let maxYAxis = maxDataValue * 1.3; // Add 30% padding

  // Round up to a visually appropriate number based on magnitude
  if (maxYAxis < 1000) {
    maxYAxis = Math.ceil(maxYAxis / 100) * 100; 
  } else if (maxYAxis < 10000) {
    maxYAxis = Math.ceil(maxYAxis / 500) * 500;
  } else {
    maxYAxis = Math.ceil(maxYAxis / 1000) * 1000;
  }
  // Ensure a minimum non-zero maxYAxis if all values are zero
  if (maxYAxis === 0 && maxDataValue === 0) {
    maxYAxis = 100;
  }

  const renderChart = () => {
    if (loading) {
      return (
        <div className="w-full h-full flex items-center justify-center text-white">
          Loading chart data...
        </div>
      );
    }
    if (activeTab === 'All') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{top: 20, right: 30, left: 0, bottom: 32}}>
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
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : `${value}`}
              domain={[0, maxYAxis]}
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
          <AreaChart data={depositsChartData}>
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
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : `${value}`}
              domain={[0, maxYAxis]}
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
          <AreaChart data={withdrawalsChartData}>
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
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : `${value}`}
              domain={[0, maxYAxis]}
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
          <div className="flex gap-2">
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
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-sm capitalize">{timeFilter}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>
          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-[#2A2A32] rounded-lg shadow-lg py-1 z-10">
              {(['week', 'month', 'year'] as TimeFilterType[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setTimeFilter(filter);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-[#3A3A42] transition-colors ${
                    timeFilter === filter ? 'text-[#1D8751]' : 'text-gray-400'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="h-64 sm:h-70">
        {renderChart()}
      </div>
    </div>
  );
};

export default TransactionOverviewChart;