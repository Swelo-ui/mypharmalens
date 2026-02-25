import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle, Loader2, Sparkles } from 'lucide-react';

type ClaimStatus = 'verifying' | 'success' | 'error';

const ClaimCallback: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<ClaimStatus>('verifying');
    const [message, setMessage] = useState('Verifying your claim...');

    useEffect(() => {
        const verifyClaim = async () => {

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
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-pharma-500/5 blur-[120px] mix-blend-multiply dark:mix-blend-lighten" />
                <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] mix-blend-multiply dark:mix-blend-lighten" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Main Card */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-xl shadow-gray-200/20 dark:shadow-black/40 overflow-hidden transform transition-all">
                    <div className="p-8 sm:p-10 flex flex-col items-center text-center">

                        {/* Status Icon Wrapper */}
                        <div className="relative mb-8">
                            {/* Pulse rings for verifying state */}
                            {status === 'verifying' && (
                                <>
                                    <div className="absolute inset-0 rounded-full bg-pharma-400/20 animate-ping" style={{ animationDuration: '2s' }} />
                                    <div className="absolute inset-[-15px] rounded-full border border-pharma-400/20 animate-pulse" />
                                </>
                            )}

                            <div className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center transition-all duration-700 ${status === 'verifying'
                                    ? 'bg-gradient-to-tr from-pharma-100 to-pharma-50 dark:from-pharma-900/50 dark:to-pharma-800/20 shadow-inner'
                                    : status === 'success'
                                        ? 'bg-gradient-to-tr from-emerald-100 to-emerald-50 dark:from-emerald-900/50 dark:to-emerald-800/30 ring-4 ring-emerald-50 dark:ring-emerald-900/20 scale-110'
                                        : 'bg-gradient-to-tr from-red-100 to-red-50 dark:from-red-900/50 dark:to-red-800/20'
                                }`}>
                                {status === 'verifying' && (
                                    <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-pharma-600 dark:text-pharma-400 animate-spin" strokeWidth={2.5} />
                                )}
                                {status === 'success' && (
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-emerald-400 blur-md opacity-30 animate-pulse" />
                                        <CheckCircle2 className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                                    </div>
                                )}
                                {status === 'error' && (
                                    <XCircle className="w-12 h-12 sm:w-14 sm:h-14 text-red-500 dark:text-red-400" strokeWidth={2.5} />
                                )}
                            </div>
                        </div>

                        {/* Title & Message */}
                        <div className="space-y-3 w-full">
                            <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight transition-colors duration-500 ${status === 'verifying' ? 'text-gray-900 dark:text-white' :
                                    status === 'success' ? 'text-emerald-700 dark:text-emerald-400' :
                                        'text-red-600 dark:text-red-400'
                                }`}>
                                {status === 'verifying' && 'Verifying Claim'}
                                {status === 'success' && 'Unblocked successfully'}
                                {status === 'error' && 'Verification Failed'}
                            </h1>

                            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 leading-relaxed max-w-[280px] mx-auto">
                                {status === 'verifying' ? 'Please keep this page open. We are confirming your reward.' : message}
                            </p>
                        </div>

                        {/* Success Badge */}
                        <div className={`mt-6 transition-all duration-700 ease-out ${status === 'success' ? 'opacity-100 translate-y-0 height-auto' : 'opacity-0 translate-y-4 h-0 overflow-hidden'}`}>
                            <div className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-300 rounded-2xl text-sm font-semibold shadow-sm">
                                <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                <span>+1 Free Identification Added</span>
                            </div>
                        </div>

                        {/* Action Buttons (Show only when done) */}
                        <div className={`w-full transition-all duration-700 delay-150 ${status !== 'verifying' ? 'opacity-100 translate-y-0 mt-8' : 'opacity-0 translate-y-4 hidden'}`}>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => window.close()}
                                    className="w-full flex items-center justify-center py-3.5 px-4 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                                >
                                    Return to PharmaLens
                                </button>
                                <button
                                    onClick={() => navigate('/identify', { replace: true })}
                                    className="w-full flex items-center justify-center py-3.5 px-4 bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-xl font-medium transition-all active:scale-[0.98]"
                                >
                                    Go to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom accent bar */}
                    <div className={`h-1.5 w-full transition-colors duration-700 ${status === 'verifying' ? 'bg-pharma-500' :
                            status === 'success' ? 'bg-emerald-500' :
                                'bg-red-500'
                        }`} />
                </div>

                {/* Branding footer */}
                <div className="mt-8 flex justify-center opacity-60">
                    <span className="font-outfit font-bold text-gray-400 dark:text-gray-500 tracking-tight flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-pharma-600 flex items-center justify-center text-[10px] text-white">PL</span>
                        PharmaLens
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ClaimCallback;
