import * as React from "react"

// Mobile-first responsive breakpoints
const BREAKPOINTS = {
  mobile: 640,    // sm
  tablet: 768,    // md  
  desktop: 1024,  // lg
  wide: 1280      // xl
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.mobile - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.mobile)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < BREAKPOINTS.mobile)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.desktop - 1}px)`)
    const onChange = () => {
      const width = window.innerWidth
      setIsTablet(width >= BREAKPOINTS.mobile && width < BREAKPOINTS.desktop)
    }
    mql.addEventListener("change", onChange)
    const width = window.innerWidth
    setIsTablet(width >= BREAKPOINTS.mobile && width < BREAKPOINTS.desktop)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isTablet
}

export function useScreenSize() {
  const [screenSize, setScreenSize] = React.useState<'mobile' | 'tablet' | 'desktop' | 'wide'>('desktop')

  React.useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth
      if (width < BREAKPOINTS.mobile) {
        setScreenSize('mobile')
      } else if (width < BREAKPOINTS.desktop) {
        setScreenSize('tablet')
      } else if (width < BREAKPOINTS.wide) {
        setScreenSize('desktop')
      } else {
        setScreenSize('wide')
      }
    }

    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])

  return screenSize
}

// Touch device detection
export function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = React.useState(false)

  React.useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }
    checkTouch()
  }, [])

  return isTouchDevice
}
