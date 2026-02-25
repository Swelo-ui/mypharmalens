import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Pill,
  Zap,
  History,
  Shield,
  Activity,
  FlaskConical,
  Database,
  CheckCircle2
} from 'lucide-react';
import { IDENTIFICATION_LIMITS } from '@/config/subscription.config';

interface Benefit {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const AccountBenefits: React.FC = () => {
  const benefits: Benefit[] = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: "AI-Powered Identification",
      description: "Instant medication identification using advanced AI. Snap a photo and get comprehensive drug information."
    },
    {
      icon: <Database className="h-5 w-5" />,
      title: "1200+ Medicines Database",
      description: "Access detailed information on uses, dosages, side effects, and interactions."
    },
    {
      icon: <Activity className="h-5 w-5" />,
      title: "Symptom Checker",
      description: "Get personalized medication recommendations based on your symptoms."
    },
    {
      icon: <FlaskConical className="h-5 w-5" />,
      title: "Drug Interaction Checker",
      description: "Check potential interactions between medications with real-time safety alerts."
    },
    {
      icon: <History className="h-5 w-5" />,
      title: "Identification History",
      description: "Track all your medication searches and access your history anytime."
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Secure & Private",
      description: "Enterprise-grade encryption. Your data is protected and never shared."
    }
  ];

  return (
    <div className="w-full py-6 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header with PharmaLens Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-pharma-600 flex items-center justify-center">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              <span className="text-pharma-600">PharmaLens</span>
            </h2>
          </div>
          <p className="text-base text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
            AI-Powered Medication Identification & Drug Information
          </p>
          <Badge className="mt-3 bg-green-500 text-white">Account Created Successfully</Badge>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {benefits.map((benefit, index) => (
            <Card
              key={index}
              className="group hover:shadow-lg transition-all duration-300 hover:border-pharma-200 dark:hover:border-pharma-800"
            >
              <CardContent className="p-5">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 transition-transform duration-300 group-hover:scale-110 bg-pharma-100 dark:bg-pharma-900/30 text-pharma-600 dark:text-pharma-400">
                  {benefit.icon}
                </div>
                <h3 className="text-base font-semibold mb-1.5">{benefit.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Free Plan Info */}
        <div className="mt-8">
          <Card className="border-pharma-200 dark:border-pharma-800 bg-gradient-to-r from-pharma-50 to-blue-50 dark:from-pharma-900/20 dark:to-blue-900/20">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-pharma-600 text-white flex-shrink-0">
                  <Zap className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-3">Your Free Plan Includes:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{IDENTIFICATION_LIMITS.FREE} AI identification{IDENTIFICATION_LIMITS.FREE > 1 ? 's' : ''}/month</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Up to 5 free identifications daily via short ads</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">100 drugs database access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">Drug interaction checker</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">Symptom checker</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-3">
                    <span className="font-semibold text-pharma-600">Need more?</span> Upgrade to Lite or Pro for unlimited features
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AccountBenefits;
