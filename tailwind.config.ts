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
        background: '#0A0A0A',
        surface: '#1A1A1A',
        'surface-high': '#252525',
        border: '#27272A',
        primary: '#10B981',
        'primary-dim': '#4EDEA3',
        'on-primary': '#000000',
        'text-primary': '#FFFFFF',
        'text-secondary': '#A1A1AA',
        error: '#EF4444',
        warning: '#F59E0B',
        success: '#10B981',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      fontSize: {
        'headline-lg': ['32px', { fontWeight: '600', letterSpacing: '-0.01em' }],
        'headline-md': ['24px', { fontWeight: '600' }],
        'title-md': ['18px', { fontWeight: '600' }],
        'body-md': ['16px', { fontWeight: '400' }],
        'body-sm': ['14px', { fontWeight: '400' }],
        'label-md': ['14px', { fontWeight: '500' }],
        'label-sm': ['12px', { fontWeight: '600' }],
      },
    },
  },
  plugins: [],
}
export default config
