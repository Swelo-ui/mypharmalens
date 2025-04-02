
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import Header from '@/components/Header';
import AuthForm from '@/components/ui/auth-form';

const Auth = () => {
  const { isAuthenticated, isLoading } = useAuthStatus();
  
  // If user is already logged in, redirect to identify page
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/identify" replace />;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 pt-16">
        <AuthForm />
      </div>
    </>
  );
};

export default Auth;
