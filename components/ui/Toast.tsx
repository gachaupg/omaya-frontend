"use client";

import { Toaster as SonnerToaster } from "sonner";

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

const baseToast =
  "group toast group-[.toaster]:bg-[#35353E] group-[.toaster]:shadow-lg group-[.toaster]:border";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <SonnerToaster
      position="top-right"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: baseToast,
          title: "group-[.toast]:font-semibold",
          description: "group-[.toast]:opacity-90",
          success: `${baseToast} group-[.toaster]:border-[#1D8751] group-[.toaster]:text-[#1D8751] [&_[data-title]]:text-[#1D8751] [&_[data-description]]:text-[#7dd4a0]`,
          error: `${baseToast} group-[.toaster]:border-[#E23D3A] group-[.toaster]:text-[#E23D3A] [&_[data-title]]:text-[#E23D3A] [&_[data-description]]:text-[#f5a5a3]`,
          warning: `${baseToast} group-[.toaster]:border-[#F79330] group-[.toaster]:text-[#F79330] [&_[data-title]]:text-[#F79330] [&_[data-description]]:text-[#f5c99a]`,
          info: `${baseToast} group-[.toaster]:border-[#3B82F6] group-[.toaster]:text-[#93C5FD] [&_[data-title]]:text-[#93C5FD] [&_[data-description]]:text-[#BFDBFE]`,
          actionButton:
            "group-[.toast]:bg-[#1D8751] group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-[#35353E] group-[.toast]:text-gray-300",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
