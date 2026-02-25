import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Clock, ExternalLink, Zap } from 'lucide-react';
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
                        <Sparkles className="w-4 h-4" />
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
            <div className="p-4 bg-gradient-to-r from-pharma-50 to-blue-50 dark:from-pharma-900/20 dark:to-blue-900/20 rounded-lg border border-pharma-200/60 dark:border-pharma-800/40">
                <div className="flex items-center justify-between gap-4">
                    {/* Left — icon + text */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-pharma-100 dark:bg-pharma-800/40 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-pharma-600 dark:text-pharma-400" />
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                Claim Free Identification
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Watch a short ad to earn +1 free ID
                            </p>
                        </div>
                    </div>

                    {/* Right — progress + button */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Daily progress dots (desktop) */}
                        {!statusLoading && (
                            <div className="hidden sm:flex items-center gap-1.5">
                                {Array.from({ length: dailyLimit }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${i < dailyClaims
                                                ? 'bg-pharma-500 dark:bg-pharma-400'
                                                : 'bg-gray-200 dark:bg-gray-700'
                                            }`}
                                    />
                                ))}
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 tabular-nums">
                                    {dailyClaims}/{dailyLimit}
                                </span>
                            </div>
                        )}

                        <Button
                            onClick={handleClaim}
                            disabled={loading || isLimitReached || statusLoading}
                            size="sm"
                            className={`gap-1.5 transition-all duration-200 ${isLimitReached
                                    ? 'bg-gray-400 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-600 cursor-not-allowed'
                                    : 'bg-pharma-600 hover:bg-pharma-700 dark:bg-pharma-500 dark:hover:bg-pharma-600 shadow-sm hover:shadow-md'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="hidden sm:inline">Processing...</span>
                                </>
                            ) : statusLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isLimitReached ? (
                                <>
                                    <Clock className="w-4 h-4" />
                                    <span className="hidden sm:inline">Tomorrow</span>
                                </>
                            ) : (
                                <>
                                    <ExternalLink className="w-4 h-4" />
                                    Claim Free
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Bottom — progress bar + remaining count */}
                {!statusLoading && (
                    <div className="mt-3 pt-2 border-t border-pharma-200/50 dark:border-pharma-800/30">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                {claimsRemaining} free claim{claimsRemaining !== 1 ? 's' : ''} remaining today
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 sm:hidden tabular-nums">
                                {dailyClaims}/{dailyLimit} used
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-pharma-500 dark:bg-pharma-400 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default FreeClaimButton;
