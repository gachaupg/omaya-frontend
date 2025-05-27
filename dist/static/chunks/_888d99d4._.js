(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/features/auth/api.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * api.ts – auto‑generated placeholder
 */ __turbopack_context__.s({
    "API_ENDPOINTS": (()=>API_ENDPOINTS)
});
const API_ENDPOINTS = {
    LOGIN: '/api/login/',
    REGISTER: '/api/register/',
    FORGOT_PASSWORD: '/api/forget-password/',
    RESET_PASSWORD: '/api/reset-password/',
    VERIFY_OTP: '/api/verify-otp/',
    LOGOUT: '/api/logout/',
    REFRESH_TOKEN: '/api/token/refresh/'
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/features/auth/utils/storage.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "storage": (()=>storage)
});
const STORAGE_KEYS = {
    PROFILE: 'profile',
    USER_EMAIL: 'user_email'
};
const storage = {
    getProfile: ()=>{
        if ("TURBOPACK compile-time falsy", 0) {
            "TURBOPACK unreachable";
        }
        const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
        return data ? JSON.parse(data) : null;
    },
    setProfile: (profile)=>{
        if ("TURBOPACK compile-time falsy", 0) {
            "TURBOPACK unreachable";
        }
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    },
    removeProfile: ()=>{
        if ("TURBOPACK compile-time falsy", 0) {
            "TURBOPACK unreachable";
        }
        localStorage.removeItem(STORAGE_KEYS.PROFILE);
    },
    getUserEmail: ()=>{
        if ("TURBOPACK compile-time falsy", 0) {
            "TURBOPACK unreachable";
        }
        return localStorage.getItem(STORAGE_KEYS.USER_EMAIL) || '';
    },
    setUserEmail: (email)=>{
        if ("TURBOPACK compile-time falsy", 0) {
            "TURBOPACK unreachable";
        }
        localStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
    },
    removeUserEmail: ()=>{
        if ("TURBOPACK compile-time falsy", 0) {
            "TURBOPACK unreachable";
        }
        localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    },
    clear: ()=>{
        if ("TURBOPACK compile-time falsy", 0) {
            "TURBOPACK unreachable";
        }
        localStorage.removeItem(STORAGE_KEYS.PROFILE);
        localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/lib/apiClient.ts [app-client] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * apiClient.ts – auto‑generated placeholder
 */ __turbopack_context__.s({
    "apiClient": (()=>apiClient),
    "del": (()=>del),
    "get": (()=>get),
    "post": (()=>post),
    "put": (()=>put)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$utils$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/auth/utils/storage.ts [app-client] (ecmascript)");
;
;
const API_BASE_URL = ("TURBOPACK compile-time value", "https://dev.backend.omaya.io");
if ("TURBOPACK compile-time falsy", 0) {
    "TURBOPACK unreachable";
}
const createAxiosInstance = ()=>{
    const instance = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].create({
        baseURL: API_BASE_URL,
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return instance;
};
const addAuthInterceptor = (instance)=>{
    instance.interceptors.request.use({
        "addAuthInterceptor.use": (config)=>{
            const profile = __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$utils$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].getProfile();
            if (profile?.tokens?.access) {
                config.headers.Authorization = `Bearer ${profile.tokens.access}`;
            }
            return config;
        }
    }["addAuthInterceptor.use"], {
        "addAuthInterceptor.use": (error)=>Promise.reject(error)
    }["addAuthInterceptor.use"]);
    return instance;
};
const addRefreshTokenInterceptor = (instance)=>{
    instance.interceptors.response.use({
        "addRefreshTokenInterceptor.use": (response)=>response
    }["addRefreshTokenInterceptor.use"], {
        "addRefreshTokenInterceptor.use": async (error)=>{
            const originalRequest = error.config;
            const profile = __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$utils$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].getProfile();
            if (error.response?.status === 401 && profile?.tokens?.refresh && originalRequest && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].post(`${API_BASE_URL}/api/token/refresh/`, {
                        refresh: profile.tokens.refresh
                    });
                    const newAccessToken = response.data.access;
                    __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$utils$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].setProfile({
                        ...profile,
                        tokens: {
                            ...profile.tokens,
                            access: newAccessToken
                        }
                    });
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return instance(originalRequest);
                } catch (refreshError) {
                    __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$utils$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].removeProfile();
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        }
    }["addRefreshTokenInterceptor.use"]);
    return instance;
};
const createApiClient = ()=>{
    const instance = createAxiosInstance();
    const withAuth = addAuthInterceptor(instance);
    const withRefresh = addRefreshTokenInterceptor(withAuth);
    return withRefresh;
};
const apiClient = createApiClient();
const get = (url, config)=>{
    return apiClient.get(url, config);
};
const post = (url, data, config)=>{
    return apiClient.post(url, data, config);
};
const put = (url, data, config)=>{
    return apiClient.put(url, data, config);
};
const del = (url, config)=>{
    return apiClient.delete(url, config);
};
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/lib/apiClient.ts [app-client] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$utils$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/auth/utils/storage.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/apiClient.ts [app-client] (ecmascript) <locals>");
}}),
"[project]/features/auth/slices/authSlice.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * authSlice.ts – auto‑generated placeholder
 */ __turbopack_context__.s({
    "clearError": (()=>clearError),
    "default": (()=>__TURBOPACK__default__export__),
    "forgotPassword": (()=>forgotPassword),
    "initializeAuth": (()=>initializeAuth),
    "loginUser": (()=>loginUser),
    "logout": (()=>logout),
    "registerUser": (()=>registerUser),
    "resetPassword": (()=>resetPassword),
    "verifyOTP": (()=>verifyOTP)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/auth/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/lib/apiClient.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/apiClient.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/axios/index.js [app-client] (ecmascript) <locals>");
;
;
;
const initialState = {
    user: null,
    tokens: null,
    loading: false,
    error: null,
    isAuthenticated: false
};
// Helper to handle API errors
const handleApiError = (error)=>{
    if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["AxiosError"]) {
        return error.response?.data?.message || error.response?.data?.error || error.response?.data?.details || 'An error occurred';
    }
    return 'An unexpected error occurred';
};
const registerUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createAsyncThunk"])('auth/register', async (payload, { rejectWithValue })=>{
    try {
        const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["post"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_ENDPOINTS"].REGISTER, payload);
        return response.data;
    } catch (error) {
        return rejectWithValue(handleApiError(error));
    }
});
const loginUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createAsyncThunk"])('auth/login', async (payload, { rejectWithValue })=>{
    try {
        const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["post"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_ENDPOINTS"].LOGIN, payload);
        return response.data;
    } catch (error) {
        return rejectWithValue(handleApiError(error));
    }
});
const forgotPassword = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createAsyncThunk"])('auth/forgotPassword', async (payload, { rejectWithValue })=>{
    try {
        const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["post"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_ENDPOINTS"].FORGOT_PASSWORD, payload);
        return response.data.message;
    } catch (error) {
        return rejectWithValue(handleApiError(error));
    }
});
const resetPassword = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createAsyncThunk"])('auth/resetPassword', async (payload, { rejectWithValue })=>{
    try {
        const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["post"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_ENDPOINTS"].RESET_PASSWORD, payload);
        return response.data.message;
    } catch (error) {
        return rejectWithValue(handleApiError(error));
    }
});
const verifyOTP = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createAsyncThunk"])('auth/verifyOTP', async (payload, { rejectWithValue })=>{
    try {
        const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["post"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_ENDPOINTS"].VERIFY_OTP, payload);
        return response.data;
    } catch (error) {
        return rejectWithValue(handleApiError(error));
    }
});
const authSlice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createSlice"])({
    name: 'auth',
    initialState,
    reducers: {
        logout (state) {
            state.user = null;
            state.tokens = null;
            state.isAuthenticated = false;
            localStorage.removeItem('profile');
        },
        clearError (state) {
            state.error = null;
        },
        initializeAuth (state) {
            const authData = localStorage.getItem('profile');
            if (authData) {
                const parsedData = JSON.parse(authData);
                state.user = parsedData.user;
                state.tokens = parsedData.tokens;
                state.isAuthenticated = true;
            }
        }
    },
    extraReducers: (builder)=>{
        // Register
        builder.addCase(registerUser.pending, (state)=>{
            state.loading = true;
            state.error = null;
        });
        builder.addCase(registerUser.fulfilled, (state, action)=>{
            state.loading = false;
            state.user = action.payload.user;
            state.isAuthenticated = false; // User not authenticated until email verification
        });
        builder.addCase(registerUser.rejected, (state, action)=>{
            state.loading = false;
            state.error = action.payload;
        });
        // Login
        builder.addCase(loginUser.pending, (state)=>{
            state.loading = true;
            state.error = null;
        });
        builder.addCase(loginUser.fulfilled, (state, action)=>{
            state.loading = false;
            state.user = action.payload.user;
            state.tokens = {
                access: action.payload.access,
                refresh: action.payload.refresh
            };
            state.isAuthenticated = true;
            localStorage.setItem('profile', JSON.stringify({
                user: action.payload.user,
                tokens: {
                    access: action.payload.access,
                    refresh: action.payload.refresh
                }
            }));
        });
        builder.addCase(loginUser.rejected, (state, action)=>{
            state.loading = false;
            state.error = action.payload;
        });
        // Forgot Password
        builder.addCase(forgotPassword.pending, (state)=>{
            state.loading = true;
            state.error = null;
        });
        builder.addCase(forgotPassword.fulfilled, (state)=>{
            state.loading = false;
        });
        builder.addCase(forgotPassword.rejected, (state, action)=>{
            state.loading = false;
            state.error = action.payload;
        });
        // Reset Password
        builder.addCase(resetPassword.pending, (state)=>{
            state.loading = true;
            state.error = null;
        });
        builder.addCase(resetPassword.fulfilled, (state)=>{
            state.loading = false;
        });
        builder.addCase(resetPassword.rejected, (state, action)=>{
            state.loading = false;
            state.error = action.payload;
        });
        // Verify OTP
        builder.addCase(verifyOTP.pending, (state)=>{
            state.loading = true;
            state.error = null;
        });
        builder.addCase(verifyOTP.fulfilled, (state, action)=>{
            state.loading = false;
            if (state.user) {
                state.user.is_verified = action.payload.user.is_verified;
            }
        });
        builder.addCase(verifyOTP.rejected, (state, action)=>{
            state.loading = false;
            state.error = action.payload;
        });
    }
});
const { logout, clearError, initializeAuth } = authSlice.actions;
const __TURBOPACK__default__export__ = authSlice.reducer;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/components/layout/Navbar.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>Navbar)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/moon.js [app-client] (ecmascript) <export default as Moon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sun.js [app-client] (ecmascript) <export default as Sun>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/menu.js [app-client] (ecmascript) <export default as Menu>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-client] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-redux/dist/react-redux.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$slices$2f$authSlice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/auth/slices/authSlice.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
function Navbar() {
    _s();
    const [theme, setTheme] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("light");
    const [mobileMenuOpen, setMobileMenuOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [scrolled, setScrolled] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const { isAuthenticated } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSelector"])({
        "Navbar.useSelector": (state)=>state.auth
    }["Navbar.useSelector"]);
    const dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDispatch"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Navbar.useEffect": ()=>{
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$slices$2f$authSlice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["initializeAuth"])());
        }
    }["Navbar.useEffect"], [
        dispatch
    ]);
    const toggleTheme = ()=>{
        setTheme(theme === "light" ? "dark" : "light");
    };
    const toggleMobileMenu = ()=>{
        setMobileMenuOpen(!mobileMenuOpen);
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Navbar.useEffect": ()=>{
            const handleScroll = {
                "Navbar.useEffect.handleScroll": ()=>{
                    if (window.scrollY > 0) {
                        setScrolled(true);
                    } else {
                        setScrolled(false);
                    }
                }
            }["Navbar.useEffect.handleScroll"];
            window.addEventListener("scroll", handleScroll);
            // Clean up the event listener on component unmount
            return ({
                "Navbar.useEffect": ()=>{
                    window.removeEventListener("scroll", handleScroll);
                }
            })["Navbar.useEffect"];
        }
    }["Navbar.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                className: `fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 sm:px-6 md:px-12 2xl:px-20 transition-all duration-300 ${scrolled ? "bg-[#1D1D23]" : "bg-transparent"}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: "/",
                                className: "mr-4 md:mr-10",
                                children: scrolled ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    src: "https://res.cloudinary.com/dam1sxczj/image/upload/v1747133499/Omaya_green-logo_yva2ah.png",
                                    alt: "OMAYA Exchange",
                                    width: 150,
                                    height: 40,
                                    className: "h-auto w-32 md:w-40 2xl:w-48",
                                    priority: true
                                }, void 0, false, {
                                    fileName: "[project]/components/layout/Navbar.tsx",
                                    lineNumber: 57,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    src: "https://res.cloudinary.com/dam1sxczj/image/upload/v1746538269/Frame_q3pwt7.png",
                                    alt: "OMAYA Exchange",
                                    width: 150,
                                    height: 40,
                                    className: "h-auto w-32 md:w-40 2xl:w-48",
                                    priority: true
                                }, void 0, false, {
                                    fileName: "[project]/components/layout/Navbar.tsx",
                                    lineNumber: 66,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/layout/Navbar.tsx",
                                lineNumber: 55,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "hidden md:flex space-x-6 lg:space-x-8 2xl:space-x-12",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NavLink, {
                                        href: "/",
                                        children: "Home"
                                    }, void 0, false, {
                                        fileName: "[project]/components/layout/Navbar.tsx",
                                        lineNumber: 79,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NavLink, {
                                        href: "/dashboard",
                                        children: "Dashboard"
                                    }, void 0, false, {
                                        fileName: "[project]/components/layout/Navbar.tsx",
                                        lineNumber: 80,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NavLink, {
                                        href: "/market",
                                        children: "Market"
                                    }, void 0, false, {
                                        fileName: "[project]/components/layout/Navbar.tsx",
                                        lineNumber: 81,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NavLink, {
                                        href: "/rates",
                                        children: "Rates"
                                    }, void 0, false, {
                                        fileName: "[project]/components/layout/Navbar.tsx",
                                        lineNumber: 82,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NavLink, {
                                        href: "/blog",
                                        children: "Blog"
                                    }, void 0, false, {
                                        fileName: "[project]/components/layout/Navbar.tsx",
                                        lineNumber: 83,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/layout/Navbar.tsx",
                                lineNumber: 78,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/layout/Navbar.tsx",
                        lineNumber: 54,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "hidden md:flex items-center space-x-4 2xl:space-x-6",
                        children: [
                            isAuthenticated ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center space-x-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/dashboard/deposit",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: "flex items-center bg-[#1D8751] hover:bg-[#13B562] text-white px-6 py-2 rounded-full transition-colors duration-200 text-sm md:text-base 2xl:text-lg",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    className: "mr-2",
                                                    width: "20",
                                                    height: "20",
                                                    fill: "none",
                                                    viewBox: "0 0 24 24",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M12 3v14m0 0l-5-5m5 5l5-5",
                                                        stroke: "#FFB800",
                                                        strokeWidth: "2",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/layout/Navbar.tsx",
                                                        lineNumber: 94,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/components/layout/Navbar.tsx",
                                                    lineNumber: 93,
                                                    columnNumber: 19
                                                }, this),
                                                "Deposit"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/layout/Navbar.tsx",
                                            lineNumber: 92,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/layout/Navbar.tsx",
                                        lineNumber: 91,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "relative",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                src: "https://randomuser.me/api/portraits/men/32.jpg",
                                                alt: "Profile",
                                                className: "w-10 h-10 rounded-full border-2 border-white object-cover"
                                            }, void 0, false, {
                                                fileName: "[project]/components/layout/Navbar.tsx",
                                                lineNumber: 100,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "absolute bottom-0 right-0 w-5 h-5 bg-[#1D8751] rounded-full flex items-center justify-center border-2 border-white",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    width: "14",
                                                    height: "14",
                                                    viewBox: "0 0 20 20",
                                                    fill: "none",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                            cx: "10",
                                                            cy: "10",
                                                            r: "10",
                                                            fill: "#1D8751"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/layout/Navbar.tsx",
                                                            lineNumber: 107,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            d: "M6 10.5L9 13.5L14 8.5",
                                                            stroke: "white",
                                                            strokeWidth: "2",
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/layout/Navbar.tsx",
                                                            lineNumber: 108,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/components/layout/Navbar.tsx",
                                                    lineNumber: 106,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/components/layout/Navbar.tsx",
                                                lineNumber: 105,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/layout/Navbar.tsx",
                                        lineNumber: 99,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/layout/Navbar.tsx",
                                lineNumber: 90,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/auth/register",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthButton, {
                                            variant: "primary",
                                            children: "Register"
                                        }, void 0, false, {
                                            fileName: "[project]/components/layout/Navbar.tsx",
                                            lineNumber: 116,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/layout/Navbar.tsx",
                                        lineNumber: 115,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/auth/login",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthButton, {
                                            variant: "secondary",
                                            children: "Log In"
                                        }, void 0, false, {
                                            fileName: "[project]/components/layout/Navbar.tsx",
                                            lineNumber: 119,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/layout/Navbar.tsx",
                                        lineNumber: 118,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center space-x-4 2xl:space-x-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LanguageSelector, {}, void 0, false, {
                                        fileName: "[project]/components/layout/Navbar.tsx",
                                        lineNumber: 125,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ThemeToggle, {
                                        theme: theme,
                                        toggleTheme: toggleTheme
                                    }, void 0, false, {
                                        fileName: "[project]/components/layout/Navbar.tsx",
                                        lineNumber: 126,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/layout/Navbar.tsx",
                                lineNumber: 124,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/layout/Navbar.tsx",
                        lineNumber: 88,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "md:hidden text-white p-2 rounded-md focus:outline-none",
                        onClick: toggleMobileMenu,
                        children: mobileMenuOpen ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                            size: 24
                        }, void 0, false, {
                            fileName: "[project]/components/layout/Navbar.tsx",
                            lineNumber: 135,
                            columnNumber: 29
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__["Menu"], {
                            size: 24
                        }, void 0, false, {
                            fileName: "[project]/components/layout/Navbar.tsx",
                            lineNumber: 135,
                            columnNumber: 47
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/layout/Navbar.tsx",
                        lineNumber: 131,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/layout/Navbar.tsx",
                lineNumber: 49,
                columnNumber: 7
            }, this),
            mobileMenuOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `fixed top-16 left-0 right-0 z-40 md:hidden p-6 space-y-6 shadow-lg transition-all duration-300 bg-[#1D1D23]`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MobileNavLink, {
                        href: "/",
                        onClick: toggleMobileMenu,
                        children: "Home"
                    }, void 0, false, {
                        fileName: "[project]/components/layout/Navbar.tsx",
                        lineNumber: 144,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MobileNavLink, {
                        href: "/dashboard",
                        onClick: toggleMobileMenu,
                        children: "Dashboard"
                    }, void 0, false, {
                        fileName: "[project]/components/layout/Navbar.tsx",
                        lineNumber: 147,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MobileNavLink, {
                        href: "/market",
                        onClick: toggleMobileMenu,
                        children: "Market"
                    }, void 0, false, {
                        fileName: "[project]/components/layout/Navbar.tsx",
                        lineNumber: 150,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MobileNavLink, {
                        href: "/rates",
                        onClick: toggleMobileMenu,
                        children: "Rates"
                    }, void 0, false, {
                        fileName: "[project]/components/layout/Navbar.tsx",
                        lineNumber: 153,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MobileNavLink, {
                        href: "/blog",
                        onClick: toggleMobileMenu,
                        children: "Blog"
                    }, void 0, false, {
                        fileName: "[project]/components/layout/Navbar.tsx",
                        lineNumber: 156,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col space-y-4 pt-4",
                        children: isAuthenticated ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/dashboard/deposit",
                                    onClick: toggleMobileMenu,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "flex items-center w-full bg-[#1D8751] hover:bg-[#13B562] text-white px-6 py-2 rounded-full transition-colors duration-200 text-base",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                src: "https://res.cloudinary.com/dam1sxczj/image/upload/v1748294216/deposit-new-f_okzshs.png",
                                                alt: ""
                                            }, void 0, false, {
                                                fileName: "[project]/components/layout/Navbar.tsx",
                                                lineNumber: 165,
                                                columnNumber: 21
                                            }, this),
                                            "Deposit"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/layout/Navbar.tsx",
                                        lineNumber: 164,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/layout/Navbar.tsx",
                                    lineNumber: 163,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "relative mt-4 flex justify-center",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            src: "https://randomuser.me/api/portraits/men/32.jpg",
                                            alt: "Profile",
                                            className: "w-10 h-10 rounded-full object-cover"
                                        }, void 0, false, {
                                            fileName: "[project]/components/layout/Navbar.tsx",
                                            lineNumber: 170,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "absolute bottom-0 right-0 w-5 h-5 bg-[#1D8751] rounded-full flex items-center justify-center border-2 border-white",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                width: "14",
                                                height: "14",
                                                viewBox: "0 0 20 20",
                                                fill: "none",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                        cx: "10",
                                                        cy: "10",
                                                        r: "10",
                                                        fill: "#1D8751"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/layout/Navbar.tsx",
                                                        lineNumber: 177,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M6 10.5L9 13.5L14 8.5",
                                                        stroke: "white",
                                                        strokeWidth: "2",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/layout/Navbar.tsx",
                                                        lineNumber: 178,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/layout/Navbar.tsx",
                                                lineNumber: 176,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/components/layout/Navbar.tsx",
                                            lineNumber: 175,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/layout/Navbar.tsx",
                                    lineNumber: 169,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthButton, {
                                    variant: "primary",
                                    fullWidth: true,
                                    children: "Register"
                                }, void 0, false, {
                                    fileName: "[project]/components/layout/Navbar.tsx",
                                    lineNumber: 185,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthButton, {
                                    variant: "secondary",
                                    fullWidth: true,
                                    children: "Log In"
                                }, void 0, false, {
                                    fileName: "[project]/components/layout/Navbar.tsx",
                                    lineNumber: 188,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true)
                    }, void 0, false, {
                        fileName: "[project]/components/layout/Navbar.tsx",
                        lineNumber: 160,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between pt-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LanguageSelector, {}, void 0, false, {
                                fileName: "[project]/components/layout/Navbar.tsx",
                                lineNumber: 196,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ThemeToggle, {
                                theme: theme,
                                toggleTheme: toggleTheme
                            }, void 0, false, {
                                fileName: "[project]/components/layout/Navbar.tsx",
                                lineNumber: 197,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/layout/Navbar.tsx",
                        lineNumber: 195,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/layout/Navbar.tsx",
                lineNumber: 141,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true);
}
_s(Navbar, "htkn2xHjxVK1sXb947sjRiJ4OSo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSelector"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDispatch"]
    ];
});
_c = Navbar;
const NavLink = ({ href, children })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        href: href,
        className: "text-white hover:text-[#1D8751] transition-colors duration-200 text-sm lg:text-base 2xl:text-lg",
        children: children
    }, void 0, false, {
        fileName: "[project]/components/layout/Navbar.tsx",
        lineNumber: 212,
        columnNumber: 3
    }, this);
_c1 = NavLink;
const MobileNavLink = ({ href, children, onClick })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        href: href,
        className: "block text-white hover:text-[#1D8751] py-2 transition-colors duration-200 text-lg",
        onClick: onClick,
        children: children
    }, void 0, false, {
        fileName: "[project]/components/layout/Navbar.tsx",
        lineNumber: 229,
        columnNumber: 3
    }, this);
_c2 = MobileNavLink;
const AuthButton = ({ variant, children, fullWidth = false })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        className: `${variant === "primary" ? "bg-[#0E5531] hover:bg-[#13B562]" : "bg-transparent border border-[#1D8751]"} 
    text-white px-4 py-2 rounded-md transition-colors duration-200 text-sm md:text-base 2xl:text-lg
    ${fullWidth ? "w-full" : ""}`,
        children: children
    }, void 0, false, {
        fileName: "[project]/components/layout/Navbar.tsx",
        lineNumber: 247,
        columnNumber: 3
    }, this);
_c3 = AuthButton;
const LanguageSelector = ()=>{
    _s1();
    const [dropdownOpen, setDropdownOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [selectedLanguage, setSelectedLanguage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("English");
    const toggleDropdown = ()=>{
        setDropdownOpen(!dropdownOpen);
    };
    const selectLanguage = (language)=>{
        setSelectedLanguage(language);
        setDropdownOpen(false);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative ",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-center cursor-pointer",
                onClick: toggleDropdown,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        src: selectedLanguage === "English" ? "https://res.cloudinary.com/dam1sxczj/image/upload/v1746538734/united_kingdom_zud79x.png" : "https://res.cloudinary.com/dam1sxczj/image/upload/v1747216099/somali_jq5e97.png",
                        alt: selectedLanguage,
                        width: 32,
                        height: 32,
                        className: "rounded-full"
                    }, void 0, false, {
                        fileName: "[project]/components/layout/Navbar.tsx",
                        lineNumber: 279,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        xmlns: "http://www.w3.org/2000/svg",
                        width: "16",
                        height: "16",
                        className: "fill-white",
                        viewBox: "0 0 16 16",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            d: "M1.5 6.5l6 6 6-6h-12z"
                        }, void 0, false, {
                            fileName: "[project]/components/layout/Navbar.tsx",
                            lineNumber: 297,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/layout/Navbar.tsx",
                        lineNumber: 290,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/layout/Navbar.tsx",
                lineNumber: 275,
                columnNumber: 7
            }, this),
            dropdownOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute right-0 mt-2 w-[300px] bg-[#18181D] border border-[#35353E] rounded-lg shadow-lg z-50",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "block w-full text-left px-4 py-2 text-white hover:bg-[#35353E]",
                        onClick: ()=>selectLanguage("English"),
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-between",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center space-x-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            src: "https://res.cloudinary.com/dam1sxczj/image/upload/v1746538734/united_kingdom_zud79x.png",
                                            alt: "English",
                                            width: 20,
                                            height: 20,
                                            className: "rounded-full"
                                        }, void 0, false, {
                                            fileName: "[project]/components/layout/Navbar.tsx",
                                            lineNumber: 308,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-sm",
                                            children: "English"
                                        }, void 0, false, {
                                            fileName: "[project]/components/layout/Navbar.tsx",
                                            lineNumber: 315,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/layout/Navbar.tsx",
                                    lineNumber: 307,
                                    columnNumber: 15
                                }, this),
                                selectedLanguage === "English" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-4 h-4 rounded-full flex items-center justify-center",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                        size: 16,
                                        className: "text-[#1D8751]"
                                    }, void 0, false, {
                                        fileName: "[project]/components/layout/Navbar.tsx",
                                        lineNumber: 319,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/layout/Navbar.tsx",
                                    lineNumber: 318,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/layout/Navbar.tsx",
                            lineNumber: 306,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/layout/Navbar.tsx",
                        lineNumber: 302,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "block w-full text-left px-4 py-2 text-white hover:bg-[#35353E]",
                        onClick: ()=>selectLanguage("Somali"),
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-between gap-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center space-x-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            src: "https://res.cloudinary.com/dam1sxczj/image/upload/v1747216099/somali_jq5e97.png",
                                            alt: "Somali",
                                            width: 20,
                                            height: 20,
                                            className: "rounded-full"
                                        }, void 0, false, {
                                            fileName: "[project]/components/layout/Navbar.tsx",
                                            lineNumber: 330,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-sm",
                                            children: "Somali"
                                        }, void 0, false, {
                                            fileName: "[project]/components/layout/Navbar.tsx",
                                            lineNumber: 337,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/layout/Navbar.tsx",
                                    lineNumber: 329,
                                    columnNumber: 15
                                }, this),
                                selectedLanguage === "Somali" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-4 h-4 rounded-full flex items-center justify-center",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[10px] text-[#1D8751]",
                                        children: "✓"
                                    }, void 0, false, {
                                        fileName: "[project]/components/layout/Navbar.tsx",
                                        lineNumber: 341,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/layout/Navbar.tsx",
                                    lineNumber: 340,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/layout/Navbar.tsx",
                            lineNumber: 328,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/layout/Navbar.tsx",
                        lineNumber: 324,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/layout/Navbar.tsx",
                lineNumber: 301,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/layout/Navbar.tsx",
        lineNumber: 274,
        columnNumber: 5
    }, this);
};
_s1(LanguageSelector, "abwy4p9rMCYeGelUYTKx7DrK9u4=");
_c4 = LanguageSelector;
const ThemeToggle = ({ theme, toggleTheme })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        onClick: toggleTheme,
        className: "text-white bg-transparent p-1",
        children: theme === "light" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__["Moon"], {
            size: 20,
            className: "text-[#13b562]"
        }, void 0, false, {
            fileName: "[project]/components/layout/Navbar.tsx",
            lineNumber: 361,
            columnNumber: 7
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__["Sun"], {
            size: 20
        }, void 0, false, {
            fileName: "[project]/components/layout/Navbar.tsx",
            lineNumber: 363,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/layout/Navbar.tsx",
        lineNumber: 359,
        columnNumber: 3
    }, this);
_c5 = ThemeToggle;
var _c, _c1, _c2, _c3, _c4, _c5;
__turbopack_context__.k.register(_c, "Navbar");
__turbopack_context__.k.register(_c1, "NavLink");
__turbopack_context__.k.register(_c2, "MobileNavLink");
__turbopack_context__.k.register(_c3, "AuthButton");
__turbopack_context__.k.register(_c4, "LanguageSelector");
__turbopack_context__.k.register(_c5, "ThemeToggle");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/features/auth/store.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "store": (()=>store)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$slices$2f$authSlice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/auth/slices/authSlice.ts [app-client] (ecmascript)");
;
;
const store = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["configureStore"])({
    reducer: {
        auth: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$slices$2f$authSlice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
    }
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/app/providers.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>Providers)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-redux/dist/react-redux.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/auth/store.ts [app-client] (ecmascript)");
'use client';
;
;
;
function Providers({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Provider"], {
        store: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["store"],
        children: children
    }, void 0, false, {
        fileName: "[project]/app/providers.tsx",
        lineNumber: 7,
        columnNumber: 10
    }, this);
}
_c = Providers;
var _c;
__turbopack_context__.k.register(_c, "Providers");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=_888d99d4._.js.map