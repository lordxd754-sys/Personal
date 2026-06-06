import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base surfaces
        background: '#111317',
        surface: '#18181B',
        'surface-card': '#18181B',
        'surface-high': '#282a2e',
        'surface-container': '#1e2024',
        'surface-container-high': '#282a2e',
        'surface-container-low': '#1a1c20',
        'surface-container-lowest': '#0c0e12',

        // Borders
        border: '#27272A',
        'surface-border': '#27272A',
        'outline': '#8b90a0',
        'outline-variant': '#414754',

        // Primary (Electric Blue)
        primary: '#adc7ff',
        'primary-dim': '#4a8eff',
        'primary-container': '#4a8eff',
        'on-primary': '#002e68',
        'on-primary-container': '#00285b',

        // Secondary (Cyan)
        secondary: '#a2e7ff',
        'secondary-container': '#00d2fd',
        'on-secondary': '#003642',

        // Text
        'on-surface': '#e2e2e8',
        'on-surface-variant': '#c1c6d7',
        'text-primary': '#e2e2e8',
        'text-secondary': '#8b90a0',
        'text-muted': '#8b90a0',

        // Status
        error: '#EF4444',
        danger: '#EF4444',
        warning: '#F59E0B',
        success: '#10B981',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      fontSize: {
        'display-lg': ['48px', { fontWeight: '700', lineHeight: '56px', letterSpacing: '-0.02em' }],
        'headline-lg': ['32px', { fontWeight: '600', lineHeight: '40px', letterSpacing: '-0.01em' }],
        'headline-lg-mobile': ['24px', { fontWeight: '600', lineHeight: '32px' }],
        'headline-md': ['24px', { fontWeight: '600', lineHeight: '32px' }],
        'title-md': ['18px', { fontWeight: '600', lineHeight: '24px' }],
        'body-lg': ['18px', { fontWeight: '400', lineHeight: '28px' }],
        'body-md': ['16px', { fontWeight: '400', lineHeight: '24px' }],
        'body-sm': ['14px', { fontWeight: '400', lineHeight: '20px' }],
        'label-md': ['14px', { fontWeight: '500', lineHeight: '20px' }],
        'label-sm': ['12px', { fontWeight: '600', lineHeight: '16px', letterSpacing: '0.05em' }],
        'label-caps': ['12px', { fontWeight: '600', lineHeight: '16px', letterSpacing: '0.05em' }],
      },
      backdropBlur: {
        xl: '20px',
      },
    },
  },
  plugins: [],
}
export default config
