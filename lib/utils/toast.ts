import { toast } from "sonner";

export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 3000,
    });
  },
  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 4000,
    });
  },
  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 3000,
    });
  },
  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 3000,
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
