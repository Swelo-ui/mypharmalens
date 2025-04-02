
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface SmartSearchProgressProps {
  status: 'idle' | 'fetching' | 'analyzing' | 'formatting' | 'complete' | 'error';
  progress: number;
}

const SmartSearchProgress: React.FC<SmartSearchProgressProps> = ({ 
  status,
  progress
}) => {
  const getStatusText = () => {
    switch (status) {
      case 'fetching':
        return 'Fetching medication data...';
      case 'analyzing':
        return 'Analyzing drug information...';
      case 'formatting':
        return 'Formatting results...';
      case 'complete':
        return 'Search complete';
      case 'error':
        return 'An error occurred';
      default:
        return 'Ready to search';
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {status !== 'idle' && status !== 'complete' && status !== 'error' && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin text-pharma-600" />
          )}
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getStatusText()}
          </p>
        </div>
        {status !== 'idle' && (
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {progress}%
          </span>
        )}
      </div>
      
      {status !== 'idle' && (
        <Progress 
          value={progress} 
          className="h-2 w-full bg-gray-200 dark:bg-gray-700"
        />
      )}
    </div>
  );
};

export default SmartSearchProgress;
