'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { fetchExchangeStatistics } from '@/features/exchange/slices/exchangeSlice';
import { fetchWallets } from '@/features/p2p/slices/walletSlice';

/**
 * Hook to fetch and calculate total pending, balance, and available balance
 * @returns {object} Object containing total, balance, availableBalance, loading, and error
 */
export const usePendingTotal = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { statistics, loading: exchangeLoading, error: exchangeError } = useSelector(
    (state: RootState) => state.exchange
  );
  const { data: wallets, loading: walletLoading } = useSelector(
    (state: RootState) => state.wallets
  );

  useEffect(() => {
    // Fetch statistics and wallets on mount
    dispatch(fetchExchangeStatistics());
    dispatch(fetchWallets());
  }, [dispatch]);

  // Get USDT wallet balance
  const balance = wallets?.wallet?.currency === "USDT" 
    ? parseFloat(wallets.wallet.balance) 
    : 0;

  // Calculate total pending (for display): pending exchange withdrawals + pending sell orders
  const total = 
    (statistics?.total_pending_p2p_withdrawals || 0) + 
    (statistics?.total_sell_orders_by_status?.pending || 0);

  // Calculate total locked amount (for available balance):
  // Exchange withdrawals + Sell orders + P2P withdrawals
  const totalLocked = 
    (statistics?.total_pending_p2p_withdrawals|| 0) + 
    (statistics?.total_sell_orders_by_status?.pending || 0) 

  // Calculate available balance: balance - all locked funds
  const availableBalance = balance - totalLocked;

  const loading = exchangeLoading || walletLoading;
  const error = exchangeError;

  return {
    total,              // Exportable: Pending exchange withdrawals + pending sell orders
    balance,            // Exportable: Wallet balance (USDT)
    availableBalance,   // Exportable: Balance - all locked funds (exchange withdrawals + sell orders + p2p withdrawals)
    totalLocked,        // Exportable: Total locked amount
    loading,
    error,
    statistics,         // Full statistics object for additional data
  };
};

/**
 * Utility function to calculate pending total from statistics object
 * @param statistics - ExchangeStatistics object
 * @returns {number} Total of pending exchange withdrawals and pending sell orders
 */
export const calculatePendingTotal = (
  statistics: any
): number => {
  return (
    (statistics?.total_pending_exchange_withdrawals || 0) + 
    (statistics?.total_sell_orders_by_status?.pending || 0)
  );
};

/**
 * Component to display the pending total, balance, and available balance
 */
export const PendingTotal = () => {
  const { total, balance, availableBalance, loading, error } = usePendingTotal();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-2">
      <div>
        <strong>Total Pending:</strong> {total.toFixed(3)}
      </div>
      <div>
        <strong>Balance:</strong> {balance.toFixed(3)}
      </div>
      <div>
        <strong>Available Balance:</strong> {availableBalance.toFixed(3)}
      </div>
    </div>
  );
};

/**
 * Hook to get just the balance as a number (exportable)
 */
export const useBalance = (): number => {
  const { balance } = usePendingTotal();
  return balance;
};

/**
 * Hook to get just the available balance as a number (exportable)
 */
export const useAvailableBalance = (): number => {
  const { availableBalance } = usePendingTotal();
  return availableBalance;
};

/**
 * Hook to get just the pending total as a number (exportable)
 */
export const usePendingTotalAsNumber = (): number => {
  const { total } = usePendingTotal();
  return total;
};

