"use client";

import { Toaster as SonnerToaster } from "sonner";

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <SonnerToaster
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#35353E] group-[.toaster]:text-[#1D8751] group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-[#1D8751]",
          actionButton: "group-[.toast]:bg-[#1D8751] group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-[#35353E] group-[.toast]:text-[#1D8751]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
