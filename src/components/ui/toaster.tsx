
import { Toaster as SonnerToaster } from "sonner";

// Simple wrapper around sonner's toaster with our default styling
export function Toaster() {
  return (
    <SonnerToaster 
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "group rounded-lg border p-4 shadow-lg",
          title: "text-sm font-semibold",
          description: "text-sm opacity-90 mt-1",
          success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300",
          error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300",
          warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300",
          info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300",
          default: "bg-background border-border text-foreground"
        }
      }}
    />
  );
}
