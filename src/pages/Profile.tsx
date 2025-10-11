
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
import { Loader2, Save, Key, User, Mail } from 'lucide-react';

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuthStatus();
  
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          // Fetch user profile from profiles table
          const { data, error } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error('Error fetching profile:', error);
            return;
          }
          
          if (data) {
            setDisplayName(data.display_name || '');
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
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center sm:text-left">Profile Settings</h1>
        
        <Tabs defaultValue="profile" className="w-full max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-6 sm:mb-8 h-auto">
            <TabsTrigger value="profile" className="text-xs sm:text-sm px-2 py-2 sm:px-4 sm:py-3">
              Profile Information
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs sm:text-sm px-2 py-2 sm:px-4 sm:py-3">
              Security
            </TabsTrigger>
            <TabsTrigger value="audio" className="text-xs sm:text-sm px-2 py-2 sm:px-4 sm:py-3">
              Audio Settings
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
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
