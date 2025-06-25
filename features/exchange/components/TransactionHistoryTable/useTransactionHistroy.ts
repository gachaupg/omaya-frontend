import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/store';
import { fetchTransactions, searchTransactions } from '@/features/exchange/slices/exchangeSlice';
import type { Transaction } from '@/features/exchange/types';
import { storage } from '@/features/auth/utils/storage';
import { RootState } from '@/store/rootReducer';

export function useTransactionHistory() {
  const dispatch = useDispatch<AppDispatch>();
  const { transactions, loading, error } = useSelector((state: RootState) => state.exchange);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const itemsPerPage = 5;

  useEffect(() => {
    const profile = storage.getProfile();
    const email = profile?.user?.email || "";
    setUserEmail(email);
  }, []);

  useEffect(() => {
    if (userEmail) {
      dispatch(fetchTransactions());
    }
  }, [dispatch, userEmail]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery && userEmail) {
        dispatch(searchTransactions({ 
          search: searchQuery, 
          page: currentPage,
        }));
      } else if (userEmail) {
        dispatch(fetchTransactions());
      }
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, currentPage, dispatch, userEmail]);

  const handleEyeClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsReceiptModalOpen(true);
  };

  const closeModal = () => {
    setIsReceiptModalOpen(false);
    setSelectedTransaction(null);
  };

  const getFilteredTransactions = (): Transaction[] => {
    if (!transactions || !userEmail) return [];
    return transactions.filter((tx: Transaction) => tx.user_email === userEmail);
  };

  const filteredTransactions = getFilteredTransactions();
  const currentTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return {
    loading,
    error,
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    isReceiptModalOpen,
    setIsReceiptModalOpen,
    selectedTransaction,
    setSelectedTransaction,
    handleEyeClick,
    closeModal,
    filteredTransactions,
    currentTransactions,
    itemsPerPage,
  };
}
