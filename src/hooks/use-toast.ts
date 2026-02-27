import { toast as sonnerToast, ExternalToast } from "sonner";

export interface ToastOptions {
  message?: string;
  title?: string;
  description?: string;
  type?: "default" | "success" | "info" | "warning" | "error";
  duration?: number;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
}

// Helper to safely stringify and hash content for deduplication
const generateToastId = (message: string | React.ReactNode, data?: ExternalToast) => {
  if (data?.id) return data.id;
  const msgStr = typeof message === 'string' ? message : 'complex-msg';
  const descStr = typeof data?.description === 'string' ? data.description : '';
  return `${msgStr}-${descStr}`;
};

// Create a proxy wrapper around sonner toast to auto-deduplicate identical messages
const createDeduplicatedToast = () => {
  const customToast = (message: string | React.ReactNode, data?: ExternalToast) => {
    return sonnerToast(message, { ...data, id: generateToastId(message, data) });
  };

  // Add the method shorthands
  customToast.success = (message: string | React.ReactNode, data?: ExternalToast) =>
    sonnerToast.success(message, { ...data, id: generateToastId(message, data) });

  customToast.error = (message: string | React.ReactNode, data?: ExternalToast) =>
    sonnerToast.error(message, { ...data, id: generateToastId(message, data) });

  customToast.info = (message: string | React.ReactNode, data?: ExternalToast) =>
    sonnerToast.info(message, { ...data, id: generateToastId(message, data) });

  customToast.warning = (message: string | React.ReactNode, data?: ExternalToast) =>
    sonnerToast.warning(message, { ...data, id: generateToastId(message, data) });

  customToast.loading = (message: string | React.ReactNode, data?: ExternalToast) =>
    sonnerToast.loading(message, { ...data, id: generateToastId(message, data) });

  customToast.dismiss = (id?: string | number) => sonnerToast.dismiss(id);
  customToast.promise = sonnerToast.promise;
  customToast.custom = sonnerToast.custom;

  return customToast as typeof sonnerToast;
};

export const toast = createDeduplicatedToast();

export const useToast = () => {
  const legacyToastWrapper = (options: ToastOptions | string) => {
    if (typeof options === "string") {
      return toast(options);
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

    const content = title || message || "";
    const opts = { description, duration, action };

    switch (type) {
      case "success": return toast.success(content, opts);
      case "error": return toast.error(content, opts);
      case "warning": return toast.warning(content, opts);
      case "info": return toast.info(content, opts);
      default: return toast(content, opts);
    }
  };

  const toasts: any[] = [];
  return { toast: legacyToastWrapper, toasts };
};
