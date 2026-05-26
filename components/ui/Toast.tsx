"use client";

import { Toaster as SonnerToaster } from "sonner";
import toast, {
  Toaster as HotToaster,
  ToastBar,
  resolveValue,
} from "react-hot-toast";
import { ToastContainer } from "react-toastify";
import { X } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import { hotToastOptions, sonnerToastClassNames } from "@/lib/utils/toastTheme";

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <>
      <SonnerToaster
        position="top-right"
        className="toaster group"
        closeButton
        toastOptions={{
          classNames: sonnerToastClassNames,
        }}
        {...props}
      />
      <HotToaster position="top-right" gutter={8} toastOptions={hotToastOptions}>
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <div className="relative flex items-start gap-2 w-full pr-5">
                {icon ? <span className="shrink-0 mt-0.5">{icon}</span> : null}
                <div className="flex-1 min-w-0 text-[13px] leading-snug">
                  {resolveValue(message, t)}
                </div>
                {t.type !== "loading" ? (
                  <button
                    type="button"
                    onClick={() => toast.dismiss(t.id)}
                    className="absolute top-2 right-2 p-0.5 rounded opacity-70 hover:opacity-100 text-inherit"
                    aria-label="Close"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </button>
                ) : null}
              </div>
            )}
          </ToastBar>
        )}
      </HotToaster>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        closeButton
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        icon={false}
        toastClassName="omaya-toastify-toast"
      />
    </>
  );
};

export { Toaster };
