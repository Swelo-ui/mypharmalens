
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import { Label } from '@/components/ui/label';
import { User, Mail, Key, LogOut } from 'lucide-react';

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuthStatus();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    avatarUrl: '',
  });
  
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Load user profile data
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.user_metadata?.full_name || '',
        email: user.email || '',
        avatarUrl: user.user_metadata?.avatar_url || '',
      });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      let avatarUrl = profile.avatarUrl;
      
      // Upload avatar if there's a new one
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('user-avatars')
          .upload(filePath, avatarFile);
          
        if (uploadError) {
          throw uploadError;
        }
        
        const { data } = supabase.storage
          .from('user-avatars')
          .getPublicUrl(filePath);
          
        avatarUrl = data.publicUrl;
      }
      
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profile.name,
          avatar_url: avatarUrl,
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwords;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "All password fields are required.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password should be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      // First verify the current password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });
      
      if (signInError) {
        throw new Error("Current password is incorrect.");
      }
      
      // Now update to the new password
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: newPassword
      });
      
      if (updateError) throw updateError;
      
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
      
      // Clear password fields
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
    } catch (error: any) {
      toast({
        title: "Error changing password",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setAvatarFile(file);
    
    // Preview the image
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen pb-20">
      <Header />
      
      <div className="container max-w-4xl mx-auto pt-20 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your account settings</p>
        </div>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="profile" className="text-center py-3">
              <User className="h-4 w-4 mr-2" />
              Profile Info
            </TabsTrigger>
            <TabsTrigger value="security" className="text-center py-3">
              <Key className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and profile picture.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center mb-6">
                  <div className="mb-4 relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage 
                        src={avatarPreview || profile.avatarUrl} 
                        alt={profile.name || 'Profile'} 
                      />
                      <AvatarFallback>
                        {profile.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="absolute bottom-0 right-0">
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          id="avatar-upload"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleAvatarChange}
                        />
                        <div className="bg-[#4285F4] text-white rounded-full p-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500">Click on the icon to upload a new photo</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        placeholder="Your full name"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Your email"
                        value={profile.email}
                        disabled
                        className="pl-10 bg-gray-50 dark:bg-gray-800"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>
                  
                  <Button 
                    onClick={handleUpdateProfile} 
                    disabled={isUpdating}
                    className="w-full bg-[#4285F4] hover:bg-[#3367d6]"
                  >
                    {isUpdating ? "Updating..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter your current password"
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter a new password"
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your new password"
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleChangePassword} 
                    disabled={isChangingPassword}
                    className="w-full bg-[#4285F4] hover:bg-[#3367d6]"
                  >
                    {isChangingPassword ? "Updating..." : "Change Password"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
                <CardDescription>
                  Manage your account session and data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="destructive" 
                  onClick={handleSignOut} 
                  className="w-full"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default Profile;
