"use client"
import dynamicImport from 'next/dynamic'

// Dynamically import the RegisterForm with no SSR
const RegisterPage = dynamicImport(() => import("@/features/auth/components/RegisterForm"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D8751] mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading registration form...</p>
      </div>
    </div>
  )
})

const Register = () => {
    return (
        <>
         <RegisterPage/>
        </>
        )
    }

// Disable static generation for this page
export const dynamic = 'force-dynamic'
    
export default Register;