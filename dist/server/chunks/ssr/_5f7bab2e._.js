module.exports = {

"[project]/features/p2p/data.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Static data for P2P feature
 */ __turbopack_context__.s({
    "ASSETS": (()=>ASSETS),
    "NETWORKS": (()=>NETWORKS),
    "NETWORK_FEE": (()=>NETWORK_FEE),
    "WALLET_TYPES": (()=>WALLET_TYPES),
    "assetBalances": (()=>assetBalances),
    "currencyOptions": (()=>currencyOptions),
    "dateOptions": (()=>dateOptions),
    "feedbackTableData": (()=>feedbackTableData),
    "marketTableData": (()=>marketTableData),
    "orderStatusTabs": (()=>orderStatusTabs),
    "ordersTransactionsData": (()=>ordersTransactionsData),
    "overviewData": (()=>overviewData),
    "p2pHistory": (()=>p2pHistory),
    "p2pTabs": (()=>p2pTabs),
    "p2pTransactions": (()=>p2pTransactions),
    "statsData": (()=>statsData),
    "statusOptions": (()=>statusOptions),
    "tokenOptions": (()=>tokenOptions),
    "transactionData": (()=>transactionData),
    "transactionData1": (()=>transactionData1),
    "typeOptions": (()=>typeOptions)
});
const p2pTabs = [
    {
        id: "dashboard",
        label: "P2p Dashboard",
        path: "/p2p/dashboard"
    },
    {
        id: "market",
        label: "Market",
        path: "/p2p/market"
    },
    {
        id: "orders",
        label: "Orders",
        path: "/p2p/orders"
    },
    {
        id: "center",
        label: "P2P Center",
        path: "/p2p/center"
    }
];
const transactionData1 = {
    total: 35000,
    deposits: 25000,
    withdrawals: 8000,
    inProgress: 4000,
    p2p: 1400
};
const assetBalances = [
    {
        symbol: "USDT",
        name: "Tether US",
        available: 0.1234,
        locked: 0.1234,
        icon: "tether"
    }
];
const p2pTransactions = [
    {
        id: "454432",
        type: "P2P Buy",
        date: "12-Jun-2023",
        amount: "+1002",
        status: "New",
        asset: "Bitcoin",
        assetSymbol: "BTC"
    },
    {
        id: "454432",
        type: "P2P Sell",
        date: "12-Jun-2023",
        amount: "-420",
        status: "New",
        asset: "Bitcoin",
        assetSymbol: "BTC"
    },
    {
        id: "454432",
        type: "P2P Sell",
        date: "12-Jun-2023",
        amount: "-420",
        status: "New",
        asset: "Bitcoin",
        assetSymbol: "BTC"
    },
    {
        id: "454432",
        type: "P2P Buy",
        date: "12-Jun-2023",
        amount: "+420",
        status: "New",
        asset: "Bitcoin",
        assetSymbol: "BTC"
    }
];
const marketTableData = [
    {
        advertiser: "Advertiser User Name",
        orders: 120,
        completion: "98.32%",
        online: true,
        commission: "0.5%",
        available: "1,200 USDT",
        limit: "100-1,000 USD",
        payment: [
            "Sadam Bank"
        ]
    },
    {
        advertiser: "Advertiser User Name",
        orders: 120,
        completion: "98.32%",
        online: true,
        commission: "0.8%",
        available: "1,200 USDT",
        limit: "100-1,000 USD",
        payment: [
            "Sadam Bank",
            "Premier Bank",
            "Dohaboshi Bank",
            "Amal Bank"
        ]
    },
    {
        advertiser: "Advertiser User Name",
        orders: 120,
        completion: "98.32%",
        online: true,
        commission: "0.8%",
        available: "1,200 USDT",
        limit: "100-1,000 USD",
        payment: [
            "Sadam Bank",
            "Dohaboshi Bank"
        ]
    },
    {
        advertiser: "Advertiser User Name",
        orders: 120,
        completion: "98.32%",
        online: true,
        commission: "0.5%",
        available: "1,200 USDT",
        limit: "100-1,000 USD",
        payment: [
            "Sadam Bank"
        ]
    },
    {
        advertiser: "Advertiser User Name",
        orders: 120,
        completion: "98.32%",
        online: true,
        commission: "0.8%",
        available: "1,200 USDT",
        limit: "100-1,000 USD",
        payment: [
            "Sadam Bank",
            "Premier Bank",
            "Dohaboshi Bank"
        ]
    },
    {
        advertiser: "Advertiser User Name",
        orders: 120,
        completion: "98.32%",
        online: true,
        commission: "0.8%",
        available: "1,200 USDT",
        limit: "100-1,000 USD",
        payment: [
            "Sadam Bank",
            "Dohaboshi Bank"
        ]
    },
    {
        advertiser: "Advertiser User Name",
        orders: 120,
        completion: "98.32%",
        online: true,
        commission: "0.5%",
        available: "1,200 USDT",
        limit: "100-1,000 USD",
        payment: [
            "Sadam Bank",
            "Premier Bank"
        ]
    },
    {
        advertiser: "Advertiser User Name",
        orders: 120,
        completion: "98.32%",
        online: true,
        commission: "0.8%",
        available: "1,200 USDT",
        limit: "100-1,000 USD",
        payment: [
            "Sadam Bank",
            "Dohaboshi Bank",
            "Premier Bank"
        ]
    },
    {
        advertiser: "Advertiser User Name 2",
        orders: 110,
        completion: "90.20%",
        online: false,
        commission: "0.6%",
        available: "2,000 USDT",
        limit: "200-2,000 USD",
        payment: [
            "Amal Bank"
        ]
    },
    {
        advertiser: "Advertiser User Name 3",
        orders: 95,
        completion: "95.00%",
        online: true,
        commission: "0.7%",
        available: "3,500 USDT",
        limit: "300-3,000 USD",
        payment: [
            "Premier Bank",
            "Amal Bank"
        ]
    },
    {
        advertiser: "Advertiser User Name 4",
        orders: 80,
        completion: "85.00%",
        online: false,
        commission: "0.9%",
        available: "900 USDT",
        limit: "50-900 USD",
        payment: [
            "Dohaboshi Bank"
        ]
    },
    {
        advertiser: "Advertiser User Name 5",
        orders: 150,
        completion: "99.00%",
        online: true,
        commission: "0.4%",
        available: "5,000 USDT",
        limit: "500-5,000 USD",
        payment: [
            "Sadam Bank",
            "Premier Bank"
        ]
    },
    {
        advertiser: "Advertiser User Name 6",
        orders: 60,
        completion: "80.00%",
        online: false,
        commission: "1.0%",
        available: "600 USDT",
        limit: "60-600 USD",
        payment: [
            "Amal Bank",
            "Dohaboshi Bank"
        ]
    },
    {
        advertiser: "Advertiser User Name 7",
        orders: 200,
        completion: "100.00%",
        online: true,
        commission: "0.3%",
        available: "10,000 USDT",
        limit: "1,000-10,000 USD",
        payment: [
            "Premier Bank"
        ]
    },
    {
        advertiser: "Advertiser User Name 8",
        orders: 70,
        completion: "88.00%",
        online: false,
        commission: "0.85%",
        available: "850 USDT",
        limit: "85-850 USD",
        payment: [
            "Sadam Bank",
            "Amal Bank"
        ]
    },
    {
        advertiser: "Advertiser User Name 9",
        orders: 130,
        completion: "92.00%",
        online: true,
        commission: "0.65%",
        available: "1,300 USDT",
        limit: "130-1,300 USD",
        payment: [
            "Dohaboshi Bank",
            "Premier Bank"
        ]
    }
];
const orderStatusTabs = [
    {
        id: "all",
        label: "All Orders"
    },
    {
        id: "completed",
        label: "Completed"
    },
    {
        id: "processing",
        label: "Processing",
        count: 2
    },
    {
        id: "canceled",
        label: "Canceled"
    }
];
const tokenOptions = [
    {
        value: "usdt",
        label: "Tether",
        icon: "tether"
    }
];
const currencyOptions = [
    {
        value: "usdt",
        label: "USDT"
    }
];
const typeOptions = [
    {
        value: "all",
        label: "Type"
    },
    {
        value: "buy",
        label: "Buy"
    },
    {
        value: "sell",
        label: "Sell"
    }
];
const statusOptions = [
    {
        value: "all",
        label: "Status"
    },
    {
        value: "completed",
        label: "Completed"
    },
    {
        value: "processing",
        label: "Processing"
    },
    {
        value: "canceled",
        label: "Canceled"
    }
];
const dateOptions = [
    {
        value: "all",
        label: "Date"
    },
    {
        value: "today",
        label: "Today"
    },
    {
        value: "week",
        label: "This Week"
    },
    {
        value: "month",
        label: "This Month"
    }
];
const transactionData = [
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
            logo: ""
        }
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
            logo: ""
        }
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
            logo: ""
        }
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
            logo: ""
        }
    }
];
const ordersTransactionsData = [
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
            logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg"
        }
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
            logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg"
        }
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
            logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg"
        }
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
            logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg"
        }
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
            logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg"
        }
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
            logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg"
        }
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
            logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg"
        }
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
            logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg"
        }
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
            logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg"
        }
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
            logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg"
        }
    }
];
const overviewData = {
    total: 100000,
    deposits: 40000,
    withdrawals: 20000,
    inProgress: 15000,
    p2p: 25000
};
const p2pHistory = [
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
            logo: ""
        }
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
            logo: ""
        }
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
            logo: ""
        }
    }
];
const statsData = {
    trades: 120,
    completionRate: 98,
    avgReleaseTime: "1:22",
    avgPayTime: "2:56",
    rating: 99,
    totalVolume: 1200,
    currency: "USD"
};
const feedbackTableData = [
    {
        id: "1283989479421",
        type: "Buy",
        date: "12-Jun-2023 15:02",
        amount: "148.56",
        status: "Positive",
        asset: "Tether US",
        assetSymbol: "USDT",
        payment: {
            bank: "Salam Bank",
            logo: "/banks/salam.png"
        },
        username: "****Ali@gmail.com",
        rating: "Positive",
        comment: "View"
    },
    {
        id: "1283989479421",
        type: "Sell",
        date: "12-Jun-2023 15:02",
        amount: "148.56",
        status: "Positive",
        asset: "Tether US",
        assetSymbol: "USDT",
        payment: {
            bank: "Premier Bank",
            logo: "/banks/premier.png"
        },
        username: "****Ali@gmail.com",
        rating: "Positive",
        comment: "View"
    },
    {
        id: "1283989479421",
        type: "Buy",
        date: "12-Jun-2023 15:02",
        amount: "148.56",
        status: "Positive",
        asset: "Tether US",
        assetSymbol: "USDT",
        payment: {
            bank: "Dahabshiil Bank",
            logo: "/banks/dahabshiil.png"
        },
        username: "****Ali@gmail.com",
        rating: "Positive",
        comment: "View"
    },
    {
        id: "1283989479421",
        type: "Buy",
        date: "12-Jun-2023 15:02",
        amount: "148.56",
        status: "Positive",
        asset: "Tether US",
        assetSymbol: "USDT",
        payment: {
            bank: "Salam Bank",
            logo: "/banks/salam.png"
        },
        username: "****Ali@gmail.com",
        rating: "Positive",
        comment: "View"
    },
    {
        id: "1283989479421",
        type: "Buy",
        date: "12-Jun-2023 15:02",
        amount: "148.56",
        status: "Positive",
        asset: "Tether US",
        assetSymbol: "USDT",
        payment: {
            bank: "Salam Bank",
            logo: "/banks/salam.png"
        },
        username: "****Ali@gmail.com",
        rating: "Positive",
        comment: "View"
    },
    {
        id: "1283989479421",
        type: "Buy",
        date: "12-Jun-2023 15:02",
        amount: "148.56",
        status: "Positive",
        asset: "Tether US",
        assetSymbol: "USDT",
        payment: {
            bank: "Salam Bank",
            logo: "/banks/salam.png"
        },
        username: "****Ali@gmail.com",
        rating: "Positive",
        comment: "View"
    },
    {
        id: "1283989479421",
        type: "Buy",
        date: "12-Jun-2023 15:02",
        amount: "148.56",
        status: "Positive",
        asset: "Tether US",
        assetSymbol: "USDT",
        payment: {
            bank: "Salam Bank",
            logo: "/banks/salam.png"
        },
        username: "****Ali@gmail.com",
        rating: "Positive",
        comment: "View"
    }
];
const ASSETS = [
    {
        label: "USDT Tether USDT",
        value: "usdt",
        icon: "https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
    }
];
const NETWORKS = [
    {
        label: "TRC 20 Tron",
        value: "trc20",
        icon: "https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
    }
];
const WALLET_TYPES = [
    {
        label: "USDT Wallet Address",
        value: "usdt_wallet",
        icon: "https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
    }
];
const NETWORK_FEE = 3;
}}),
"[project]/styles/tokens.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * tokens.ts – unified design palette (superset of main, Marketing & p2p)
 */ // src/styles/tokens.ts
