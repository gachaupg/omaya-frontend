"use client";

import { ContactPage } from "@/features/contact/components"

const page = () => {
  return (
    <div className="bg-gray-50 dark:bg-[var(--bg-color)] min-h-screen w-full pt-16 sm:pt-20 md:pt-24 lg:pt-28 pb-6 sm:pb-8 md:pb-12 lg:pb-16 px-3 sm:px-4 md:px-6 lg:px-6 relative z-0 overflow-x-hidden">
      <div className="max-w-[1200px] mx-auto w-full">
        <ContactPage />
      </div>
    </div>
  )
}

export default page