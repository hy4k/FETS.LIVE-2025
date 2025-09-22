import { ReactNode, forwardRef } from 'react'
import { motion } from 'framer-motion'

interface GlassCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  variant?: 'default' | 'primary' | 'secondary' | 'accent'
  elevation?: 'low' | 'medium' | 'high'
  blur?: 'light' | 'medium' | 'heavy'
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>((
  { 
    children, 
    className = '', 
    onClick, 
    variant = 'default',
    elevation = 'medium',
    blur = 'medium'
  }, 
  ref
) => {
  const baseClasses = 'glass-card'
  const variantClasses = {
    default: 'glass-card--default',
    primary: 'glass-card--primary',
    secondary: 'glass-card--secondary',
    accent: 'glass-card--accent'
  }
  const elevationClasses = {
    low: 'glass-card--elevation-low',
    medium: 'glass-card--elevation-medium',
    high: 'glass-card--elevation-high'
  }
  const blurClasses = {
    light: 'glass-card--blur-light',
    medium: 'glass-card--blur-medium',
    heavy: 'glass-card--blur-heavy'
  }
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    elevationClasses[elevation],
    blurClasses[blur],
    onClick ? 'glass-card--clickable' : '',
    className
  ].filter(Boolean).join(' ')
  
  if (onClick) {
    return (
      <motion.button
        className={classes}
        onClick={onClick}
        whileHover={{ 
          scale: 1.02,
          transition: { duration: 0.2 }
        }}
        whileTap={{ 
          scale: 0.98,
          transition: { duration: 0.1 }
        }}
      >
        <div className="glass-card__content">
          {children}
        </div>
      </motion.button>
    )
  }
  
  return (
    <motion.div
      ref={ref}
      className={classes}
    >
      <div className="glass-card__content">
        {children}
      </div>
    </motion.div>
  )
})

GlassCard.displayName = 'GlassCard'