/**
 * Skeletons.tsx - Reusable loading skeleton components
 *
 * These provide immediate visual feedback while data is loading,
 * dramatically improving perceived performance.
 *
 * Usage: Show skeleton while loading, replace with actual component when data arrives
 */

import React from "react";

/**
 * Base Skeleton component with animation
 */
const SkeletonBase = ({ className }: { className?: string }) => (
  <div
    className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg ${className || ""}`}
  />
);

/**
 * Wallet Card Skeleton - Used in P2P and other pages
 */
export const WalletSkeleton = () => (
  <div className="w-full p-6 bg-white dark:bg-[#1D1D23] rounded-lg border dark:border-[#35353E] border-gray-200">
    <div className="animate-pulse space-y-4">
      {/* Title */}
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>

      {/* Balance Section */}
      <div className="flex justify-between items-center">
        <div className="space-y-2 flex-1">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
      </div>
    </div>
  </div>
);

/**
 * Chart Skeleton - Used for all chart components
 */
export const ChartSkeleton = ({ height = "h-64" }: { height?: string }) => (
  <div
    className={`w-full p-6 bg-white dark:bg-[#1D1D23] rounded-lg border dark:border-[#35353E] border-gray-200`}
  >
    <div className="animate-pulse space-y-4">
      {/* Chart Title */}
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>

      {/* Chart Area */}
      <div className={`bg-gray-200 dark:bg-gray-700 rounded ${height}`}>
        {/* Simulated chart bars */}
        <div className="flex items-end justify-around h-full p-4">
          {[40, 70, 50, 90, 60, 80, 55].map((height, i) => (
            <div
              key={i}
              className="bg-gray-300 dark:bg-gray-600 rounded-t w-8"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      </div>
    </div>
  </div>
);

/**
 * Table Skeleton - Used for transaction tables, order tables, etc.
 */
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="w-full p-6 bg-white dark:bg-[#1D1D23] rounded-lg border dark:border-[#35353E] border-gray-200">
    <div className="animate-pulse space-y-3">
      {/* Table Header */}
      <div className="flex gap-4 pb-3 border-b dark:border-gray-700 border-gray-200">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      </div>

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Card Skeleton - Generic card skeleton for stats, info cards, etc.
 */
export const CardSkeleton = () => (
  <div className="w-full p-6 bg-white dark:bg-[#1D1D23] rounded-lg border dark:border-[#35353E] border-gray-200">
    <div className="animate-pulse space-y-3">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </div>
  </div>
);

/**
 * User Profile Skeleton - For user cards
 */
export const UserProfileSkeleton = () => (
  <div className="w-full p-6 bg-white dark:bg-[#1D1D23] rounded-lg border dark:border-[#35353E] border-gray-200">
    <div className="animate-pulse">
      <div className="flex items-center space-x-4">
        {/* Avatar */}
        <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>

        {/* Info */}
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Form Skeleton - For loading forms
 */
export const FormSkeleton = () => (
  <div className="w-full p-6 bg-white dark:bg-[#1D1D23] rounded-lg border dark:border-[#35353E] border-gray-200">
    <div className="animate-pulse space-y-4">
      {/* Form Fields */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      ))}

      {/* Submit Button */}
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
    </div>
  </div>
);

/**
 * Page Layout Skeleton - Full page loading state
 */
export const PageSkeleton = () => (
  <div className="space-y-6 p-4">
    <UserProfileSkeleton />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CardSkeleton />
      <CardSkeleton />
    </div>
    <ChartSkeleton />
    <TableSkeleton />
  </div>
);

/**
 * Minimal Spinner - For inline loading states
 */
export const Spinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-[#1D8751]`}
      />
    </div>
  );
};

/**
 * Loading Overlay - For when entire section is loading
 */
export const LoadingOverlay = ({ message }: { message?: string }) => (
  <div className="absolute inset-0 bg-white/80 dark:bg-[#1D1D23]/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-lg">
    <Spinner size="lg" />
    {message && (
      <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">{message}</p>
    )}
  </div>
);

/**
 * Stale Data Indicator - Shows when displaying cached data while refetching
 */
export const StaleDataIndicator = () => (
  <div className="absolute top-2 right-2 z-10">
    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-full">
      <Spinner size="sm" />
      <span className="text-xs text-yellow-800 dark:text-yellow-300">
        Refreshing...
      </span>
    </div>
  </div>
);

/**
 * P2P Market Table Skeleton - For market transactions
 */
export const P2PMarketTableSkeleton = ({ rows = 8 }: { rows?: number }) => (
  <div className="w-full bg-white dark:bg-[#18181D] rounded-lg border dark:border-[#35353E] border-gray-200 p-4">
    <div className="animate-pulse space-y-3">
      {/* Search and Filters */}
      <div className="flex gap-2 mb-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-6 gap-4 pb-3 border-b dark:border-gray-700 border-gray-200">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
          ></div>
        ))}
      </div>

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-6 gap-4 py-3 items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
          </div>
          {[1, 2, 3, 4, 5].map((j) => (
            <div
              key={j}
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
            ></div>
          ))}
        </div>
      ))}

      {/* Pagination */}
      <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700 border-gray-200">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"
            ></div>
          ))}
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      </div>
    </div>
  </div>
);

/**
 * Chat Skeleton - For P2P chat interface
 */
