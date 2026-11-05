import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7f4',
          100: '#d9ede2',
          200: '#b5dbc7',
          300: '#85c2a5',
          400: '#56a580',
          500: '#368a64',
          600: '#276e50',
          700: '#205941',
          800: '#1c4735',
          900: '#183b2d',
          950: '#0c211a',
        },
        mountain: {
          slate: '#3d4f5f',
          stone: '#8b8680',
          snow: '#f8f9fa',
          sky: '#87CEEB',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
