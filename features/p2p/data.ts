/**
 * Static data for P2P feature
 */
import { Tab, TransactionType } from "./types";

// P2P navigation tabs
export const p2pTabs: Tab[] = [
  { id: "dashboard", label: "tabs.dashboard", path: "/p2p/dashboard" },
  { id: "market", label: "tabs.market", path: "/p2p/market" },
  { id: "orders", label: "tabs.orders", path: "/p2p/orders" },
  { id: "center", label: "tabs.center", path: "/p2p/center" },
  { id: "chats", label: "Chats", path: "/p2p/chats" },
];

// Transaction overview data
export const transactionData1 = {
  total: 35000,
  deposits: 25000,
  withdrawals: 8000,
  inProgress: 4000,
  p2p: 1400,
};

// Asset balance data
export const assetBalances = [
  {
    symbol: "USDT",
    name: "Tether US",
    available: 0.1234,
    locked: 0.1234,
    icon: "tether",
  },
  // Add more assets as needed
];

// P2P transaction data
export const p2pTransactions = [
  {
    id: "454432",
    type: "P2P Buy",
    date: "12-Jun-2023",
    amount: "+1002",
    status: "New",
    asset: "Bitcoin",
    assetSymbol: "BTC",
  },
  {
    id: "454432",
    type: "P2P Sell",
    date: "12-Jun-2023",
    amount: "-420",
    status: "New",
    asset: "Bitcoin",
    assetSymbol: "BTC",
  },
  {
    id: "454432",
    type: "P2P Sell",
    date: "12-Jun-2023",
    amount: "-420",
    status: "New",
    asset: "Bitcoin",
    assetSymbol: "BTC",
  },
  {
    id: "454432",
    type: "P2P Buy",
    date: "12-Jun-2023",
    amount: "+420",
    status: "New",
    asset: "Bitcoin",
    assetSymbol: "BTC",
  },
];

