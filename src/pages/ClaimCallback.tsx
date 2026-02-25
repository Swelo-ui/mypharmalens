import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle, Loader2, Sparkles } from 'lucide-react';

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
                return;
            }

            try {
                const response = await supabase.functions.invoke('gplinks-claim', {
                    body: { action: 'verify', token }
                });

                if (response.data?.success) {
                    setStatus('success');
                    setMessage('Free identification added! You can safely close this tab to return to the app.');

                    // Notify the original tab via localStorage
                    localStorage.setItem('claim_success', Date.now().toString());

                    // Attempt to close the tab automatically after a short delay
                    setTimeout(() => {
                        window.close();
                    }, 2500);
                } else {
                    setStatus('error');
                    setMessage(response.data?.error || 'Claim verification failed. You may close this tab.');
                }
            } catch (error) {
                console.error('Claim verification error:', error);
                setStatus('error');
                setMessage('Something went wrong. Please try again.');
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

                {/* Return Button if window.close() blocked */}
                {status !== 'verifying' && (
                    <div className="pt-4 flex flex-col items-center gap-3">
                        <button
                            onClick={() => window.close()}
                            className="w-full max-w-[200px] py-2 px-4 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 font-medium transition-colors"
                        >
                            Close Tab
                        </button>
                        <button
                            onClick={() => navigate('/identify', { replace: true })}
                            className="text-sm text-pharma-600 dark:text-pharma-400 hover:underline"
                        >
                            Or return to dashboard
                        </button>
                    </div>
                )}

                {/* Redirect notice */}
                {status === 'verifying' && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        Please wait while we verify your claim...
                    </p>
                )}
            </div>
        </div>
    );
};

export default ClaimCallback;
