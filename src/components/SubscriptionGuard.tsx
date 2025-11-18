import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStatus } from '../hooks/useAuthStatus'; // Corrected import path and hook name

interface SubscriptionGuardProps {
  feature: 'ai_identification' | 'database_search' | 'history_feature' | 'layman_explanations' | 'advanced_filters';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true
}) => {
  const { currentSubscription, canPerformIdentification, hasFeatureAccess, usageStats, loading } = useSubscription();
  const navigate = useNavigate();
  const { session, isLoading: isAuthLoading } = useAuthStatus();

  if (loading || isAuthLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pharma-600"></div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated and trying to access AI identification
  if (!session && feature === 'ai_identification') {
    navigate('/signin');
    toast.info('Please sign in to use the AI Drug Identification feature.');
    return null;
  }

  // Check specific feature access with improved error handling
  const checkFeatureAccess = (): boolean => {
    try {
      switch (feature) {
        case 'ai_identification':
          return canPerformIdentification();
        case 'database_search':
          return (usageStats?.databaseSearchesRemaining ?? 0) > 0 || usageStats?.databaseSearchesRemaining === -1;
        case 'history_feature':
          return hasFeatureAccess('history_feature');
        case 'layman_explanations':
          return hasFeatureAccess('layman_explanations');
        case 'advanced_filters':
          return hasFeatureAccess('advanced_filters');
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  };

  const hasAccess = checkFeatureAccess();

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show upgrade prompt if enabled
  if (!showUpgradePrompt) {
    return null;
  }

  const getFeatureDisplayName = (): string => {
    switch (feature) {
      case 'ai_identification':
        return 'AI Drug Identification';
      case 'database_search':
        return 'Database Search';
      case 'history_feature':
        return 'Identification History';
      case 'layman_explanations':
        return 'Layman Explanations';
      case 'advanced_filters':
        return 'Advanced Search Filters';
      default:
        return 'Premium Feature';
    }
  };

  const getUpgradeMessage = (): string => {
    try {
      const planName = currentSubscription?.plan?.name || 'Free Plan';
      
      switch (feature) {
        case 'ai_identification':
          const identificationsRemaining = usageStats?.identificationsRemaining ?? 0;
          const identificationsUsed = usageStats?.identificationsUsed ?? 0;
          const monthlyLimit = usageStats?.monthlyLimit ?? 5;
          
          if (identificationsRemaining === 0) {
            return `You've used all ${identificationsUsed} of ${monthlyLimit === -1 ? '∞' : monthlyLimit} AI identifications in your ${planName}. Upgrade to get more identifications!`;
          }
          return `AI Drug Identification is not available in your ${planName}.`;
        case 'database_search':
          return `You've reached the database search limit for your ${planName}.`;
        case 'history_feature':
          return `Identification History is available in Premium plans only.`;
        case 'layman_explanations':
          return `Layman explanations for medical terms are available in Premium plans only.`;
        case 'advanced_filters':
          return `Advanced search filters are available in Premium plans only.`;
        default:
          return `This feature requires a premium subscription.`;
      }
    } catch (error) {
      console.error('Error generating upgrade message:', error);
      return 'This feature requires a premium subscription.';
    }
  };

  const getRecommendedPlan = (): string => {
    const currentPlanId = currentSubscription?.plan?.id;
    
    if (currentPlanId === 'free-plan') {
      if (feature === 'ai_identification') {
        return 'Lite Plan'; // For more identifications
      }
      return 'Monthly Premium Plan'; // For premium features
    }
    
    if (currentPlanId === 'lite-plan') {
      return 'Monthly Premium Plan'; // For premium features
    }
    
    return 'Monthly Premium Plan';
  };

  const handleUpgradeClick = () => {
    try {
      navigate('/subscription-manager');
      toast.info(`Redirecting to subscription manager to upgrade your plan`);
    } catch (error) {
      console.error('Error navigating to subscription manager:', error);
      toast.error('Unable to navigate to subscription manager. Please try again.'); // Fixed unterminated string literal
    }
  }; // Added missing closing curly brace for handleUpgradeClick

  return (
    <Card className="border-2 border-dashed border-pharma-200 bg-pharma-50/50">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 bg-pharma-100 rounded-full flex items-center justify-center mb-3">
          <Lock className="w-6 h-6 text-pharma-600" />
        </div>
        <CardTitle className="text-lg flex items-center justify-center gap-2">
          <Crown className="w-5 h-5 text-pharma-600" />
          {getFeatureDisplayName()} Locked
        </CardTitle>
        <CardDescription className="text-sm">
          {getUpgradeMessage()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="bg-pharma-100 text-pharma-700 border-pharma-300">
            Current: {currentSubscription?.plan?.name || 'Free Plan'}
          </Badge>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <Badge className="bg-pharma-600 text-white">
            Recommended: {getRecommendedPlan()}
          </Badge>
        </div>

        {feature === 'ai_identification' && (usageStats?.identificationsRemaining ?? 0) === 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center justify-center gap-2 text-orange-700">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">
                {usageStats?.identificationsUsed ?? 0}/{(usageStats?.monthlyLimit ?? 5) === -1 ? '∞' : (usageStats?.monthlyLimit ?? 5)} identifications used this month
              </span>
            </div>
          </div>
        )}

        <Button 
          onClick={handleUpgradeClick}
          className="w-full bg-pharma-600 hover:bg-pharma-700"
        >
          <Crown className="w-4 h-4 mr-2" />
          Upgrade to {getRecommendedPlan()}
        </Button>
        
        <p className="text-xs text-gray-500">
          Unlock this feature and many more with a premium subscription
        </p>
      </CardContent>
    </Card>
  );
};

export default SubscriptionGuard;