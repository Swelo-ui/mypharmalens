
import { toast as sonnerToast, type ToastT } from "sonner";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
}

export interface ToastOptions {
  message: string;
  description?: string;
  type?: "default" | "success" | "info" | "warning" | "error";
  duration?: number;
}

export const useToast = () => {
  const toast = (options: ToastOptions | string) => {
    if (typeof options === "string") {
      return sonnerToast(options);
    }
    
    const { message, description, type = "default", duration } = options;
    
    switch (type) {
      case "success":
        return sonnerToast.success(message, {
          description,
          duration,
        });
      case "error":
        return sonnerToast.error(message, {
          description,
          duration,
        });
      case "warning":
        return sonnerToast.warning(message, {
          description,
          duration,
        });
      case "info":
        return sonnerToast.info(message, {
          description,
          duration,
        });
      default:
        return sonnerToast(message, {
          description,
          duration,
        });
    }
  };

  return { toast };
};

export { sonnerToast as toast };
