import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
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
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
		fontFamily: {
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
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
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
  darkMode: ["class", "class"],
};

export default config;