export const ChatSkeleton = () => (
  <div className="w-full h-96 bg-white dark:bg-[#18181D] rounded-lg border dark:border-[#35353E] border-gray-200 p-4">
    <div className="animate-pulse h-full flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center gap-3 pb-3 border-b dark:border-gray-700 border-gray-200">
        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 py-4">
        {/* Received message */}
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
        </div>

        {/* Sent message */}
        <div className="flex gap-2 justify-end">
          <div className="flex-1 space-y-2 flex flex-col items-end">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
        </div>

        {/* Another received message */}
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-2/3"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex gap-2 pt-3 border-t dark:border-gray-700 border-gray-200">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
    </div>
  </div>
);

/**
 * Trade Card Skeleton - For matched trades, order cards
 */
export const TradeCardSkeleton = () => (
  <div className="w-full p-6 bg-white dark:bg-[#1D1D23] rounded-lg border dark:border-[#35353E] border-gray-200">
    <div className="animate-pulse space-y-4">
      {/* Header with avatar and status */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        </div>
        <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>

      {/* Trade Details */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
      </div>
    </div>
  </div>
);

/**
 * Dashboard Stats Grid Skeleton - For dashboard overview
 */
export const DashboardStatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="p-6 bg-white dark:bg-[#1D1D23] rounded-lg border dark:border-[#35353E] border-gray-200"
      >
        <div className="animate-pulse space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        </div>
      </div>
    ))}
  </div>
);

/**
 * Exchange Form Skeleton - For deposit/withdraw forms
 */
export const ExchangeFormSkeleton = () => (
  <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-[#1D1D23] rounded-lg border dark:border-[#35353E] border-gray-200">
    <div className="animate-pulse space-y-6">
      {/* Title */}
      <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>

      {/* Asset Selection */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
      </div>

      {/* Network Selection */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 bg-gray-200 dark:bg-gray-700 rounded"
            ></div>
          ))}
        </div>
      </div>

      {/* Address Input */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      </div>

      {/* Submit Button */}
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>

      {/* Summary Section */}
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * Swap Widget Skeleton - For swap interface
 */
export const SwapWidgetSkeleton = () => (
  <div className="w-full max-w-lg mx-auto p-6 bg-white dark:bg-[#1D1D23] rounded-lg border dark:border-[#35353E] border-gray-200">
    <div className="animate-pulse space-y-4">
      {/* Title */}
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>

      {/* From Token */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        </div>
      </div>

      {/* Swap Arrow */}
      <div className="flex justify-center">
        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>

      {/* To Token */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        </div>
      </div>

      {/* Exchange Rate */}
      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      </div>

      {/* Swap Button */}
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
    </div>
  </div>
);

/**
 * Orders List Skeleton - For order history
 */
export const OrdersListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="w-full p-4 bg-white dark:bg-[#1D1D23] rounded-lg border dark:border-[#35353E] border-gray-200"
      >
        <div className="animate-pulse">
          <div className="flex justify-between items-start mb-3">
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="space-y-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
);

/**
 * Market Overview Skeleton - For P2P dashboard overview
 */
export const MarketOverviewSkeleton = () => (
  <div className="space-y-4">
    {/* Quick Stats */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="p-4 bg-white dark:bg-[#1D1D23] rounded-lg border dark:border-[#35353E] border-gray-200"
        >
          <div className="animate-pulse space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>

    {/* Charts Section */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ChartSkeleton height="h-48" />
      <ChartSkeleton height="h-48" />
    </div>

    {/* Recent Activity */}
    <OrdersListSkeleton count={3} />
  </div>
);

/**
 * Settings Page Skeleton - For account settings
 */
export const SettingsPageSkeleton = () => (
  <div className="space-y-6">
    {/* Profile Section */}
    <div className="p-6 bg-white dark:bg-[#1D1D23] rounded-lg border dark:border-[#35353E] border-gray-200">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>

    {/* Settings Sections */}
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="p-6 bg-white dark:bg-[#1D1D23] rounded-lg border dark:border-[#35353E] border-gray-200"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          {[1, 2].map((j) => (
            <div key={j} className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

/**
 * Transaction History Skeleton - For exchange transactions
 */
export const TransactionHistorySkeleton = ({ rows = 6 }: { rows?: number }) => (
  <div className="w-full bg-white dark:bg-[#18181D] rounded-lg border dark:border-[#35353E] border-gray-200">
    <div className="animate-pulse">
      {/* Header with filters */}
      <div className="p-4 border-b dark:border-gray-700 border-gray-200">
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"
            ></div>
          ))}
        </div>
      </div>

      {/* Transaction Items */}
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700 border-gray-200"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="space-y-1 flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="space-y-1">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * P2P Dashboard Skeleton - Complete P2P dashboard loading state
 */
export const P2PDashboardSkeleton = () => (
  <div className="space-y-6">
    {/* User Card */}
    <UserProfileSkeleton />

    {/* Wallet + Quick Actions */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <WalletSkeleton />
      </div>
      <CardSkeleton />
    </div>

    {/* Stats */}
    <DashboardStatsSkeleton />

    {/* Charts */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ChartSkeleton height="h-64" />
      <ChartSkeleton height="h-64" />
    </div>

    {/* Recent Trades */}
    <OrdersListSkeleton count={3} />
  </div>
);

/**
 * Inline Skeleton - For small inline loading states
 */
export const InlineSkeleton = ({ width = "w-20" }: { width?: string }) => (
  <div
    className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${width} animate-pulse`}
  ></div>
);
