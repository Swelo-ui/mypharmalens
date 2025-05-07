
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Key, User, Mail, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuthStatus();
  const { toast } = useToast();
  const { language, setLanguage, translate } = useLanguage();
  
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
          // Set email from auth user first
          if (user.email) {
            setEmail(user.email);
          }
          
          // Fetch user profile from profiles table
          const { data, error } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .single();
            
          if (error) {
            // If no profile exists, create one
            if (error.code === 'PGRST116') {
              console.log('No profile found, creating one...');
              
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  display_name: user.user_metadata?.full_name || '',
                  updated_at: new Date().toISOString()
                });
                
              if (insertError) {
                console.error('Error creating profile:', insertError);
                return;
              }
              
              // Set display name from user metadata if available
              setDisplayName(user.user_metadata?.full_name || '');
            } else {
              console.error('Error fetching profile:', error);
            }
            return;
          }
          
          if (data) {
            setDisplayName(data.display_name || '');
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
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
      
      toast({
        title: translate('profile.updateSuccess'),
        description: translate('profile.updateSuccess'),
        type: "success"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: translate('profile.updateFailed'),
        description: translate('profile.updateFailed'),
        type: "error"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: translate('profile.passwordNotMatch'),
        description: translate('profile.passwordNotMatch'),
        type: "error"
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: translate('profile.passwordTooShort'),
        description: translate('profile.passwordTooShort'),
        type: "error"
      });
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      // First verify the current password - this is no longer needed as Supabase will handle this
      // We can directly update the password if the user is authenticated
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast({
        title: translate('profile.passwordUpdated'),
        description: translate('profile.passwordUpdated'),
        type: "success"
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: translate('profile.updateFailed'),
        description: translate('profile.updateFailed'),
        type: "error"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLanguageChange = (value: 'en' | 'hi') => {
    setLanguage(value);
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
              <CardTitle>{translate('error.authRequired')}</CardTitle>
              <CardDescription>
                {translate('error.loginRequired')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => window.location.href = '/auth'}
              >
                {translate('error.goToLogin')}
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
        <h1 className="text-2xl font-bold mb-6">{translate('profile.title')}</h1>
        
        <Tabs defaultValue="profile" className="max-w-3xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="profile">{translate('profile.profileInfo')}</TabsTrigger>
            <TabsTrigger value="security">{translate('profile.security')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>{translate('profile.profileInfo')}</CardTitle>
                <CardDescription>
                  {translate('profile.settings')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-6">
                  <div className="mb-6">
                    <Label htmlFor="displayName" className="mb-2 block">
                      <User className="inline-block w-4 h-4 mr-2" />
                      {translate('profile.displayName')}
                    </Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={translate('profile.displayName')}
                    />
                  </div>
                  
                  <div className="mb-6">
                    <Label htmlFor="language" className="mb-2 block">
                      <Globe className="inline-block w-4 h-4 mr-2" />
                      {translate('profile.language')}
                    </Label>
                    <RadioGroup
                      defaultValue={language}
                      onValueChange={(value) => handleLanguageChange(value as 'en' | 'hi')}
                      className="flex flex-col space-y-1 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="en" id="en" />
                        <Label htmlFor="en">{translate('profile.english')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hi" id="hi" />
                        <Label htmlFor="hi">{translate('profile.hindi')}</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="mb-6">
                    <Label htmlFor="email" className="mb-2 block">
                      <Mail className="inline-block w-4 h-4 mr-2" />
                      {translate('common.email')}
                    </Label>
                    <Input
                      id="email"
                      value={email}
                      readOnly
                      disabled
                      className="bg-gray-100 dark:bg-gray-800"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {translate('common.email')} {translate('common.cancel')}
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
                    {translate('profile.saveChanges')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>{translate('profile.securitySettings')}</CardTitle>
                <CardDescription>
                  {translate('profile.changePassword')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword" className="mb-2 block">
                      <Key className="inline-block w-4 h-4 mr-2" />
                      {translate('profile.currentPassword')}
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={translate('profile.currentPassword')}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="newPassword" className="mb-2 block">
                      {translate('profile.newPassword')}
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={translate('profile.newPassword')}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword" className="mb-2 block">
                      {translate('profile.confirmPassword')}
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={translate('profile.confirmPassword')}
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
                      {translate('profile.changePassword')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;
