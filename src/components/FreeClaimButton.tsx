import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, ExternalLink, Zap, PlaySquare } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { FREE_CLAIM_LIMITS } from '@/config/subscription.config';
import PurchaseSuccessConfetti from '@/components/PurchaseSuccessConfetti';

interface FreeClaimButtonProps {
    onClaimSuccess?: () => void;
    compact?: boolean;
}

const FreeClaimButton: React.FC<FreeClaimButtonProps> = ({ onClaimSuccess, compact = false }) => {
    const { user } = useAuthStatus();
    const [loading, setLoading] = useState(false);
    const [dailyClaims, setDailyClaims] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);
    const [statusLoading, setStatusLoading] = useState(true);

    const dailyLimit = FREE_CLAIM_LIMITS.DAILY_CLAIMS;
    const claimsRemaining = Math.max(dailyLimit - dailyClaims, 0);

    const fetchClaimStatus = useCallback(async () => {
        if (!user?.id) return;
        try {
            setStatusLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await supabase.functions.invoke('gplinks-claim', {
                body: { action: 'status' }
            });

            if (response.data?.success) {
                setDailyClaims(response.data.dailyClaimsUsed ?? 0);
            }
        } catch (error) {
            console.error('Error fetching claim status:', error);
        } finally {
            setStatusLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchClaimStatus();
    }, [fetchClaimStatus]);

    // Listen for claim success from the callback tab
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'claim_success' && e.newValue) {
                setShowConfetti(true);
                toast.success('Free Identification Added', {
                    description: '+1 identification credited to your account.',
                    duration: 5000
                });
                fetchClaimStatus();
                onClaimSuccess?.();

                setTimeout(() => {
                    setShowConfetti(false);
                    localStorage.removeItem('claim_success');
                }, 4000);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [fetchClaimStatus, onClaimSuccess]);

    const handleClaim = async () => {
        if (!user?.id) {
            toast.error('Please sign in to claim free identifications.');
            return;
        }

        if (claimsRemaining <= 0) {
            toast.info('Daily limit reached. Come back tomorrow for more free claims.');
            return;
        }

        setLoading(true);
        try {
            const response = await supabase.functions.invoke('gplinks-claim', {
                body: { action: 'generate' }
            });

            if (response.error) {
                throw new Error(response.error.message || 'Failed to generate claim link');
            }

            if (!response.data?.success) {
                const errorMsg = response.data?.error || 'Failed to generate claim';
                if (errorMsg.includes('Daily limit')) {
                    setDailyClaims(dailyLimit);
                    toast.info('Daily limit reached. Come back tomorrow.');
                } else {
                    toast.error(errorMsg);
                }
                return;
            }

            const { shortUrl } = response.data;

            toast.info('Opening ad link...', {
                description: 'Complete the page to earn your free identification. This tab will update automatically.',
                duration: 8000
            });

            window.open(shortUrl, '_blank', 'noopener');
            setDailyClaims(prev => prev + 1);

        } catch (error) {
            console.error('Free claim error:', error);
            const message = error instanceof Error ? error.message : 'Something went wrong';
            toast.error('Failed to create claim', { description: message });
        } finally {
            setLoading(false);
        }
    };

    if (!user?.id) return null;

    const isLimitReached = claimsRemaining <= 0;
    const progressPercent = dailyLimit > 0 ? (dailyClaims / dailyLimit) * 100 : 0;

    // Compact mode
    if (compact) {
        return (
            <>
                {showConfetti && (
                    <PurchaseSuccessConfetti
                        isOpen={showConfetti}
                        message="Free Identification Added"
                        subMessage="+1 bonus identification credited."
                        onComplete={() => setShowConfetti(false)}
                    />
                )}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClaim}
                    disabled={loading || isLimitReached || statusLoading}
                    className="gap-2 border-pharma-300 dark:border-pharma-700 text-pharma-700 dark:text-pharma-300 hover:bg-pharma-50 dark:hover:bg-pharma-900/30 hover:border-pharma-400 transition-all"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <PlaySquare className="w-4 h-4" />
                    )}
                    {isLimitReached ? 'Come back tomorrow' : 'Claim Free ID'}
                    {!isLimitReached && !statusLoading && (
                        <Badge variant="secondary" className="ml-1 text-xs bg-pharma-100 dark:bg-pharma-900/40 text-pharma-700 dark:text-pharma-300">
                            {claimsRemaining} left
                        </Badge>
                    )}
                </Button>
            </>
        );
    }

    // Full card mode — PharmaLens design language
    return (
        <>
            {showConfetti && (
                <PurchaseSuccessConfetti
                    isOpen={showConfetti}
                    message="Free Identification Added"
                    subMessage="+1 bonus identification credited."
                    onComplete={() => setShowConfetti(false)}
                />
            )}
            <div className="p-4 sm:p-5 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left — icon + text */}
                    <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800/30">
                            <PlaySquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                                Watch Ad for Free ID
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-snug mt-0.5 line-clamp-2 sm:line-clamp-1">
                                Earn +1 identification by watching a short sponsor video
                            </p>
                        </div>
                    </div>

                    {/* Right — progress + button */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-5 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800">
                        {/* Daily progress dots (desktop & organized mobile) */}
                        {!statusLoading && (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                {Array.from({ length: dailyLimit }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors duration-300 ${i < dailyClaims
                                            ? 'bg-blue-500 dark:bg-blue-400'
                                            : 'bg-gray-200 dark:bg-gray-700'
                                            }`}
                                    />
                                ))}
                                <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 ml-1.5 tabular-nums">
                                    {dailyClaims}/{dailyLimit}
                                </span>
                            </div>
                        )}

                        <Button
                            onClick={handleClaim}
                            disabled={loading || isLimitReached || statusLoading}
                            size="sm"
                            className={`flex-shrink-0 gap-1.5 font-medium transition-all duration-200 ${isLimitReached
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : statusLoading ? (
                                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                            ) : isLimitReached ? (
                                <>
                                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    <span>Limit Reached</span>
                                </>
                            ) : (
                                <>
                                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    <span>Claim Now</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default FreeClaimButton;
