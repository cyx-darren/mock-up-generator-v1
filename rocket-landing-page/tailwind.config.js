/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "var(--color-border)", // slate-200
        input: "var(--color-input)", // white
        ring: "var(--color-ring)", // blue-600
        background: "var(--color-background)", // white
        foreground: "var(--color-foreground)", // slate-900
        primary: {
          DEFAULT: "var(--color-primary)", // blue-600
          foreground: "var(--color-primary-foreground)", // white
        },
        secondary: {
          DEFAULT: "var(--color-secondary)", // slate-500
          foreground: "var(--color-secondary-foreground)", // white
        },
        destructive: {
          DEFAULT: "var(--color-destructive)", // red-600
          foreground: "var(--color-destructive-foreground)", // white
        },
        muted: {
          DEFAULT: "var(--color-muted)", // slate-50
          foreground: "var(--color-muted-foreground)", // slate-600
        },
        accent: {
          DEFAULT: "var(--color-accent)", // amber-500
          foreground: "var(--color-accent-foreground)", // white
        },
        popover: {
          DEFAULT: "var(--color-popover)", // white
          foreground: "var(--color-popover-foreground)", // slate-900
        },
        card: {
          DEFAULT: "var(--color-card)", // white
          foreground: "var(--color-card-foreground)", // slate-900
        },
        success: {
          DEFAULT: "var(--color-success)", // emerald-500
          foreground: "var(--color-success-foreground)", // white
        },
        warning: {
          DEFAULT: "var(--color-warning)", // red-500
          foreground: "var(--color-warning-foreground)", // white
        },
        error: {
          DEFAULT: "var(--color-error)", // red-600
          foreground: "var(--color-error-foreground)", // white
        },
        surface: "var(--color-surface)", // slate-50
        "text-primary": "var(--color-text-primary)", // slate-900
        "text-secondary": "var(--color-text-secondary)", // slate-600
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        accent: ['Playfair Display', 'serif'],
      },
      fontWeight: {
        'headline-semibold': '600',
        'headline-bold': '700',
        'headline-extrabold': '800',
        'body-normal': '400',
        'body-medium': '500',
        'cta-semibold': '600',
        'accent-medium': '500',
        'accent-semibold': '600',
      },
      boxShadow: {
        'cta': '0 4px 14px 0 rgba(37, 99, 235, 0.15)',
        'mockup': '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
      },
      transitionDuration: {
        'smooth': '250ms',
        'slide': '300ms',
      },
      transitionTimingFunction: {
        'smooth': 'ease-in-out',
        'slide': 'ease-in-out',
      },
      spacing: {
        'header-desktop': '80px',
        'header-mobile': '64px',
      },
      zIndex: {
        'header': '100',
        'mobile-bar': '90',
        'modal-backdrop': '999',
        'modal': '1000',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}