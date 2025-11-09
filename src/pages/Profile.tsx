
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AudioSettings from '@/components/AudioSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { toast } from 'sonner';
import { Loader2, Save, Key, User, Mail, Calendar, CreditCard, Info, LogOut } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuthStatus();
  const navigate = useNavigate();
  const { currentSubscription, usageStats, loading } = useSubscription();
  
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [extraIdentifications, setExtraIdentifications] = useState(0);
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [tabValue, setTabValue] = useState('profile');

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
      toast.error('Failed to sign out');
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          // Fetch user profile from profiles table
          const { data, error } = await supabase
            .from('profiles')
            .select('display_name, extra_identifications')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error('Error fetching profile:', error);
            return;
          }
          
          if (data) {
            setDisplayName((data as { display_name: string | null }).display_name || '');
            setExtraIdentifications((data as any).extra_identifications || 0);
          }
          
          // Set email from auth user
          setEmail(user.email || '');
        } catch (error) {
          console.error('Error:', error);
        }
      }
    };
    
    fetchUserProfile();
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    
    try {
      // Update profile in the profiles table
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      // First verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      
      if (signInError) {
        toast.error('Current password is incorrect');
        setIsChangingPassword(false);
        return;
      }
      
      // Then update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#0384c6] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col pt-16">
        <Header />
        <div className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Not Authenticated</CardTitle>
              <CardDescription>
                Please log in to view and manage your profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => window.location.href = '/auth'}
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pt-16 pb-20">
      <Header />
      
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">Profile Settings</h1>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="hidden sm:inline-flex">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
        <div className="sm:hidden mb-4">
          <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
        
        <Tabs value={tabValue} onValueChange={setTabValue} className="w-full max-w-4xl mx-auto">
          <div className="sm:hidden mb-4">
            <Select value={tabValue} onValueChange={setTabValue}>
              <SelectTrigger aria-label="Profile menu" className="w-full">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profile">Profile Information</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="audio">Audio Settings</SelectItem>
                <SelectItem value="subscription">Subscription & Usage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <TabsList className="hidden sm:grid w-full grid-cols-4 mb-6 sm:mb-8 h-12 sm:h-14">
            <TabsTrigger value="profile" className="text-xs sm:text-sm px-1 sm:px-4 py-2 sm:py-3 flex items-center justify-center min-h-[2.5rem] sm:min-h-[3rem]">
              <span className="text-center leading-tight">Profile<br className="sm:hidden" /><span className="hidden sm:inline"> Information</span></span>
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs sm:text-sm px-1 sm:px-4 py-2 sm:py-3 flex items-center justify-center min-h-[2.5rem] sm:min-h-[3rem]">
              Security
            </TabsTrigger>
            <TabsTrigger value="audio" className="text-xs sm:text-sm px-1 sm:px-4 py-2 sm:py-3 flex items-center justify-center min-h-[2.5rem] sm:min-h-[3rem]">
              <span className="text-center leading-tight">Audio<br className="sm:hidden" /><span className="hidden sm:inline"> Settings</span></span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="text-xs sm:text-sm px-1 sm:px-4 py-2 sm:py-3 flex items-center justify-center min-h-[2.5rem] sm:min-h-[3rem]">
              <span className="text-center leading-tight">Subscription<br className="sm:hidden" /><span className="hidden sm:inline"> & Usage</span></span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card className="border-0 sm:border shadow-none sm:shadow-sm">
              <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
                <CardTitle className="text-lg sm:text-xl">Profile Information</CardTitle>
                <CardDescription className="text-sm">
                  Update your profile details
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-6">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="displayName" className="flex items-center text-sm font-medium">
                      <User className="w-4 h-4 mr-2 flex-shrink-0" />
                      Display Name
                    </Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="email" className="flex items-center text-sm font-medium">
                      <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      value={email}
                      readOnly
                      disabled
                      className="bg-gray-100 dark:bg-gray-800 w-full"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Email address cannot be changed
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-center sm:justify-end mt-8">
                  <Button 
                    variant="primary" 
                    onClick={handleUpdateProfile} 
                    disabled={isUpdating}
                    className="w-full sm:w-auto min-w-[140px]"
                  >
                    {isUpdating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card className="border-0 sm:border shadow-none sm:shadow-sm">
              <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
                <CardTitle className="text-lg sm:text-xl">Security Settings</CardTitle>
                <CardDescription className="text-sm">
                  Change your password and manage account security
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-6">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="currentPassword" className="flex items-center text-sm font-medium">
                      <Key className="w-4 h-4 mr-2 flex-shrink-0" />
                      Current Password
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="newPassword" className="text-sm font-medium block">
                      New Password
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium block">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="pt-6">
                    <div className="flex justify-center sm:justify-start">
                      <Button 
                        variant="primary" 
                        onClick={handleChangePassword} 
                        disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                        className="w-full sm:w-auto min-w-[160px]"
                      >
                        {isChangingPassword ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Key className="mr-2 h-4 w-4" />
                        )}
                        Change Password
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="audio">
            <AudioSettings />
          </TabsContent>

          <TabsContent value="subscription">
            <Card className="border-0 sm:border shadow-none sm:shadow-sm">
              <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
                <CardTitle className="text-lg sm:text-xl">Subscription & Usage</CardTitle>
                <CardDescription className="text-sm">View your current plan, usage, and history</CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-6 space-y-6">
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading subscription and usage...
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border bg-muted/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="w-4 h-4" />
                          <span className="font-medium">Current Plan</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <p><span className="text-gray-600">Plan:</span> {currentSubscription?.plan?.name || 'Free'}</p>
                          <p><span className="text-gray-600">Status:</span> {currentSubscription?.status || 'active'}</p>
                          <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> <span className="text-gray-600">Start:</span> {currentSubscription?.starts_at || currentSubscription?.created_at ? new Date((currentSubscription?.starts_at || currentSubscription?.created_at)!).toLocaleDateString() : '—'}</p>
                          <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> <span className="text-gray-600">End:</span> {currentSubscription?.plan?.id === 'free-plan' ? 'No expiration' : (currentSubscription?.ends_at ? new Date(currentSubscription.ends_at).toLocaleDateString() : '—')}</p>
                        </div>
                      </div>
                      <div className="p-4 rounded-lg border bg-muted/20">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="w-4 h-4" />
                          <span className="font-medium">AI Identifications Usage</span>
                        </div>
                        <div className="text-sm space-y-2">
                          <p>Total Used: <span className="font-semibold">{usageStats.identificationsUsed}</span>{usageStats.monthlyLimit >= 0 ? ` / ${(() => {
                            const planName = usageStats.planName || 'Free';
                            let monthlyLimit = 5;
                            if (planName === 'Free' || planName.toLowerCase().includes('free')) {
                              monthlyLimit = 5;
                            } else if (planName === 'Lite' || planName.toLowerCase().includes('lite')) {
                              monthlyLimit = 39;
                            } else if (planName === 'Pro' || planName.toLowerCase().includes('pro')) {
                              monthlyLimit = 101;
                            }
                            return monthlyLimit + extraIdentifications;
                          })()}` : ' (Unlimited)'}</p>
                          {extraIdentifications > 0 && (
                            <p className={`text-xs flex items-center gap-1 ${
                              extraIdentifications >= 50 ? 'text-violet-600 dark:text-violet-400' :
                              extraIdentifications >= 30 ? 'text-green-600 dark:text-green-400' :
                              extraIdentifications >= 10 ? 'text-blue-600 dark:text-blue-400' :
                              extraIdentifications >= 5 ? 'text-amber-600 dark:text-amber-400' :
                              'text-red-600 dark:text-red-400'
                            }`}>
                              <span className="inline-block">⚡</span>{extraIdentifications} bonus remaining
                            </p>
                          )}
                          {usageStats.monthlyLimit >= 0 && (
                            <div className="w-full h-2 bg-gray-200 rounded">
                              <div className="h-2 bg-[#0384c6] rounded" style={{ width: `${Math.min(100, (usageStats.identificationsUsed / Math.max((() => {
                                const planName = usageStats.planName || 'Free';
                                let monthlyLimit = 5;
                                if (planName === 'Free' || planName.toLowerCase().includes('free')) {
                                  monthlyLimit = 5;
                                } else if (planName === 'Lite' || planName.toLowerCase().includes('lite')) {
                                  monthlyLimit = 39;
                                } else if (planName === 'Pro' || planName.toLowerCase().includes('pro')) {
                                  monthlyLimit = 101;
                                }
                                return monthlyLimit + extraIdentifications;
                              })(), 1)) * 100)}%` }} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-end">
                      <Button variant="outline" onClick={() => navigate('/payment-history')}>View Purchase History</Button>
                      <Button variant="outline" onClick={() => navigate('/subscription')}>Manage Subscription</Button>
                      <Button variant="primary" onClick={() => navigate('/account-subscription')}>Open Detailed Page</Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;