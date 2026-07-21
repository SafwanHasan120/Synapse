import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F2E8DC',
        surface: '#EDE0D0',
        border: '#D9C9B5',
        rust: '#7D3A2C',
        'rust-dark': '#6A2E22',
        brown: '#B87550',
        sand: '#D4A472',
        ink: '#1C1208',
        warm: '#7A6355',
        muted: '#A8927E',
        sage: '#5C7A52',
      },
      fontFamily: {
        serif: ['DM Serif Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'logo': ['16px', { lineHeight: '1', letterSpacing: '0.08em' }],
        'page-heading': ['24px', { lineHeight: '1.2' }],
        'section-heading': ['18px', { lineHeight: '1.2' }],
        'body': ['14px', { lineHeight: '1.6' }],
        'ui': ['13px', { lineHeight: '1.5' }],
        'meta': ['11px', { lineHeight: '1.4', letterSpacing: '0.02em' }],
      },
      maxWidth: {
        'content': '1280px',
      },
      spacing: {
        'page-x': '24px',
        'page-y': '32px',
        'card-gap': '16px',
      },
    },
  },
  plugins: [],
};

export default config;