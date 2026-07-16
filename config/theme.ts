/**
 * Theme Configuration
 * Centralized color and style management for the application
 */

export const themeColors = {
  // Primary colors
  primary: {
    light: "hsl(var(--primary))",
    dark: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
  },

  // Semantic colors
  success: {
    bg: "bg-green-50 dark:bg-green-950",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-800",
  },

  warning: {
    bg: "bg-yellow-50 dark:bg-yellow-950",
    text: "text-yellow-700 dark:text-yellow-300",
    border: "border-yellow-200 dark:border-yellow-800",
  },

  error: {
    bg: "bg-red-50 dark:bg-red-950",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
  },

  info: {
    bg: "bg-blue-50 dark:bg-blue-950",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
}

export const themeSizes = {
  // Spacing
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
  },

  // Border radius
  radius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
  },

  // Font sizes
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
  },
}

export const componentVariants = {
  // Card variants
  card: {
    base: "border border-border rounded-lg p-4 bg-card",
    hover: "border border-border rounded-lg p-4 bg-card hover:shadow-lg transition-shadow",
    interactive: "border border-border rounded-lg p-4 bg-card hover:shadow-lg hover:bg-accent/5 cursor-pointer transition-all",
  },

  // Button variants
  button: {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-border bg-background hover:bg-accent/5",
    ghost: "hover:bg-accent/10",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  },

  // Badge variants
  badge: {
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
}

/**
 * Usage guide:
 *
 * // Colors
 * <div className={themeColors.success.bg}>Success message</div>
 *
 * // Component variants
 * <div className={componentVariants.card.hover}>Card content</div>
 *
 * // Or use component classes in globals.css:
 * <div className="card-base">Card content</div>
 */
