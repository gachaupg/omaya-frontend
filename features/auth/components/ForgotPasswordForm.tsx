/**
 * ForgotPasswordForm.tsx – auto‑generated placeholder
 */

"use client";
import Image from 'next/image';


const ForgetPassword = () => {
  return (
    <div className="flex min-h-screen bg-[#18181D] flex-col md:flex-row items-start justify-center relative overflow-hidden px-6 py-8 md:pt-24">
      {/* Left Side - Mobile App Preview */}
      <div className="w-full md:w-1/2 flex justify-center mb-8 md:mb-0 relative z-10">
         {/* Background Glow Effect */}
         <div className="w-[438px] h-[403px] bg-[#1D8751] blur-[60px]  absolute left-16 2xl:left-54 opacity-60"></div>
        <div className="relative">
          <Image
            src="https://res.cloudinary.com/dam1sxczj/image/upload/v1747220053/iphone_vn7ejc.png"
            alt="OMAYA Exchange Mobile App"
            width={350}
            height={650}
            className="mx-auto "
            priority
          />
          {/* App store badges */}
        <div className="flex space-x-1 mt-4 justify-center">
        <div className="rounded px-2 flex items-center border border-gray-700 bg-white">
            <Image
              src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746787514/Google_Play-Icon-Logo.wine_dqxxk7.svg" 
              alt="Google Play Store" 
              width={40} 
              height={13} 
              className="mr-2"
            />
            <div>
              <p className="text-[#051015] text-xs">Download on the</p>
              <span className="text-[#051015] text-sm font-bold">Google Play</span>
            </div>
          </div>
          <div className="rounded px-2 flex items-center border border-gray-700 bg-white">
            <Image 
              src="https://res.cloudinary.com/dam1sxczj/image/upload/v1747288173/dark_apple_rwpgwi.png" 
              alt="Apple App Store" 
              width={20} 
              height={20} 
              className="mr-2"
            />
            <div>
              <p className="text-[#051015] text-xs">Download on the</p>
              <span className="text-[#051015] text-sm font-bold">App Store</span>
            </div>
          </div>
        </div>
        </div>
      </div>
      
      {/* Right side - Forgot password flow */}
      <div className="w-1/2 p-8 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full 2xl:max-w-3/4">
              <h1 className="text-2xl font-semibold text-white mb-2">Forgot Password</h1>
              <p className="text-[#788099] mb-1">
                Enter your email to receive the instruction <br />
                to reset your password
              </p>
              
              <form className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                <label htmlFor="email" className="block text-white text-sm mb-2">
                    Email*
                </label>
                <div className="relative">
                    <input
                    type="email"
                    id="email"
                    placeholder="Email Address"
                    className="w-full py-2 px-4 pl-9 bg-[#1D1D23] border border-[#35353E] rounded-full  text-[#788099] placeholder-[#788099] focus:outline-none focus:ring-2 focus:ring-[#1D8751] focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="4" width="16" height="12" rx="2" stroke="#1D8751" strokeWidth="1.5" />
                        <path d="M18 6L10 11L2 6" stroke="#1D8751" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    </div>
                </div>
                </div>
          </div>
        </form>
        <button
              type="submit"
              className="w-full bg-[#1D8751] text-white py-2 px-4 rounded-full hover:bg-[#0E5531] transition-colors duration-300 mt-4"
            >
              Confirm
            </button>
        </div>
 
      </div>
    </div>
  );
};

export default ForgetPassword;