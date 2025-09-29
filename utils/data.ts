import { TransactionType } from "@/features/p2p/types";

export const navItems = [
  {
    labelKey: "navigation.dashboard",
    icon: "https://res.cloudinary.com/pitz/image/upload/v1747237691/svgexport-54_1_ldjke6.png",
    href: "/dashboard",
  },
  {
    labelKey: "navigation.express",
    icon: "https://res.cloudinary.com/pitz/image/upload/v1752243765/Vector_2_xauedx.png",
    href: "/dashboard/express-exchange",
  },
  // {
  //   labelKey: "navigation.exchange",
  //   icon: "https://res.cloudinary.com/pitz/image/upload/v1747237692/uil_exchange_tavqwx.png",
  //   href: "/dashboard/exchange",
  // },
  {
    labelKey: "navigation.p2pTrading",
    icon: "https://res.cloudinary.com/pitz/image/upload/v1747237692/users-profiles-left_e2oejc.png",
    href: "/dashboard/p2p",
  },
  {
    labelKey: "navigation.swapCrypto",
    icon: "https://res.cloudinary.com/pitz/image/upload/v1747237691/Group_164002_fgt2kf.png",
    href: "/dashboard/swap",
  },
  // {
  //   labelKey: "navigation.buyCrypto",
  //   icon: "https://res.cloudinary.com/pitz/image/upload/v1747237691/Group_164004_m9zmz3.png",
  //   href: "/dashboard/buy",
  // },
  {
    labelKey: "navigation.account",
    icon: "https://res.cloudinary.com/pitz/image/upload/v1747237692/users-profiles-left_e2oejc.png",
    href: "/dashboard/account",
  },
  // {
  //   labelKey: "navigation.settings",
  //   icon: "https://res.cloudinary.com/pitz/image/upload/v1747237691/settings_hi7ckx.png",
  //   href: "/dashboard/settings",
  // },
];

export const transactions: (TransactionType & { when: string })[] = [
  {
    id: "1",
    asset: "Bitcoin",
    assetSymbol: "BTC",
    type: "Withdrawal",
    amount: "-29,799.28",
    when: "1 min ago",
    date: "",
    status: "Completed",
    payment: {
      bank: "Salam Bank",
      logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg",
    },
  },
  {
    id: "2",
    asset: "Bitcoin",
    assetSymbol: "BTC",
    type: "Deposit",
    amount: "+29,799.28",
    when: "1 min ago",
    date: "",
    status: "Completed",
    payment: {
      bank: "Salam Bank",
      logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg",
    },
  },
  {
    id: "3",
    asset: "Bitcoin",
    assetSymbol: "BTC",
    type: "P2P Buy",
    amount: "+29,799.28",
    when: "1 min ago",
    date: "",
    status: "Completed",
    payment: {
      bank: "Salam Bank",
      logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg",
    },
  },
  {
    id: "4",
    asset: "Bitcoin",
    assetSymbol: "BTC",
    type: "Withdrawal",
    amount: "-29,799.28",
    when: "1 min ago",
    date: "",
    status: "Completed",
    payment: {
      bank: "Salam Bank",
      logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg",
    },
  },
  {
    id: "5",
    asset: "Bitcoin",
    assetSymbol: "BTC",
    type: "P2P Sell",
    amount: "-29,799.28",
    when: "1 min ago",
    date: "",
    status: "Completed",
    payment: {
      bank: "Salam Bank",
      logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg",
    },
  },
  {
    id: "6",
    asset: "Bitcoin",
    assetSymbol: "BTC",
    type: "Deposit",
    amount: "+29,799.28",
    when: "1 min ago",
    date: "",
    status: "Completed",
    payment: {
      bank: "Salam Bank",
      logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg",
    },
  },
  {
    id: "7",
    asset: "Bitcoin",
    assetSymbol: "BTC",
    type: "Withdrawal",
    amount: "-29,799.28",
    when: "1 min ago",
    date: "",
    status: "Completed",
    payment: {
      bank: "Salam Bank",
      logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg",
    },
  },
  {
    id: "8",
    asset: "Bitcoin",
    assetSymbol: "BTC",
    type: "P2P Sell",
    amount: "-29,799.28",
    when: "1 min ago",
    date: "",
    status: "Completed",
    payment: {
      bank: "Salam Bank",
      logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg",
    },
  },
];

export const volumeData = [
  { title: "My Total Volume", value: "10 M +" },
  { title: "Exchange", value: "1 M +" },
  { title: "P2P Volume", value: "1 M +" },
  { title: "Swap", value: "20 K +" },
  { title: "Buy", value: "20 K +" },
];
