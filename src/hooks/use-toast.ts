
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

// Create a global request tracker to prevent duplicate toasts
const recentToasts = new Set<string>();
const TOAST_DEBOUNCE_TIME = 5000; // 5 seconds debounce time

// Helper function to create a unique key for a toast message
const getToastKey = (content: string, type: string): string => {
  return `${content}-${type}`;
};

// Track all active toast IDs to prevent duplicates
const activeToastIds = new Set<string>();

export const useToast = () => {
  const toast = (options: ToastOptions | string) => {
    if (typeof options === "string") {
      const toastKey = getToastKey(options, "default");
      
      // Check if this toast was recently shown
      if (recentToasts.has(toastKey)) {
        return;
      }
      
      // Add to recent toasts and set timeout to remove it
      recentToasts.add(toastKey);
      setTimeout(() => recentToasts.delete(toastKey), TOAST_DEBOUNCE_TIME);
      
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
    const toastKey = getToastKey(content, type);
    
    // Check if this toast was recently shown
    if (recentToasts.has(toastKey) || content === "") {
      return;
    }
    
    // Add to recent toasts and set timeout to remove it
    recentToasts.add(toastKey);
    setTimeout(() => recentToasts.delete(toastKey), TOAST_DEBOUNCE_TIME);
    
    // Ensure each toast has a unique ID by adding a timestamp
    const uniqueId = `${content}-${type}-${Date.now()}`;
    
    // Prevent duplicate toast IDs
    if (activeToastIds.has(uniqueId)) {
      return;
    }
    
    activeToastIds.add(uniqueId);
    setTimeout(() => activeToastIds.delete(uniqueId), 500);
    
    switch (type) {
      case "success":
        return sonnerToast.success(content, {
          id: uniqueId,
          description,
          duration,
          action,
        });
      case "error":
        return sonnerToast.error(content, {
          id: uniqueId,
          description,
          duration,
          action,
        });
      case "warning":
        return sonnerToast.warning(content, {
          id: uniqueId,
          description,
          duration,
          action,
        });
      case "info":
        return sonnerToast.info(content, {
          id: uniqueId,
          description,
          duration,
          action,
        });
      default:
        return sonnerToast(content, {
          id: uniqueId,
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
