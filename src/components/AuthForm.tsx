
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogIn, UserPlus, ArrowRight, Loader2, Mail, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="w-full max-w-md mx-auto">
      <Tabs defaultValue="signin" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="signin" className="text-base">Sign In</TabsTrigger>
          <TabsTrigger value="signup" className="text-base">Sign Up</TabsTrigger>
        </TabsList>
        
        <TabsContent value="signin">
          <div className="space-y-4 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 rounded-full bg-pharma-100 dark:bg-pharma-900/20">
                <LogIn className="h-8 w-8 text-pharma-600 dark:text-pharma-400" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-center">Welcome Back</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">Sign in to access your identification history</p>
            
            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="text-base">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input 
                    id="signin-email"
                    type="email" 
                    placeholder="your@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 py-6 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="signin-password" className="text-base">Password</Label>
                  <a href="#" className="text-sm text-pharma-600 dark:text-pharma-400 hover:underline">Forgot password?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input 
                    id="signin-password"
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 py-6 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full py-6 text-base bg-pharma-600 hover:bg-pharma-700 dark:bg-pharma-500 dark:hover:bg-pharma-600"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </TabsContent>
        
        <TabsContent value="signup">
          <div className="space-y-4 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 rounded-full bg-pharma-100 dark:bg-pharma-900/20">
                <UserPlus className="h-8 w-8 text-pharma-600 dark:text-pharma-400" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-center">Create Account</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">Sign up to save your identification history</p>
            
            <form onSubmit={handleSignUp} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-base">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input 
                    id="signup-email"
                    type="email" 
                    placeholder="your@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 py-6 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-base">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input 
                    id="signup-password"
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 py-6 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 6 characters
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full py-6 text-base bg-pharma-600 hover:bg-pharma-700 dark:bg-pharma-500 dark:hover:bg-pharma-600"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthForm;
