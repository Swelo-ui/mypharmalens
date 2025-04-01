
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import Header from '@/components/Header';
import AuthForm from '@/components/AuthForm';
import { ShieldCheck, Scan, Database, History, Lock } from 'lucide-react';

const Auth = () => {
  const { isAuthenticated, isLoading } = useAuthStatus();
  
  // If user is already logged in, redirect to identify page
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/identify" replace />;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        <div className="container max-w-6xl mx-auto px-4 pt-24 pb-16">
          <div className="flex flex-col md:flex-row md:gap-12 items-center">
            <div className="w-full md:w-1/2 mb-10 md:mb-0">
              <div className="text-center md:text-left mb-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-pharma-600 to-blue-600 bg-clip-text text-transparent">Secure Account Access</h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  Sign in or create an account to access all features of PharmaLens
                </p>
              </div>
              
              <div className="space-y-6 bg-white dark:bg-gray-800/50 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-medium mb-5 flex items-center text-gray-900 dark:text-gray-100">
                  <ShieldCheck className="w-5 h-5 mr-2 text-pharma-600" />
                  Benefits of your PharmaLens account
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 p-1.5 bg-pharma-100 dark:bg-pharma-900/30 rounded-lg mr-3">
                      <Scan className="h-5 w-5 text-pharma-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1 text-gray-900 dark:text-gray-100">Advanced Medication Identification</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Identify medications from images with high accuracy using our advanced AI system.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 p-1.5 bg-pharma-100 dark:bg-pharma-900/30 rounded-lg mr-3">
                      <Database className="h-5 w-5 text-pharma-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1 text-gray-900 dark:text-gray-100">Comprehensive Medication Database</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Access a vast database of medications powered by drugs.com for detailed information.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 p-1.5 bg-pharma-100 dark:bg-pharma-900/30 rounded-lg mr-3">
                      <History className="h-5 w-5 text-pharma-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1 text-gray-900 dark:text-gray-100">Personal Identification History</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Save and access your medication identification history from any device.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 p-1.5 bg-pharma-100 dark:bg-pharma-900/30 rounded-lg mr-3">
                      <Lock className="h-5 w-5 text-pharma-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1 text-gray-900 dark:text-gray-100">Enhanced Privacy & Security</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Your data is securely encrypted and protected with enterprise-grade security measures.</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    PharmaLens uses secure authentication and encryption to protect your data.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-8">
                <AuthForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
