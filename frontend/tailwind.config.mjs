/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Dark theme backgrounds
        bg: '#1a1510',
        bg2: '#201b14',
        bg3: '#26201a',
        bg4: '#2e2820',
        card: '#241e17',
        card2: '#2c251d',
        
        // Amber accents
        amber: '#e8a84c',
        amber2: '#f0c070',
        amber3: '#c4882a',
        
        // Cream text colors
        cream: '#f5ead8',
        cream2: '#d4c4a8',
        cream3: '#9c8a72',
        
        // Green accents
        green: '#6a9e6a',
        green2: '#3d6b3d',
        green3: '#2a4a2a',
        
        // Red for danger
        red: '#c45858',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};