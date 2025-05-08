
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Globe } from 'lucide-react';

interface LanguageBadgeProps {
  language: string;
  className?: string;
}

const LanguageBadge = ({ language, className }: LanguageBadgeProps) => {
  if (!language || language.toLowerCase() === 'english' || language.toLowerCase() === 'en') {
    return null;
  }
  
  return (
    <Badge 
      variant="outline" 
      className={`bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 ${className}`}
    >
      <Globe className="h-3 w-3 mr-1" />
      {language}
    </Badge>
  );
};

export default LanguageBadge;
