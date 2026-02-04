
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogIn, UserPlus, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState('');
  const navigate = useNavigate();
  const LEGACY_EMAIL_VERIFICATION_CUTOFF = '2026-02-04T00:00:00.000Z';
  const disposableEmailDomains = new Set([
    '10minutemail.com',
    '10minutemail.net',
    'mailinator.com',
    'yopmail.com',
    'guerrillamail.com',
    'guerrillamail.org',
    'guerrillamail.net',
    'tempmail.com',
    'temp-mail.org',
    'trashmail.com',
    'mintemail.com',
    'disposablemail.com'
  ]);

  const normalizeEmail = (value: string) => value.trim().toLowerCase();
  const getEmailDomain = (value: string) => {
    const atIndex = value.lastIndexOf('@');
    return atIndex === -1 ? '' : value.slice(atIndex + 1);
  };
  const isLegacyUser = (createdAt?: string | null) => {
    if (!createdAt) return false;
    const createdTime = new Date(createdAt).getTime();
    const cutoffTime = new Date(LEGACY_EMAIL_VERIFICATION_CUTOFF).getTime();
    return Number.isFinite(createdTime) && Number.isFinite(cutoffTime) && createdTime < cutoffTime;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate terms acceptance for sign-up
    if (!acceptedTerms) {
      setTermsError('You must accept the Terms and Conditions to create an account');
      toast.error("Please accept the Terms and Conditions to proceed with account creation.");
      return;
    }
    
    setTermsError('');
    const normalizedEmail = normalizeEmail(email);
    const domain = getEmailDomain(normalizedEmail);
    if (!domain) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (disposableEmailDomains.has(domain)) {
      toast.error("Disposable email addresses are not allowed.", {
        description: "Please use a real email so we can verify your account."
      });
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({ 
        email: normalizedEmail, 
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
      
      // Clear form after successful signup
      setEmail('');
      setPassword('');
      setAcceptedTerms(false);
      
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
      const normalizedEmail = normalizeEmail(email);
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: normalizedEmail, 
        password 
      });

      if (error) {
        throw error;
      }

      const isEmailConfirmed = !!data.user?.email_confirmed_at || !!data.user?.confirmed_at;
      const isLegacy = isLegacyUser(data.user?.created_at);
      if (!isEmailConfirmed && !isLegacy) {
        await supabase.auth.signOut();
        toast.error("Please confirm your email before signing in.", {
          description: "Check your inbox for the verification link."
        });
        return;
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
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        
        <TabsContent value="signin">
          <div className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-full bg-pharma-50 dark:bg-pharma-900/20">
                <LogIn className="h-6 w-6 text-pharma-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-center">Welcome Back</h2>
            <p className="text-sm text-gray-500 text-center mb-4">Sign in to access your identification history</p>
            
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input 
                  id="signin-email"
                  type="email" 
                  placeholder="your@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Input 
                    id="signin-password"
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
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
          </div>
        </TabsContent>
        
        <TabsContent value="signup">
          <div className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-full bg-pharma-50 dark:bg-pharma-900/20">
                <UserPlus className="h-6 w-6 text-pharma-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-center">Create Account</h2>
            <p className="text-sm text-gray-500 text-center mb-4">Sign up to save your identification history</p>
            
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input 
                  id="signup-email"
                  type="email" 
                  placeholder="your@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input 
                    id="signup-password"
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Password must be at least 6 characters
                </p>
              </div>
              
              {/* Terms and Conditions Acceptance */}
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="accept-terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => {
                      setAcceptedTerms(checked as boolean);
                      if (checked) {
                        setTermsError('');
                      }
                    }}
                    className="mt-0.5"
                    aria-describedby="terms-error"
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor="accept-terms" 
                      className="text-sm font-medium cursor-pointer leading-relaxed"
                    >
                      I agree to the{' '}
                      <Link 
                        to="/terms" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-pharma-600 hover:text-pharma-700 underline font-semibold"
                      >
                        Terms and Conditions
                      </Link>
                      {' '}and{' '}
                      <Link 
                        to="/privacy" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-pharma-600 hover:text-pharma-700 underline font-semibold"
                      >
                        Privacy Policy
                      </Link>
                    </Label>
                    {termsError && (
                      <p 
                        id="terms-error" 
                        className="text-sm text-red-600 dark:text-red-400 mt-1"
                        role="alert"
                      >
                        {termsError}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 ml-7">
                  By creating an account, you acknowledge that you have read and understood our terms regarding data collection, medical disclaimers, and age restrictions (13+).
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading || !acceptedTerms}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
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
