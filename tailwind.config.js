/** @type {import('tailwindcss').Config} */
module.exports = {
    safelist: [
        {
            pattern: /bg-(red|blue|yellow|green|purple|gray|pink|indigo)-(50|100|200|300|400|500|600|700|800|900)/,
        }
    ],
    content: [
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            keyframes: {
                'bounce-subtle': {
                    '0%, 100%': {
                        transform: 'translateY(-5%)',
                        animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
                    },
                    '50%': {
                        transform: 'translateY(0)',
                        animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
                    },
                }
            },
            animation: {
                'bounce-subtle': 'bounce-subtle 1.5s infinite',
            }
        }
    },
    plugins: [],
}