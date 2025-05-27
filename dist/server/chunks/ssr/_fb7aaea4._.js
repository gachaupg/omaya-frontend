module.exports = {

"[project]/utils/data.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "navItems": (()=>navItems),
    "transactions": (()=>transactions),
    "volumeData": (()=>volumeData)
});
const navItems = [
    {
        label: "Dashboard",
        icon: "https://res.cloudinary.com/pitz/image/upload/v1747237691/svgexport-54_1_ldjke6.png",
        href: "/dashboard"
    },
    {
        label: "Exchange",
        icon: "https://res.cloudinary.com/pitz/image/upload/v1747237692/uil_exchange_tavqwx.png",
        href: "/dashboard/exchange"
    },
    {
        label: "P2P Trading",
        icon: "https://res.cloudinary.com/pitz/image/upload/v1747237692/users-profiles-left_e2oejc.png",
        href: "/dashboard/p2p"
    },
    {
        label: "Swap Crypto",
        icon: "https://res.cloudinary.com/pitz/image/upload/v1747237691/Group_164002_fgt2kf.png",
        href: "/dashboard/swap"
    },
    {
        label: "Buy Crypto",
        icon: "https://res.cloudinary.com/pitz/image/upload/v1747237691/Group_164004_m9zmz3.png",
        href: "/dashboard/markets"
    },
    {
        label: "Account",
        icon: "https://res.cloudinary.com/pitz/image/upload/v1747237692/users-profiles-left_e2oejc.png",
        href: "/dashboard/account"
    },
    {
        label: "Settings",
        icon: "https://res.cloudinary.com/pitz/image/upload/v1747237691/settings_hi7ckx.png",
        href: "/dashboard/settings"
    }
];
const transactions = [
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
            logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg"
        }
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
            logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg"
        }
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
            logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg"
        }
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
            logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg"
        }
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
            logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg"
        }
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
            logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg"
        }
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
            logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg"
        }
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
            logo: "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg"
        }
    }
];
const volumeData = [
    {
        title: "My Total Volume",
        value: "10 M +"
    },
    {
        title: "Exchange",
        value: "1 M +"
    },
    {
        title: "P2P Volume",
        value: "1 M +"
    },
    {
        title: "Swap",
        value: "20 K +"
    },
    {
        title: "Buy",
        value: "20 K +"
    }
];
}}),
"[project]/components/layout/Sidebar.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>Sidebar)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module 'clsx'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/data.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
function Sidebar() {
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                className: clsx("hidden md:block  left-0 rounded-xl shadow-lg", "w-[222.28px]"),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "space-y-1",
                        children: __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["navItems"].map((item)=>{
                            const isActive = pathname === item.href;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: item.href,
                                    className: clsx("flex items-center px-6 py-3 rounded-lg text-base font-medium gap-4 transition", "w-full sm:w-auto", isActive ? "bg-[#303038] text-white" : "text-[#727272] hover:text-white hover:bg-[#23262F]"),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            src: item.icon,
                                            alt: item.label + " icon",
                                            className: "w-6 h-6 object-contain"
                                        }, void 0, false, {
                                            fileName: "[project]/components/layout/Sidebar.tsx",
                                            lineNumber: 41,
                                            columnNumber: 21
                                        }, this),
                                        item.label
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/layout/Sidebar.tsx",
                                    lineNumber: 31,
                                    columnNumber: 19
                                }, this)
                            }, item.label, false, {
                                fileName: "[project]/components/layout/Sidebar.tsx",
                                lineNumber: 30,
                                columnNumber: 17
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/components/layout/Sidebar.tsx",
                        lineNumber: 26,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/components/layout/Sidebar.tsx",
                    lineNumber: 25,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/layout/Sidebar.tsx",
                lineNumber: 19,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "md:hidden w-full overflow-x-auto bg-[#1D1D23] sticky top-0 z-40",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                    className: "px-4",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "flex space-x-2 py-3",
                        children: __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["navItems"].map((item)=>{
                            const isActive = pathname === item.href;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: item.href,
                                    className: clsx("flex items-center px-4 py-2 rounded-lg text-sm font-medium gap-2 whitespace-nowrap transition", isActive ? "bg-[#303038] text-white" : "text-[#727272] hover:text-white hover:bg-[#23262F]"),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            src: item.icon,
                                            alt: item.label + " icon",
                                            className: "w-5 h-5 object-contain"
                                        }, void 0, false, {
                                            fileName: "[project]/components/layout/Sidebar.tsx",
                                            lineNumber: 72,
                                            columnNumber: 21
                                        }, this),
                                        item.label
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/layout/Sidebar.tsx",
                                    lineNumber: 63,
                                    columnNumber: 19
                                }, this)
                            }, item.label, false, {
                                fileName: "[project]/components/layout/Sidebar.tsx",
                                lineNumber: 62,
                                columnNumber: 17
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/components/layout/Sidebar.tsx",
                        lineNumber: 58,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/components/layout/Sidebar.tsx",
                    lineNumber: 57,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/layout/Sidebar.tsx",
                lineNumber: 56,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}}),
"[project]/app/dashboard/layout.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>DashboardLayout)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$layout$2f$Sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/layout/Sidebar.tsx [app-ssr] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module 'framer-motion'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
"use client";
;
;
;
function DashboardLayout({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen mt-28",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(motion.div, {
                initial: {
                    y: -20,
                    opacity: 0
                },
                animate: {
                    y: 0,
                    opacity: 1
                },
                transition: {
                    duration: 0.3
                },
                className: "md:hidden fixed top-18 left-0 right-0 z-40",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$layout$2f$Sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/app/dashboard/layout.tsx",
                    lineNumber: 20,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/dashboard/layout.tsx",
                lineNumber: 14,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(motion.div, {
                initial: {
                    x: -20,
                    opacity: 0
                },
                animate: {
                    x: 0,
                    opacity: 1
                },
                transition: {
                    duration: 0.3
                },
                className: "hidden md:mb-28 md:block fixed top-28 left-0 w-[222.28px] h-[calc(100vh-7rem)]",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$layout$2f$Sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/app/dashboard/layout.tsx",
                    lineNumber: 30,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/dashboard/layout.tsx",
                lineNumber: 24,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AnimatePresence, {
                    mode: "wait",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(motion.div, {
                        initial: {
                            opacity: 0,
                            y: 20
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        exit: {
                            opacity: 0,
                            y: -20
                        },
                        transition: {
                            duration: 0.3
                        },
                        className: "max-md:mt-40 md:mt-28 md:pl-[222.28px] px-4 md:px-6",
                        children: children
                    }, Math.random(), false, {
                        fileName: "[project]/app/dashboard/layout.tsx",
                        lineNumber: 36,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/dashboard/layout.tsx",
                    lineNumber: 35,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/dashboard/layout.tsx",
                lineNumber: 34,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/dashboard/layout.tsx",
        lineNumber: 12,
        columnNumber: 5
    }, this);
}
}}),
"[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/navigation.js [app-ssr] (ecmascript)");
}}),

};

//# sourceMappingURL=_fb7aaea4._.js.map