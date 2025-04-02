
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") as "light" | "dark") || "light"
  );
  
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove the class first to prevent flickering
    root.classList.remove("light", "dark");
    
    // Add the appropriate class
    root.classList.add(theme);
    
    // Save the theme preference
    localStorage.setItem("theme", theme);
  }, [theme]);
  
  function toggleTheme() {
    setTheme(prevTheme => prevTheme === "light" ? "dark" : "light");
  }
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5 transition-all" />
      ) : (
        <Sun className="h-5 w-5 transition-all" />
      )}
    </Button>
  );
}
