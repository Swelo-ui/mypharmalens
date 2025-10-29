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
  billingCycle: string;
}

const CongratulationsModal: React.FC<CongratulationsModalProps> = ({
  isOpen,
  onClose,
  planName,
  billingCycle
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
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md md:max-w-lg w-full p-5 md:p-8 relative max-h-[85vh] overflow-y-auto"
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
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
                  Congratulations!
                  <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
                </h2>
                
                <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 mb-5 md:mb-6">
                  Your subscription has been activated successfully!
                </p>

                {/* Plan Details */}
                <div className="bg-gradient-to-r from-pharma-50 to-blue-50 dark:from-pharma-900/20 dark:to-blue-900/20 rounded-lg p-3 md:p-4 mb-5 md:mb-6">
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">
                    You're now subscribed to
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-pharma-600 dark:text-pharma-400">
                    {planName}
                  </p>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {billingCycle} Billing
                  </p>
                </div>

                {/* Benefits List */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-left space-y-2 mb-5 md:mb-6"
                >
                  <p className="text-sm md:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2 md:mb-3">
                    You now have access to:
                  </p>
                  {billingCycle === 'weekly' ? (
                    <>
                      <div className="flex items-center text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        21 AI drug identifications per week
                      </div>
                      <div className="flex items-center text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        7 days of premium features
                      </div>
                    </>
                  ) : billingCycle === 'monthly' ? (
                    <>
                      <div className="flex items-center text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        100 AI drug identifications per month
                      </div>
                      <div className="flex items-center text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        30 days of premium features
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        1200 AI drug identifications per year
                      </div>
                      <div className="flex items-center text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        365 days of premium features
                      </div>
                    </>
                  )}
                  <div className="flex items-center text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Unlimited database searches
                  </div>
                  <div className="flex items-center text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    10 identification history storage
                  </div>
                  <div className="flex items-center text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Priority support
                  </div>
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
