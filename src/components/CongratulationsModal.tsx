import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface CongratulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  billingCycle?: string;
  planFeatures?: string[];
  type?: 'subscription' | 'topup';
  identificationsCount?: number;
  amount?: number;
}

const CongratulationsModal: React.FC<CongratulationsModalProps> = ({
  isOpen,
  onClose,
  planName,
  billingCycle = 'monthly',
  planFeatures,
  type = 'subscription',
  identificationsCount = 0,
  amount = 0
}) => {
  const { width, height } = useWindowSize();
  const isMobile = (width || 0) <= 480;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Confetti Effect */}
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={isMobile ? 140 : 500}
            gravity={isMobile ? 0.2 : 0.3}
          />

          {/* Modal Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 md:p-4"
            onClick={onClose}
          >
            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-gradient-to-br from-gray-900 via-pharma-900 to-blue-900 rounded-2xl shadow-2xl max-w-md md:max-w-lg w-full p-5 md:p-8 relative max-h-[85vh] overflow-y-auto border border-pharma-500/20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute top-4 right-4 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Success Icon with Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto w-16 h-16 md:w-20 md:h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-5 md:mb-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                >
                  <Check className="h-8 w-8 md:h-10 md:w-10 text-green-600 dark:text-green-400" />
                </motion.div>
              </motion.div>

              {/* Congratulations Text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
                  Congratulations!
                  <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
                </h2>
                
                <p className="text-base md:text-lg text-gray-200 mb-5 md:mb-6">
                  {type === 'topup' 
                    ? 'Your top-up pack has been added successfully!' 
                    : 'Your subscription has been activated successfully!'}
                </p>

                {/* Plan Details */}
                <div className="bg-gradient-to-r from-pharma-500 to-blue-500 rounded-lg p-3 md:p-4 mb-5 md:mb-6">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-white" />
                    </div>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-white text-center">
                    {planName}
                  </p>
                  <p className="text-xs md:text-sm text-white/80 text-center mt-1">
                    {type === 'topup'
                      ? `${identificationsCount} AI identifications added to your account!`
                      : 'You now have access to all premium features!'}
                  </p>
                </div>

                {/* Benefits List */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-left space-y-2 mb-5 md:mb-6"
                >
                  <p className="text-sm md:text-base font-semibold text-gray-200 mb-2 md:mb-3 flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-pharma-500 flex items-center justify-center text-xs">
                      {type === 'topup' ? '🎁' : '📦'}
                    </span>
                    {type === 'topup' ? 'Pack Details:' : 'What\'s included:'}
                  </p>
                  {type === 'topup' ? (
                    <>
                      <div className="flex items-center text-xs md:text-sm text-gray-300">
                        <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                        {identificationsCount} AI identifications added
                      </div>
                      <div className="flex items-center text-xs md:text-sm text-gray-300">
                        <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                        Valid for 1 year
                      </div>
                      <div className="flex items-center text-xs md:text-sm text-gray-300">
                        <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                        Use anytime
                      </div>
                      <div className="flex items-center text-xs md:text-sm text-gray-300">
                        <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                        Instant activation
                      </div>
                    </>
                  ) : (planFeatures && planFeatures.length > 0) ? (
                    planFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center text-xs md:text-sm text-gray-300">
                        <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                        {feature}
                      </div>
                    ))
                  ) : (
                    <>
                      {billingCycle === 'weekly' ? (
                        <>
                          <div className="flex items-center text-xs md:text-sm text-gray-300">
                            <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                            21 AI identifications/week
                          </div>
                          <div className="flex items-center text-xs md:text-sm text-gray-300">
                            <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                            500+ medicines database
                          </div>
                          <div className="flex items-center text-xs md:text-sm text-gray-300">
                            <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                            Priority support
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center text-xs md:text-sm text-gray-300">
                            <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                            {billingCycle === 'yearly' ? '1200 AI identifications/year' : '100 AI identifications/month'}
                          </div>
                          <div className="flex items-center text-xs md:text-sm text-gray-300">
                            <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                            1000+ medicines database
                          </div>
                          <div className="flex items-center text-xs md:text-sm text-gray-300">
                            <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                            Advanced search & filters
                          </div>
                          <div className="flex items-center text-xs md:text-sm text-gray-300">
                            <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                            History feature
                          </div>
                        </>
                      )}
                    </>
                  )}
                </motion.div>

                {/* Action Button */}
                <Button
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-pharma-600 to-blue-600 hover:from-pharma-700 hover:to-blue-700"
                  size={isMobile ? 'default' : 'lg'}
                >
                  Start Using PharmaLens
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CongratulationsModal;
