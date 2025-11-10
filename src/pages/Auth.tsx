
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthForm from '@/components/AuthForm';
import AccountBenefits from '@/components/AccountBenefits';

const Auth = () => {
  const { isAuthenticated, isLoading } = useAuthStatus();
  
  // If user is already logged in, redirect to identify page
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/identify" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container max-w-5xl mx-auto px-4 pt-20 sm:pt-24 pb-12">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Account Access</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Sign in or create an account to save your medication identification history
          </p>
        </div>
        
        <AuthForm />
        
        {/* Comprehensive Benefits Section */}
        <AccountBenefits />
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
