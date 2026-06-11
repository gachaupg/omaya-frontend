import { toast } from "sonner";

type ToastPosition = "top-center" | "top-right" | "top-left" | "bottom-center" | "bottom-right" | "bottom-left";

type ToastOptions = {
  position?: ToastPosition;
  duration?: number;
};

export const showToast = {
  success: (message: string, description?: string, options?: ToastOptions) => {
    toast.success(message, {
      description,
      duration: options?.duration ?? 3000,
      position: options?.position || "top-right",
    });
  },
  error: (message: string, description?: string, options?: ToastOptions) => {
    toast.error(message, {
      description,
      duration: options?.duration ?? 4000,
      position: options?.position || "top-right",
    });
  },
  warning: (message: string, description?: string, options?: ToastOptions) => {
    toast.warning(message, {
      description,
      duration: options?.duration ?? 3000,
      position: options?.position || "top-right",
    });
  },
  info: (message: string, description?: string, options?: ToastOptions) => {
    toast.info(message, {
      description,
      duration: options?.duration ?? 3000,
      position: options?.position || "top-right",
    });
  },
  loading: (
    message: string,
    options?: { duration?: number; position?: string }
  ) => {
    return toast.loading(message, {
      duration: options?.duration || 0, // 0 means don't auto-dismiss
      position: (options?.position as any) || "top-right",
    });
  },
  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },
  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  },
};
