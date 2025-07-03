import React, { memo, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import DrugCard, { DrugData } from './DrugCard';
import { cn } from '@/lib/utils';

interface VirtualizedDrugListProps {
  drugs: DrugData[];
  height?: number;
  itemHeight?: number;
  className?: string;
  onDrugClick?: (drug: DrugData) => void;
}

interface ListItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    drugs: DrugData[];
    onDrugClick?: (drug: DrugData) => void;
  };
}

// Memoized list item component
const ListItem = memo(({ index, style, data }: ListItemProps) => {
  const { drugs, onDrugClick } = data;
  const drug = drugs[index];

  const handleClick = useCallback(() => {
    if (onDrugClick) {
      onDrugClick(drug);
    }
  }, [drug, onDrugClick]);

  return (
    <div style={style} className="px-2 py-1">
      <DrugCard 
        drug={drug} 
        onClick={handleClick}
        className="h-full"
      />
    </div>
  );
});

ListItem.displayName = 'ListItem';

// Main virtualized drug list component
const VirtualizedDrugList: React.FC<VirtualizedDrugListProps> = memo(({
  drugs,
  height = 600,
  itemHeight = 180,
  className,
  onDrugClick
}) => {
  // Memoize the data object to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    drugs,
    onDrugClick
  }), [drugs, onDrugClick]);

  // If no drugs, show empty state
  if (drugs.length === 0) {
    return (
      <div className={cn(
        "flex items-center justify-center h-64 text-gray-500 dark:text-gray-400",
        className
      )}>
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No drugs found</p>
          <p className="text-sm">Try adjusting your search criteria</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <List
        height={height}
        width="100%"
        itemCount={drugs.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={5} // Render 5 extra items for smoother scrolling
        className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
      >
        {ListItem}
      </List>
    </div>
  );
});

VirtualizedDrugList.displayName = 'VirtualizedDrugList';

export default VirtualizedDrugList;

// Hook for calculating optimal item height based on content
export const useOptimalItemHeight = (drugs: DrugData[], baseHeight = 160) => {
  return useMemo(() => {
    if (drugs.length === 0) return baseHeight;
    
    // Calculate average description length to adjust item height
    const avgDescriptionLength = drugs.reduce((sum, drug) => {
      return sum + (drug.description?.length || 0);
    }, 0) / drugs.length;
    
    // Adjust height based on average description length
    if (avgDescriptionLength > 150) return baseHeight + 40;
    if (avgDescriptionLength > 100) return baseHeight + 20;
    return baseHeight;
  }, [drugs, baseHeight]);
};

// Hook for infinite scrolling with virtualization
export const useInfiniteVirtualScroll = (
  allDrugs: DrugData[],
  initialCount = 50,
  increment = 25
) => {
  const [displayCount, setDisplayCount] = React.useState(initialCount);
  
  const displayedDrugs = useMemo(() => {
    return allDrugs.slice(0, displayCount);
  }, [allDrugs, displayCount]);
  
  const loadMore = useCallback(() => {
    setDisplayCount(prev => Math.min(prev + increment, allDrugs.length));
  }, [allDrugs.length, increment]);
  
  const hasMore = displayCount < allDrugs.length;
  
  return {
    displayedDrugs,
    loadMore,
    hasMore,
    totalCount: allDrugs.length,
    displayCount
  };
};