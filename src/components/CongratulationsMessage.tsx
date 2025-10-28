import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, X, Sparkles, Crown, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CongratulationsMessageProps {
  isVisible: boolean;
  planName: string;
  onDismiss: () => void;
  autoHide?: boolean;
  duration?: number;
}

const CongratulationsMessage: React.FC<CongratulationsMessageProps> = ({
  isVisible,
  planName,
  onDismiss,
  autoHide = true,
  duration = 5000
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true);
      
      if (autoHide) {
        const timer = setTimeout(() => {
          onDismiss();
        }, duration);

        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, autoHide, duration, onDismiss]);

  useEffect(() => {
    if (showConfetti) {
      const confettiTimer = setTimeout(() => {
        setShowConfetti(false);
      }, 3000);

      return () => clearTimeout(confettiTimer);
    }
  }, [showConfetti]);

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
          {/* Confetti Animation */}
          <AnimatePresence>
            {showConfetti && (
              <motion.div
                variants={confettiVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute inset-0 pointer-events-none overflow-hidden"
              >
                {generateConfettiItems()}
              </motion.div>
            )}
          </AnimatePresence>

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
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950 dark:via-gray-900 dark:to-purple-950" />
              
              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="absolute top-2 right-2 z-10 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
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
                    <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Congratulations!
                    </h2>
                    <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
                  </div>
                  
                  <p className="text-lg text-gray-700 dark:text-gray-300">
                    Your subscription has been successfully activated!
                  </p>
                </motion.div>

                {/* Plan Details */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Crown className="h-5 w-5" />
                    <span className="font-semibold text-lg">{planName}</span>
                  </div>
                  <p className="text-blue-100 text-sm">
                    You now have access to all premium features!
                  </p>
                </motion.div>

                {/* Features Highlight */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                    <Gift className="h-4 w-4" />
                    <span className="text-sm">What's included:</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['Unlimited Identifications', 'Advanced Search', 'Priority Support'].map((feature, index) => (
                      <motion.span
                        key={feature}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1 + index * 0.1, duration: 0.3 }}
                        className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium"
                      >
                        {feature}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>

                {/* Auto-dismiss indicator */}
                {autoHide && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                    className="text-xs text-gray-500 dark:text-gray-400"
                  >
                    This message will auto-dismiss in {Math.ceil(duration / 1000)} seconds
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CongratulationsMessage;