
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

// For backward compatibility, also export as useMobile
export const useMobile = useIsMobile;

// Add the useMediaQuery function that's being imported in Header.tsx
export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState<boolean>(false)

  React.useEffect(() => {
    const media = window.matchMedia(query)
    const updateMatch = () => {
      setMatches(media.matches)
    }
    
    // Set initial value
    updateMatch()
    
    // Add listener
    media.addEventListener("change", updateMatch)
    
    // Clean up
    return () => {
      media.removeEventListener("change", updateMatch)
    }
  }, [query])

  return matches
}