// Market table data for the market view
export const marketTableData = [
  {
    advertiser: "Advertiser User Name",
    orders: 120,
    completion: "98.32%",
    online: true,
    commission: "0.5%",
    available: "1,200 USDT",
    limit: "100-1,000 USD",
    payment: ["Sadam Bank"],
  },
  {
    advertiser: "Advertiser User Name",
    orders: 120,
    completion: "98.32%",
    online: true,
    commission: "0.8%",
    available: "1,200 USDT",
    limit: "100-1,000 USD",
    payment: ["Sadam Bank", "Premier Bank", "Dohaboshi Bank", "Amal Bank"],
  },
  {
    advertiser: "Advertiser User Name",
    orders: 120,
    completion: "98.32%",
    online: true,
    commission: "0.8%",
    available: "1,200 USDT",
    limit: "100-1,000 USD",
    payment: ["Sadam Bank", "Dohaboshi Bank"],
  },
  {
    advertiser: "Advertiser User Name",
    orders: 120,
    completion: "98.32%",
    online: true,
    commission: "0.5%",
    available: "1,200 USDT",
    limit: "100-1,000 USD",
    payment: ["Sadam Bank"],
  },
  {
    advertiser: "Advertiser User Name",
    orders: 120,
    completion: "98.32%",
    online: true,
    commission: "0.8%",
    available: "1,200 USDT",
    limit: "100-1,000 USD",
    payment: ["Sadam Bank", "Premier Bank", "Dohaboshi Bank"],
  },
  {
    advertiser: "Advertiser User Name",
    orders: 120,
    completion: "98.32%",
    online: true,
    commission: "0.8%",
    available: "1,200 USDT",
    limit: "100-1,000 USD",
    payment: ["Sadam Bank", "Dohaboshi Bank"],
  },
  {
    advertiser: "Advertiser User Name",
    orders: 120,
    completion: "98.32%",
    online: true,
    commission: "0.5%",
    available: "1,200 USDT",
    limit: "100-1,000 USD",
    payment: ["Sadam Bank", "Premier Bank"],
  },
  {
    advertiser: "Advertiser User Name",
    orders: 120,
    completion: "98.32%",
    online: true,
    commission: "0.8%",
    available: "1,200 USDT",
    limit: "100-1,000 USD",
    payment: ["Sadam Bank", "Dohaboshi Bank", "Premier Bank"],
  },
  {
    advertiser: "Advertiser User Name 2",
    orders: 110,
    completion: "90.20%",
    online: false,
    commission: "0.6%",
    available: "2,000 USDT",
    limit: "200-2,000 USD",
    payment: ["Amal Bank"],
  },
  {
    advertiser: "Advertiser User Name 3",
    orders: 95,
    completion: "95.00%",
    online: true,
    commission: "0.7%",
    available: "3,500 USDT",
    limit: "300-3,000 USD",
    payment: ["Premier Bank", "Amal Bank"],
  },
  {
    advertiser: "Advertiser User Name 4",
    orders: 80,
    completion: "85.00%",
    online: false,
    commission: "0.9%",
    available: "900 USDT",
    limit: "50-900 USD",
    payment: ["Dohaboshi Bank"],
  },
  {
    advertiser: "Advertiser User Name 5",
    orders: 150,
    completion: "99.00%",
    online: true,
    commission: "0.4%",
    available: "5,000 USDT",
    limit: "500-5,000 USD",
    payment: ["Sadam Bank", "Premier Bank"],
  },
  {
    advertiser: "Advertiser User Name 6",
    orders: 60,
    completion: "80.00%",
    online: false,
    commission: "1.0%",
    available: "600 USDT",
    limit: "60-600 USD",
    payment: ["Amal Bank", "Dohaboshi Bank"],
  },
  {
    advertiser: "Advertiser User Name 7",
    orders: 200,
    completion: "100.00%",
    online: true,
    commission: "0.3%",
    available: "10,000 USDT",
    limit: "1,000-10,000 USD",
    payment: ["Premier Bank"],
  },
  {
    advertiser: "Advertiser User Name 8",
    orders: 70,
    completion: "88.00%",
    online: false,
    commission: "0.85%",
    available: "850 USDT",
    limit: "85-850 USD",
    payment: ["Sadam Bank", "Amal Bank"],
  },
  {
    advertiser: "Advertiser User Name 9",
    orders: 130,
    completion: "92.00%",
    online: true,
    commission: "0.65%",
    available: "1,300 USDT",
    limit: "130-1,300 USD",
    payment: ["Dohaboshi Bank", "Premier Bank"],
  },
];

// Order status tabs for Filters
export const orderStatusTabs: Array<{ id: string; label: string; count?: number }> = [
  { id: "all", label: "All Orders" },
  { id: "completed", label: "Completed" },
  { id: "processing", label: "Processing" },
  { id: "canceled", label: "Canceled" },
];

// Token options for Filters
export const tokenOptions = [
  { value: "usdt", label: "Tether", icon: "tether" },
  // Add more tokens as needed
];
// Currency options for Filters
export const currencyOptions = [
  { value: "usdt", label: "USDT" },
  // Add more currencies as needed
];

// Type options for Filters
export const typeOptions = [
  { value: "all", label: "All" },
  { value: "buy", label: "Buy" },
  { value: "sell", label: "Sell" },
];

// Status options for Filters
export const statusOptions = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "processing", label: "Processing" },
  { value: "canceled", label: "Canceled" },
];

// Date options for Filters
export const dateOptions = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "custom", label: "Custom Range" },
];

// P2P transaction history data
export const transactionData: TransactionType[] = [
  {
    id: "1",
    asset: "Bitcoin",
    assetSymbol: "BTC",
    type: "Buy",
    amount: "+1000",
    date: "2024-03-20",
    status: "Completed",
    payment: {
      bank: "Bank A",
      logo: "",
    },
  },
  {
    id: "1",
    asset: "Bitcoin",
    assetSymbol: "BTC",
    type: "Buy",
    amount: "+1000",
    date: "2024-03-20",
    status: "Completed",
    payment: {
      bank: "Bank A",
      logo: "",
    },
  },
  {
    id: "1",
    asset: "Bitcoin",
    assetSymbol: "BTC",
    type: "Buy",
    amount: "+1000",
    date: "2024-03-20",
    status: "Completed",
    payment: {
      bank: "Bank A",
      logo: "",
    },
  },
  {
    id: "1",
    asset: "Bitcoin",
    assetSymbol: "BTC",
    type: "Buy",
    amount: "+1000",
    date: "2024-03-20",
    status: "Completed",
    payment: {
      bank: "Bank A",
      logo: "",
    },
  },
];

