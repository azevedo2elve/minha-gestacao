/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        terracotta: {
          50: '#FDF6F3',
          100: '#F9EBE5',
          200: '#F3D4C8',
          300: '#EBBBA9',
          400: '#E29A82',
          DEFAULT: '#D97757', // Terracota suave
          600: '#C25D3B',
          700: '#9E4426',
          800: '#7D331B',
          900: '#5F2512',
        },
        sage: {
          50: '#F4F7F5',
          100: '#E7ECE8',
          200: '#CFDAD2',
          300: '#B0C2B6',
          400: '#8EAA97',
          DEFAULT: '#6B8E78', // Verde Sálvia
          600: '#54745F',
          700: '#415C4B',
          800: '#32473A',
          900: '#233229',
        },
        cream: {
          50: '#FFFFFF',
          100: '#FDFCFA',
          DEFAULT: '#FAF6F0', // Creme
          300: '#F2EDE3',
          400: '#E8E1D3',
          500: '#DDD3C1',
        },
        rose: {
          50: '#FCF7F7',
          100: '#F8EEF0',
          200: '#F2DDE0',
          300: '#E8B4B8', // Rosé
          400: '#DC969C',
          500: '#CF7B82',
          600: '#BC5E66',
        },
        dark: {
          bg: '#181A1B',      // Fundo suave escuro
          card: '#23272A',    // Card / superfície
          border: '#363C40',  // Borda discreta
          text: '#F3F4F6',    // Texto primário
          subtext: '#9CA3AF', // Texto secundário
          surface: '#1F2224',
        },
      },
    },
  },
  plugins: [],
};
