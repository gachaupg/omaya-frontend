"use client";

import { ContactPage } from "@/features/contact/components"

const page = () => {
  return (
    <div className="bg-gray-50 dark:bg-[#0b0b0f] min-h-screen w-full pt-14 sm:pt-16 md:pt-20 lg:pt-20 pb-10 sm:pb-14 md:pb-16 px-3 sm:px-4 md:px-6 lg:px-8 relative z-0 overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full">
        <ContactPage />
      </div>
    </div>
  )
}

export default page