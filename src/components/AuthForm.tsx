
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogIn, UserPlus, ArrowRight, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast.error("Invalid email format");
      return;
    }
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        throw error;
      }

      toast.success("Account created successfully!", { 
        description: "Please check your email to confirm your account."
      });
      
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast.error("Sign up failed", { 
        description: error.message || "An unexpected error occurred" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) {
        throw error;
      }

      toast.success("Signed in successfully");
      navigate('/identify');
      
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error("Sign in failed", { 
        description: error.message || "An unexpected error occurred" 
      });
    } finally {
      setLoading(false);
    }
  };
  
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Tabs defaultValue="signin" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        
        <TabsContent value="signin">
          <div className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 rounded-full bg-pharma-100 dark:bg-pharma-900/30">
                <LogIn className="h-6 w-6 text-pharma-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-center">Welcome Back</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">Sign in to access your identification history</p>
            
            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="flex items-center text-sm font-medium">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  Email
                </Label>
                <div className="relative">
                  <Input 
                    id="signin-email"
                    type="email" 
                    placeholder="your@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-3 pr-3 py-2 border-gray-300 dark:border-gray-600 focus:ring-pharma-500 focus:border-pharma-500"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signin-password" className="flex items-center text-sm font-medium">
                  <Lock className="h-4 w-4 mr-2 text-gray-400" />
                  Password
                </Label>
                <div className="relative">
                  <Input 
                    id="signin-password"
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-3 pr-10 py-2 border-gray-300 dark:border-gray-600 focus:ring-pharma-500 focus:border-pharma-500"
                    required
                  />
                  <button 
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={setRememberMe}
                  />
                  <Label htmlFor="remember-me" className="text-sm text-gray-500 cursor-pointer">Remember me</Label>
                </div>
                <a href="#" className="text-sm font-medium text-pharma-600 hover:text-pharma-700">Forgot password?</a>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-pharma-600 hover:bg-pharma-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    const signupTab = document.querySelector('[data-value="signup"]') as HTMLElement | null;
                    if (signupTab) signupTab.click();
                  }}
                  className="font-medium text-pharma-600 hover:text-pharma-700"
                >
                  Sign up now
                </button>
              </p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="signup">
          <div className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 rounded-full bg-pharma-100 dark:bg-pharma-900/30">
                <UserPlus className="h-6 w-6 text-pharma-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-center">Create Account</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">Sign up to save your identification history</p>
            
            <form onSubmit={handleSignUp} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="flex items-center text-sm font-medium">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  Email
                </Label>
                <div className="relative">
                  <Input 
                    id="signup-email"
                    type="email" 
                    placeholder="your@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-3 pr-3 py-2 border-gray-300 dark:border-gray-600 focus:ring-pharma-500 focus:border-pharma-500"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="flex items-center text-sm font-medium">
                  <Lock className="h-4 w-4 mr-2 text-gray-400" />
                  Password
                </Label>
                <div className="relative">
                  <Input 
                    id="signup-password"
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-3 pr-10 py-2 border-gray-300 dark:border-gray-600 focus:ring-pharma-500 focus:border-pharma-500"
                    required
                  />
                  <button 
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Password must be at least 6 characters
                </p>
              </div>
              
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="rounded border-gray-300 text-pharma-600 focus:ring-pharma-500"
                  required
                />
                <Label htmlFor="terms" className="text-sm text-gray-500">
                  I agree to the <a href="/terms" className="text-pharma-600 hover:text-pharma-700">Terms of Service</a> and <a href="/privacy" className="text-pharma-600 hover:text-pharma-700">Privacy Policy</a>
                </Label>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-pharma-600 hover:bg-pharma-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    const signinTab = document.querySelector('[data-value="signin"]') as HTMLElement | null;
                    if (signinTab) signinTab.click();
                  }}
                  className="font-medium text-pharma-600 hover:text-pharma-700"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthForm;
