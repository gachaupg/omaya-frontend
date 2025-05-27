module.exports = {

"[externals]/util [external] (util, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}}),
"[externals]/stream [external] (stream, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}}),
"[externals]/path [external] (path, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}}),
"[externals]/http [external] (http, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}}),
"[externals]/https [external] (https, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}}),
"[externals]/url [external] (url, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}}),
"[externals]/fs [external] (fs, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}}),
"[externals]/crypto [external] (crypto, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}}),
"[externals]/assert [external] (assert, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("assert", () => require("assert"));

module.exports = mod;
}}),
"[externals]/zlib [external] (zlib, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}}),
"[externals]/events [external] (events, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}}),
"[project]/features/auth/slices/authSlice.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * authSlice.ts – auto‑generated placeholder
 */ __turbopack_context__.s({
    "clearError": (()=>clearError),
    "default": (()=>__TURBOPACK__default__export__),
    "forgotPassword": (()=>forgotPassword),
    "loginUser": (()=>loginUser),
    "logout": (()=>logout),
    "registerUser": (()=>registerUser),
    "resetPassword": (()=>resetPassword)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [app-ssr] (ecmascript)");
;
;
const initialState = {
    user: null,
    tokens: null,
    loading: false,
    error: null,
    isAuthenticated: false
};
const registerUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createAsyncThunk"])('auth/register', async (payload, { rejectWithValue })=>{
    try {
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].post(`${process.env.BASE_URL}/api/register/`, payload);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Registration failed');
    }
});
const loginUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createAsyncThunk"])('auth/login', async (payload, { rejectWithValue })=>{
    try {
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].post(`${process.env.BASE_URL}/api/login/`, payload);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Login failed');
    }
});
const forgotPassword = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createAsyncThunk"])('auth/forgotPassword', async (payload, { rejectWithValue })=>{
    try {
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].post(`${process.env.BASE_URL}/api/forget-password/`, payload);
        return response.data.message;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Password reset failed');
    }
});
const resetPassword = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createAsyncThunk"])('auth/resetPassword', async (payload, { rejectWithValue })=>{
    try {
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].post(`${process.env.BASE_URL}/api/reset-password/`, payload);
        return response.data.message;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Password reset failed');
    }
});
const authSlice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createSlice"])({
    name: 'auth',
    initialState,
    reducers: {
        logout (state) {
            state.user = null;
            state.tokens = null;
            state.isAuthenticated = false;
        },
        clearError (state) {
            state.error = null;
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
    }
});
const { logout, clearError } = authSlice.actions;
const __TURBOPACK__default__export__ = authSlice.reducer;
}}),
"[project]/features/auth/components/RegisterForm.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * RegisterForm.tsx – auto‑generated placeholder
 */ __turbopack_context__.s({
    "default": (()=>RegistrationPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-redux/dist/react-redux.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$slices$2f$authSlice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/auth/slices/authSlice.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
function RegistrationPage() {
    // Form state
    const dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDispatch"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    // Form state
    const [firstName, setFirstName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [lastName, setLastName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [email, setEmail] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [countryCode, setCountryCode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("252");
    const [phone, setPhone] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [password, setPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [confirmPassword, setConfirmPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [referralCode, setReferralCode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [agreeToTerms, setAgreeToTerms] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isSubmitting, setIsSubmitting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    // Validation errors
    const [errors, setErrors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: ""
    });
    // Password validation states
    const hasMinChars = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
    const validateForm = ()=>{
        let isValid = true;
        const newErrors = {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: ""
        };
        // First name validation
        if (!firstName.trim()) {
            newErrors.firstName = "First name is required";
            isValid = false;
        }
        // Last name validation
        if (!lastName.trim()) {
            newErrors.lastName = "Last name is required";
            isValid = false;
        }
        // Email validation
        if (!email.trim()) {
            newErrors.email = "Email is required";
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Email is invalid";
            isValid = false;
        }
        // Phone validation
        if (!phone.trim()) {
            newErrors.phone = "Phone number is required";
            isValid = false;
        }
        // Password validation
        if (!password) {
            newErrors.password = "Password is required";
            isValid = false;
        } else if (!hasMinChars || !hasNumber || !hasSymbol || !hasMixedCase) {
            newErrors.password = "Password doesn't meet requirements";
            isValid = false;
        }
        // Confirm password validation
        if (password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
            isValid = false;
        }
        // Terms agreement validation
        if (!agreeToTerms) {
            isValid = false;
        }
        setErrors(newErrors);
        return isValid;
    };
    const handleSubmit = async (e)=>{
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        setIsSubmitting(true);
        try {
            const phoneNumber = `+${countryCode}${phone}`;
            const result = await dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$slices$2f$authSlice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["registerUser"])({
                email,
                password,
                confirm_password: confirmPassword,
                first_name: firstName,
                last_name: lastName,
                user_type: "individual",
                phone_number: phoneNumber,
                referred_by: referralCode || undefined
            }));
            if (__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$slices$2f$authSlice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["registerUser"].fulfilled.match(result)) {
                // Registration successful
                router.push("/auth/verify-email"); // Redirect to verification page
            } else {
                // Handle API errors
                if (result.payload) {
                    const apiErrors = result.payload;
                    setErrors((prev)=>({
                            ...prev,
                            ...apiErrors
                        }));
                }
            }
        } catch (error) {
            console.error("Registration error:", error);
            setErrors((prev)=>({
                    ...prev,
                    email: "An error occurred during registration"
                }));
        } finally{
            setIsSubmitting(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-[#18181D] flex flex-col md:flex-row items-start justify-center relative overflow-hidden px-6 py-16 md:pt-24 md:pb-24",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full md:w-1/2 flex justify-center mb-8 md:mb-0 relative z-10",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-[438px] h-[403px] bg-[#1D8751] blur-[60px]  absolute left-16 2xl:left-54 opacity-60"
                    }, void 0, false, {
                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                        lineNumber: 161,
                        columnNumber: 10
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                src: "https://res.cloudinary.com/dam1sxczj/image/upload/v1747220053/iphone_vn7ejc.png",
                                alt: "OMAYA Exchange Mobile App",
                                width: 350,
                                height: 650,
                                className: "mx-auto ",
                                priority: true
                            }, void 0, false, {
                                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                lineNumber: 163,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex space-x-1 mt-4 justify-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "rounded px-2 flex items-center border border-gray-700 bg-white",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                src: "https://res.cloudinary.com/dam1sxczj/image/upload/v1746787514/Google_Play-Icon-Logo.wine_dqxxk7.svg",
                                                alt: "Google Play Store",
                                                width: 40,
                                                height: 13,
                                                className: "mr-2"
                                            }, void 0, false, {
                                                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                lineNumber: 174,
                                                columnNumber: 13
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-[#051015] text-xs",
                                                        children: "Download on the"
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                        lineNumber: 182,
                                                        columnNumber: 15
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[#051015] text-sm font-bold",
                                                        children: "Google Play"
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                        lineNumber: 183,
                                                        columnNumber: 15
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                lineNumber: 181,
                                                columnNumber: 13
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                        lineNumber: 173,
                                        columnNumber: 9
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "rounded px-2 flex items-center border border-gray-700 bg-white",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                src: "https://res.cloudinary.com/dam1sxczj/image/upload/v1747288173/dark_apple_rwpgwi.png",
                                                alt: "Apple App Store",
                                                width: 20,
                                                height: 20,
                                                className: "mr-2"
                                            }, void 0, false, {
                                                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                lineNumber: 187,
                                                columnNumber: 13
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-[#051015] text-xs",
                                                        children: "Download on the"
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                        lineNumber: 195,
                                                        columnNumber: 15
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[#051015] text-sm font-bold",
                                                        children: "App Store"
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                        lineNumber: 196,
                                                        columnNumber: 15
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                lineNumber: 194,
                                                columnNumber: 13
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                        lineNumber: 186,
                                        columnNumber: 11
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                lineNumber: 172,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                        lineNumber: 162,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                lineNumber: 159,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full md:w-1/2 relative z-10",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-md mx-auto 2xl:max-w-3/4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    className: "text-white text-2xl font-semibold",
                                    children: "Registration"
                                }, void 0, false, {
                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                    lineNumber: 207,
                                    columnNumber: 11
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-[#788099]",
                                    children: "Please Register with correct Information"
                                }, void 0, false, {
                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                    lineNumber: 208,
                                    columnNumber: 11
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                            lineNumber: 206,
                            columnNumber: 7
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                            onSubmit: handleSubmit,
                            className: "space-y-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 md:grid-cols-2 gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    htmlFor: "first-name",
                                                    className: "block text-white text-sm mb-2",
                                                    children: "First Name*"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 214,
                                                    columnNumber: 15
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "relative",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "text",
                                                            id: "company-name",
                                                            value: firstName,
                                                            onChange: (e)=>setFirstName(e.target.value),
                                                            className: `w-full py-2 px-4 pl-9 rounded-full bg-[#1D1D23] border ${errors.firstName ? "border-[#FDA29B]" : "border-gray-700"} text-[#788099] focus:outline-none focus:border-[#13B562]`,
                                                            placeholder: "Full Name"
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                            lineNumber: 218,
                                                            columnNumber: 17
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                width: "16",
                                                                height: "16",
                                                                viewBox: "0 0 20 20",
                                                                fill: "none",
                                                                xmlns: "http://www.w3.org/2000/svg",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M17 19V17C17 15.9391 16.5786 14.9217 15.8284 14.1716C15.0783 13.4214 14.0609 13 13 13H7C5.93913 13 4.92172 13.4214 4.17157 14.1716C3.42143 14.9217 3 15.9391 3 17V19",
                                                                        stroke: "#1D8751",
                                                                        strokeWidth: "1.5",
                                                                        strokeLinecap: "round",
                                                                        strokeLinejoin: "round"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                        lineNumber: 230,
                                                                        columnNumber: 21
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M10 10C12.2091 10 14 8.20914 14 6C14 3.79086 12.2091 2 10 2C7.79086 2 6 3.79086 6 6C6 8.20914 7.79086 10 10 10Z",
                                                                        stroke: "#1D8751",
                                                                        strokeWidth: "1.5",
                                                                        strokeLinecap: "round",
                                                                        strokeLinejoin: "round"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                        lineNumber: 231,
                                                                        columnNumber: 21
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                lineNumber: 229,
                                                                columnNumber: 19
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                            lineNumber: 228,
                                                            columnNumber: 17
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 217,
                                                    columnNumber: 15
                                                }, this),
                                                errors.firstName && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "mt-1 text-xs text-[#F04438]",
                                                    children: errors.firstName
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 235,
                                                    columnNumber: 36
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                            lineNumber: 213,
                                            columnNumber: 13
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    htmlFor: "establishment-date",
                                                    className: "block text-white text-sm mb-2",
                                                    children: "Last Name*"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 239,
                                                    columnNumber: 15
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "relative",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "text",
                                                            id: "establishment-date",
                                                            value: lastName,
                                                            onChange: (e)=>setLastName(e.target.value),
                                                            className: `w-full py-2 px-4 pl-9 rounded-full bg-[#1D1D23] border ${errors.lastName ? "border-[#FDA29B]" : "border-gray-700"} text-[#788099] focus:outline-none focus:border-[#13B562]`,
                                                            placeholder: "Last Name"
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                            lineNumber: 243,
                                                            columnNumber: 17
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                width: "16",
                                                                height: "16",
                                                                viewBox: "0 0 20 20",
                                                                fill: "none",
                                                                xmlns: "http://www.w3.org/2000/svg",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M17 19V17C17 15.9391 16.5786 14.9217 15.8284 14.1716C15.0783 13.4214 14.0609 13 13 13H7C5.93913 13 4.92172 13.4214 4.17157 14.1716C3.42143 14.9217 3 15.9391 3 17V19",
                                                                        stroke: "#1D8751",
                                                                        strokeWidth: "1.5",
                                                                        strokeLinecap: "round",
                                                                        strokeLinejoin: "round"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                        lineNumber: 255,
                                                                        columnNumber: 21
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M10 10C12.2091 10 14 8.20914 14 6C14 3.79086 12.2091 2 10 2C7.79086 2 6 3.79086 6 6C6 8.20914 7.79086 10 10 10Z",
                                                                        stroke: "#1D8751",
                                                                        strokeWidth: "1.5",
                                                                        strokeLinecap: "round",
                                                                        strokeLinejoin: "round"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                        lineNumber: 256,
                                                                        columnNumber: 21
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                lineNumber: 254,
                                                                columnNumber: 17
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                            lineNumber: 253,
                                                            columnNumber: 17
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 242,
                                                    columnNumber: 15
                                                }, this),
                                                errors.lastName && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "mt-1 text-xs text-[#F04438]",
                                                    children: errors.lastName
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 260,
                                                    columnNumber: 35
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                            lineNumber: 238,
                                            columnNumber: 13
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                    lineNumber: 212,
                                    columnNumber: 11
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 gap-4",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                htmlFor: "email",
                                                className: "block text-white text-sm mb-2",
                                                children: "Email*"
                                            }, void 0, false, {
                                                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                lineNumber: 266,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "relative",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "email",
                                                        id: "email",
                                                        value: email,
                                                        onChange: (e)=>setEmail(e.target.value),
                                                        className: `w-full py-2 px-4 pl-9 rounded-full bg-[#1D1D23] border ${errors.email ? "border-[#FDA29B]" : "border-gray-700"} text-[#788099] focus:outline-none focus:border-[#13B562]`,
                                                        placeholder: "Email Address"
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                        lineNumber: 270,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                            width: "16",
                                                            height: "16",
                                                            viewBox: "0 0 20 20",
                                                            fill: "none",
                                                            xmlns: "http://www.w3.org/2000/svg",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                                                    x: "2",
                                                                    y: "4",
                                                                    width: "16",
                                                                    height: "12",
                                                                    rx: "2",
                                                                    stroke: "#1D8751",
                                                                    strokeWidth: "1.5"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                    lineNumber: 282,
                                                                    columnNumber: 21
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                    d: "M18 6L10 11L2 6",
                                                                    stroke: "#1D8751",
                                                                    strokeWidth: "1.5",
                                                                    strokeLinecap: "round",
                                                                    strokeLinejoin: "round"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                    lineNumber: 283,
                                                                    columnNumber: 21
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                            lineNumber: 281,
                                                            columnNumber: 19
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                        lineNumber: 280,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                lineNumber: 269,
                                                columnNumber: 15
                                            }, this),
                                            errors.email && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mt-1 text-xs text-[#F04438]",
                                                children: errors.email
                                            }, void 0, false, {
                                                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                lineNumber: 287,
                                                columnNumber: 32
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                        lineNumber: 265,
                                        columnNumber: 13
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                    lineNumber: 264,
                                    columnNumber: 11
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-3 gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    htmlFor: "country-code",
                                                    className: "block text-white text-sm mb-2",
                                                    children: "Country Code*"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 293,
                                                    columnNumber: 15
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "relative",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                            id: "country-code",
                                                            value: countryCode,
                                                            onChange: (e)=>setCountryCode(e.target.value),
                                                            className: "w-full py-2 px-4 pl-9 pr-8 rounded-full bg-[#1D1D23] border border-gray-700 text-white focus:outline-none focus:border-[#13B562] appearance-none",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                value: "50",
                                                                children: "So"
                                                            }, void 0, false, {
                                                                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                lineNumber: 303,
                                                                columnNumber: 19
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                            lineNumber: 297,
                                                            columnNumber: 17
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                width: "12",
                                                                height: "12",
                                                                viewBox: "0 0 24 24",
                                                                fill: "none",
                                                                xmlns: "http://www.w3.org/2000/svg",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                    d: "M6 9L12 15L18 9",
                                                                    stroke: "#788099",
                                                                    strokeWidth: "2",
                                                                    strokeLinecap: "round",
                                                                    strokeLinejoin: "round"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                    lineNumber: 307,
                                                                    columnNumber: 21
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                lineNumber: 306,
                                                                columnNumber: 17
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                            lineNumber: 305,
                                                            columnNumber: 17
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "mr-1 text-[#788099] text-sm",
                                                                    children: "+252"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                    lineNumber: 311,
                                                                    columnNumber: 17
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                    viewBox: "0 0 100 100",
                                                                    xmlns: "http://www.w3.org/2000/svg",
                                                                    width: "16",
                                                                    height: "16",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                                            cx: "50",
                                                                            cy: "50",
                                                                            r: "45",
                                                                            fill: "none"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                            lineNumber: 313,
                                                                            columnNumber: 21
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                                            cx: "50",
                                                                            cy: "50",
                                                                            r: "40",
                                                                            fill: "none",
                                                                            stroke: "#98A2B3",
                                                                            strokeWidth: "5"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                            lineNumber: 314,
                                                                            columnNumber: 21
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                            d: "M40 35 A10 10 0 0 1 50 25 A10 10 0 0 1 60 35 Q60 40 57.5 45 Q55 50 52.5 52.5 Q50 55 50 60",
                                                                            fill: "none",
                                                                            stroke: "#98A2B3",
                                                                            strokeWidth: "6",
                                                                            strokeLinecap: "round"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                            lineNumber: 315,
                                                                            columnNumber: 21
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                                            cx: "50",
                                                                            cy: "70",
                                                                            r: "5",
                                                                            fill: "#98A2B3"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                            lineNumber: 317,
                                                                            columnNumber: 21
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                    lineNumber: 312,
                                                                    columnNumber: 17
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                            lineNumber: 310,
                                                            columnNumber: 17
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 296,
                                                    columnNumber: 15
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                            lineNumber: 292,
                                            columnNumber: 13
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "col-span-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    htmlFor: "phone",
                                                    className: "block text-white text-sm mb-2",
                                                    children: "Phone*"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 324,
                                                    columnNumber: 15
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "relative",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "tel",
                                                            id: "phone",
                                                            value: phone,
                                                            onChange: (e)=>setPhone(e.target.value),
                                                            className: `w-full py-2 px-4 pl-9 rounded-full bg-[#1D1D23] border ${errors.phone ? "border-[#FDA29B]" : "border-gray-700"} text-[#788099] focus:outline-none focus:border-[#13B562]`,
                                                            placeholder: "+12345678"
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                            lineNumber: 328,
                                                            columnNumber: 17
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                width: "16",
                                                                height: "16",
                                                                viewBox: "0 0 20 20",
                                                                fill: "none",
                                                                xmlns: "http://www.w3.org/2000/svg",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                    d: "M17 13V16C17 16.5304 16.7893 17.0391 16.4142 17.4142C16.0391 17.7893 15.5304 18 15 18C12.6266 18 10.3065 17.1571 8.3432 15.6569C6.5276 14.2921 5.0461 12.4787 4.0567 10.375C3.35236 8.77321 2.99913 7.0312 3 5.27276C3 4.74232 3.21071 4.23363 3.58579 3.85855C3.96086 3.48348 4.46957 3.27277 5 3.27277H8C8.47171 3.27132 8.92936 3.46188 9.26542 3.8049C9.60148 4.14793 9.79281 4.61042 9.79 5.08213C9.78207 5.87858 9.86506 6.67266 10.0367 7.44455C10.1549 7.90095 10.1367 8.3877 9.98511 8.83222C9.83357 9.27674 9.55903 9.65729 9.2 9.92277L8.21 10.9128C9.1654 12.7952 10.6348 14.2646 12.5172 15.22L13.507 14.23C13.7725 13.871 14.153 13.5964 14.5976 13.4449C15.0421 13.2933 15.5288 13.2751 15.9852 13.3933C16.7571 13.5649 17.5512 13.6479 18.3476 13.64C18.8202 13.6372 19.2834 13.8293 19.6263 14.1666C19.9692 14.5039 20.158 14.9629 20.1547 15.4355V18.0001C20.1547 18.5305 19.944 19.0392 19.5689 19.4143C19.1938 19.7893 18.6851 20.0001 18.1547 20.0001",
                                                                    stroke: "#1D8751",
                                                                    strokeWidth: "1.5",
                                                                    strokeLinecap: "round",
                                                                    strokeLinejoin: "round"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                    lineNumber: 340,
                                                                    columnNumber: 21
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                lineNumber: 339,
                                                                columnNumber: 19
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                            lineNumber: 338,
                                                            columnNumber: 17
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 327,
                                                    columnNumber: 15
                                                }, this),
                                                errors.phone && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "mt-1 text-xs text-[#F04438]",
                                                    children: errors.phone
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 344,
                                                    columnNumber: 32
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                            lineNumber: 323,
                                            columnNumber: 13
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                    lineNumber: 291,
                                    columnNumber: 11
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 md:grid-cols-2 gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    htmlFor: "password",
                                                    className: "block text-white text-sm mb-2",
                                                    children: "Password*"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 350,
                                                    columnNumber: 15
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "relative",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "password",
                                                            id: "password",
                                                            value: password,
                                                            onChange: (e)=>setPassword(e.target.value),
                                                            className: `w-full py-2 px-4 pl-9 rounded-full bg-[#1D1D23] border ${errors.password ? "border-[#FDA29B]" : "border-gray-700"} text-[#788099] focus:outline-none focus:border-[#13B562]`,
                                                            placeholder: "Enter password"
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                            lineNumber: 354,
                                                            columnNumber: 17
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                xmlns: "http://www.w3.org/2000/svg",
                                                                viewBox: "0 0 24 24",
                                                                width: "24",
                                                                height: "20",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M8,10 L8,7 C8,4.791 9.791,3 12,3 C14.209,3 16,4.791 16,7 L16,10",
                                                                        stroke: "#1D8751",
                                                                        strokeWidth: "1.5",
                                                                        fill: "none",
                                                                        strokeLinecap: "round"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                        lineNumber: 366,
                                                                        columnNumber: 19
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                                                        x: "7",
                                                                        y: "10",
                                                                        width: "10",
                                                                        height: "8",
                                                                        rx: "1",
                                                                        stroke: "#1D8751",
                                                                        strokeWidth: "1.5",
                                                                        fill: "none"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                        lineNumber: 371,
                                                                        columnNumber: 19
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                                        x1: "12",
                                                                        y1: "13.5",
                                                                        x2: "12",
                                                                        y2: "14.5",
                                                                        stroke: "#1D8751",
                                                                        strokeWidth: "1.5",
                                                                        strokeLinecap: "round"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                        lineNumber: 375,
                                                                        columnNumber: 19
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                lineNumber: 365,
                                                                columnNumber: 17
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                            lineNumber: 364,
                                                            columnNumber: 17
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "absolute inset-y-0 right-0 pr-3 flex items-center",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                width: "16",
                                                                height: "16",
                                                                viewBox: "0 0 20 20",
                                                                fill: "none",
                                                                xmlns: "http://www.w3.org/2000/svg",
                                                                className: "cursor-pointer",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M2 10C2 10 5 4 10 4C15 4 18 10 18 10C18 10 15 16 10 16C5 16 2 10 2 10Z",
                                                                        stroke: "#788099",
                                                                        strokeWidth: "1.5",
                                                                        strokeLinecap: "round",
                                                                        strokeLinejoin: "round"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                        lineNumber: 380,
                                                                        columnNumber: 21
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12Z",
                                                                        stroke: "#788099",
                                                                        strokeWidth: "1.5",
                                                                        strokeLinecap: "round",
                                                                        strokeLinejoin: "round"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                        lineNumber: 381,
                                                                        columnNumber: 21
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                lineNumber: 379,
                                                                columnNumber: 19
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                            lineNumber: 378,
                                                            columnNumber: 17
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 353,
                                                    columnNumber: 15
                                                }, this),
                                                errors.password && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "mt-1 text-xs text-[#F04438]",
                                                    children: errors.password
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 385,
                                                    columnNumber: 35
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                            lineNumber: 349,
                                            columnNumber: 13
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    htmlFor: "confirm-password",
                                                    className: "block text-white text-sm mb-2",
                                                    children: "Confirm password*"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 389,
                                                    columnNumber: 15
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "relative",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "password",
                                                            id: "confirm-password",
                                                            value: confirmPassword,
                                                            onChange: (e)=>setConfirmPassword(e.target.value),
                                                            className: `w-full py-2 px-4 pl-9 rounded-full bg-[#1D1D23] border ${errors.confirmPassword ? "border-[#FDA29B]" : "border-gray-700"} text-[#788099] focus:outline-none focus:border-[#13B562]`,
                                                            placeholder: "Confirm password"
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                            lineNumber: 393,
                                                            columnNumber: 17
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                xmlns: "http://www.w3.org/2000/svg",
                                                                viewBox: "0 0 24 24",
                                                                width: "24",
                                                                height: "20",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M8,10 L8,7 C8,4.791 9.791,3 12,3 C14.209,3 16,4.791 16,7 L16,10",
                                                                        stroke: "#1D8751",
                                                                        strokeWidth: "1.5",
                                                                        fill: "none",
                                                                        strokeLinecap: "round"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                        lineNumber: 405,
                                                                        columnNumber: 19
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                                                        x: "7",
                                                                        y: "10",
                                                                        width: "10",
                                                                        height: "8",
                                                                        rx: "1",
                                                                        stroke: "#1D8751",
                                                                        strokeWidth: "1.5",
                                                                        fill: "none"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                        lineNumber: 410,
                                                                        columnNumber: 19
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                                        x1: "12",
                                                                        y1: "13.5",
                                                                        x2: "12",
                                                                        y2: "14.5",
                                                                        stroke: "#1D8751",
                                                                        strokeWidth: "1.5",
                                                                        strokeLinecap: "round"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                        lineNumber: 414,
                                                                        columnNumber: 19
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                lineNumber: 404,
                                                                columnNumber: 17
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                            lineNumber: 403,
                                                            columnNumber: 17
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "absolute inset-y-0 right-0 pr-3 flex items-center",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                width: "16",
                                                                height: "16",
                                                                viewBox: "0 0 20 20",
                                                                fill: "none",
                                                                xmlns: "http://www.w3.org/2000/svg",
                                                                className: "cursor-pointer",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M2 10C2 10 5 4 10 4C15 4 18 10 18 10C18 10 15 16 10 16C5 16 2 10 2 10Z",
                                                                        stroke: "#788099",
                                                                        strokeWidth: "1.5",
                                                                        strokeLinecap: "round",
                                                                        strokeLinejoin: "round"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                        lineNumber: 419,
                                                                        columnNumber: 21
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12Z",
                                                                        stroke: "#788099",
                                                                        strokeWidth: "1.5",
                                                                        strokeLinecap: "round",
                                                                        strokeLinejoin: "round"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                        lineNumber: 420,
                                                                        columnNumber: 21
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                lineNumber: 418,
                                                                columnNumber: 19
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                            lineNumber: 417,
                                                            columnNumber: 17
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 392,
                                                    columnNumber: 15
                                                }, this),
                                                errors.confirmPassword && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "mt-1 text-xs text-[#F04438]",
                                                    children: errors.confirmPassword
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 424,
                                                    columnNumber: 42
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                            lineNumber: 388,
                                            columnNumber: 13
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                    lineNumber: 348,
                                    columnNumber: 11
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-col space-y-1 ml-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center space-x-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: `h-2 w-2 rounded-full ${hasMinChars ? "bg-[#1D8751]" : "bg-[#1D8751]"}`
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 431,
                                                    columnNumber: 15
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-sm text-white",
                                                    children: "At least 8 characters"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 432,
                                                    columnNumber: 15
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                            lineNumber: 430,
                                            columnNumber: 13
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center space-x-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: `h-2 w-2 rounded-full ${hasNumber || hasSymbol ? "bg-[#1D8751]" : "bg-[#1D8751]"}`
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 435,
                                                    columnNumber: 15
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-sm text-white",
                                                    children: "At least one number or symbol"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 436,
                                                    columnNumber: 15
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                            lineNumber: 434,
                                            columnNumber: 13
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center space-x-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: `h-2 w-2 rounded-full ${hasMixedCase ? "bg-[#1D8751]" : "bg-[#1D8751]"}`
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 439,
                                                    columnNumber: 15
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-sm text-white",
                                                    children: "Both uppercase and lowercase letters"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 440,
                                                    columnNumber: 15
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                            lineNumber: 438,
                                            columnNumber: 13
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                    lineNumber: 429,
                                    columnNumber: 11
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            htmlFor: "referral-code",
                                            className: "block text-white text-sm mb-2",
                                            children: "Referral Code"
                                        }, void 0, false, {
                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                            lineNumber: 446,
                                            columnNumber: 13
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "relative",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    id: "referral-code",
                                                    value: referralCode,
                                                    onChange: (e)=>setReferralCode(e.target.value),
                                                    className: "w-full py-2 px-4 pl-9 rounded-full bg-[#1D1D23] border border-gray-700 text-[#788099] focus:outline-none focus:border-[#13B562]",
                                                    placeholder: "Paste here your referral code"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 450,
                                                    columnNumber: 15
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                        src: "https://res.cloudinary.com/dam1sxczj/image/upload/v1747313820/link-svgrepo-com_pnpakl.svg",
                                                        className: "w-4 h-4",
                                                        alt: ""
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                        lineNumber: 459,
                                                        columnNumber: 18
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 458,
                                                    columnNumber: 15
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "absolute inset-y-0 right-0 pr-3 flex items-center",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                        viewBox: "0 0 100 100",
                                                        xmlns: "http://www.w3.org/2000/svg",
                                                        width: "16",
                                                        height: "16",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                                cx: "50",
                                                                cy: "50",
                                                                r: "45",
                                                                fill: "none"
                                                            }, void 0, false, {
                                                                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                lineNumber: 463,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                                cx: "50",
                                                                cy: "50",
                                                                r: "40",
                                                                fill: "none",
                                                                stroke: "#98A2B3",
                                                                strokeWidth: "5"
                                                            }, void 0, false, {
                                                                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                lineNumber: 464,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                d: "M40 35 A10 10 0 0 1 50 25 A10 10 0 0 1 60 35 Q60 40 57.5 45 Q55 50 52.5 52.5 Q50 55 50 60",
                                                                fill: "none",
                                                                stroke: "#98A2B3",
                                                                strokeWidth: "6",
                                                                strokeLinecap: "round"
                                                            }, void 0, false, {
                                                                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                lineNumber: 465,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                                cx: "50",
                                                                cy: "70",
                                                                r: "5",
                                                                fill: "#98A2B3"
                                                            }, void 0, false, {
                                                                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                lineNumber: 467,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                        lineNumber: 462,
                                                        columnNumber: 15
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 461,
                                                    columnNumber: 15
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                            lineNumber: 449,
                                            columnNumber: 13
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                    lineNumber: 445,
                                    columnNumber: 11
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "relative flex items-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox",
                                                    id: "terms",
                                                    checked: agreeToTerms,
                                                    onChange: ()=>setAgreeToTerms(!agreeToTerms),
                                                    className: "opacity-0 absolute h-4 w-4 cursor-pointer"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 477,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: `border border-[#1D8751] rounded h-4 w-4 flex flex-shrink-0 justify-center items-center mr-2 ${agreeToTerms ? 'bg-[#1D8751]' : 'bg-transparent'}`,
                                                    children: agreeToTerms && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                        className: "fill-current w-2 h-2 text-[#788099] pointer-events-none",
                                                        viewBox: "0 0 20 20",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            d: "M0 11l2-2 5 5L18 3l2 2L7 18z"
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                            lineNumber: 487,
                                                            columnNumber: 23
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                        lineNumber: 486,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 484,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    htmlFor: "terms",
                                                    className: "text-sm text-white cursor-pointer",
                                                    children: "By clicking Register, you agree to our Terms of Services and that you have read our Data Use Policy, including our Cookie Use"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 491,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                            lineNumber: 476,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                        lineNumber: 475,
                                        columnNumber: 13
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                    lineNumber: 474,
                                    columnNumber: 11
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "submit",
                                    className: "w-full bg-[#1D8751] text-white py-3 px-4 rounded-full hover:bg-[#0E5531] transition-colors duration-300 mt-4",
                                    children: "Register"
                                }, void 0, false, {
                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                    lineNumber: 499,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-center mt-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-gray-400",
                                            children: [
                                                "Already have an account?",
                                                " ",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                    href: "/auth/login",
                                                    className: "text-[#1D8751] hover:text-[#0E5531] cursor-pointer",
                                                    children: "Log In"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 510,
                                                    columnNumber: 15
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                            lineNumber: 508,
                                            columnNumber: 13
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "border-t border-gray-700 flex-grow mt-2"
                                        }, void 0, false, {
                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                            lineNumber: 514,
                                            columnNumber: 13
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                    lineNumber: 507,
                                    columnNumber: 11
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "relative flex items-center justify-center",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "mx-4 text-gray-400 text-sm",
                                                children: "Or Sign Up with"
                                            }, void 0, false, {
                                                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                lineNumber: 520,
                                                columnNumber: 15
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                            lineNumber: 519,
                                            columnNumber: 13
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-2 gap-2 mt-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    className: "flex items-center justify-center py-2 px-4 rounded-lg border border-gray-700 bg-[#1D1D23] text-white hover:bg-[#1a1a1a] transition-colors duration-300",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                            className: "w-5 h-5 mr-2",
                                                            viewBox: "0 0 24 24",
                                                            xmlns: "http://www.w3.org/2000/svg",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                    d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z",
                                                                    fill: "#4285F4"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                    lineNumber: 533,
                                                                    columnNumber: 19
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                    d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z",
                                                                    fill: "#34A853"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                    lineNumber: 537,
                                                                    columnNumber: 19
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                    d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z",
                                                                    fill: "#FBBC05"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                    lineNumber: 541,
                                                                    columnNumber: 19
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                    d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z",
                                                                    fill: "#EA4335"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                    lineNumber: 545,
                                                                    columnNumber: 19
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                            lineNumber: 528,
                                                            columnNumber: 17
                                                        }, this),
                                                        "Google"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 524,
                                                    columnNumber: 15
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    className: "flex items-center justify-center py-2 px-4 rounded-lg border border-gray-700 bg-[#1D1D23] text-white hover:bg-[#1a1a1a] transition-colors duration-300",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                            className: "w-6 h-6 mr-2",
                                                            viewBox: "0 0 24 24",
                                                            xmlns: "http://www.w3.org/2000/svg",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                                    cx: "12",
                                                                    cy: "12",
                                                                    r: "12",
                                                                    fill: "#1877F2"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                    lineNumber: 561,
                                                                    columnNumber: 19
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                    d: "M15.117 8.667h-1.55c-.486 0-.867.381-.867.867v1.55h2.417l-.317 2.417h-2.1v6.05h-2.417v-6.05h-2.1v-2.417h2.1v-1.55c0-1.486 1.2-2.683 2.683-2.683h1.55v2.417z",
                                                                    fill: "#FFFFFF"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                                    lineNumber: 562,
                                                                    columnNumber: 19
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                            lineNumber: 556,
                                                            columnNumber: 17
                                                        }, this),
                                                        "Facebook"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                                    lineNumber: 552,
                                                    columnNumber: 15
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                            lineNumber: 523,
                                            columnNumber: 13
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                                    lineNumber: 518,
                                    columnNumber: 11
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/auth/components/RegisterForm.tsx",
                            lineNumber: 211,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/auth/components/RegisterForm.tsx",
                    lineNumber: 205,
                    columnNumber: 7
                }, this)
            }, void 0, false, {
                fileName: "[project]/features/auth/components/RegisterForm.tsx",
                lineNumber: 204,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/auth/components/RegisterForm.tsx",
        lineNumber: 157,
        columnNumber: 5
    }, this);
}
}}),
"[project]/app/auth/register/page.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$components$2f$RegisterForm$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/auth/components/RegisterForm.tsx [app-ssr] (ecmascript)");
"use client";
;
;
const Register = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$components$2f$RegisterForm$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
            fileName: "[project]/app/auth/register/page.tsx",
            lineNumber: 8,
            columnNumber: 10
        }, this)
    }, void 0, false);
};
const __TURBOPACK__default__export__ = Register;
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__8a92c7e9._.js.map