
import { toast as sonnerToast } from "sonner";

export interface ToastOptions {
  message?: string;
  title?: string;
  description?: string;
  type?: "default" | "success" | "info" | "warning" | "error";
  duration?: number;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
}

export const useToast = () => {
  const toast = (options: ToastOptions | string) => {
    if (typeof options === "string") {
      return sonnerToast(options);
    }
    
    const { 
      message, 
      title, 
      description, 
      type = "default", 
      duration,
      action,
      variant 
    } = options;
    
    // Use title or message as the primary content
    const content = title || message || "";
    
    switch (type) {
      case "success":
        return sonnerToast.success(content, {
          description,
          duration,
          action,
        });
      case "error":
        return sonnerToast.error(content, {
          description,
          duration,
          action,
        });
      case "warning":
        return sonnerToast.warning(content, {
          description,
          duration,
          action,
        });
      case "info":
        return sonnerToast.info(content, {
          description,
          duration,
          action,
        });
      default:
        return sonnerToast(content, {
          description,
          duration,
          action,
        });
    }
  };

  // This is needed for compatibility with the shadcn/ui toaster component
  const toasts = [];

  return { toast, toasts };
};

export { sonnerToast as toast };
