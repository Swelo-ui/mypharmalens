
import { useState, useEffect } from 'react';

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    // Check for SSR
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      
      const updateMatches = () => {
        setMatches(media.matches);
      };
      
      // Set initial value
      updateMatches();
      
      // Use the modern event listener
      media.addEventListener('change', updateMatches);
      
      // Cleanup
      return () => {
        media.removeEventListener('change', updateMatches);
      };
    }
  }, [query]);

  return matches;
};

// Export useIsMobile hook for detecting mobile devices
export const useIsMobile = (): boolean => {
  return useMediaQuery('(max-width: 768px)');
};

export default useMediaQuery;