// Orders transactions data// P2P transaction history data
export const ordersTransactionsData: TransactionType[] = [
  {
    id: "100001",
    type: "Buy",
    date: "12-Jun-2023 15:02",
    amount: "+120",
    status: "Completed",
    asset: "USDT",
    assetSymbol: "USDT",
    rate: "0.89",
    payment: {
      bank: "Salam Bank",
      logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg",
    },
  },
  {
    id: "100002",
    type: "Sell",
    date: "12-Jun-2023 15:02",
    amount: "-120",
    status: "Processing",
    asset: "USDT",
    assetSymbol: "USDT",
    rate: "0.89",
    payment: {
      bank: "Dahabshiil Bank",
      logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg",
    },
  },
  {
    id: "100003",
    type: "Buy",
    date: "12-Jun-2023 15:02",
    amount: "+120",
    status: "Canceled",
    asset: "USDT",
    assetSymbol: "USDT",
    rate: "0.89",
    payment: {
      bank: "Dahabshiil Bank",
      logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg",
    },
  },
  {
    id: "100001",
    type: "Buy",
    date: "12-Jun-2023 15:02",
    amount: "+120",
    status: "Completed",
    asset: "USDT",
    assetSymbol: "USDT",
    rate: "0.89",
    payment: {
      bank: "Salam Bank",
      logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg",
    },
  },
  {
    id: "100001",
    type: "Buy",
    date: "12-Jun-2023 15:02",
    amount: "+120",
    status: "Completed",
    asset: "USDT",
    assetSymbol: "USDT",
    rate: "0.89",
    payment: {
      bank: "Salam Bank",
      logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg",
    },
  },
  {
    id: "100001",
    type: "Buy",
    date: "12-Jun-2023 15:02",
    amount: "+120",
    status: "Completed",
    asset: "USDT",
    assetSymbol: "USDT",
    rate: "0.89",
    payment: {
      bank: "Salam Bank",
      logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg",
    },
  },
  {
    id: "100001",
    type: "Buy",
    date: "12-Jun-2023 15:02",
    amount: "+120",
    status: "Completed",
    asset: "USDT",
    assetSymbol: "USDT",
    rate: "0.89",
    payment: {
      bank: "Salam Bank",
      logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg",
    },
  },
  {
    id: "100001",
    type: "Buy",
    date: "12-Jun-2023 15:02",
    amount: "+120",
    status: "Completed",
    asset: "USDT",
    assetSymbol: "USDT",
    rate: "0.89",
    payment: {
      bank: "Salam Bank",
      logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg",
    },
  },
  {
    id: "100001",
    type: "Buy",
    date: "12-Jun-2023 15:02",
    amount: "+120",
    status: "Completed",
    asset: "USDT",
    assetSymbol: "USDT",
    rate: "0.89",
    payment: {
      bank: "Salam Bank",
      logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg",
    },
  },
  {
    id: "100001",
    type: "Buy",
    date: "12-Jun-2023 15:02",
    amount: "+120",
    status: "Completed",
    asset: "USDT",
    assetSymbol: "USDT",
    rate: "0.89",
    payment: {
      bank: "Salam Bank",
      logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg",
    },
  },
  // Add more sample entries as needed
];

export const overviewData = {
  total: 100000,
  deposits: 40000,
  withdrawals: 20000,
  inProgress: 15000,
  p2p: 25000,
};

