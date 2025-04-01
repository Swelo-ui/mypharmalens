
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import Header from '@/components/Header';
import AuthForm from '@/components/AuthForm';

const Auth = () => {
  const { isAuthenticated, isLoading } = useAuthStatus();
  
  // If user is already logged in, redirect to identify page
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/identify" replace />;
  }

  return (
    <>
      <Header />
      <div className="container max-w-5xl mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Account Access</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Sign in or create an account to save your medication identification history
          </p>
        </div>
        
        <AuthForm />
        
        <div className="mt-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-medium mb-3">Benefits of creating an account:</h3>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-pharma-100 dark:bg-pharma-900/30 text-pharma-600 text-sm mr-3 mt-0.5">✓</span>
              <span>Save your medication identification history</span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-pharma-100 dark:bg-pharma-900/30 text-pharma-600 text-sm mr-3 mt-0.5">✓</span>
              <span>Access your history from any device</span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-pharma-100 dark:bg-pharma-900/30 text-pharma-600 text-sm mr-3 mt-0.5">✓</span>
              <span>Track medications you've identified previously</span>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default Auth;