__turbopack_context__.s({
    "tokens": (()=>tokens)
});
const tokens = {
    colors: {
        brand: {
            primary: "#1D8751",
            secondary: "#E23D3A",
            hero: "#022E18",
            lightGreen: "#13B562",
            darkGreen: "#0E5531"
        },
        dark: {
            background: "#18181D",
            card: "#1D1D23",
            textTitle: "#FFFFFF",
            textBody: "#788099",
            border: "#35353E",
            textSecondary: "#E23D3A"
        }
    }
};
}}),
"[project]/features/p2p/components/Tabs.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/styles/tokens.ts [app-ssr] (ecmascript)");
"use client";
;
;
const Tabs = ({ tabs, activeTab, onTabChange })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-wrap gap-4 mb-6",
        children: tabs.map((tab)=>{
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>onTabChange(tab.id),
                className: `py-2 px-4 relative flex cursor-pointer items-center font-mulish text-lg font-semibold leading-none tracking-[-0.2px] ${activeTab === tab.id ? `text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]` : `text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}]`}`,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "relative",
                    children: [
                        tab.label,
                        activeTab === tab.id && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `absolute bottom-[-8px] left-0 h-0.5 w-full bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.primary}]`
                        }, void 0, false, {
                            fileName: "[project]/features/p2p/components/Tabs.tsx",
                            lineNumber: 24,
                            columnNumber: 17
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/p2p/components/Tabs.tsx",
                    lineNumber: 21,
                    columnNumber: 13
                }, this)
            }, tab.id, false, {
                fileName: "[project]/features/p2p/components/Tabs.tsx",
                lineNumber: 12,
                columnNumber: 11
            }, this);
        })
    }, void 0, false, {
        fileName: "[project]/features/p2p/components/Tabs.tsx",
        lineNumber: 9,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = Tabs;
}}),
"[project]/features/p2p/components/ui/p2pdashboard/Available.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/data.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/styles/tokens.ts [app-ssr] (ecmascript)");
;
;
;
const Available = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mt-4",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: `rounded-[24px] border border-[#35353E] h-[140px] overflow-hidden bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.card}]`,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `grid grid-cols-3 py-4 px-6 border-b border-[#35353E] bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.card}]`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `text-sm text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}]`,
                                children: "Asset"
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/p2pdashboard/Available.tsx",
                                lineNumber: 17,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `text-sm text-right text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}]`,
                                children: "Available"
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/p2pdashboard/Available.tsx",
                                lineNumber: 20,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `text-sm text-right text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}]`,
                                children: "In Escrow / Locked"
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/p2pdashboard/Available.tsx",
                                lineNumber: 25,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/Available.tsx",
                        lineNumber: 14,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `px-6 py-4 bg-[#18181D]`,
                        children: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["assetBalances"].map((asset, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `grid grid-cols-3 py-3 border-b last:border-b-0 border-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}]`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `w-8 h-8 rounded-full flex items-center justify-center bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.primary}]`,
                                                children: asset.icon === "tether" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `font-bold text-lg text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                                    children: "₮"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Available.tsx",
                                                    lineNumber: 45,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/ui/p2pdashboard/Available.tsx",
                                                lineNumber: 41,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: `font-medium text-sm text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                                        children: asset.symbol
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/Available.tsx",
                                                        lineNumber: 53,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: `text-xs text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}]`,
                                                        children: asset.name
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/Available.tsx",
                                                        lineNumber: 58,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/features/p2p/components/ui/p2pdashboard/Available.tsx",
                                                lineNumber: 52,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/Available.tsx",
                                        lineNumber: 40,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `text-right self-center text-sm text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                        children: asset.available.toFixed(4)
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/Available.tsx",
                                        lineNumber: 67,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `text-right self-center text-sm text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                        children: asset.locked.toFixed(4)
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/Available.tsx",
                                        lineNumber: 74,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, index, true, {
                                fileName: "[project]/features/p2p/components/ui/p2pdashboard/Available.tsx",
                                lineNumber: 35,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/Available.tsx",
                        lineNumber: 33,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/p2p/components/ui/p2pdashboard/Available.tsx",
                lineNumber: 12,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Available.tsx",
            lineNumber: 9,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/features/p2p/components/ui/p2pdashboard/Available.tsx",
        lineNumber: 7,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = Available;
}}),
"[project]/features/p2p/components/Common/Button.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
;
const Button = ({ children, variant = "primary", size = "md", icon, iconPosition = "left", fullWidth = false, className = "", width, height, borderColor, borderRadius, ...props })=>{
    const baseStyles = "flex items-center justify-center gap-2 transition-all duration-200 font-medium text-dark-textTitle cursor-pointer";
    const sizeStyles = {
        sm: "px-3 text-xs",
        md: "px-4 text-sm",
        lg: "px-5 text-base"
    };
    const variantStyles = {
        primary: "bg-[#1D8751] border-none hover:opacity-90 text-white",
        secondary: "bg-[#E23D3A] border-none hover:opacity-90 text-white",
        outline: `bg-transparent text-brand-primary border hover:opacity-90`,
        ghost: "bg-transparent border-none hover:opacity-90"
    };
    const widthStyle = fullWidth ? "w-full" : width ? `w-[${width}px]` : "w-fit";
    const heightStyle = height ? `h-[${height}px]` : "";
    const borderRadiusStyle = borderRadius === "full" ? "rounded-full" : borderRadius ? `rounded-[${borderRadius}px]` : "rounded-md";
    // Determine border color class
    let borderColorClass = "";
    if (borderColor) {
        if (borderColor.startsWith("#")) {
            borderColorClass = `border-[${borderColor}]`;
        } else {
            borderColorClass = `border-${borderColor}`;
        }
    }
    // Determine if border should be shown
    const showBorder = borderColor && variant !== "primary" && variant !== "secondary";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        style: {
            width: width ? `${width}px` : undefined,
            height: height ? `${height}px` : undefined,
            ...borderColor ? {
                borderColor: borderColor
            } : {}
        },
        className: [
            baseStyles,
            sizeStyles[size],
            variantStyles[variant],
            borderRadiusStyle,
            showBorder ? `border` : "",
            className
        ].join(" "),
        ...props,
        children: [
            icon && iconPosition === "left" && icon,
            children,
            icon && iconPosition === "right" && icon
        ]
    }, void 0, true, {
        fileName: "[project]/features/p2p/components/Common/Button.tsx",
        lineNumber: 72,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = Button;
}}),
"[project]/features/p2p/components/Common/charts.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/styles/tokens.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Button.tsx [app-ssr] (ecmascript)");
;
;
;
const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun"
];
const Charts = ({ title = "P2P Overview (USD)", timeFrame = "Month", data })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between items-center mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: `text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}] font-medium`,
                                children: title
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                lineNumber: 22,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        borderRadius: 24,
                                        height: 36,
                                        variant: "outline",
                                        size: "sm",
                                        className: `border text-[#1D8751] border-[#1D8751] text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}]`,
                                        children: "All"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                        lineNumber: 27,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        borderRadius: 24,
                                        variant: "primary",
                                        size: "sm",
                                        className: `border text-[#1D8751] border-[#1D8751] text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}]`,
                                        children: "Sells"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                        lineNumber: 36,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        borderRadius: 24,
                                        height: 36,
                                        variant: "outline",
                                        size: "sm",
                                        className: `border text-[#1D8751] border-[#1D8751] text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}]`,
                                        children: "Buys"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                        lineNumber: 44,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                lineNumber: 26,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/p2p/components/Common/charts.tsx",
                        lineNumber: 21,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: `flex items-center gap-1 px-4 py-1.5 text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}] text-sm`,
                            children: [
                                timeFrame,
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    xmlns: "http://www.w3.org/2000/svg",
                                    width: "16",
                                    height: "16",
                                    viewBox: "0 0 24 24",
                                    fill: "none",
                                    stroke: "currentColor",
                                    strokeWidth: "2",
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    className: `text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}]`,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        d: "m6 9 6 6 6-6"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                        lineNumber: 73,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                    lineNumber: 61,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/Common/charts.tsx",
                            lineNumber: 57,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/features/p2p/components/Common/charts.tsx",
                        lineNumber: 56,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/p2p/components/Common/charts.tsx",
                lineNumber: 20,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `w-full rounded-2xl  bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.card}] border-2 border-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}]`,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative h-[320px] p-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `absolute left-6 top-6 bottom-8 flex flex-col justify-between text-sm text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}]`,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: "10,000"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                    lineNumber: 88,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: "5,000"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                    lineNumber: 89,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: "2,500"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                    lineNumber: 90,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: "1,000"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                    lineNumber: 91,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/Common/charts.tsx",
                            lineNumber: 85,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "ml-20 h-full pb-8 relative",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute w-full h-[calc(100%-32px)] flex flex-col justify-between",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `border-b border-dashed border-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}]`
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                            lineNumber: 98,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `border-b border-dashed border-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}]`
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                            lineNumber: 101,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `border-b border-dashed border-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}]`
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                            lineNumber: 104,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `border-b border-dashed border-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}]`
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                            lineNumber: 107,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                    lineNumber: 97,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute w-full h-[calc(100%-32px)]",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        width: "100%",
                                        height: "100%",
                                        viewBox: "0 0 1200 300",
                                        preserveAspectRatio: "none",
                                        className: `text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.primary}]`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("defs", {
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("linearGradient", {
                                                    id: "chartGradient",
                                                    x1: "0%",
                                                    y1: "0%",
                                                    x2: "0%",
                                                    y2: "100%",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                                            offset: "0%",
                                                            stopColor: __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.primary,
                                                            stopOpacity: "0.4"
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                                            lineNumber: 130,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                                            offset: "100%",
                                                            stopColor: __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.primary,
                                                            stopOpacity: "0"
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                                            lineNumber: 135,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                                    lineNumber: 123,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                                lineNumber: 122,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                d: "M0,50 C100,120 200,180 300,100 C400,20 500,120 600,150 C700,180 800,70 900,200 C1000,150 1100,100 1200,20 L1200,300 L0,300 Z",
                                                fill: "url(#chartGradient)"
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                                lineNumber: 144,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                d: "M0,50 C100,120 200,180 300,100 C400,20 500,120 600,150 C700,180 800,70 900,200 C1000,150 1100,100 1200,20",
                                                fill: "none",
                                                stroke: __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.primary,
                                                strokeWidth: "3"
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                                lineNumber: 150,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                        lineNumber: 114,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                    lineNumber: 113,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/Common/charts.tsx",
                            lineNumber: 95,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `absolute left-20 right-6 bottom-0 flex justify-between text-sm text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}]`,
                            children: months.map((month, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: month
                                }, index, false, {
                                    fileName: "[project]/features/p2p/components/Common/charts.tsx",
                                    lineNumber: 165,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/features/p2p/components/Common/charts.tsx",
                            lineNumber: 161,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/p2p/components/Common/charts.tsx",
                    lineNumber: 83,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/features/p2p/components/Common/charts.tsx",
                lineNumber: 79,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/p2p/components/Common/charts.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = Charts;
}}),
"[project]/features/p2p/components/Common/Table.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "Table": (()=>Table)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/styles/tokens.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ellipsis$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MoreHorizontal$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/ellipsis.js [app-ssr] (ecmascript) <export default as MoreHorizontal>");
;
;
;
;
;
const Table = ({ title = "P2P History", data = [], type = "", onExport, onSearch })=>{
    const [currentPage, setCurrentPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const handleSearch = (e)=>{
        if (onSearch) {
            onSearch(e.target.value);
        }
    };
    const handleExport = ()=>{
        if (onExport) {
            onExport();
        }
    };
    const getStatusColor = (status)=>{
        if (status === "Completed") return `text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.primary}]`;
        if (status === "Processing") return "text-yellow-400";
        return `text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.secondary}]`;
    };
    const handlePageChange = (page)=>{
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: " mt-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: `font-medium text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                        children: title
                    }, void 0, false, {
                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                        lineNumber: 57,
                        columnNumber: 9
                    }, this),
                    type === "p2p" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative w-full sm:w-60",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        placeholder: "Search",
                                        onChange: handleSearch,
                                        className: `py-2 pl-9 pr-4 rounded-[24px] text-sm w-full border focus:outline-none bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.card}] text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}] border-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}]`
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                        lineNumber: 64,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute left-3 top-1/2 transform -translate-y-1/2",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            width: "16",
                                            height: "16",
                                            viewBox: "0 0 24 24",
                                            fill: "none",
                                            xmlns: "http://www.w3.org/2000/svg",
                                            className: `text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}]`,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    d: "M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z",
                                                    stroke: "currentColor",
                                                    strokeWidth: "2",
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                    lineNumber: 79,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    d: "M21 21L16.65 16.65",
                                                    stroke: "currentColor",
                                                    strokeWidth: "2",
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                    lineNumber: 86,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                            lineNumber: 71,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                        lineNumber: 70,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                lineNumber: 63,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                variant: "ghost",
                                size: "sm",
                                onClick: handleExport,
                                className: "text-sm ",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-[#1D8751]",
                                    children: "Export Transactions"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                    lineNumber: 103,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                lineNumber: 97,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                        lineNumber: 62,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                lineNumber: 56,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "overflow-x-auto rounded-[24px]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `min-w-[800px] w-full border overflow-hidden bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.card}] border-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}]`,
                        children: [
                            type === "myads" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-10 py-3 px-4 border-b bg-[${tokens.colors.dark.card}] border-[${tokens.colors.dark.border}]",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm font-medium text-[${tokens.colors.dark.textTitle}]",
                                        children: "Asset"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                        lineNumber: 116,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm font-medium text-[${tokens.colors.dark.textTitle}]",
                                        children: "Ad ID"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                        lineNumber: 119,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm font-medium text-[${tokens.colors.dark.textTitle}]",
                                        children: "Type"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                        lineNumber: 122,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm font-medium text-[${tokens.colors.dark.textTitle}]",
                                        children: "Limit"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                        lineNumber: 125,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm font-medium text-[${tokens.colors.dark.textTitle}]",
                                        children: "Price"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                        lineNumber: 128,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm font-medium text-[${tokens.colors.dark.textTitle}]",
                                        children: "Commission"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                        lineNumber: 131,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm font-medium text-[${tokens.colors.dark.textTitle}]",
                                        children: "Payment"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                        lineNumber: 134,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm font-medium text-[${tokens.colors.dark.textTitle}]",
                                        children: "Last Update"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                        lineNumber: 137,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm font-medium text-[${tokens.colors.dark.textTitle}]",
                                        children: "Status"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                        lineNumber: 140,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm font-medium text-[${tokens.colors.dark.textTitle}]",
                                        children: "Action"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                        lineNumber: 143,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                lineNumber: 115,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `grid grid-cols-7 md:grid-cols-8 py-3 px-4 border-b bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.card}] border-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}]`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `text-sm font-medium text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                        children: type === "orders" ? "Coin" : "Asset"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                        lineNumber: 151,
                                        columnNumber: 15
                                    }, this),
                                    type === "p2p" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            " ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `text-sm font-medium text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                                children: "ID"
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                lineNumber: 159,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `text-sm font-medium text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                        children: "Type"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                        lineNumber: 166,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `text-sm font-medium text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                        children: "Amount"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                        lineNumber: 171,
                                        columnNumber: 15
                                    }, this),
                                    type === "orders" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `text-sm font-medium text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                        children: "Rate"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                        lineNumber: 177,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `text-sm font-medium text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                        children: "Date"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                        lineNumber: 184,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `text-sm font-medium text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                        children: "Status"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                        lineNumber: 189,
                                        columnNumber: 15
                                    }, this),
                                    type === "p2p" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `text-sm font-medium text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}] flex items-center gap-1`,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                        width: "16",
                                                        height: "16",
                                                        viewBox: "0 0 24 24",
                                                        fill: "none",
                                                        xmlns: "http://www.w3.org/2000/svg",
                                                        className: `text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                d: "M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z",
                                                                stroke: "currentColor",
                                                                strokeWidth: "2",
                                                                strokeLinecap: "round",
                                                                strokeLinejoin: "round"
                                                            }, void 0, false, {
                                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                                lineNumber: 208,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                d: "M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z",
                                                                stroke: "currentColor",
                                                                strokeWidth: "2",
                                                                strokeLinecap: "round",
                                                                strokeLinejoin: "round"
                                                            }, void 0, false, {
                                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                                lineNumber: 215,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                        lineNumber: 200,
                                                        columnNumber: 21
                                                    }, this),
                                                    "Receipt"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                lineNumber: 197,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `text-sm font-medium text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                                children: "More"
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                lineNumber: 225,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `text-sm font-medium text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                        children: "Payments"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                        lineNumber: 232,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                lineNumber: 148,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: type === "myads" ? paginatedData.map((row, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `w-full grid grid-cols-10 py-4 px-4 border-b last:border-b-0 items-center hover:bg-opacity-80 transition-colors border-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}] bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.background}]`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "w-8 h-8 rounded-full flex items-center justify-center bg-[#26A17B]",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "font-bold text-lg text-white",
                                                            children: "₮"
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                            lineNumber: 252,
                                                            columnNumber: 25
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                        lineNumber: 251,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `text-sm font-medium text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                                        children: row.assetSymbol
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                        lineNumber: 254,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                lineNumber: 250,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-sm font-medium text-[${tokens.colors.dark.textTitle}]",
                                                children: row.id
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                lineNumber: 261,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-sm font-medium text-[#1D8751]",
                                                children: row.type
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                lineNumber: 265,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-sm font-medium text-[${tokens.colors.dark.textTitle}]",
                                                children: row.limit
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                lineNumber: 269,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-sm font-medium font-semibold text-[${tokens.colors.dark.textTitle}]",
                                                children: row.price
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                lineNumber: 273,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-sm font-medium text-[${tokens.colors.dark.textTitle}]",
                                                children: row.commission
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                lineNumber: 277,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-wrap gap-2",
                                                children: Array.isArray(row.payment) && row.payment.map((p, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "flex items-center gap-1",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                                src: p.logo,
                                                                alt: p.bank,
                                                                className: "w-6 h-6 rounded-full"
                                                            }, void 0, false, {
                                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                                lineNumber: 285,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                children: p.bank
                                                            }, void 0, false, {
                                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                                lineNumber: 290,
                                                                columnNumber: 29
                                                            }, this)
                                                        ]
                                                    }, i, true, {
                                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                        lineNumber: 284,
                                                        columnNumber: 27
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                lineNumber: 281,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-sm font-medium text-[${tokens.colors.dark.textTitle}]",
                                                children: row.lastUpdate
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                lineNumber: 295,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-sm font-medium",
                                                style: {
                                                    color: row.status === "Published" ? "#1D8751" : "red"
                                                },
                                                children: row.status
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                lineNumber: 299,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    className: "text-[#1D8751]",
                                                    children: "..."
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                    lineNumber: 309,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                lineNumber: 308,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, idx, true, {
                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                        lineNumber: 245,
                                        columnNumber: 19
                                    }, this)) : paginatedData.map((row, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `w-full grid grid-cols-7 md:grid-cols-8 py-4 px-4 border-b last:border-b-0 items-center hover:bg-opacity-80 transition-colors border-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}] bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.background}]`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    row.assetSymbol === "BTC" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "w-8 h-8 rounded-full flex items-center justify-center bg-[#F7931A]",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "font-bold text-lg text-white",
                                                            children: "₿"
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                            lineNumber: 322,
                                                            columnNumber: 27
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                        lineNumber: 321,
                                                        columnNumber: 25
                                                    }, this),
                                                    row.assetSymbol === "ETH" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "w-8 h-8 rounded-full flex items-center justify-center bg-[#627EEA]",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "font-bold text-lg text-white",
                                                            children: "Ξ"
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                            lineNumber: 329,
                                                            columnNumber: 27
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                        lineNumber: 328,
                                                        columnNumber: 25
                                                    }, this),
                                                    row.assetSymbol === "USDT" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "w-8 h-8 rounded-full flex items-center justify-center bg-[#26A17B]",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "font-bold text-lg text-white",
                                                            children: "₮"
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                            lineNumber: 336,
                                                            columnNumber: 27
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                        lineNumber: 335,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `text-sm font-medium text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                                        children: row.assetSymbol
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                        lineNumber: 341,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                lineNumber: 319,
                                                columnNumber: 21
                                            }, this),
                                            type === "p2p" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `text-sm font-medium text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                                children: row.id
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                lineNumber: 349,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `text-sm font-medium ${row.type === "Buy" ? `text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.primary}]` : `text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.secondary}]`}`,
                                                children: row.type
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                lineNumber: 357,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `text-sm font-medium ${row.amount.startsWith("+") ? `text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.primary}]` : `text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.secondary}]`}`,
                                                children: [
                                                    row.amount,
                                                    " USD"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                lineNumber: 367,
                                                columnNumber: 21
                                            }, this),
                                            type === "orders" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `text-sm font-medium text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                                children: row.rate
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                lineNumber: 378,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `text-sm font-medium text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                                children: row.date
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                lineNumber: 386,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `text-sm font-medium ${getStatusColor(row.status)}`,
                                                children: row.status
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                lineNumber: 392,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    Array.isArray(row.payment) ? row.payment.map((p, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: p.bank
                                                        }, i, false, {
                                                            fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                            lineNumber: 403,
                                                            columnNumber: 29
                                                        }, this)) : row.payment?.logo && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                        src: row.payment.logo,
                                                        alt: "logo",
                                                        className: "w-6 h-6 rounded-full"
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                        lineNumber: 406,
                                                        columnNumber: 29
                                                    }, this),
                                                    Array.isArray(row.payment) ? null : row.payment?.bank
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                lineNumber: 400,
                                                columnNumber: 21
                                            }, this),
                                            type == "p2p" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex justify-between items-center",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                            variant: "ghost",
                                                            size: "sm",
                                                            color: "#1D8751",
                                                            className: "text-[#1D8751]",
                                                            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                width: "20",
                                                                height: "20",
                                                                viewBox: "0 0 24 24",
                                                                fill: "none",
                                                                xmlns: "http://www.w3.org/2000/svg",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z",
                                                                        stroke: "currentColor",
                                                                        strokeWidth: "2",
                                                                        strokeLinecap: "round",
                                                                        strokeLinejoin: "round"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                                        lineNumber: 431,
                                                                        columnNumber: 33
                                                                    }, void 0),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z",
                                                                        stroke: "currentColor",
                                                                        strokeWidth: "2",
                                                                        strokeLinecap: "round",
                                                                        strokeLinejoin: "round"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                                        lineNumber: 438,
                                                                        columnNumber: 33
                                                                    }, void 0)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                                lineNumber: 424,
                                                                columnNumber: 31
                                                            }, void 0)
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                            lineNumber: 418,
                                                            columnNumber: 27
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                        lineNumber: 417,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ellipsis$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MoreHorizontal$3e$__["MoreHorizontal"], {}, void 0, false, {
                                                            fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                            lineNumber: 450,
                                                            columnNumber: 27
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                                        lineNumber: 449,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, void 0, true) : null
                                        ]
                                    }, index, true, {
                                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                        lineNumber: 314,
                                        columnNumber: 19
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                lineNumber: 242,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                        lineNumber: 110,
                        columnNumber: 9
                    }, this),
                    totalPages > 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-center items-center gap-2 mt-6 select-none",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>handlePageChange(currentPage - 1),
                                disabled: currentPage === 1,
                                className: `w-8 h-8 flex items-center justify-center rounded transition-colors ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-[#7C8493] hover:bg-[#E6E8EC]"}`,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xl",
                                    children: "<"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                    lineNumber: 470,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                lineNumber: 461,
                                columnNumber: 13
                            }, this),
                            Array.from({
                                length: totalPages
                            }, (_, i)=>i + 1).map((page)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>handlePageChange(page),
                                    className: `w-8 h-8 flex items-center justify-center rounded-[8px] font-medium text-base transition-colors ${currentPage === page ? "bg-[#1D8751] text-white" : "text-[#7C8493] hover:bg-[#E6E8EC]"}`,
                                    children: page
                                }, page, false, {
                                    fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                    lineNumber: 473,
                                    columnNumber: 15
                                }, this)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>handlePageChange(currentPage + 1),
                                disabled: currentPage === totalPages,
                                className: `w-8 h-8 flex items-center justify-center rounded transition-colors ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-[#7C8493] hover:bg-[#E6E8EC]"}`,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xl",
                                    children: ">"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                    lineNumber: 494,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                                lineNumber: 485,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/p2p/components/Common/Table.tsx",
                        lineNumber: 460,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/p2p/components/Common/Table.tsx",
                lineNumber: 109,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/p2p/components/Common/Table.tsx",
        lineNumber: 55,
        columnNumber: 5
    }, this);
};
}}),
"[project]/features/p2p/components/ui/p2pdashboard/P2PCharts.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$charts$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/charts.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Table$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Table.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/data.ts [app-ssr] (ecmascript)");
;
;
;
;
const P2PCharts = ()=>{
    // Handlers for table functionality
    const handleExport = ()=>{
        console.log("Exporting transactions...");
    };
    const handleSearch = (query)=>{
        console.log("Searching for:", query);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full pt-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$charts$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                title: "P2P Overview (USD)",
                timeFrame: "Month"
            }, void 0, false, {
                fileName: "[project]/features/p2p/components/ui/p2pdashboard/P2PCharts.tsx",
                lineNumber: 18,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Table$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Table"], {
                type: "p2p",
                title: "P2P History",
                data: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["transactionData"],
                onExport: handleExport,
                onSearch: handleSearch
            }, void 0, false, {
                fileName: "[project]/features/p2p/components/ui/p2pdashboard/P2PCharts.tsx",
                lineNumber: 19,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/p2p/components/ui/p2pdashboard/P2PCharts.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = P2PCharts;
}}),
"[project]/features/p2p/components/Common/Card.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * UserCard.tsx – auto‑generated placeholder
 */ __turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/styles/tokens.ts [app-ssr] (ecmascript)");