export const p2pHistory: TransactionType[] = [
  {
    id: "1",
    asset: "Bitcoin",
    assetSymbol: "BTC",
    type: "Buy",
    amount: "+1000",
    date: "2024-03-20",
    status: "Completed",
    payment: {
      bank: "Bank A",
      logo: "",
    },
  },
  {
    id: "2",
    asset: "Ethereum",
    assetSymbol: "ETH",
    type: "Sell",
    amount: "-500",
    date: "2024-03-19",
    status: "Processing",
    payment: {
      bank: "Bank B",
      logo: "",
    },
  },
  {
    id: "3",
    asset: "Tether",
    assetSymbol: "USDT",
    type: "Buy",
    amount: "+2000",
    date: "2024-03-18",
    status: "Completed",
    payment: {
      bank: "Bank C",
      logo: "",
    },
  },
];

// Stats data for P2P Center
export const statsData = {
  trades: 120,
  completionRate: 98,
  avgReleaseTime: "1:22",
  avgPayTime: "2:56",
  rating: 99,
  totalVolume: 1200,
  currency: "USD",
};

// Feedback table data for P2P Center Feedback section
export const feedbackTableData: TransactionType[] = [
  {
    id: "1283989479421",
    type: "Buy",
    date: "12-Jun-2023 15:02",
    amount: "148.56",
    status: "Positive",
    asset: "Tether US",
    assetSymbol: "USDT",
    payment: { bank: "Salam Bank", logo: "/banks/salam.png" },
    username: "****Ali@gmail.com",
    rating: "Positive",
    comment: "View",
  },
  {
    id: "1283989479421",
    type: "Sell",
    date: "12-Jun-2023 15:02",
    amount: "148.56",
    status: "Positive",
    asset: "Tether US",
    assetSymbol: "USDT",
    payment: { bank: "Premier Bank", logo: "/banks/premier.png" },
    username: "****Ali@gmail.com",
    rating: "Positive",
    comment: "View",
  },
  {
    id: "1283989479421",
    type: "Buy",
    date: "12-Jun-2023 15:02",
    amount: "148.56",
    status: "Positive",
    asset: "Tether US",
    assetSymbol: "USDT",
    payment: { bank: "Dahabshiil Bank", logo: "/banks/dahabshiil.png" },
    username: "****Ali@gmail.com",
    rating: "Positive",
    comment: "View",
  },
  {
    id: "1283989479421",
    type: "Buy",
    date: "12-Jun-2023 15:02",
    amount: "148.56",
    status: "Positive",
    asset: "Tether US",
    assetSymbol: "USDT",
    payment: { bank: "Salam Bank", logo: "/banks/salam.png" },
    username: "****Ali@gmail.com",
    rating: "Positive",
    comment: "View",
  },
  {
    id: "1283989479421",
    type: "Buy",
    date: "12-Jun-2023 15:02",
    amount: "148.56",
    status: "Positive",
    asset: "Tether US",
    assetSymbol: "USDT",
    payment: { bank: "Salam Bank", logo: "/banks/salam.png" },
    username: "****Ali@gmail.com",
    rating: "Positive",
    comment: "View",
  },
  {
    id: "1283989479421",
    type: "Buy",
    date: "12-Jun-2023 15:02",
    amount: "148.56",
    status: "Positive",
    asset: "Tether US",
    assetSymbol: "USDT",
    payment: { bank: "Salam Bank", logo: "/banks/salam.png" },
    username: "****Ali@gmail.com",
    rating: "Positive",
    comment: "View",
  },
  {
    id: "1283989479421",
    type: "Buy",
    date: "12-Jun-2023 15:02",
    amount: "148.56",
    status: "Positive",
    asset: "Tether US",
    assetSymbol: "USDT",
    payment: { bank: "Salam Bank", logo: "/banks/salam.png" },
    username: "****Ali@gmail.com",
    rating: "Positive",
    comment: "View",
  },
];

export const ASSETS = [
  {
    label: "USDT Tether USDT",
    value: "usdt",
    icon: "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png",
  },
];
export const NETWORKS = [
  {
    label: "TRC 20 Tron",
    value: "trc20",
    icon: "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png",
  },
];
export const WALLET_TYPES = [
  {
    label: "USDT Wallet Address",
    value: "usdt_wallet",
    icon: "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png",
  },
];

export const NETWORK_FEE = 3;
