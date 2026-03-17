// Dummy data for Exchange Dashboard
export const userInfo = {
  name: "Omar Ali",
  userId: "383672684",
  userType: "Individual",
  profileImage: "/avatar.png",
  verified: true,
};

export const favouriteAssets = [
  {
    asset_id: '1',
    symbol: "BTC",
    description: "Bitcoin",
    asset_image: "/assets/TRC20_ffibtg.png",
    price: 32349,
    network: "BITCOIN",
    isFavourite: true,
  },
  {
    asset_id: '2',
    symbol: "ETH",
    description: "Ethereum",
    asset_image: "/assets/TRC20_ffibtg.png",
    price: 3559.28,
    network: "ETHEREUM",
    isFavourite: false,
  },
  {
    asset_id: '3',
    symbol: "TRX",
    description: "Tron",
    asset_image: "/assets/TRC20_ffibtg.png",
    price: 0.002,
    network: "TRON",
    isFavourite: false,
  },
  {
    asset_id: '4',
    symbol: "USDT",
    description: "Tether (USDT)",
    asset_image: "/assets/TRC20_ffibtg.png",
    price: 0.99,
    network: "TRON",
    isFavourite: true,
  },
];

const chartData = [
  { name: "JAN", deposits: 1000, withdrawals: 1200 },
  { name: "FEB", deposits: 2000, withdrawals: 1800 },
  { name: "MAR", deposits: 5000, withdrawals: 3000 },
  { name: "APR", deposits: 3000, withdrawals: 4000 },
  { name: "MAY", deposits: 2000, withdrawals: 3000 },
  { name: "JUN", deposits: 4000, withdrawals: 2000 },
  { name: "JUL", deposits: 3500, withdrawals: 4500 },
  { name: "AUG", deposits: 5000, withdrawals: 3000 },
  { name: "SEP", deposits: 2500, withdrawals: 4500 },
  { name: "OCT", deposits: 4000, withdrawals: 3000 },
  { name: "NOV", deposits: 5000, withdrawals: 2000 },
  { name: "DEC", deposits: 6000, withdrawals: 3500 },
]

export const transactionHistory = [
  { id: 454432, type: "Deposit", date: "12-Jan-2023", amount: "+420", status: "New", asset: "BTC" },
  { id: 454432, type: "Withdrawal", date: "12-Jan-2023", amount: "-420 ", status: "New", asset: "BTC" },
  { id: 454432, type: "Withdrawal", date: "12-Jan-2023", amount: "-420", status: "New", asset: "BTC" },
  { id: 454432, type: "Deposit", date: "12-Jan-2023", amount: "+420", status: "New", asset: "BTC" },
];

export const overviewTotal = {
  total: 35000,
  deposits: 25000,
  withdrawals: 8000,
  inProgress: 4000,
  exchange: 1400,
};

export const exchangeDeposit = {
  total: 30000,
  completed: 20000,
  inEscrow: 10000,
};

export const exchangeWithdraw = {
  total: 5000,
  completed: 4000,
  inEscrow: 1000,
}; 