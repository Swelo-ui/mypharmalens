
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { LogIn, UserPlus, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import Turnstile from 'react-turnstile';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA';

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [fingerprint, setFingerprint] = useState<string>('');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [turnstileKey, setTurnstileKey] = useState<number>(0);
  const [honeypot, setHoneypot] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const setFp = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        setFingerprint(result.visitorId);
      } catch (e) {
        console.error('Fingerprint failed', e);
      }
    };
    setFp();
  }, []);

  const normalizeEmail = (value: string) => value.trim().toLowerCase();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      setTermsError('You must accept the Terms and Conditions to create an account');
      toast.error("Please accept the Terms and Conditions to proceed.");
      return;
    }

    if (!turnstileToken) {
      toast.error("Please complete the security check (CAPTCHA).");
      return;
    }
    
    setTermsError('');
    const normalizedEmail = normalizeEmail(email);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('secure-signup', {
        body: {
          email: normalizedEmail,
          password,
          turnstileToken,
          deviceFingerprint: fingerprint,
          honeypot
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });

      if (signInError) throw signInError;

      toast.success("Account created successfully!");
      
      setEmail('');
      setPassword('');
      setAcceptedTerms(false);
      setTurnstileToken('');
      setTurnstileKey(prev => prev + 1);
      
    } catch (error) {
      console.error('Error signing up:', error);
      let message = 'An unexpected error occurred';
      if (error && typeof error === 'object') {
        const err = error as { message?: string; context?: { body?: unknown } };
        const body = err.context?.body;
        if (body) {
          if (typeof body === 'string') {
            try {
              const parsed = JSON.parse(body) as { error?: unknown };
              message = parsed?.error ? String(parsed.error) : body;
            } catch {
              message = body;
            }
          } else if (typeof body === 'object' && 'error' in body) {
            message = String((body as { error?: unknown }).error ?? message);
          }
        }
        if (message === 'An unexpected error occurred' && err.message) {
          message = err.message;
        }
      }
      toast.error("Sign up failed", { 
        description: message 
      });
      setTurnstileToken('');
      setTurnstileKey(prev => prev + 1);
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

      toast.success("Signed in successfully");
      navigate('/identify');
      
    } catch (error) {
      console.error('Error signing in:', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error("Sign in failed", { 
        description: message 
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

              <div className="absolute opacity-0 -z-10 h-0 w-0 overflow-hidden">
                <input 
                  type="text" 
                  name="website_url" 
                  tabIndex={-1} 
                  autoComplete="off" 
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <div className="flex justify-center py-2">
                <Turnstile
                  key={turnstileKey}
                  sitekey={TURNSTILE_SITE_KEY}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => {
                    toast.error("Security check failed");
                    setTurnstileToken('');
                  }}
                  onExpire={() => setTurnstileToken('')}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading || !acceptedTerms || !turnstileToken}
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
