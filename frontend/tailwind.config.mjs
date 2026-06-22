/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f4f7f4', 100: '#e3ebe3', 200: '#c5d8c5', 300: '#9bbd9b',
          400: '#729c72', 500: '#527f52', 600: '#3e633e', 700: '#334f33',
          800: '#2b3f2b', 900: '#243424',
        },
        plum: {
          50: '#f5f3f7', 100: '#eae4f0', 200: '#d6cbe2', 300: '#b9a5cc',
          400: '#9678b3', 500: '#7a5499', 600: '#61417a', 700: '#4d3461',
          800: '#402d51', 900: '#362644',
        },
        warm: {
          50: '#fdfcfb', 100: '#faf8f5', 200: '#f3efe9', 300: '#e8e1d6',
          400: '#d4c8b8', 500: '#bca994', 600: '#a18b75', 700: '#85705f',
          800: '#6e5c4f', 900: '#5a4c42',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};