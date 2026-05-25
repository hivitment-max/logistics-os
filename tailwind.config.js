/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        dark: {
          800: "#1f2937",
          900: "#111827",
        }
      },
      // ✅ ანიმაციები (რუსტული კოდისთვის საჭიროა)
      animation: {
        'ring-pulse': 'ringPulse 3s ease-in-out infinite',
        'slide-down': 'slideDown 0.22s cubic-bezier(0.23, 1, 0.32, 1)',
      },
      keyframes: {
        ringPulse: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.55', transform: 'scale(1.02)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}