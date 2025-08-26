import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "370px",
      },
      colors: {
        // Cores específicas do SNF/Berachain/Launchpad
        primary: "#ff2e00",
        hyperGreen: "#96FCE4",
        
        // Cores originais do Hyperliquid (mantidas para compatibilidade)
        'app-primary': 'var(--app-primary)',
        borderinput: 'var(--borderinput)',
        'daybreak-blueblue-6': 'var(--daybreak-blueblue-6)',
        'graygray-1': 'var(--graygray-1)',
        'graygray-10': 'var(--graygray-10)',
        'graygray-2': 'var(--graygray-2)',
        'graygray-3': 'var(--graygray-3)',
        'graygray-4': 'var(--graygray-4)',
        'graygray-5': 'var(--graygray-5)',
        'graygray-6': 'var(--graygray-6)',
        'graygray-7': 'var(--graygray-7)',
        'graygray-8': 'var(--graygray-8)',
        'graygray-9': 'var(--graygray-9)',
        'graygray1-white': 'var(--graygray1-white)',
        'graygray5-border': 'var(--graygray5-border)',
        'graygray9-primary-text': 'var(--graygray9-primary-text)',
        'magenta-magenta-1': 'var(--magenta-magenta-1)',
        'magenta-magenta-3': 'var(--magenta-magenta-3)',
        'magenta-magenta-6': 'var(--magenta-magenta-6)',
        mainwhite: 'var(--mainwhite)',
        'orangesweep-6': 'var(--orangesweep-6)',
        'primaryprimary-3': 'var(--primaryprimary-3)',
        'primaryprimary-6': 'var(--primaryprimary-6)',
        text: 'var(--text)',
        textsubtle: 'var(--textsubtle)',
        white: 'var(--white)',
        
        // Cores do shadcn/ui
        primary2: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        // Cores do rainbow button
        "color-1": "hsl(var(--color-1))",
        "color-2": "hsl(var(--color-2))",
        "color-3": "hsl(var(--color-3))",
        "color-4": "hsl(var(--color-4))",
        "color-5": "hsl(var(--color-5))",
      },
      fontFamily: {
        // Fontes do SNF/Berachain
        poppins: ["var(--font-poppins)", "sans-serif"],
        syne: ["var(--font-syne)", "sans-serif"],
        
        // Fontes originais do Hyperliquid (mantidas para compatibilidade)
        '12px-cake': 'var(--12px-cake-font-family)',
        '14px-cake': 'var(--14px-cake-font-family)',
        '16px-cake': 'var(--16px-cake-font-family)',
        default: 'var(--default-font-family)',
        'regular-14px-22px': 'var(--regular-14px-22px-font-family)',
        'text-base-regular': 'var(--text-base-regular-font-family)',
        'text-base-semibold': 'var(--text-base-semibold-font-family)',
        'text-small-regular': 'var(--text-small-regular-font-family)',
        'text-text-12px-400': 'var(--text-text-12px-400-font-family)',
        'text-text-14px-400': 'var(--text-text-14px-400-font-family)',
        'text-text-14px-600': 'var(--text-text-14px-600-font-family)',
        'title-title-20px-600': 'var(--title-title-20px-600-font-family)',
        'title-title-24px-600': 'var(--title-title-24px-600-font-family)',
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-inter)', 'Inter', 'monospace'],
      },
      boxShadow: {
        'drop-sweep': 'var(--drop-sweep)'
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      animation: {
        // Animações do SNF/Berachain
        rainbow: "rainbow var(--speed, 2s) infinite linear",
        "background-position-spin": "background-position-spin 3000ms infinite alternate",
        marquee: "marquee var(--duration) infinite linear",
        "marquee-vertical": "marquee-vertical var(--duration) linear infinite",
        shine: "shine var(--duration) infinite linear",
        floating: "floating 4s ease-in-out infinite",
        
        // Animações originais do Hyperliquid
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      },
      keyframes: {
        // Keyframes do SNF/Berachain
        floating: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-30px)" },
        },
        rainbow: {
          "0%": { "background-position": "0%" },
          "100%": { "background-position": "200%" },
        },
        "background-position-spin": {
          "0%": { backgroundPosition: "top center" },
          "100%": { backgroundPosition: "bottom center" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap)))" },
        },
        "marquee-vertical": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(calc(-100% - var(--gap)))" },
        },
        shine: {
          "0%": { "background-position": "0% 0%" },
          "50%": { "background-position": "100% 100%" },
          to: { "background-position": "0% 0%" },
        },
        
        // Keyframes originais do Hyperliquid
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
    },
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