;
;
const Card = ({ children, borderColor = `border-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}]`, width = "w-full", bgColor = `bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.card}]`, borderRadius = "rounded-[20px]", className = "" })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `border ${borderColor} ${width} ${bgColor} ${borderRadius} ${className}`,
        children: children
    }, void 0, false, {
        fileName: "[project]/features/p2p/components/Common/Card.tsx",
        lineNumber: 26,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = Card;
}}),
"[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/styles/tokens.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Card.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/data.ts [app-ssr] (ecmascript)");
;
;
;
;
// Define constants for colors that aren't in tokens
const PROGRESS_COLOR = __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.primary;
const P2P_COLOR = __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.secondary;
const Overview = ()=>{
    const { total = 0, deposits = 0, withdrawals = 0, inProgress = 0, p2p = 0 } = __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["transactionData1"] || {};
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: `text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}] mb-2 text-sm`,
                children: "Overview Total"
            }, void 0, false, {
                fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                lineNumber: 21,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                borderColor: `border-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}]`,
                width: "w-full",
                bgColor: `bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.card}]`,
                borderRadius: "rounded-[14px]",
                className: "p-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col items-center justify-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-4",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                width: "200",
                                height: "200",
                                viewBox: "0 0 260 260",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                        cx: "130",
                                        cy: "130",
                                        r: "110",
                                        fill: "transparent",
                                        stroke: __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border,
                                        strokeWidth: "12"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                        lineNumber: 35,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                        cx: "130",
                                        cy: "130",
                                        r: "110",
                                        fill: "transparent",
                                        stroke: __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.primary,
                                        strokeWidth: "14",
                                        strokeDasharray: `${deposits / total * 691} ${691 - deposits / total * 691}`,
                                        strokeDashoffset: "173"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                        lineNumber: 44,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                        cx: "130",
                                        cy: "130",
                                        r: "110",
                                        fill: "transparent",
                                        stroke: __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.secondary,
                                        strokeWidth: "14",
                                        strokeDasharray: `${p2p / total * 691} ${691 - p2p / total * 691}`,
                                        strokeDashoffset: `${173 - deposits / total * 691}`
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                        lineNumber: 57,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                        cx: "130",
                                        cy: "130",
                                        r: "110",
                                        fill: "transparent",
                                        stroke: __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.primary,
                                        strokeWidth: "14",
                                        strokeDasharray: `${inProgress / total * 691} ${691 - inProgress / total * 691}`,
                                        strokeDashoffset: `${173 - (deposits + p2p) / total * 691}`
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                        lineNumber: 70,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                        cx: "130",
                                        cy: "130",
                                        r: "110",
                                        fill: "transparent",
                                        stroke: __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.secondary,
                                        strokeWidth: "14",
                                        strokeDasharray: `${withdrawals / total * 691} ${691 - withdrawals / total * 691}`,
                                        strokeDashoffset: `${173 - (deposits + p2p + inProgress) / total * 691}`
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                        lineNumber: 83,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                                        x: "130",
                                        y: "120",
                                        textAnchor: "middle",
                                        fill: __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle,
                                        fontSize: "22",
                                        fontWeight: "bold",
                                        children: [
                                            total.toLocaleString(),
                                            " USD"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                        lineNumber: 99,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                                        x: "130",
                                        y: "150",
                                        textAnchor: "middle",
                                        fill: __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody,
                                        fontSize: "16",
                                        children: "Transactions"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                        lineNumber: 109,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                lineNumber: 34,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                            lineNumber: 33,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-full flex flex-col gap-3 mt-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: `w-3 h-3 rounded-full bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.primary}]`
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                    lineNumber: 125,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `text-sm text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}]`,
                                                    children: "Deposits"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                    lineNumber: 128,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                            lineNumber: 124,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: `text-sm text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                            children: [
                                                deposits.toLocaleString(),
                                                " USD"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                            lineNumber: 134,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                    lineNumber: 123,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: `w-3 h-3 rounded-full bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.secondary}]`
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                    lineNumber: 143,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `text-sm text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}]`,
                                                    children: "Withdrawals"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                    lineNumber: 146,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                            lineNumber: 142,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: `text-sm text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                            children: [
                                                withdrawals.toLocaleString(),
                                                " USD"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                            lineNumber: 152,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                    lineNumber: 141,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: `w-3 h-3 rounded-full bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.primary}]`
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                    lineNumber: 161,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `text-sm text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}]`,
                                                    children: "In Progress"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                    lineNumber: 164,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                            lineNumber: 160,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: `text-sm text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                            children: [
                                                inProgress.toLocaleString(),
                                                " USD"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                            lineNumber: 170,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                    lineNumber: 159,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: `w-3 h-3 rounded-full bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.secondary}]`
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                    lineNumber: 179,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `text-sm text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}]`,
                                                    children: "P2P"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                    lineNumber: 182,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                            lineNumber: 178,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: `text-sm text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                            children: [
                                                p2p.toLocaleString(),
                                                " USD"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                            lineNumber: 188,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                    lineNumber: 177,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                            lineNumber: 122,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                    lineNumber: 31,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                lineNumber: 24,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-4 flex-col mt-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        borderColor: `border-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}]`,
                        width: "w-full",
                        bgColor: `bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.card}]`,
                        borderRadius: "rounded-[14px]",
                        className: "p-3",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between mb-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: `font-medium text-sm text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                            children: "P2P Buys"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                            lineNumber: 209,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "relative",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                    className: `px-2 py-1 rounded text-xs appearance-none pr-8 bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.card}] border border-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}] text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        children: "Month"
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                        lineNumber: 218,
                                                        columnNumber: 19
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                    lineNumber: 215,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                                    children: "▼"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                    lineNumber: 220,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                            lineNumber: 214,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                    lineNumber: 208,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `text-xl font-bold mb-3 text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                    children: "30,000 USD"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                    lineNumber: 228,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `mb-2 w-full rounded-full h-4 bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}]`,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `h-4 rounded-full w-[66.7%] bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.primary}]`
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                        lineNumber: 237,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                    lineNumber: 234,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-col gap-3 mt-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex justify-between items-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: `w-3 h-3 rounded-full bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.primary}]`
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                            lineNumber: 245,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: `text-sm text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}]`,
                                                            children: "Completed"
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                            lineNumber: 248,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                    lineNumber: 244,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                                    children: "20,000 USD"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                    lineNumber: 254,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                            lineNumber: 243,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex justify-between items-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: `w-3 h-3 rounded-full bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.primary}]`
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                            lineNumber: 261,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: `text-sm text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}]`,
                                                            children: "In Escrow"
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                            lineNumber: 264,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                    lineNumber: 260,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                                    children: "10,000 USD"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                    lineNumber: 270,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                            lineNumber: 259,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                    lineNumber: 242,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                            lineNumber: 207,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                        lineNumber: 200,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        borderColor: `border-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}]`,
                        width: "w-full",
                        bgColor: `bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.card}]`,
                        borderRadius: "rounded-[14px]",
                        className: "p-3",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between mb-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: `font-medium text-sm text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                            children: "P2P Sells"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                            lineNumber: 288,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "relative",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                    className: `px-2 py-1 rounded text-xs appearance-none pr-8 bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.card}] border border-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}] text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        children: "Month"
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                        lineNumber: 297,
                                                        columnNumber: 19
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                    lineNumber: 294,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                                    children: "▼"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                    lineNumber: 299,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                            lineNumber: 293,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                    lineNumber: 287,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `text-xl font-bold mb-3 text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                    children: "5,000 USD"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                    lineNumber: 307,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `mb-2 w-full rounded-full h-4 bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}]`,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `h-4 rounded-full w-[80%] bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.secondary}]`
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                        lineNumber: 316,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                    lineNumber: 313,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-col gap-3 mt-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex justify-between items-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: `w-3 h-3 rounded-full bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.secondary}]`
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                            lineNumber: 324,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: `text-sm text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}]`,
                                                            children: "Completed"
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                            lineNumber: 327,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                    lineNumber: 323,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                                    children: "4,000 USD"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                    lineNumber: 333,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                            lineNumber: 322,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex justify-between items-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: `w-3 h-3 rounded-full bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.primary}]`
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                            lineNumber: 340,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: `text-sm text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}]`,
                                                            children: "In Escrow"
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                            lineNumber: 343,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                    lineNumber: 339,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                                    children: "1,000 USD"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                                    lineNumber: 349,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                            lineNumber: 338,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                                    lineNumber: 321,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                            lineNumber: 286,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                        lineNumber: 279,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
                lineNumber: 198,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx",
        lineNumber: 20,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = Overview;
}}),
"[project]/features/p2p/components/ui/p2pdashboard/P2pWallet.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/styles/tokens.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Card.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Button.tsx [app-ssr] (ecmascript)");
;
;
;
;
const P2pWallet = ({ isOpenForm, setIsOpenForm })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
            borderColor: `border-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}]`,
            width: "w-full",
            bgColor: `bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.card}]`,
            borderRadius: "rounded-[16px]",
            className: "p-3",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col space-y-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: `text-base opacity-70 text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}]`,
                        children: "Balance"
                    }, void 0, false, {
                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/P2pWallet.tsx",
                        lineNumber: 23,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap justify-between items-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex text-[14px]  flex-wrap items-baseline",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: `text-[15px] font-medium mr-2 text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                        children: "1900.8648 USDT"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/P2pWallet.tsx",
                                        lineNumber: 31,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}] text-lg flex items-center`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "mx-1 opacity-50",
                                                children: "≈"
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/ui/p2pdashboard/P2pWallet.tsx",
                                                lineNumber: 39,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}] opacity-80`,
                                                children: "1,900 USD"
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/ui/p2pdashboard/P2pWallet.tsx",
                                                lineNumber: 40,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/P2pWallet.tsx",
                                        lineNumber: 36,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/features/p2p/components/ui/p2pdashboard/P2pWallet.tsx",
                                lineNumber: 30,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        onClick: ()=>setIsOpenForm("deposit"),
                                        width: 120,
                                        height: 40,
                                        borderRadius: 24,
                                        variant: isOpenForm === "deposit" ? "primary" : "outline",
                                        borderColor: __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.primary,
                                        size: "md",
                                        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            width: "16",
                                            height: "16",
                                            viewBox: "0 0 24 24",
                                            fill: "none",
                                            xmlns: "http://www.w3.org/2000/svg",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                d: "M12 5V19M12 5L19 12M12 5L5 12",
                                                className: isOpenForm === "deposit" ? `stroke-[#ffff]` : `stroke-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.primary}]`,
                                                strokeWidth: "2",
                                                strokeLinecap: "round",
                                                strokeLinejoin: "round"
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/ui/p2pdashboard/P2pWallet.tsx",
                                                lineNumber: 65,
                                                columnNumber: 21
                                            }, void 0)
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/P2pWallet.tsx",
                                            lineNumber: 58,
                                            columnNumber: 19
                                        }, void 0),
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: `text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                            children: "Deposit"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/P2pWallet.tsx",
                                            lineNumber: 79,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/P2pWallet.tsx",
                                        lineNumber: 49,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        onClick: ()=>setIsOpenForm("withdraw"),
                                        width: 120,
                                        height: 40,
                                        borderRadius: 24,
                                        variant: isOpenForm === "withdraw" ? "secondary" : "outline",
                                        borderColor: __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.secondary,
                                        size: "md",
                                        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            width: "16",
                                            height: "16",
                                            viewBox: "0 0 24 24",
                                            fill: "none",
                                            xmlns: "http://www.w3.org/2000/svg",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                d: "M12 19V5M12 19L19 12M12 19L5 12",
                                                className: isOpenForm === "withdraw" ? `stroke-[#ffff]` : `stroke-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.secondary}]`,
                                                strokeWidth: "2",
                                                strokeLinecap: "round",
                                                strokeLinejoin: "round"
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/ui/p2pdashboard/P2pWallet.tsx",
                                                lineNumber: 100,
                                                columnNumber: 21
                                            }, void 0)
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/P2pWallet.tsx",
                                            lineNumber: 93,
                                            columnNumber: 19
                                        }, void 0),
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: `text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                            children: "Withdraw"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/P2pWallet.tsx",
                                            lineNumber: 114,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/P2pWallet.tsx",
                                        lineNumber: 84,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/features/p2p/components/ui/p2pdashboard/P2pWallet.tsx",
                                lineNumber: 48,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/P2pWallet.tsx",
                        lineNumber: 29,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/p2p/components/ui/p2pdashboard/P2pWallet.tsx",
                lineNumber: 22,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/features/p2p/components/ui/p2pdashboard/P2pWallet.tsx",
            lineNumber: 15,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/features/p2p/components/ui/p2pdashboard/P2pWallet.tsx",
        lineNumber: 14,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = P2pWallet;
}}),
"[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Card.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
;
;
;
;
;
const UserCard = ()=>{
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
        borderColor: "border-[#35353E]",
        width: "w-full",
        bgColor: "bg-[#1D1D23]",
        borderRadius: "rounded-[20px]",
        className: "p-2",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-3 md:gap-0",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "relative",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-14 w-14 rounded-full overflow-hidden relative",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        src: "https://res.cloudinary.com/pitz/image/upload/v1746538908/1fd9f384e7054d4ed9c913e3cfc2b1cf634d0cf4_ldkmkj.jpg",
                                        alt: "User avatar",
                                        width: 56,
                                        height: 56,
                                        className: "object-cover",
                                        unoptimized: true,
                                        onError: (e)=>{
                                            const target = e.target;
                                            target.onerror = null;
                                            target.src = "https://via.placeholder.com/56";
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                        lineNumber: 23,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                    lineNumber: 22,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute -top-1 -right-1 rounded-full p-1 bg-[#1D8751]",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        width: "16",
                                        height: "16",
                                        viewBox: "0 0 24 24",
                                        fill: "none",
                                        xmlns: "http://www.w3.org/2000/svg",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            d: "M16 3L21 8L8 21L3 21L3 16L16 3Z",
                                            className: "stroke-[#FFFFFF]",
                                            strokeWidth: "2"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                            lineNumber: 45,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                        lineNumber: 38,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                    lineNumber: 37,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                            lineNumber: 21,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-lg text-[14px] font-semibold text-[#FFFFFF]",
                                        children: "Hello, Omar Ali!"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                        lineNumber: 57,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                    lineNumber: 56,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-[#1D8751] text-[14px]",
                                            children: "Verified Profile"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                            lineNumber: 62,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "rounded-full p-0.5 bg-[#1D8751]",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                width: "14",
                                                height: "14",
                                                viewBox: "0 0 24 24",
                                                fill: "none",
                                                xmlns: "http://www.w3.org/2000/svg",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M9 12L11 14L15 10",
                                                        className: "stroke-[#FFFFFF]",
                                                        strokeWidth: "2",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                                        lineNumber: 71,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                        cx: "12",
                                                        cy: "12",
                                                        r: "9",
                                                        className: "stroke-[#FFFFFF]",
                                                        strokeWidth: "2"
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                                        lineNumber: 78,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                                lineNumber: 64,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                            lineNumber: 63,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                    lineNumber: 61,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                            lineNumber: 55,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                    lineNumber: 19,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex  text-[14px] flex-col w-full md:w-auto md:flex-row items-start md:items-center gap-4 md:gap-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-[#788099]",
                                    children: "User ID"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                    lineNumber: 95,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-base text-[#FFFFFF]",
                                            children: "383672684"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                            lineNumber: 97,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                width: "20",
                                                height: "20",
                                                viewBox: "0 0 24 24",
                                                fill: "none",
                                                xmlns: "http://www.w3.org/2000/svg",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                                    x: "5",
                                                    y: "5",
                                                    width: "14",
                                                    height: "14",
                                                    rx: "2",
                                                    className: "stroke-[#E23D3A]",
                                                    strokeWidth: "2"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                                    lineNumber: 106,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                                lineNumber: 99,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                            lineNumber: 98,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                    lineNumber: 96,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                            lineNumber: 94,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-[#788099]",
                                    children: "User Type"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                    lineNumber: 122,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-base text-[#FFFFFF]",
                                    children: "Individual"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                    lineNumber: 123,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                            lineNumber: 121,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-wrap gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    borderRadius: 24,
                                    width: 130,
                                    height: 36,
                                    variant: "primary",
                                    size: "sm",
                                    onClick: ()=>router.push("/adds?type=buy"),
                                    children: "+Post Buy Ad"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                    lineNumber: 128,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    borderRadius: 24,
                                    width: 130,
                                    height: 36,
                                    variant: "secondary",
                                    size: "sm",
                                    onClick: ()=>router.push("/adds?type=sell"),
                                    children: "+Post Sell Ad"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                    lineNumber: 138,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    variant: "ghost",
                                    size: "sm",
                                    className: " flex items-center justify-center p-0",
                                    icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-10 h-10 rounded-full border border-[#1D8751] flex items-center justify-center p-1",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            width: "16",
                                            height: "16",
                                            viewBox: "0 0 24 24",
                                            fill: "none",
                                            xmlns: "http://www.w3.org/2000/svg",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    d: "M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z",
                                                    className: "stroke-[#1D8751]",
                                                    strokeWidth: "2",
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                                    lineNumber: 161,
                                                    columnNumber: 21
                                                }, void 0),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    d: "M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21",
                                                    className: "stroke-[#1D8751]",
                                                    strokeWidth: "2",
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                                    lineNumber: 168,
                                                    columnNumber: 21
                                                }, void 0)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                            lineNumber: 154,
                                            columnNumber: 19
                                        }, void 0)
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                        lineNumber: 153,
                                        columnNumber: 17
                                    }, void 0)
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                    lineNumber: 148,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    variant: "ghost",
                                    size: "sm",
                                    className: " flex items-center justify-center p-0",
                                    icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-10 h-10 rounded-[50%] border border-[#1D8751] flex items-center justify-center p-0",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            width: "16",
                                            height: "16",
                                            viewBox: "0 0 24 24",
                                            fill: "none",
                                            xmlns: "http://www.w3.org/2000/svg",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    d: "M3 18V12C3 9.61305 3.94821 7.32387 5.63604 5.63604C7.32387 3.94821 9.61305 3 12 3C14.3869 3 16.6761 3.94821 18.364 5.63604C20.0518 7.32387 21 9.61305 21 12V18",
                                                    className: "stroke-[#1D8751]",
                                                    strokeWidth: "2",
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                                    lineNumber: 192,
                                                    columnNumber: 21
                                                }, void 0),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    d: "M21 19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H18C17.4696 21 16.9609 20.7893 16.5858 20.4142C16.2107 20.0391 16 19.5304 16 19V16C16 15.4696 16.2107 14.9609 16.5858 14.5858C16.9609 14.2107 17.4696 14 18 14H21V19ZM3 19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H6C6.53043 21 7.03914 20.7893 7.41421 20.4142C7.78929 20.0391 8 19.5304 8 19V16C8 15.4696 7.78929 14.9609 7.41421 14.5858C7.03914 14.2107 6.53043 14 6 14H3V19Z",
                                                    className: "stroke-[#1D8751]",
                                                    strokeWidth: "2",
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                                    lineNumber: 199,
                                                    columnNumber: 21
                                                }, void 0)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                            lineNumber: 185,
                                            columnNumber: 19
                                        }, void 0)
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                        lineNumber: 184,
                                        columnNumber: 17
                                    }, void 0)
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                                    lineNumber: 179,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                            lineNumber: 127,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
                    lineNumber: 92,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
            lineNumber: 18,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx",
        lineNumber: 11,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = UserCard;
}}),
"[project]/features/p2p/components/Common/Input.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/styles/tokens.ts [app-ssr] (ecmascript)");
;
;
const Input = ({ className = "", borderColor = __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border, bgColor = __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.card, ...props })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
        className: `bg-[${bgColor}] border border-[${borderColor}] ${className.includes("rounded") ? "" : "rounded-lg"} px-4 py-2 text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}] placeholder:text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textBody}] focus:outline-none transition ${className}`,
        ...props
    }, void 0, false, {
        fileName: "[project]/features/p2p/components/Common/Input.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = Input;
}}),
"[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Card.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Input.tsx [app-ssr] (ecmascript)");
;
;
;
;
const USDT_ADDRESS = "123u341039ke3443jj1123";
const Deposit = ()=>{
    // Form fields for amount (and asset, if needed)
    const [selectedFile, setSelectedFile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const handleFileChange = (e)=>{
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };
    // Handle form submit
    const handleSubmit = (data)=>{
        // handle deposit logic
        console.log(data);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex justify-center items-center min-h-screen w-full pt-6",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
            className: "w-full h-full min-h-screen sm:min-h-[calc(100vh-2rem)] px-4 sm:px-8 md:px-12 pt-4 p-0 bg-[#23232B] border-2 border-[#35353E] shadow-xl rounded-[24px] flex flex-col mx-auto my-auto",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col sm:flex-row gap-4 sm:gap-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1 flex flex-col",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "block text-sm font-medium text-gray-400 mb-2",
                                    children: "Amount"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                    lineNumber: 34,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-[#35353E] border border-[#23232B] rounded-[24px] flex items-center px-3 py-4 h-[46px]",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            src: "https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png",
                                            alt: "USDT",
                                            className: "w-6 h-6 mr-3"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                            lineNumber: 38,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                            type: "number",
                                            placeholder: "Enter Amount",
                                            className: "w-full bg-transparent border-none text-white placeholder:text-gray-500 focus:ring-0 focus:outline-none shadow-none p-0"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                            lineNumber: 43,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                    lineNumber: 37,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                            lineNumber: 33,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1 flex flex-col",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "block text-sm font-medium text-gray-400 mb-2",
                                    children: "Asset"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                    lineNumber: 52,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-[#35353E] border border-[#23232B] rounded-[24px] flex items-center px-4 sm:px-6 py-4 h-[46px]",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            src: "https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png",
                                            alt: "USDT",
                                            className: "w-6 h-6 mr-3"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                            lineNumber: 56,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-semibold text-white text-base",
                                            children: "USDT TRC20"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                            lineNumber: 61,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "ml-3 text-xs text-gray-400 hidden sm:inline",
                                            children: "Tether USDT (TRON Network)"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                            lineNumber: 64,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                    lineNumber: 55,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                            lineNumber: 51,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                    lineNumber: 31,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "h-auto sm:h-[104px] w-full bg-[#35353E] border border-[#1D8751] rounded-[24px] flex flex-col sm:flex-row items-center p-4 sm:px-8 sm:py-0 mt-4 mx-auto",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                            src: "https://res.cloudinary.com/pitz/image/upload/v1747039472/download_1_qytuya.png",
                            alt: "QR Code",
                            className: "w-[60px] h-[60px] rounded-[8px] bg-white object-contain mb-4 sm:mb-0"
                        }, void 0, false, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                            lineNumber: 74,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col justify-center sm:ml-8 flex-1 w-full sm:w-auto",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-sm text-gray-400 mb-1",
                                    children: "USDT Address"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                    lineNumber: 81,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            src: "/wallet-icon.svg",
                                            alt: "Wallet",
                                            className: "w-6 h-6"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                            lineNumber: 83,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-[#1D8751] font-mono text-base sm:text-lg select-all break-all",
                                            children: "123u341039ke3443jj1123"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                            lineNumber: 84,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                    lineNumber: 82,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                            lineNumber: 80,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "mt-4 sm:mt-0 sm:ml-auto flex items-center text-[#1D8751] text-base font-medium hover:opacity-80 focus:outline-none",
                            onClick: ()=>navigator.clipboard.writeText("123u341039ke3443jj1123"),
                            type: "button",
                            children: [
                                "Copy",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    className: "ml-1 w-5 h-5",
                                    fill: "none",
                                    stroke: "currentColor",
                                    strokeWidth: "2",
                                    viewBox: "0 0 24 24",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                            x: "9",
                                            y: "9",
                                            width: "13",
                                            height: "13",
                                            rx: "2"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                            lineNumber: 105,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                            x: "3",
                                            y: "3",
                                            width: "13",
                                            height: "13",
                                            rx: "2"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                            lineNumber: 106,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                    lineNumber: 98,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                            lineNumber: 90,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                    lineNumber: 72,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center mb-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-gray-400 text-sm font-medium mr-2",
                                    children: "Transfer Details"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                    lineNumber: 114,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    className: "w-4 h-4 text-gray-400",
                                    fill: "none",
                                    stroke: "currentColor",
                                    strokeWidth: "2",
                                    viewBox: "0 0 24 24",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                            cx: "12",
                                            cy: "12",
                                            r: "10"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                            lineNumber: 124,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                            x1: "12",
                                            y1: "16",
                                            x2: "12",
                                            y2: "12"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                            lineNumber: 125,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                            x1: "12",
                                            y1: "8",
                                            x2: "12.01",
                                            y2: "8"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                            lineNumber: 126,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                    lineNumber: 117,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                            lineNumber: 113,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "border border-[#1D8751] rounded-[16px] bg-[#23232B] px-4 sm:px-6 py-4 mb-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center mb-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "w-3 h-3 bg-[#1D8751] rounded-full inline-block mr-3"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                            lineNumber: 131,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-white text-sm",
                                            children: "Please send the money from your own account Only"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                            lineNumber: 132,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                    lineNumber: 130,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center mb-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "w-3 h-3 bg-[#1D8751] rounded-full inline-block mr-3"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                            lineNumber: 137,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-white text-sm",
                                            children: "Put transaction ID in the description field of the bank"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                            lineNumber: 138,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                    lineNumber: 136,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "w-3 h-3 bg-[#1D8751] rounded-full inline-block mr-3"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                            lineNumber: 143,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-white text-sm",
                                            children: "Please note, If you do not follow above conditions, we will reject your transaction and send you back your money."
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                            lineNumber: 144,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                    lineNumber: 142,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                            lineNumber: 129,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                    lineNumber: 112,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "border border-[#FFA500] rounded-[16px] bg-[#23232B] px-4 sm:px-6 py-4 mb-6 flex flex-col",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center mb-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-white font-medium mr-2",
                                    children: "Upload Documents"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                    lineNumber: 155,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "flex items-center cursor-pointer",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "file",
                                            accept: "image/*",
                                            className: "hidden",
                                            onChange: handleFileChange
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                            lineNumber: 159,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            className: "w-6 h-6 text-[#FFA500]",
                                            fill: "none",
                                            stroke: "currentColor",
                                            strokeWidth: "2",
                                            viewBox: "0 0 24 24",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    d: "M12 16V4m0 0l-4 4m4-4l4 4",
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                                    lineNumber: 172,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                                    x: "4",
                                                    y: "16",
                                                    width: "16",
                                                    height: "4",
                                                    rx: "2"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                                    lineNumber: 177,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                            lineNumber: 165,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                    lineNumber: 158,
                                    columnNumber: 13
                                }, this),
                                selectedFile && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "ml-3 text-xs text-gray-400 truncate max-w-[200px] sm:max-w-none",
                                    children: selectedFile.name
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                                    lineNumber: 181,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                            lineNumber: 154,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-gray-400",
                            children: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
                        }, void 0, false, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                            lineNumber: 186,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                    lineNumber: 153,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center mb-8",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "checkbox",
                            id: "confirm",
                            className: "accent-[#1D8751] w-5 h-5 mr-2 rounded-full"
                        }, void 0, false, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                            lineNumber: 196,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            htmlFor: "confirm",
                            className: "text-white text-sm select-none",
                            children: "I confirm that I sent the payment"
                        }, void 0, false, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                            lineNumber: 201,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                    lineNumber: 195,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col sm:flex-row gap-4 sm:gap-6 mb-8",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "w-full sm:flex-1 py-3 rounded-[16px] border border-[#5A5A6E] text-white bg-transparent hover:bg-[#35353E] transition text-lg font-medium",
                            type: "button",
                            children: "Cancel"
                        }, void 0, false, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                            lineNumber: 208,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "w-full sm:flex-1 py-3 rounded-[16px] bg-[#1D8751] text-white text-lg font-medium hover:bg-[#17693e] transition",
                            type: "submit",
                            children: "Deposit"
                        }, void 0, false, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                            lineNumber: 214,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
                    lineNumber: 207,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
            lineNumber: 29,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx",
        lineNumber: 28,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = Deposit;
}}),
"[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Card.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/fa/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/data.ts [app-ssr] (ecmascript)");
;
;
;
;
;
const Withdraw = ()=>{
    const [isClient, setIsClient] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [asset, setAsset] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [network, setNetwork] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [walletType, setWalletType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [amount, setAmount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [usdtAddress, setUsdtAddress] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setIsClient(true);
        setAsset(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ASSETS"][0].value);
        setNetwork(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NETWORKS"][0].value);
        setWalletType(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WALLET_TYPES"][0].value);
    }, []);
    const receiveAmount = amount ? Math.max(0, parseFloat(amount) - __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NETWORK_FEE"]).toFixed(5) : "0.00000";
    if (!isClient) {
        return null; // or a loading skeleton
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex justify-center items-center min-h-screen w-full pt-6",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
            className: "w-full h-full min-h-screen sm:min-h-[calc(100vh-2rem)] px-4 sm:px-8 md:px-12 pt-4 p-0 bg-[#23232B] border-2 border-[#35353E] shadow-xl rounded-[24px] flex flex-col mx-auto my-auto",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col sm:flex-row gap-4 mb-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1 flex flex-col",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "block text-xs font-medium text-gray-400 mb-1",
                                    children: "Asset"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                    lineNumber: 41,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "relative",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            className: "w-full bg-[#35353E] border border-[#23232B] rounded-[18px] text-white py-3 pl-10 pr-4 appearance-none focus:outline-none",
                                            value: asset,
                                            onChange: (e)=>setAsset(e.target.value),
                                            children: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ASSETS"].map((a)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: a.value,
                                                    children: a.label
                                                }, a.value, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                                    lineNumber: 51,
                                                    columnNumber: 19
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                            lineNumber: 45,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            src: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ASSETS"][0].icon,
                                            alt: "asset",
                                            className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                            lineNumber: 56,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                    lineNumber: 44,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                            lineNumber: 40,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1 flex flex-col",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "block text-xs font-medium text-gray-400 mb-1",
                                    children: "Network"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                    lineNumber: 65,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "relative",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            className: "w-full bg-[#35353E] border border-[#23232B] rounded-[18px] text-white py-3 pl-10 pr-4 appearance-none focus:outline-none",
                                            value: network,
                                            onChange: (e)=>setNetwork(e.target.value),
                                            children: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NETWORKS"].map((n)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: n.value,
                                                    children: n.label
                                                }, n.value, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                                    lineNumber: 75,
                                                    columnNumber: 19
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                            lineNumber: 69,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            src: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NETWORKS"][0].icon,
                                            alt: "network",
                                            className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                            lineNumber: 80,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                    lineNumber: 68,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                            lineNumber: 64,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                    lineNumber: 38,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "block text-xs font-medium text-gray-400 mb-1",
                            children: "Wallet Type"
                        }, void 0, false, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                            lineNumber: 91,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-wrap gap-2",
                            children: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WALLET_TYPES"].map((w)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: `flex items-center gap-2 px-3 sm:px-4 py-2 rounded-[12px] border ${walletType === w.value ? "border-[#1D8751] bg-[#23232B]" : "border-[#35353E] bg-[#35353E]"} text-white text-sm font-medium focus:outline-none`,
                                    onClick: ()=>setWalletType(w.value),
                                    type: "button",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            src: w.icon,
                                            alt: "wallet",
                                            className: "w-5 h-5"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                            lineNumber: 106,
                                            columnNumber: 17
                                        }, this),
                                        w.label
                                    ]
                                }, w.value, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                    lineNumber: 96,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                            lineNumber: 94,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                    lineNumber: 90,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col sm:flex-row gap-4 mb-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1 flex flex-col",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "block text-xs font-medium text-gray-400 mb-1",
                                    children: "I want to withdraw"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                    lineNumber: 117,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "relative flex items-center py-3 pl-10 pr-4 h-[55px] bg-[#35353E] border border-[#23232B] rounded-[18px] px-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-[#1D8751] text-lg font-semibold mr-2",
                                            children: "$"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                            lineNumber: 121,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "number",
                                            className: "w-full bg-transparent border-none text-white placeholder:text-gray-500 focus:ring-0 focus:outline-none shadow-none p-0 text-lg",
                                            placeholder: "0",
                                            value: amount,
                                            onChange: (e)=>setAmount(e.target.value),
                                            min: "0"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                            lineNumber: 124,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "ml-2 text-xs flex text-gray-400",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-[#1D8751]",
                                                    children: "Max."
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                                    lineNumber: 133,
                                                    columnNumber: 17
                                                }, this),
                                                " USDT"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                            lineNumber: 132,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                    lineNumber: 120,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                            lineNumber: 116,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1 flex flex-col",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "text-xs flex flex-col sm:flex-row sm:justify-between font-medium text-gray-400 mb-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: "I will Receive"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                            lineNumber: 140,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "mt-1 sm:mt-0",
                                            children: [
                                                "Network Fee",
                                                " ",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-[#1D8751]",
                                                    children: [
                                                        "$",
                                                        __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NETWORK_FEE"]
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                                    lineNumber: 143,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                            lineNumber: 141,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                    lineNumber: 139,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "relative flex items-center py-3 pl-10 pr-4 bg-[#35353E] border border-[#23232B] rounded-[18px] px-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            src: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ASSETS"][0].icon,
                                            alt: "usdt",
                                            className: "w-5 h-5 mr-2"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                            lineNumber: 147,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-[#1D8751] text-base sm:text-lg font-semibold",
                                            children: [
                                                receiveAmount,
                                                " USDT"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                            lineNumber: 148,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "ml-auto text-xs text-gray-400 flex items-center gap-1",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "relative group",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                        className: "w-4 h-4 ml-1 text-gray-400 cursor-pointer",
                                                        fill: "none",
                                                        stroke: "currentColor",
                                                        strokeWidth: "2",
                                                        viewBox: "0 0 24 24",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                                cx: "12",
                                                                cy: "12",
                                                                r: "10"
                                                            }, void 0, false, {
                                                                fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                                                lineNumber: 160,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                                x1: "12",
                                                                y1: "16",
                                                                x2: "12",
                                                                y2: "12"
                                                            }, void 0, false, {
                                                                fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                                                lineNumber: 161,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                                x1: "12",
                                                                y1: "8",
                                                                x2: "12.01",
                                                                y2: "8"
                                                            }, void 0, false, {
                                                                fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                                                lineNumber: 162,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                                        lineNumber: 153,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-8 bg-[#23232B] text-xs text-white px-3 py-2 rounded shadow-lg border border-[#35353E] w-56 z-10",
                                                        children: "A network fee will be deducted from withdrawals, covering the costs of blockchain transactions."
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                                        lineNumber: 164,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                                lineNumber: 152,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                            lineNumber: 151,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                    lineNumber: 146,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                            lineNumber: 138,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                    lineNumber: 114,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "block text-xs font-medium text-gray-400 mb-1",
                            children: "USDT Address"
                        }, void 0, false, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                            lineNumber: 176,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "text",
                            className: "w-full bg-[#35353E] border border-[#23232B] rounded-[12px] text-white py-3 px-4 placeholder:text-gray-500 focus:ring-0 focus:outline-none shadow-none text-base",
                            placeholder: "Type in here your USDT TRC20 (TRON) Wallet Address",
                            value: usdtAddress,
                            onChange: (e)=>setUsdtAddress(e.target.value)
                        }, void 0, false, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                            lineNumber: 179,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                    lineNumber: 175,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-8",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center mb-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-gray-400 text-sm font-medium mr-2",
                                    children: "Transfer Details"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                    lineNumber: 191,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    className: "w-4 h-4 text-gray-400",
                                    fill: "none",
                                    stroke: "currentColor",
                                    strokeWidth: "2",
                                    viewBox: "0 0 24 24",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                            cx: "12",
                                            cy: "12",
                                            r: "10"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                            lineNumber: 201,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                            x1: "12",
                                            y1: "16",
                                            x2: "12",
                                            y2: "12"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                            lineNumber: 202,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                            x1: "12",
                                            y1: "8",
                                            x2: "12.01",
                                            y2: "8"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                            lineNumber: 203,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                    lineNumber: 194,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                            lineNumber: 190,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "border border-[#1D8751] rounded-[16px] bg-[#23232B] px-4 sm:px-6 py-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center mb-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FaCheckCircle"], {
                                            className: "text-[#1D8751] mr-3"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                            lineNumber: 208,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-white text-sm",
                                            children: "Please send the money from your own account Only"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                            lineNumber: 209,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                    lineNumber: 207,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center mb-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FaCheckCircle"], {
                                            className: "text-[#1D8751] mr-3"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                            lineNumber: 214,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-white text-sm",
                                            children: "Put transaction ID in the description field of the bank"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                            lineNumber: 215,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                    lineNumber: 213,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FaCheckCircle"], {
                                            className: "text-[#1D8751] mr-3"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                            lineNumber: 220,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-white text-sm",
                                            children: "Please note, if you do not follow above conditions, we will reject your transaction and send you back your money."
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                            lineNumber: 221,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                                    lineNumber: 219,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                            lineNumber: 206,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                    lineNumber: 189,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col sm:flex-row gap-4 sm:gap-6 mb-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "w-full sm:flex-1 py-3 rounded-[16px] border border-[#5A5A6E] text-white bg-transparent hover:bg-[#35353E] transition text-lg font-medium",
                            type: "button",
                            children: "Cancel"
                        }, void 0, false, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                            lineNumber: 231,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "w-full sm:flex-1 py-3 rounded-[16px] bg-[#E23D3A] text-white text-lg font-medium hover:bg-[#17693e] transition",
                            type: "submit",
                            children: "Withdraw"
                        }, void 0, false, {
                            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                            lineNumber: 237,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
                    lineNumber: 230,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
            lineNumber: 36,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx",
        lineNumber: 35,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = Withdraw;
}}),
"[project]/features/p2p/components/tabs/P2PDashboard.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pdashboard$2f$Available$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/ui/p2pdashboard/Available.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pdashboard$2f$P2PCharts$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/ui/p2pdashboard/P2PCharts.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pdashboard$2f$Overview$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/ui/p2pdashboard/Overview.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pdashboard$2f$P2pWallet$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/ui/p2pdashboard/P2pWallet.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pdashboard$2f$UserCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/ui/p2pdashboard/UserCard.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pdashboard$2f$sections$2f$Deposit$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/ui/p2pdashboard/sections/Deposit.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pdashboard$2f$sections$2f$Withdraw$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/ui/p2pdashboard/sections/Withdraw.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
;
const P2PDashboard = ()=>{
    const [isOpenForm, setIsOpenForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pdashboard$2f$UserCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/features/p2p/components/tabs/P2PDashboard.tsx",
                lineNumber: 18,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col lg:flex-row  gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-full lg:w-[70%] lg:flex-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pdashboard$2f$P2pWallet$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                isOpenForm: isOpenForm,
                                setIsOpenForm: setIsOpenForm
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/tabs/P2PDashboard.tsx",
                                lineNumber: 21,
                                columnNumber: 11
                            }, this),
                            isOpenForm === "deposit" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pdashboard$2f$sections$2f$Deposit$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                fileName: "[project]/features/p2p/components/tabs/P2PDashboard.tsx",
                                lineNumber: 22,
                                columnNumber: 40
                            }, this),
                            isOpenForm === "withdraw" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pdashboard$2f$sections$2f$Withdraw$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                fileName: "[project]/features/p2p/components/tabs/P2PDashboard.tsx",
                                lineNumber: 23,
                                columnNumber: 41
                            }, this),
                            isOpenForm === "" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pdashboard$2f$Available$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                        fileName: "[project]/features/p2p/components/tabs/P2PDashboard.tsx",
                                        lineNumber: 27,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pdashboard$2f$P2PCharts$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                        fileName: "[project]/features/p2p/components/tabs/P2PDashboard.tsx",
                                        lineNumber: 28,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/p2p/components/tabs/P2PDashboard.tsx",
                        lineNumber: 20,
                        columnNumber: 9
                    }, this),
                    isOpenForm === "" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-full lg:w-[28%] lg:flex-shrink-0",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pdashboard$2f$Overview$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                            fileName: "[project]/features/p2p/components/tabs/P2PDashboard.tsx",
                            lineNumber: 34,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/features/p2p/components/tabs/P2PDashboard.tsx",
                        lineNumber: 33,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/p2p/components/tabs/P2PDashboard.tsx",
                lineNumber: 19,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/p2p/components/tabs/P2PDashboard.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = P2PDashboard;
}}),
"[project]/features/p2p/components/ui/market/TopButtons.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Button.tsx [app-ssr] (ecmascript)");
"use client";
;
;
const TopButtons = ({ activeTab, setActiveTab })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex border border-[#35353E] rounded-[9px] overflow-hidden w-fit bg-transparent",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                onClick: ()=>setActiveTab("buy"),
                variant: activeTab === "buy" ? "primary" : "ghost",
                size: "md",
                className: "border-r border-[#35353E] rounded-none font-semibold min-w-[90px] h-12 transition-all duration-200",
                children: "Buy"
            }, void 0, false, {
                fileName: "[project]/features/p2p/components/ui/market/TopButtons.tsx",
                lineNumber: 15,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                onClick: ()=>setActiveTab("sell"),
                variant: activeTab === "sell" ? "primary" : "ghost",
                size: "md",
                className: "rounded-none font-semibold min-w-[90px] h-12 transition-all duration-200",
                children: "Sell"
            }, void 0, false, {
                fileName: "[project]/features/p2p/components/ui/market/TopButtons.tsx",
                lineNumber: 23,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/p2p/components/ui/market/TopButtons.tsx",
        lineNumber: 14,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = TopButtons;
}}),
"[project]/features/p2p/components/Common/Select.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/styles/tokens.ts [app-ssr] (ecmascript)");
;
;
const Select = ({ options, className = "", placeholder, borderColor = __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border, bgColor = __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.card, value, ...props })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
        className: `bg-[#35353e] border border-[${borderColor}] rounded-lg px-4 py-2 text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}] focus:outline-none focus:border-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.primary}] transition ${className}`,
        value: value,
        ...props,
        children: [
            placeholder && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                value: "",
                disabled: true,
                children: placeholder
            }, void 0, false, {
                fileName: "[project]/features/p2p/components/Common/Select.tsx",
                lineNumber: 33,
                columnNumber: 9
            }, this),
            options.map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                    value: option.value,
                    className: "bg-[#35353e]",
                    children: option.label
                }, option.value, false, {
                    fileName: "[project]/features/p2p/components/Common/Select.tsx",
                    lineNumber: 38,
                    columnNumber: 9
                }, this))
        ]
    }, void 0, true, {
        fileName: "[project]/features/p2p/components/Common/Select.tsx",
        lineNumber: 27,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = Select;
}}),
"[project]/features/p2p/components/ui/market/Table.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/styles/tokens.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/fa/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$thumbs$2d$up$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ThumbsUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/thumbs-up.js [app-ssr] (ecmascript) <export default as ThumbsUp>");
;
;
;
;
;
;
const paymentColors = [
    __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.primary,
    __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.secondary,
    __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textSecondary,
    __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.primary,
    __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.brand.secondary
];
const MarketTable = ({ data })=>{
    const [currentPage, setCurrentPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "overflow-x-auto rounded-2xl",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `min-w-[800px] w-full border overflow-hidden bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.card}] border-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}]`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `grid grid-cols-5 py-3 px-4 border-b bg-[#35353E] border-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}]`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-xs font-semibold text-[#788099] min-w-[200px]",
                                children: "Advertiser"
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                lineNumber: 55,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-xs font-semibold text-[#788099] min-w-[120px]",
                                children: "Commission"
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                lineNumber: 58,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-xs font-semibold text-[#788099] min-w-[180px]",
                                children: "Available/Order Limit"
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                lineNumber: 61,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-xs font-semibold text-[#788099] min-w-[200px]",
                                children: "Payment"
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                lineNumber: 64,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-xs font-semibold text-right text-[#788099] min-w-[120px]",
                                children: "Trade"
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                lineNumber: 67,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                        lineNumber: 52,
                        columnNumber: 11
                    }, this),
                    paginatedData.map((row, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `grid grid-cols-5 items-center py-4 px-4 border-b last:border-b-0 border-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}]`,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-col gap-1 min-w-[200px]",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "bg-[#1D8751] text-white h-10 w-10 rounded-[10px] text-xs font-bold px-2 py-0.5 justify-center mr-1 flex items-center gap-1",
                                                    children: "CA"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                                    lineNumber: 80,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `font-medium flex items-center text-sm text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                                    children: [
                                                        row.advertiser,
                                                        " ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FaCheckCircle"], {
                                                            className: "text-[#FFD600] ml-1",
                                                            title: "Verified"
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                                            lineNumber: 87,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                                    lineNumber: 83,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                            lineNumber: 79,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-2 flex-wrap",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs text-[#8C8CA1]",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[#1D8751]",
                                                        children: row.orders
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                                        lineNumber: 95,
                                                        columnNumber: 21
                                                    }, this),
                                                    " Orders | ",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[#1D8751]",
                                                        children: row.completion
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                                        lineNumber: 96,
                                                        columnNumber: 23
                                                    }, this),
                                                    " ",
                                                    "Completion"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                                lineNumber: 94,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                            lineNumber: 93,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-2 mt-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "flex items-center gap-1 text-xs text-[#1D8751] font-semibold bg-[#1D8751]/10 px-2 py-0.5 rounded",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$thumbs$2d$up$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ThumbsUp$3e$__["ThumbsUp"], {
                                                            height: 10,
                                                            className: "text-[#1D8751] text-xs"
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                                            lineNumber: 102,
                                                            columnNumber: 21
                                                        }, this),
                                                        " ",
                                                        "95%"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                                    lineNumber: 101,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "flex items-center gap-1 text-xs text-[#1D8751] font-semibold bg-[#1D8751]/10 px-2 py-0.5 rounded",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FaRegClock"], {
                                                            className: "text-[#1D8751] text-xs"
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                                            lineNumber: 106,
                                                            columnNumber: 21
                                                        }, this),
                                                        " 20 min"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                                    lineNumber: 105,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                            lineNumber: 100,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                    lineNumber: 78,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `text-sm font-semibold ml-7 text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}] min-w-[120px]`,
                                    children: row.commission
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                    lineNumber: 111,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-col min-w-[180px]",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: `font-semibold text-sm text-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.textTitle}]`,
                                            children: row.available
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                            lineNumber: 118,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-xs text-[#8C8CA1]",
                                            children: [
                                                "Limit:",
                                                row.limit
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                            lineNumber: 123,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                    lineNumber: 117,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-wrap gap-2 min-w-[200px]",
                                    children: row.payment.map((method, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "flex items-center gap-1 text-[14px] font-medium text-white w-1/2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FaUniversity"], {
                                                    className: "text-[#1D8751] text-xs"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                                    lineNumber: 134,
                                                    columnNumber: 21
                                                }, this),
                                                " ",
                                                method
                                            ]
                                        }, method, true, {
                                            fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                            lineNumber: 130,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                    lineNumber: 128,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex justify-end min-w-[120px]",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        width: 116,
                                        height: 35,
                                        borderRadius: 10,
                                        variant: "primary",
                                        size: "sm",
                                        className: "min-w-[90px] font-semibold",
                                        children: "BUY USDT"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                        lineNumber: 140,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                    lineNumber: 139,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, idx, true, {
                            fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                            lineNumber: 73,
                            columnNumber: 13
                        }, this)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-center items-center gap-2 py-4 bg-transparent",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setCurrentPage((p)=>Math.max(1, p - 1)),
                                disabled: currentPage === 1,
                                className: `px-3 py-1 rounded-md text-sm font-medium border border-[#35353E] bg-[#23232B] text-[#8C8CA1] ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-[#35353E]"}`,
                                children: "<"
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                lineNumber: 155,
                                columnNumber: 13
                            }, this),
                            Array.from({
                                length: totalPages
                            }, (_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setCurrentPage(i + 1),
                                    className: `px-3 py-1 rounded-md text-sm font-medium border border-[#35353E] ${currentPage === i + 1 ? "bg-[#1D8751] text-white" : "bg-[#23232B] text-[#8C8CA1] hover:bg-[#35353E]"}`,
                                    children: i + 1
                                }, i, false, {
                                    fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                    lineNumber: 167,
                                    columnNumber: 15
                                }, this)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setCurrentPage((p)=>Math.min(totalPages, p + 1)),
                                disabled: currentPage === totalPages,
                                className: `px-3 py-1 rounded-md text-sm font-medium border border-[#35353E] bg-[#23232B] text-[#8C8CA1] ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-[#35353E]"}`,
                                children: ">"
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                                lineNumber: 179,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                        lineNumber: 154,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
                lineNumber: 48,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
            lineNumber: 47,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/features/p2p/components/ui/market/Table.tsx",
        lineNumber: 46,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = MarketTable;
}}),
"[project]/features/p2p/components/ui/market/MarketTransactions.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Input.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Select$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Select.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/fa/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/styles/tokens.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/data.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$market$2f$Table$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/ui/market/Table.tsx [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
const currencyOptions = [
    {
        label: "USD",
        value: "USD"
    },
    {
        label: "EUR",
        value: "EUR"
    },
    {
        label: "BTC",
        value: "BTC"
    }
];
const paymentTypeOptions = [
    {
        label: "Payment Type",
        value: ""
    },
    {
        label: "Bank Transfer",
        value: "bank"
    },
    {
        label: "PayPal",
        value: "paypal"
    }
];
const providerOptions = [
    {
        label: "Select Provider",
        value: ""
    },
    {
        label: "Provider 1",
        value: "provider1"
    },
    {
        label: "Provider 2",
        value: "provider2"
    }
];
const MarketTransactions = ()=>{
    const [amount, setAmount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [currency, setCurrency] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("USD");
    const [paymentType, setPaymentType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [provider, setProvider] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-4 w-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col md:flex-row items-start md:items-center justify-between gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `flex items-center w-full sm:w-auto bg-[#1D1D23] border border-[#35353E] rounded-md`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        bgColor: __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.card,
                                        borderColor: __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.card,
                                        type: "number",
                                        value: amount,
                                        onChange: (e)=>setAmount(e.target.value),
                                        placeholder: "Enter amount",
                                        className: "bg-transparent border-none focus:ring-0 w-full sm:w-28"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/market/MarketTransactions.tsx",
                                        lineNumber: 41,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Select$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        bgColor: __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.card,
                                        borderColor: __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.card,
                                        value: currency,
                                        onChange: (e)=>setCurrency(e.target.value),
                                        options: currencyOptions,
                                        className: "bg-transparent border-none focus:ring-0 w-full sm:w-16"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/market/MarketTransactions.tsx",
                                        lineNumber: 50,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/features/p2p/components/ui/market/MarketTransactions.tsx",
                                lineNumber: 38,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Select$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                bgColor: __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.card,
                                borderColor: __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border,
                                value: paymentType,
                                onChange: (e)=>setPaymentType(e.target.value),
                                options: paymentTypeOptions,
                                placeholder: "Payment Type",
                                className: "w-full sm:w-48 text-[#788099]"
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/market/MarketTransactions.tsx",
                                lineNumber: 59,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Select$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                bgColor: __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.card,
                                borderColor: __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border,
                                value: provider,
                                onChange: (e)=>setProvider(e.target.value),
                                options: providerOptions,
                                placeholder: "Select Provider",
                                className: "w-full sm:w-48 text-[#788099]"
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/market/MarketTransactions.tsx",
                                lineNumber: 68,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                borderColor: "#35353E",
                                width: 44,
                                height: 40,
                                borderRadius: 10,
                                variant: "outline",
                                size: "md",
                                className: "!bg-[#23232B] !border-[#35353E] border rounded-md",
                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FaFilter"], {
                                    className: "text-[#1D8751]",
                                    size: 26
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/market/MarketTransactions.tsx",
                                    lineNumber: 85,
                                    columnNumber: 19
                                }, void 0)
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/market/MarketTransactions.tsx",
                                lineNumber: 77,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/p2p/components/ui/market/MarketTransactions.tsx",
                        lineNumber: 37,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        width: 145,
                        height: 40,
                        borderRadius: 9,
                        variant: "primary",
                        size: "md",
                        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FaSyncAlt"], {}, void 0, false, {
                            fileName: "[project]/features/p2p/components/ui/market/MarketTransactions.tsx",
                            lineNumber: 95,
                            columnNumber: 17
                        }, void 0),
                        iconPosition: "left",
                        className: "w-full sm:w-auto",
                        children: "Refresh"
                    }, void 0, false, {
                        fileName: "[project]/features/p2p/components/ui/market/MarketTransactions.tsx",
                        lineNumber: 89,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/p2p/components/ui/market/MarketTransactions.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full overflow-x-auto",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$market$2f$Table$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    data: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["marketTableData"]
                }, void 0, false, {
                    fileName: "[project]/features/p2p/components/ui/market/MarketTransactions.tsx",
                    lineNumber: 103,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/features/p2p/components/ui/market/MarketTransactions.tsx",
                lineNumber: 102,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/p2p/components/ui/market/MarketTransactions.tsx",
        lineNumber: 35,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = MarketTransactions;
}}),
"[project]/features/p2p/components/tabs/Market.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$market$2f$TopButtons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/ui/market/TopButtons.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$market$2f$MarketTransactions$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/ui/market/MarketTransactions.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
const Market = ()=>{
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("buy");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-4 w-full h-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$market$2f$TopButtons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                activeTab: activeTab,
                setActiveTab: (tab)=>setActiveTab(tab)
            }, void 0, false, {
                fileName: "[project]/features/p2p/components/tabs/Market.tsx",
                lineNumber: 12,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$market$2f$MarketTransactions$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/features/p2p/components/tabs/Market.tsx",
                lineNumber: 16,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/p2p/components/tabs/Market.tsx",
        lineNumber: 11,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = Market;
}}),
"[project]/features/p2p/components/ui/orders/Filters.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Select$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Select.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/data.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$gr$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/gr/index.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
const Filters = ()=>{
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("all");
    const [selectedToken, setSelectedToken] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokenOptions"][0].value);
    const [selectedCurrency, setSelectedCurrency] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["currencyOptions"][0].value);
    const [selectedType, setSelectedType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typeOptions"][0].value);
    const [selectedStatus, setSelectedStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["statusOptions"][0].value);
    const [selectedDate, setSelectedDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["dateOptions"][0].value);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full flex flex-col ",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-0 bg-transparent rounded-[10px] border border-[#1D8751] w-full sm:w-fit px-1 py-1 overflow-x-auto",
                        children: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["orderStatusTabs"].map((tab)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                variant: activeTab === tab.id ? "primary" : "ghost",
                                size: "md",
                                borderRadius: 10,
                                className: `px-4 py-2 font-medium text-sm transition-all flex items-center gap-1 shadow-none border-none min-w-[100px] ${activeTab === tab.id ? "bg-[#1D8751] text-white" : "bg-transparent text-[#1D8751] hover:bg-[#1D8751]/10"}`,
                                onClick: ()=>setActiveTab(tab.id),
                                children: [
                                    tab.label,
                                    tab.count && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "ml-1 text-xs bg-[#23272F] text-[#FBBF24] px-2 py-0.5 rounded-full",
                                        children: tab.count
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                                        lineNumber: 45,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, tab.id, true, {
                                fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                                lineNumber: 31,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                        lineNumber: 29,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "w-full sm:w-auto rounded-[24px] flex items-center justify-center gap-2 border border-[#1D8751] text-[#1D8751] px-4 py-2 font-medium text-sm hover:bg-[#1D8751]/10 transition-all bg-transparent",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                width: "18",
                                height: "18",
                                fill: "none",
                                viewBox: "0 0 24 24",
                                stroke: "#FBBF24",
                                className: "mr-1",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: "2",
                                    d: "M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                                    lineNumber: 61,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                                lineNumber: 53,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[#1D8751]",
                                children: "Unread Message(s)"
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                                lineNumber: 68,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                        lineNumber: 52,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                lineNumber: 28,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex w-full flex-wrap gap-4 items-center justify-between bg-transparent mt-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 bg-[#1D1D23] border border-[#444454] p-1 rounded-[24px] w-full sm:w-auto min-w-[200px]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "flex items-center justify-center",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    src: "https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png",
                                    alt: "Tether",
                                    width: 20,
                                    height: 20
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                                    lineNumber: 76,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                                lineNumber: 75,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-white font-medium text-sm",
                                children: "Tether"
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                                lineNumber: 83,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Select$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                options: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["currencyOptions"],
                                value: selectedCurrency,
                                onChange: (e)=>setSelectedCurrency(e.target.value),
                                className: "bg-transparent w-full border-none text-white text-sm focus:ring-0 focus:outline-none rounded-[24px]",
                                borderColor: "#444454",
                                bgColor: "#35353e"
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                                lineNumber: 84,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                        lineNumber: 74,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 bg-[#1D1D23] border border-[#444454] p-1 rounded-[24px] w-full sm:w-auto min-w-[200px]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[#1D8751]",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    src: "https://res.cloudinary.com/pitz/image/upload/v1746710370/coins-rotate_d278mb.png",
                                    alt: "Filter",
                                    width: 20,
                                    height: 20
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                                    lineNumber: 96,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                                lineNumber: 95,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Select$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                options: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typeOptions"],
                                value: selectedType,
                                onChange: (e)=>setSelectedType(e.target.value),
                                className: "bg-transparent w-full border-none text-white text-sm focus:ring-0 focus:outline-none rounded-[24px]",
                                borderColor: "#444454",
                                bgColor: "#35353e"
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                                lineNumber: 103,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                        lineNumber: 94,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 bg-[#1D1D23] border border-[#444454] p-1 rounded-[24px] w-full sm:w-auto min-w-[200px]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[#1D8751]",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$gr$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GrStatusGood"], {}, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                                    lineNumber: 115,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                                lineNumber: 114,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Select$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                options: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["statusOptions"],
                                value: selectedStatus,
                                onChange: (e)=>setSelectedStatus(e.target.value),
                                className: "bg-transparent border-none text-[#788099] text-sm w-full focus:ring-0 focus:outline-none rounded-[24px]",
                                borderColor: "#444454",
                                bgColor: "#35353e"
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                                lineNumber: 117,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                        lineNumber: 113,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 bg-[#1D1D23] border border-[#444454] p-1 rounded-[24px] w-full sm:w-auto min-w-[200px]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[#1D8751]",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    width: "20",
                                    height: "20",
                                    fill: "none",
                                    viewBox: "0 0 24 24",
                                    stroke: "#1D8751",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                            x: "3",
                                            y: "4",
                                            width: "18",
                                            height: "18",
                                            rx: "2",
                                            stroke: "#1D8751",
                                            strokeWidth: "2"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                                            lineNumber: 136,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            strokeWidth: "2",
                                            d: "M16 2v4M8 2v4M3 10h18"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                                            lineNumber: 145,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                                    lineNumber: 129,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                                lineNumber: 128,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Select$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                options: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["dateOptions"],
                                value: selectedDate,
                                onChange: (e)=>setSelectedDate(e.target.value),
                                className: "bg-transparent border-none text-[#788099] text-sm w-full focus:ring-0 focus:outline-none rounded-[24px]",
                                borderColor: "#444454",
                                bgColor: "#35353e"
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                                lineNumber: 153,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                        lineNumber: 127,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
                lineNumber: 72,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/p2p/components/ui/orders/Filters.tsx",
        lineNumber: 26,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = Filters;
}}),
"[project]/features/p2p/components/ui/orders/OrdersTransactions.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Table$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Table.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/data.ts [app-ssr] (ecmascript)");
;
;
;
const OrdersTransactions = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full overflow-x-auto",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Table$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Table"], {
            type: "orders",
            title: "",
            data: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ordersTransactionsData"]
        }, void 0, false, {
            fileName: "[project]/features/p2p/components/ui/orders/OrdersTransactions.tsx",
            lineNumber: 8,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/features/p2p/components/ui/orders/OrdersTransactions.tsx",
        lineNumber: 7,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = OrdersTransactions;
}}),
"[project]/features/p2p/components/tabs/Orders.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$orders$2f$Filters$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/ui/orders/Filters.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$orders$2f$OrdersTransactions$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/ui/orders/OrdersTransactions.tsx [app-ssr] (ecmascript)");
;
;
;
const Orders = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-4 w-full h-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$orders$2f$Filters$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/features/p2p/components/tabs/Orders.tsx",
                lineNumber: 8,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col  w-full",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$orders$2f$OrdersTransactions$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/features/p2p/components/tabs/Orders.tsx",
                    lineNumber: 10,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/features/p2p/components/tabs/Orders.tsx",
                lineNumber: 9,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/p2p/components/tabs/Orders.tsx",
        lineNumber: 7,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = Orders;
}}),
"[project]/features/p2p/components/tabs/NotFound.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
;
const NotFound = ({ searchQuery, onClearSearch })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white rounded-xl shadow-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-20 h-20 mb-6 text-primary-600 opacity-80",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                    xmlns: "http://www.w3.org/2000/svg",
                    fill: "none",
                    viewBox: "0 0 24 24",
                    strokeWidth: 1.5,
                    stroke: "currentColor",
                    className: "w-full h-full",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        d: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    }, void 0, false, {
                        fileName: "[project]/features/p2p/components/tabs/NotFound.tsx",
                        lineNumber: 20,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/features/p2p/components/tabs/NotFound.tsx",
                    lineNumber: 12,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/features/p2p/components/tabs/NotFound.tsx",
                lineNumber: 11,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-2xl font-semibold mb-4 text-gray-900",
                children: "No Results Found"
            }, void 0, false, {
                fileName: "[project]/features/p2p/components/tabs/NotFound.tsx",
                lineNumber: 28,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-gray-600 mb-8 max-w-md",
                children: searchQuery ? `We couldn't find any matches for "${searchQuery}". Try adjusting your search or filters.` : "No items match your current search criteria. Try adjusting your filters or search terms."
            }, void 0, false, {
                fileName: "[project]/features/p2p/components/tabs/NotFound.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this),
            onClearSearch && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: onClearSearch,
                className: "px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200",
                children: "Clear Search"
            }, void 0, false, {
                fileName: "[project]/features/p2p/components/tabs/NotFound.tsx",
                lineNumber: 39,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/p2p/components/tabs/NotFound.tsx",
        lineNumber: 10,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = NotFound;
}}),
"[project]/features/p2p/components/ui/p2pcenter/P2pProfile.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
;
const P2pProfile = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full h-[130px] rounded-[24px] border-2 border-[#35353E] flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 bg-[#1D1D23] box-border gap-4 sm:gap-0",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-4 sm:gap-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1D8751] flex items-center justify-center text-white text-xl sm:text-2xl font-bold",
                        children: "OA"
                    }, void 0, false, {
                        fileName: "[project]/features/p2p/components/ui/p2pcenter/P2pProfile.tsx",
                        lineNumber: 9,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-white text-base sm:text-lg font-medium",
                                        children: "User Name"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pcenter/P2pProfile.tsx",
                                        lineNumber: 15,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        className: "w-4 h-4 text-[#1D8751] cursor-pointer",
                                        fill: "none",
                                        stroke: "currentColor",
                                        strokeWidth: "2",
                                        viewBox: "0 0 24 24",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            d: "M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 019 17H7v-2a2 2 0 01.586-1.414z"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pcenter/P2pProfile.tsx",
                                            lineNumber: 26,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pcenter/P2pProfile.tsx",
                                        lineNumber: 19,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/features/p2p/components/ui/p2pcenter/P2pProfile.tsx",
                                lineNumber: 14,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap items-center gap-2 sm:gap-3 mt-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "flex items-center text-xs text-[#1D8751] bg-[#384B41] rounded-full px-3 py-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                className: "w-3 h-3 mr-1",
                                                fill: "none",
                                                stroke: "currentColor",
                                                strokeWidth: "2",
                                                viewBox: "0 0 24 24",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round",
                                                    d: "M5 13l4 4L19 7"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pcenter/P2pProfile.tsx",
                                                    lineNumber: 42,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/ui/p2pcenter/P2pProfile.tsx",
                                                lineNumber: 35,
                                                columnNumber: 15
                                            }, this),
                                            "Verified Merchant"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/features/p2p/components/ui/p2pcenter/P2pProfile.tsx",
                                        lineNumber: 34,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "bg-[#1D8751] text-[#ffff] text-xs font-semibold rounded-full px-4 sm:px-5 py-2",
                                        children: "Become Merchant PRO"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pcenter/P2pProfile.tsx",
                                        lineNumber: 50,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/features/p2p/components/ui/p2pcenter/P2pProfile.tsx",
                                lineNumber: 33,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/p2p/components/ui/p2pcenter/P2pProfile.tsx",
                        lineNumber: 13,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/p2p/components/ui/p2pcenter/P2pProfile.tsx",
                lineNumber: 7,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[#1D8751] text-base sm:text-lg font-medium",
                        children: "P2P Balance"
                    }, void 0, false, {
                        fileName: "[project]/features/p2p/components/ui/p2pcenter/P2pProfile.tsx",
                        lineNumber: 58,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-end gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-white text-lg sm:text-xl font-semibold",
                                children: "1900.8648 USDT"
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/p2pcenter/P2pProfile.tsx",
                                lineNumber: 62,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[#7B8191] text-base sm:text-lg",
                                children: "≈ 1,900 USD"
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/p2pcenter/P2pProfile.tsx",
                                lineNumber: 65,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/p2p/components/ui/p2pcenter/P2pProfile.tsx",
                        lineNumber: 61,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[#7B8191] text-sm",
                        children: [
                            "In escrow: ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-white font-medium",
                                children: "800 USD"
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/p2pcenter/P2pProfile.tsx",
                                lineNumber: 70,
                                columnNumber: 22
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/p2p/components/ui/p2pcenter/P2pProfile.tsx",
                        lineNumber: 69,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/p2p/components/ui/p2pcenter/P2pProfile.tsx",
                lineNumber: 57,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/p2p/components/ui/p2pcenter/P2pProfile.tsx",
        lineNumber: 5,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = P2pProfile;
}}),
"[project]/features/p2p/components/ui/p2pcenter/Stats.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/data.ts [app-ssr] (ecmascript)");
;
;
const stats = [
    {
        value: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["statsData"].trades,
        label: "Trades"
    },
    {
        value: `${__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["statsData"].completionRate}%`,
        label: "Completion rate"
    },
    {
        value: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["statsData"].avgReleaseTime
                }, void 0, false, {
                    fileName: "[project]/features/p2p/components/ui/p2pcenter/Stats.tsx",
                    lineNumber: 10,
                    columnNumber: 9
                }, this),
                " ",
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-[#A1A1AA] text-[16px] sm:text-[18px]",
                    children: "Min"
                }, void 0, false, {
                    fileName: "[project]/features/p2p/components/ui/p2pcenter/Stats.tsx",
                    lineNumber: 11,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true),
        label: "Avg. release time"
    },
    {
        value: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["statsData"].avgPayTime
                }, void 0, false, {
                    fileName: "[project]/features/p2p/components/ui/p2pcenter/Stats.tsx",
                    lineNumber: 19,
                    columnNumber: 9
                }, this),
                " ",
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-[#A1A1AA] text-[16px] sm:text-[18px]",
                    children: "Min"
                }, void 0, false, {
                    fileName: "[project]/features/p2p/components/ui/p2pcenter/Stats.tsx",
                    lineNumber: 20,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true),
        label: "Avg. pay time"
    },
    {
        value: `${__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["statsData"].rating}%`,
        label: "Rating"
    },
    {
        value: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["statsData"].totalVolume.toLocaleString()
                }, void 0, false, {
                    fileName: "[project]/features/p2p/components/ui/p2pcenter/Stats.tsx",
                    lineNumber: 29,
                    columnNumber: 9
                }, this),
                " ",
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-[#A1A1AA] text-[16px] sm:text-[18px]",
                    children: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["statsData"].currency
                }, void 0, false, {
                    fileName: "[project]/features/p2p/components/ui/p2pcenter/Stats.tsx",
                    lineNumber: 30,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true),
        label: "Total volume"
    }
];
const Stats = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full min-h-[100px] rounded-[24px] border-2 border-[#35353E] bg-[#1D1D23] p-4 sm:p-6 box-border",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 w-full",
            children: stats.map((stat, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center w-full",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-white text-[18px] sm:text-[22px] font-medium flex items-center justify-center gap-1",
                            children: stat.value
                        }, void 0, false, {
                            fileName: "[project]/features/p2p/components/ui/p2pcenter/Stats.tsx",
                            lineNumber: 45,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-[#788099] text-[13px] sm:text-[15px]",
                            children: stat.label
                        }, void 0, false, {
                            fileName: "[project]/features/p2p/components/ui/p2pcenter/Stats.tsx",
                            lineNumber: 48,
                            columnNumber: 13
                        }, this)
                    ]
                }, idx, true, {
                    fileName: "[project]/features/p2p/components/ui/p2pcenter/Stats.tsx",
                    lineNumber: 44,
                    columnNumber: 11
                }, this))
        }, void 0, false, {
            fileName: "[project]/features/p2p/components/ui/p2pcenter/Stats.tsx",
            lineNumber: 42,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/features/p2p/components/ui/p2pcenter/Stats.tsx",
        lineNumber: 41,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = Stats;
}}),
"[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Input.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Select$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Select.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/styles/tokens.ts [app-ssr] (ecmascript)");
;
;
;
;
;
;
const bankOptions = [
    {
        value: "premier",
        label: "Premier Bank",
        icon: "🏦"
    },
    {
        value: "salam",
        label: "Salam Bank",
        icon: "🏦"
    }
];
const mobileMoneyOptions = [
    {
        value: "taaj",
        label: "Taaj Money",
        icon: "💸"
    }
];
const methodOptions = [
    {
        value: "bank",
        label: "Bank Transfer"
    },
    {
        value: "mobile",
        label: "Mobile Money"
    },
    {
        value: "merchant",
        label: "Merchant"
    }
];
const PaymentMethods = ()=>{
    const [bankMethods, setBankMethods] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([
        {
            bank: "premier",
            holder: "",
            number: "",
            editable: false
        },
        {
            bank: "salam",
            holder: "",
            number: "",
            editable: false
        }
    ]);
    const [mobileMethods, setMobileMethods] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([
        {
            provider: "taaj",
            name: "Omar Ali",
            number: "123456789",
            editable: false
        }
    ]);
    const [merchantMethods, setMerchantMethods] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]); // Stub for merchant
    const [addMethodType, setAddMethodType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    // Add method handler
    const handleAddMethod = ()=>{
        if (addMethodType === "bank") {
            setBankMethods((prev)=>[
                    ...prev,
                    {
                        bank: bankOptions[0].value,
                        holder: "",
                        number: "",
                        editable: true
                    }
                ]);
        } else if (addMethodType === "mobile") {
            setMobileMethods((prev)=>[
                    ...prev,
                    {
                        provider: mobileMoneyOptions[0].value,
                        name: "",
                        number: "",
                        editable: true
                    }
                ]);
        } else if (addMethodType === "merchant") {
            setMerchantMethods((prev)=>[
                    ...prev,
                    {
                        merchant: "",
                        name: "",
                        number: "",
                        editable: true
                    }
                ]);
        }
        setAddMethodType("");
    };
    // Remove method handler
    const handleRemoveMethod = (type, idx)=>{
        if (type === "bank") {
            setBankMethods((prev)=>prev.filter((_, i)=>i !== idx));
        } else if (type === "mobile") {
            setMobileMethods((prev)=>prev.filter((_, i)=>i !== idx));
        } else if (type === "merchant") {
            setMerchantMethods((prev)=>prev.filter((_, i)=>i !== idx));
        }
    };
    // Handle input change
    const handleInputChange = (type, idx, field, value)=>{
        if (type === "bank") {
            setBankMethods((prev)=>prev.map((item, i)=>i === idx ? {
                        ...item,
                        [field]: value
                    } : item));
        } else if (type === "mobile") {
            setMobileMethods((prev)=>prev.map((item, i)=>i === idx ? {
                        ...item,
                        [field]: value
                    } : item));
        } else if (type === "merchant") {
            setMerchantMethods((prev)=>prev.map((item, i)=>i === idx ? {
                        ...item,
                        [field]: value
                    } : item));
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full min-h-[600px] bg-[#23232b] rounded-2xl p-4 text-white",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[18px] sm:text-[22px] font-semibold",
                                children: "Bank"
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                lineNumber: 119,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3 w-full sm:w-auto",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Select$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    options: methodOptions,
                                    value: addMethodType,
                                    onChange: (e)=>{
                                        const value = e.target.value;
                                        setAddMethodType("");
                                        if (value === "bank") {
                                            setBankMethods((prev)=>[
                                                    ...prev,
                                                    {
                                                        bank: bankOptions[0].value,
                                                        holder: "",
                                                        number: "",
                                                        editable: true
                                                    }
                                                ]);
                                        } else if (value === "mobile") {
                                            setMobileMethods((prev)=>[
                                                    ...prev,
                                                    {
                                                        provider: mobileMoneyOptions[0].value,
                                                        name: "",
                                                        number: "",
                                                        editable: true
                                                    }
                                                ]);
                                        } else if (value === "merchant") {
                                            setMerchantMethods((prev)=>[
                                                    ...prev,
                                                    {
                                                        merchant: "",
                                                        name: "",
                                                        number: "",
                                                        editable: true
                                                    }
                                                ]);
                                        }
                                    },
                                    placeholder: "+ Add Method",
                                    className: "w-full sm:min-w-[180px] rounded-full border-[#1D8751] bg-[#23232b]",
                                    borderColor: "#1D8751",
                                    bgColor: __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.background
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                    lineNumber: 121,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                lineNumber: 120,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                        lineNumber: 118,
                        columnNumber: 9
                    }, this),
                    bankMethods.map((method, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center mb-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            src: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg",
                                            alt: "Bank Icon",
                                            className: "w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 object-cover"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                            lineNumber: 165,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-white font-medium flex items-center text-base sm:text-lg",
                                            children: [
                                                method.bank === "premier" ? "Premier Bank" : "Salam Bank",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    className: "w-4 h-4 ml-1 text-gray-400",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    strokeWidth: 2,
                                                    viewBox: "0 0 24 24",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round",
                                                        d: "M19 9l-7 7-7-7"
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                                        lineNumber: 179,
                                                        columnNumber: 19
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                                    lineNumber: 172,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                            lineNumber: 170,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: "ml-auto text-[#1D8751] text-2xl flex items-center",
                                            title: "Delete",
                                            onClick: ()=>handleRemoveMethod("bank", idx),
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                xmlns: "http://www.w3.org/2000/svg",
                                                className: "w-5 h-5 sm:w-6 sm:h-6",
                                                fill: "none",
                                                viewBox: "0 0 24 24",
                                                stroke: "currentColor",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round",
                                                    strokeWidth: 2,
                                                    d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                                    lineNumber: 198,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                                lineNumber: 191,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                            lineNumber: 186,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                    lineNumber: 164,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-col sm:flex-row gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                            placeholder: "Account Holder",
                                            value: method.holder,
                                            className: "w-full sm:w-[539px] h-[52px] rounded-3xl border-[#353535] bg-[#353535] text-white px-[14px] py-[10px] text-base",
                                            bgColor: "#353535",
                                            borderColor: "#353535",
                                            disabled: !method.editable,
                                            onChange: (e)=>handleInputChange("bank", idx, "holder", e.target.value)
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                            lineNumber: 209,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                            placeholder: "Account Number",
                                            value: method.number,
                                            className: "w-full sm:w-[539px] h-[52px] rounded-3xl border border-[#35353E] bg-[#18181D] text-white px-[14px] py-[10px] text-base",
                                            bgColor: "#18181D",
                                            borderColor: "#35353E",
                                            disabled: !method.editable,
                                            onChange: (e)=>handleInputChange("bank", idx, "number", e.target.value)
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                            lineNumber: 220,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                    lineNumber: 208,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, idx, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                            lineNumber: 162,
                            columnNumber: 11
                        }, this))
                ]
            }, void 0, true, {
                fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                lineNumber: 117,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-[18px] sm:text-[22px] font-semibold mb-4",
                        children: "Mobile Money"
                    }, void 0, false, {
                        fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                        lineNumber: 238,
                        columnNumber: 9
                    }, this),
                    mobileMethods.map((method, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center mb-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            src: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg",
                                            alt: "Provider Icon",
                                            className: "w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 object-cover"
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                            lineNumber: 245,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-white font-medium flex items-center text-base sm:text-lg",
                                            children: [
                                                method.provider === "taaj" ? "Taaj Money" : method.provider,
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    className: "w-4 h-4 ml-1 text-gray-400",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    strokeWidth: 2,
                                                    viewBox: "0 0 24 24",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round",
                                                        d: "M19 9l-7 7-7-7"
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                                        lineNumber: 259,
                                                        columnNumber: 19
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                                    lineNumber: 252,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                            lineNumber: 250,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: "ml-auto text-[#1D8751] text-2xl flex items-center",
                                            title: "Delete",
                                            onClick: ()=>handleRemoveMethod("mobile", idx),
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                xmlns: "http://www.w3.org/2000/svg",
                                                className: "w-5 h-5 sm:w-6 sm:h-6",
                                                fill: "none",
                                                viewBox: "0 0 24 24",
                                                stroke: "currentColor",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round",
                                                    strokeWidth: 2,
                                                    d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                                    lineNumber: 278,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                                lineNumber: 271,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                            lineNumber: 266,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                    lineNumber: 244,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-col sm:flex-row gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                            placeholder: "Wallet Name",
                                            value: method.name,
                                            className: "w-full sm:w-[539px] h-[52px] rounded-3xl border-[#353535] bg-[#353535] text-white px-[14px] py-[10px] text-base",
                                            bgColor: "#353535",
                                            borderColor: "#353535",
                                            disabled: !method.editable,
                                            onChange: (e)=>handleInputChange("mobile", idx, "name", e.target.value)
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                            lineNumber: 289,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                            placeholder: "Wallet Number",
                                            value: method.number,
                                            className: "w-full sm:w-[539px] h-[52px] rounded-3xl border border-[#35353E] bg-[#18181D] text-white px-[14px] py-[10px] text-base",
                                            bgColor: "#18181D",
                                            borderColor: "#35353E",
                                            disabled: !method.editable,
                                            onChange: (e)=>handleInputChange("mobile", idx, "number", e.target.value)
                                        }, void 0, false, {
                                            fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                            lineNumber: 300,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                    lineNumber: 288,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, idx, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                            lineNumber: 242,
                            columnNumber: 11
                        }, this))
                ]
            }, void 0, true, {
                fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                lineNumber: 237,
                columnNumber: 7
            }, this),
            merchantMethods.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-[18px] sm:text-[22px] font-semibold mb-4",
                        children: "Merchant"
                    }, void 0, false, {
                        fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                        lineNumber: 319,
                        columnNumber: 11
                    }, this),
                    merchantMethods.map((method, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#1D1D23] rounded-xl p-4 sm:p-5 mb-4 border border-[#35353E]",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    placeholder: "Merchant Name",
                                    value: method.name,
                                    className: "w-full sm:flex-1 bg-[#23232b] text-white",
                                    bgColor: "#23232b",
                                    borderColor: "#35353E",
                                    disabled: !method.editable,
                                    onChange: (e)=>handleInputChange("merchant", idx, "name", e.target.value)
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                    lineNumber: 327,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    placeholder: "Merchant Number",
                                    value: method.number,
                                    className: "w-full sm:flex-1 bg-[#18181D] text-white",
                                    bgColor: "#18181D",
                                    borderColor: "#35353E",
                                    disabled: !method.editable,
                                    onChange: (e)=>handleInputChange("merchant", idx, "number", e.target.value)
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                    lineNumber: 338,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "text-[#1D8751] text-2xl flex items-center",
                                    title: "Delete",
                                    onClick: ()=>handleRemoveMethod("merchant", idx),
                                    children: "🗑️"
                                }, void 0, false, {
                                    fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                                    lineNumber: 349,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, idx, true, {
                            fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                            lineNumber: 323,
                            columnNumber: 13
                        }, this))
                ]
            }, void 0, true, {
                fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                lineNumber: 318,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-8 w-full",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    height: 40,
                    borderRadius: 24,
                    variant: "outline",
                    className: "border-2 border-[#1D8751] w-full text-white",
                    size: "md",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-white",
                        children: "Update"
                    }, void 0, false, {
                        fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                        lineNumber: 370,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                    lineNumber: 363,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
                lineNumber: 362,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx",
        lineNumber: 115,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = PaymentMethods;
}}),
"[project]/features/p2p/components/ui/p2pcenter/sections/Feedback.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/data.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/styles/tokens.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Table$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Table.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Card.tsx [app-ssr] (ecmascript)");
;
;
;
;
;
const BANK_ICON_URL = "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg";
const Feedback = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
        borderColor: `border-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.border}]`,
        width: "w-full",
        bgColor: `bg-[${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.card}]`,
        borderRadius: "rounded-[16px]",
        className: "p-4 min-h-[600px]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-[18px] sm:text-[22px] font-semibold mb-4 text-[#FFFFFF]",
                children: "Feedback"
            }, void 0, false, {
                fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/Feedback.tsx",
                lineNumber: 19,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Table$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Table"], {
                type: "feedback",
                title: "Feedback",
                data: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["feedbackTableData"]
            }, void 0, false, {
                fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/Feedback.tsx",
                lineNumber: 22,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/Feedback.tsx",
        lineNumber: 12,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = Feedback;
}}),
"[project]/features/p2p/components/ui/p2pcenter/sections/MyAdsTable.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Table$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Table.tsx [app-ssr] (ecmascript)");
;
;
const BANK_ICON_URL = "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg";
const ads = [
    {
        id: "1283979421",
        asset: "Tether US",
        assetSymbol: "USDT",
        type: "Buy",
        limit: "50,000-75,000",
        price: "148.56",
        commission: "$1.22",
        payment: [
            {
                bank: "Salam Bank",
                logo: BANK_ICON_URL
            }
        ],
        lastUpdate: "12-Jun-2023 15:33",
        status: "Published",
        date: "12-Jun-2023 15:33",
        amount: "148.56"
    }
];
const MyAdsTable = ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Table$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Table"], {
        title: "My Ads",
        data: ads,
        type: "myads"
    }, void 0, false, {
        fileName: "[project]/features/p2p/components/ui/p2pcenter/sections/MyAdsTable.tsx",
        lineNumber: 25,
        columnNumber: 26
    }, this);
