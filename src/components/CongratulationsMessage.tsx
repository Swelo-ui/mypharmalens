import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, X, Sparkles, Crown, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface CongratulationsMessageProps {
  isVisible: boolean;
  planName: string;
  onDismiss: () => void;
  billingCycle?: string;
  planFeatures?: string[];
  type?: 'subscription' | 'topup';
  identificationsCount?: number;
  amount?: number;
}

const CongratulationsMessage: React.FC<CongratulationsMessageProps> = ({
  isVisible,
  planName,
  onDismiss,
  billingCycle = 'monthly',
  planFeatures,
  type = 'subscription',
  identificationsCount = 0,
  amount = 0
}) => {
  const { width, height } = useWindowSize();
  const isMobile = (width || 0) <= 480;
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true);
      const confettiTimer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(confettiTimer);
    }
  }, [isVisible]);

  const confettiVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    },
    exit: {
      opacity: 0,
      scale: 0,
      transition: { duration: 0.3 }
    }
  };

  const confettiItemVariants = {
    hidden: { opacity: 0, y: -20, rotate: 0 },
    visible: {
      opacity: [0, 1, 1, 0] as number[],
      y: [0, -30, 50, 100] as number[],
      rotate: [0, 180, 360, 540] as number[],
      transition: {
        duration: 2,
        ease: "easeOut" as const
      }
    }
  };

  const messageVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 50
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 25,
        duration: 0.6
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -50,
      transition: {
        duration: 0.4,
        ease: "easeInOut" as const
      }
    }
  } as const;

  const generateConfettiItems = () => {
    const items = [];
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    for (let i = 0; i < 20; i++) {
      items.push(
        <motion.div
          key={i}
          variants={confettiItemVariants}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 20}%`
          }}
        />
      );
    }
    return items;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Full-screen Confetti Burst Animation */}
          {showConfetti && (
            <Confetti
              width={width}
              height={height}
              recycle={false}
              numberOfPieces={isMobile ? 150 : 500}
              gravity={isMobile ? 0.2 : 0.3}
              colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#22D3EE', '#34D399']}
            />
          )}

          {/* Main Message Card */}
          <motion.div
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative max-w-md w-full"
          >
            <Card className="relative overflow-hidden border-2 border-blue-500 shadow-2xl shadow-blue-500/20">
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-pharma-900 to-blue-900" />

              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="absolute top-2 right-2 z-10 h-8 w-8 p-0 hover:bg-gray-800 text-white"
              >
                <X className="h-4 w-4" />
              </Button>

              <CardContent className="relative p-8 text-center space-y-6">
                {/* Success Icon with Animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2
                  }}
                  className="flex justify-center"
                >
                  <div className="relative">
                    <CheckCircle className="h-16 w-16 text-green-500 animate-celebration" />
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute inset-0 rounded-full bg-green-500/20"
                    />
                  </div>
                </motion.div>

                {/* Main Message */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-yellow-500 animate-pulse" />
                    <h2 className="text-2xl md:text-3xl font-bold text-white">
                      Congratulations!
                    </h2>
                    <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-yellow-500 animate-pulse" />
                  </div>

                  <p className="text-base md:text-lg text-gray-200">
                    {type === 'topup'
                      ? 'Your top-up pack has been successfully added!'
                      : 'Your subscription has been successfully activated!'}
                  </p>
                </motion.div>

                {/* Plan Details */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="bg-gradient-to-r from-pharma-500 to-blue-500 text-white rounded-lg p-3 md:p-4 space-y-2"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-white" />
                    </div>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-white text-center">
                    {planName}
                  </p>
                  <p className="text-xs md:text-sm text-white/80 text-center">
                    {type === 'topup'
                      ? `${identificationsCount} AI identifications added to your account!`
                      : 'You now have access to all premium features!'}
                  </p>
                </motion.div>

                {/* Features Highlight */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="space-y-2 text-left"
                >
                  <p className="text-sm md:text-base font-semibold text-gray-200 mb-2 flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-pharma-500 flex items-center justify-center text-xs">
                      {type === 'topup' ? '🎁' : '📦'}
                    </span>
                    {type === 'topup' ? 'Pack Details:' : 'What\'s included:'}
                  </p>
                  <div className="space-y-2">
                    {type === 'topup' ? (
                      <>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9, duration: 0.3 }}
                          className="flex items-center text-xs md:text-sm text-gray-300"
                        >
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                          {identificationsCount} AI identifications added
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.0, duration: 0.3 }}
                          className="flex items-center text-xs md:text-sm text-gray-300"
                        >
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                          Valid for 1 year
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.1, duration: 0.3 }}
                          className="flex items-center text-xs md:text-sm text-gray-300"
                        >
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                          Use anytime with your plan
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.2, duration: 0.3 }}
                          className="flex items-center text-xs md:text-sm text-gray-300"
                        >
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                          Instant activation
                        </motion.div>
                      </>
                    ) : (planFeatures && planFeatures.length > 0) ? (
                      planFeatures.map((feature, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 + index * 0.1, duration: 0.3 }}
                          className="flex items-center text-xs md:text-sm text-gray-300"
                        >
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                          {feature}
                        </motion.div>
                      ))
                    ) : (
                      <>
                        {billingCycle === 'weekly' ? (
                          <>
                            <div className="flex items-center text-xs md:text-sm text-gray-300">
                              <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                              21 AI identifications/week
                            </div>
                            <div className="flex items-center text-xs md:text-sm text-gray-300">
                              <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                              500+ medicines database
                            </div>
                            <div className="flex items-center text-xs md:text-sm text-gray-300">
                              <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                              Priority support
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center text-xs md:text-sm text-gray-300">
                              <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                              {billingCycle === 'yearly' ? '1200 AI identifications/year' : '100 AI identifications/month'}
                            </div>
                            <div className="flex items-center text-xs md:text-sm text-gray-300">
                              <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                              1000+ medicines database
                            </div>
                            <div className="flex items-center text-xs md:text-sm text-gray-300">
                              <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                              Advanced search & filters
                            </div>
                            <div className="flex items-center text-xs md:text-sm text-gray-300">
                              <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                              History feature
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CongratulationsMessage;