import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

type ClaimStatus = 'verifying' | 'success' | 'error';

const ClaimCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<ClaimStatus>('verifying');
    const [message, setMessage] = useState('Verifying your claim...');

    useEffect(() => {
        const verifyClaim = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setStatus('error');
                setMessage('Invalid claim link. No token found.');
                setTimeout(() => navigate('/identify'), 3000);
                return;
            }

            try {
                const response = await supabase.functions.invoke('gplinks-claim', {
                    body: { action: 'verify', token }
                });

                if (response.data?.success) {
                    setStatus('success');
                    setMessage(response.data.message || 'Free identification added!');

                    // Notify the original tab via localStorage
                    localStorage.setItem('claim_success', Date.now().toString());

                    toast.success('+1 Free Identification', {
                        description: 'Your bonus identification has been added.',
                        duration: 5000
                    });

                    setTimeout(() => navigate('/identify'), 3000);
                } else {
                    setStatus('error');
                    setMessage(response.data?.error || 'Claim verification failed.');
                    setTimeout(() => navigate('/identify'), 4000);
                }
            } catch (error) {
                console.error('Claim verification error:', error);
                setStatus('error');
                setMessage('Something went wrong. Please try again.');
                setTimeout(() => navigate('/identify'), 4000);
            }
        };

        verifyClaim();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pharma-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-pharma-950 p-4">
            <div className="max-w-sm w-full text-center space-y-6">
                {/* Icon */}
                <div className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 ${status === 'verifying'
                        ? 'bg-pharma-100 dark:bg-pharma-900/40 animate-pulse'
                        : status === 'success'
                            ? 'bg-green-100 dark:bg-green-900/30 scale-110'
                            : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                    {status === 'verifying' && (
                        <Loader2 className="w-10 h-10 text-pharma-500 dark:text-pharma-400 animate-spin" />
                    )}
                    {status === 'success' && (
                        <CheckCircle2 className="w-10 h-10 text-green-500 dark:text-green-400 animate-bounce" />
                    )}
                    {status === 'error' && (
                        <XCircle className="w-10 h-10 text-red-500 dark:text-red-400" />
                    )}
                </div>

                {/* Title */}
                <h1 className={`text-2xl font-bold transition-colors ${status === 'verifying'
                        ? 'text-pharma-700 dark:text-pharma-300'
                        : status === 'success'
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-red-700 dark:text-red-300'
                    }`}>
                    {status === 'verifying' && 'Verifying Claim...'}
                    {status === 'success' && 'Claim Successful'}
                    {status === 'error' && 'Claim Failed'}
                </h1>

                {/* Message */}
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {message}
                </p>

                {/* Success badge */}
                {status === 'success' && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-pharma-100 dark:bg-pharma-900/30 text-pharma-700 dark:text-pharma-300 rounded-full text-sm font-medium">
                        <Sparkles className="w-4 h-4" />
                        +1 Free Identification Added
                    </div>
                )}

                {/* Redirect notice */}
                <p className="text-xs text-gray-400 dark:text-gray-500">
                    Redirecting you back to PharmaLens...
                </p>
            </div>
        </div>
    );
};

export default ClaimCallback;