const __TURBOPACK__default__export__ = MyAdsTable;
}}),
"[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Common/Button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pcenter$2f$sections$2f$PaymentMethods$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/ui/p2pcenter/sections/PaymentMethods.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pcenter$2f$sections$2f$Feedback$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/ui/p2pcenter/sections/Feedback.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pcenter$2f$sections$2f$MyAdsTable$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/ui/p2pcenter/sections/MyAdsTable.tsx [app-ssr] (ecmascript)");
;
;
;
;
;
;
const tabList = [
    {
        label: "Payment Methods"
    },
    {
        label: "Feedback (0)"
    },
    {
        label: "My Ads",
        extra: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-[#E23D3A]",
            children: "(14)"
        }, void 0, false, {
            fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
            lineNumber: 10,
            columnNumber: 29
        }, this)
    },
    {
        label: "+ Post New Ad"
    }
];
const FiterTabs = ()=>{
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    // Filter bar for My Ads
    const MyAdsFilterBar = ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between w-full",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center bg-[#23242A] rounded-full px-4 py-2 w-full sm:w-auto",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                            src: "/icons/usdt.svg",
                            alt: "Tether",
                            className: "w-6 h-6 mr-2"
                        }, void 0, false, {
                            fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                            lineNumber: 22,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-white mr-2",
                            children: "Tether"
                        }, void 0, false, {
                            fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                            lineNumber: 23,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-[#788099]",
                            children: "USDT"
                        }, void 0, false, {
                            fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                            lineNumber: 24,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                            className: "bg-transparent text-white ml-2 outline-none w-full sm:w-auto",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                children: "Tether"
                            }, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                                lineNumber: 26,
                                columnNumber: 11
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                            lineNumber: 25,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                    lineNumber: 21,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                    className: "bg-[#23242A] rounded-full px-4 py-2 text-white outline-none w-full sm:w-auto",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                        children: "Type"
                    }, void 0, false, {
                        fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                        lineNumber: 31,
                        columnNumber: 9
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                    lineNumber: 30,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                    className: "bg-[#23242A] rounded-full px-4 py-2 text-white outline-none w-full sm:w-auto",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                        children: "Status"
                    }, void 0, false, {
                        fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                        lineNumber: 35,
                        columnNumber: 9
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                    lineNumber: 34,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                    className: "bg-[#23242A] rounded-full px-4 py-2 text-white outline-none w-full sm:w-auto",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                        children: "Date"
                    }, void 0, false, {
                        fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                        lineNumber: 39,
                        columnNumber: 9
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                    lineNumber: 38,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col sm:flex-row gap-2 w-full sm:w-auto",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "w-full sm:w-auto px-4 py-2 rounded-full border border-[#1D8751] text-[#1D8751] bg-transparent",
                            children: "Publish"
                        }, void 0, false, {
                            fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                            lineNumber: 43,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "w-full sm:w-auto px-4 py-2 rounded-full border border-[#788099] text-[#788099] bg-transparent",
                            children: "Put Offline"
                        }, void 0, false, {
                            fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                            lineNumber: 46,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                    lineNumber: 42,
                    columnNumber: 7
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
            lineNumber: 19,
            columnNumber: 5
        }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-6 w-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center w-full",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap gap-4 w-full sm:w-auto",
                        children: tabList.map((tab, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                variant: activeTab === idx ? "primary" : "outline",
                                width: 172,
                                height: 44,
                                borderRadius: 24,
                                borderColor: activeTab === idx ? undefined : "#1D8751",
                                className: `${activeTab === idx ? "" : "text-[#1D8751]"} cursor-pointer min-w-[120px] sm:min-w-[172px]`,
                                onClick: ()=>setActiveTab(idx),
                                children: [
                                    tab.label,
                                    " ",
                                    tab.extra
                                ]
                            }, tab.label, true, {
                                fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                                lineNumber: 58,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                        lineNumber: 56,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-2 w-full sm:w-auto",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "w-3 h-3 rounded-full bg-[#1D8751] inline-block"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                                        lineNumber: 76,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[#A3A3C2]",
                                        children: "Live Ads Exist"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                                        lineNumber: 77,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                                lineNumber: 75,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "w-3 h-3 rounded-full bg-[#E23D3A] inline-block"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                                        lineNumber: 80,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[#A3A3C2]",
                                        children: "Offline Ads Exist"
                                    }, void 0, false, {
                                        fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                                        lineNumber: 81,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                                lineNumber: 79,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                        lineNumber: 74,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                lineNumber: 55,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full overflow-x-auto",
                children: [
                    activeTab === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pcenter$2f$sections$2f$PaymentMethods$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                        lineNumber: 87,
                        columnNumber: 29
                    }, this),
                    activeTab === 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pcenter$2f$sections$2f$Feedback$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                        lineNumber: 88,
                        columnNumber: 29
                    }, this),
                    activeTab === 2 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MyAdsFilterBar, {}, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                                lineNumber: 91,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pcenter$2f$sections$2f$MyAdsTable$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                                lineNumber: 92,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true)
                ]
            }, void 0, true, {
                fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
                lineNumber: 86,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx",
        lineNumber: 54,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = FiterTabs;
}}),
"[project]/features/p2p/components/tabs/p2pCenter.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pcenter$2f$P2pProfile$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/ui/p2pcenter/P2pProfile.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pcenter$2f$Stats$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/ui/p2pcenter/Stats.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pcenter$2f$FilterTabs$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/ui/p2pcenter/FilterTabs.tsx [app-ssr] (ecmascript)");
;
;
;
;
const P2PCenter = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-6 w-full h-full min-h-screen px-0 sm:px-1 lg:px-2 overflow-x-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pcenter$2f$P2pProfile$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/features/p2p/components/tabs/p2pCenter.tsx",
                lineNumber: 9,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pcenter$2f$Stats$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/features/p2p/components/tabs/p2pCenter.tsx",
                lineNumber: 10,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$ui$2f$p2pcenter$2f$FilterTabs$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/features/p2p/components/tabs/p2pCenter.tsx",
                lineNumber: 11,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/p2p/components/tabs/p2pCenter.tsx",
        lineNumber: 8,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = P2PCenter;
}}),
"[project]/features/p2p/components/P2PLayout.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
/**
 * P2PLayout.tsx
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/data.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/styles/tokens.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Tabs$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/Tabs.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$tabs$2f$P2PDashboard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/tabs/P2PDashboard.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$tabs$2f$Market$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/tabs/Market.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$tabs$2f$Orders$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/tabs/Orders.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$tabs$2f$NotFound$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/tabs/NotFound.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$tabs$2f$p2pCenter$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/p2p/components/tabs/p2pCenter.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
;
;
const P2PLayout = ()=>{
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("dashboard");
    // Function to render content based on active tab
    const renderTabContent = ()=>{
        switch(activeTab){
            case "dashboard":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$tabs$2f$P2PDashboard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/features/p2p/components/P2PLayout.tsx",
                    lineNumber: 23,
                    columnNumber: 16
                }, this);
            case "market":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$tabs$2f$Market$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/features/p2p/components/P2PLayout.tsx",
                    lineNumber: 25,
                    columnNumber: 16
                }, this);
            case "orders":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$tabs$2f$Orders$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/features/p2p/components/P2PLayout.tsx",
                    lineNumber: 28,
                    columnNumber: 16
                }, this);
            case "center":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$tabs$2f$p2pCenter$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/features/p2p/components/P2PLayout.tsx",
                    lineNumber: 30,
                    columnNumber: 16
                }, this);
            default:
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$tabs$2f$NotFound$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/features/p2p/components/P2PLayout.tsx",
                    lineNumber: 32,
                    columnNumber: 16
                }, this);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$styles$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tokens"].colors.dark.background} w-full min-h-screen`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$components$2f$Tabs$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                tabs: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$p2p$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["p2pTabs"],
                activeTab: activeTab,
                onTabChange: setActiveTab
            }, void 0, false, {
                fileName: "[project]/features/p2p/components/P2PLayout.tsx",
                lineNumber: 38,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pl-4 pt-0 mb-4  flex flex-col gap-4 rounded-lg w-full",
                children: renderTabContent()
            }, void 0, false, {
                fileName: "[project]/features/p2p/components/P2PLayout.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/p2p/components/P2PLayout.tsx",
        lineNumber: 37,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = P2PLayout;
}}),

};

//# sourceMappingURL=_5f7bab2e._.js.map