import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNavigation from '@/components/BottomNavigation';
import SEOHead from '@/components/SEOHead';
import { useMediaQuery } from '@/hooks/use-mobile';
import { 
  Check, 
  Crown, 
  ArrowRight, 
  Shield, 
  Clock, 
  MessageCircle, 
  Pill,
  ChevronRight
} from 'lucide-react';

const PricingPage: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Pricing calculations
  const weeklyPrice = 39;
  const premiumMonthlyPrice = 199;
  
  const getYearlyPrice = (monthlyPrice: number) => {
    return Math.round(monthlyPrice * 12 * 0.8); // 20% discount
  };

  const getDisplayPrice = (basePrice: number, isMonthly: boolean = true) => {
    if (isYearly && isMonthly) {
      return getYearlyPrice(basePrice);
    }
    return basePrice;
  };

  const handlePlanSelect = async (planType: string) => {
    if (planType === 'free') {
      // Already on free plan
      return;
    }
    // Navigate to contact or support page for premium plans
    navigate('/contact');
  };
  return (
    <>
      <SEOHead 
        title="Pricing Plans - PharmaLens"
        description="Choose the perfect plan for your medication identification needs. From basic searches to unlimited AI-powered identifications."
        keywords="pricing, subscription, plans, medication identification, drug database"
      />
      <Header />
      <div className={`min-h-screen bg-white dark:bg-gray-900 py-20 px-4 ${isMobile ? 'pt-20 pb-28' : 'pt-24'}`}>
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-block mb-3">
              <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-pharma-100 text-pharma-800">
                Choose Your Plan
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-4">
              Choose Your <span className="text-pharma-600">PharmaLens</span> Plan
            </h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Unlock the power of AI-driven medication identification and comprehensive drug information
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <span className={`px-3 py-2 text-sm font-medium transition-colors ${!isYearly ? 'text-pharma-600' : 'text-gray-600 dark:text-gray-300'}`}>
                Monthly
              </span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
                className="data-[state=checked]:bg-pharma-600"
              />
              <span className={`px-3 py-2 text-sm font-medium transition-colors ${isYearly ? 'text-pharma-600' : 'text-gray-600 dark:text-gray-300'}`}>
                Yearly
              </span>
              {isYearly && (
                <Badge variant="secondary" className="ml-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                  Save 20%
                </Badge>
              )}
            </div>
          </div>

          {/* Pricing Cards - Mobile-First Design */}
          <div className={`${isMobile ? 'space-y-6' : 'grid grid-cols-1 md:grid-cols-3 gap-8'}`}>
            {/* Free Plan */}
            <div className={`bg-white dark:bg-gray-800 ${isMobile ? 'rounded-xl p-6 shadow-md border-l-4 border-l-gray-400' : 'rounded-2xl p-8 shadow-lg'} border border-gray-200 dark:border-gray-700 relative`}>
              {isMobile ? (
                // Mobile Layout - Compact horizontal design
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mr-3">
                        <Pill className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Free Plan</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300">Occasional users</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">₹0</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">/month</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center">
                      <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">100 drugs search</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">5 AI identifications</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">Basic drug info</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">Mobile access</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handlePlanSelect('free')}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm py-2"
                  >
                    Current Plan
                  </Button>
                </div>
              ) : (
                // Desktop Layout - Original design
                <>
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mr-3">
                      <Pill className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Free Plan</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Perfect for occasional users</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">₹0</span>
                      <span className="text-gray-600 dark:text-gray-300 ml-1">/month</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">100 drugs database search</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">5 AI identifications per month</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">Basic drug information</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">Mobile web app access</span>
                    </li>
                  </ul>

                  <Button 
                    onClick={() => handlePlanSelect('free')}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    Current Plan
                  </Button>
                </>
              )}
            </div>

            {/* Weekly Plan */}
            <div className={`bg-white dark:bg-gray-800 ${isMobile ? 'rounded-xl p-6 shadow-md border-l-4 border-l-pharma-500' : 'rounded-2xl p-8 shadow-lg'} border border-pharma-300 relative`}>
              {!isMobile && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-pharma-600 text-white px-3 py-1">
                    Popular
                  </Badge>
                </div>
              )}
              
              {isMobile ? (
                // Mobile Layout - Compact horizontal design
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 bg-pharma-100 dark:bg-pharma-900/30 rounded-lg mr-3">
                        <Clock className="h-5 w-5 text-pharma-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Weekly Plan</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300">Regular users</p>
                        <Badge className="bg-pharma-600 text-white px-2 py-0.5 text-xs mt-1">
                          Popular
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ₹{isYearly ? Math.round(weeklyPrice * 52 * 0.8) : weeklyPrice}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        /{isYearly ? 'year' : 'week'}
                      </div>
                      {isYearly && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Save ₹{Math.round(weeklyPrice * 52 * 0.2)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center">
                      <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">All Free features</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">21 AI per week</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">500+ medicines</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">Priority support</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handlePlanSelect('weekly')}
                    className="w-full bg-pharma-600 hover:bg-pharma-700 text-white text-sm py-2"
                  >
                    Choose Plan
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              ) : (
                // Desktop Layout - Original design
                <>
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-pharma-100 dark:bg-pharma-900/30 rounded-lg mr-3">
                      <Clock className="h-6 w-6 text-pharma-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Weekly Plan</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">For regular users</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        ₹{isYearly ? Math.round(weeklyPrice * 52 * 0.8) : weeklyPrice}
                      </span>
                      <span className="text-gray-600 dark:text-gray-300 ml-1">
                        /{isYearly ? 'year' : 'week'}
                      </span>
                    </div>
                    {isYearly && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Save ₹{Math.round(weeklyPrice * 52 * 0.2)} per year
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">All Free Plan features</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">21 AI identifications per week</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">500+ medicines database</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">Priority support</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">No ads</span>
                    </li>
                  </ul>

                  <Button 
                    onClick={() => handlePlanSelect('weekly')}
                    className="w-full bg-pharma-600 hover:bg-pharma-700 text-white"
                  >
                    Choose Plan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Premium Plan */}
            <div className={`bg-gradient-to-br from-pharma-50 to-pharma-100 dark:from-pharma-900/20 dark:to-pharma-800/20 ${isMobile ? 'rounded-xl p-6 shadow-md border-l-4 border-l-pharma-600' : 'rounded-2xl p-8 shadow-lg'} border border-pharma-500 relative`}>
              {isMobile ? (
                // Mobile Layout - Compact horizontal design
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 bg-pharma-200 dark:bg-pharma-800 rounded-lg mr-3">
                        <Crown className="h-5 w-5 text-pharma-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Premium Plan</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300">Power users</p>
                        <Badge className="bg-gradient-to-r from-pharma-600 to-pharma-700 text-white px-2 py-0.5 text-xs mt-1">
                          <Crown className="h-3 w-3 mr-1" />
                          Best Value
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ₹{isYearly ? getYearlyPrice(premiumMonthlyPrice) : premiumMonthlyPrice}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        /{isYearly ? 'year' : 'month'}
                      </div>
                      {isYearly && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Save ₹{Math.round(premiumMonthlyPrice * 12 * 0.2)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center">
                      <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">All Weekly features</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">Unlimited AI</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">1000+ database</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">History feature</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handlePlanSelect('premium')}
                    className="w-full bg-pharma-600 hover:bg-pharma-700 text-white text-sm py-2"
                  >
                    Choose Plan
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              ) : (
                // Desktop Layout - Original design
                <>
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-pharma-200 dark:bg-pharma-800 rounded-lg mr-3">
                      <Crown className="h-6 w-6 text-pharma-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Premium Plan</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">For power users & families</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        ₹{isYearly ? getYearlyPrice(premiumMonthlyPrice) : premiumMonthlyPrice}
                      </span>
                      <span className="text-gray-600 dark:text-gray-300 ml-1">
                        /{isYearly ? 'year' : 'month'}
                      </span>
                    </div>
                    {isYearly && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Save ₹{Math.round(premiumMonthlyPrice * 12 * 0.2)} per year
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">All Weekly Plan features</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">Unlimited AI identifications</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">1000+ database drugs</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">Layman explanations</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">History feature</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">Advanced search filters</span>
                    </li>
                  </ul>

                  <Button 
                    onClick={() => handlePlanSelect('premium')}
                    className="w-full bg-pharma-600 hover:bg-pharma-700 text-white"
                  >
                    Choose Plan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center mb-3">
                <MessageCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-2" />
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                  Payment Gateway Notice
                </h3>
              </div>
              <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                Our payment gateway is currently under maintenance. To purchase any of our premium plans, 
                please contact our support team directly.
              </p>
              <Link 
                to="/contact" 
                className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Support for Purchase
              </Link>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Need help choosing? <Link to="/contact" className="text-pharma-600 hover:underline">Contact our team</Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
      {isMobile && <BottomNavigation />}
    </>
  );
};

export default PricingPage;