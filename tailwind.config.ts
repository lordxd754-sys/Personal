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
        // Premium Royal surfaces
        background: '#000000',
        surface: '#131313',
        'surface-card': 'rgba(28, 27, 27, 0.68)',
        'surface-high': '#2a2a2a',
        'surface-container': '#201f1f',
        'surface-container-high': '#2a2a2a',
        'surface-container-low': '#1c1b1b',
        'surface-container-lowest': '#0e0e0e',
        'surface-container-highest': '#353534',
        'surface-bright': '#3a3939',
        'surface-variant': '#353534',

        // Borders
        border: 'rgba(255, 255, 255, 0.08)',
        'surface-border': 'rgba(255, 255, 255, 0.08)',
        outline: '#958da1',
        'outline-variant': '#4a4455',

        // Primary (Royal Purple)
        primary: '#d2bbff',
        'primary-dim': '#b991ff',
        'primary-container': '#7c3aed',
        'on-primary': '#3f008e',
        'on-primary-container': '#ede0ff',

        // Secondary (Metallic Gold)
        secondary: '#e9c349',
        'secondary-container': '#af8d11',
        'on-secondary': '#3c2f00',
        'on-secondary-container': '#342800',

        // Text
        'on-surface': '#e5e2e1',
        'on-surface-variant': '#ccc3d8',
        'text-primary': '#e5e2e1',
        'text-secondary': '#ccc3d8',
        'text-muted': '#958da1',

        // Status
        error: '#ffb4ab',
        'on-error': '#690005',
        danger: '#ffb4ab',
        warning: '#e9c349',
        success: '#6ee7b7',
      },
      fontFamily: {
        sans: ['Hanken Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        full: '9999px',
      },
      fontSize: {
        'display-lg': ['48px', { fontWeight: '700', lineHeight: '56px', letterSpacing: '0' }],
        'headline-lg': ['32px', { fontWeight: '600', lineHeight: '40px', letterSpacing: '0' }],
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
