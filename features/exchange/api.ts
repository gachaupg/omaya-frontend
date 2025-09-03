/**
 * api.ts – auto‑generated placeholder
 */
import { TransactionSearchParams } from './types';

export const EXCHANGE_ENDPOINTS = {
    DEPOSITS: '/trading_engine/deposits/',
    WITHDRAWALS: '/trading_engine/withdraw/',
    ASSETS: '/administration/admin/fronted-all-asset-network-range/',
    FAVORITES:'/trading_engine/favorites/',
    ADDFAVORITE: '/trading_engine/favorites/',
    REMOVEFAVORITE: '/trading_engine/favorites/',
    STATISTICS: '/trading_engine/transactionsummaryview/',
    TRANSACTIONS: '/trading_engine/all-transactions/',
    TRANSACTIONSEARCH: (params: TransactionSearchParams) => {
        const queryParams = new URLSearchParams();
        if (params.search) queryParams.append('search', params.search);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.status) queryParams.append('status', params.status);
        if (params.transaction_type) queryParams.append('transaction_type', params.transaction_type);
        if (params.start_date) queryParams.append('start_date', params.start_date);
        if (params.end_date) queryParams.append('end_date', params.end_date);
        return `/trading_engine/all-transactions/?${queryParams.toString()}`;
    },
    // Deposit status endpoint
    DEPOSIT_STATUS: (transactionId: string) => `/deposits/${transactionId}/`,
    // Update deposit address endpoint
    UPDATE_DEPOSIT_ADDRESS: '/trading_engine/deposits/update-address/',
    // Payment
    PAYMENT_METHODS: '/payments/payment-methods/',
    PAYMENT_PROVIDERS: (methodName: string) => `/payments/payment-providers/${methodName}/`,
    USER_PAYMENT_DETAILS: '/payments/user-payment-details/',
    ADMIN_PAYMENT_DETAILS: '/payments/admin/payment-details/',
}