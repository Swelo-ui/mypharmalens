
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
        
        <Tabs defaultValue="profile" className="max-w-3xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-6">
                  <div className="mb-6">
                    <Label htmlFor="displayName" className="mb-2 block">
                      <User className="inline-block w-4 h-4 mr-2" />
                      Display Name
                    </Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <Label htmlFor="email" className="mb-2 block">
                      <Mail className="inline-block w-4 h-4 mr-2" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      value={email}
                      readOnly
                      disabled
                      className="bg-gray-100 dark:bg-gray-800"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email address cannot be changed
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <Button 
                    variant="primary" 
                    onClick={handleUpdateProfile} 
                    disabled={isUpdating}
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
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Change your password and manage account security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword" className="mb-2 block">
                      <Key className="inline-block w-4 h-4 mr-2" />
                      Current Password
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="newPassword" className="mb-2 block">
                      New Password
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword" className="mb-2 block">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                    />
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      variant="primary" 
                      onClick={handleChangePassword} 
                      disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                      className="w-full sm:w-auto"
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
