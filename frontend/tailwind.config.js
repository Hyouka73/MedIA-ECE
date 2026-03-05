/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#EDEBE6',
                primary: {
                    DEFAULT: '#1B4F8A',
                    hover: '#2459A8',
                },
                sidebar: {
                    DEFAULT: '#101E33',
                    hover: '#162540',
                },
                text: {
                    primary: '#1A1510',
                    secondary: '#5A5048'
                },
                border: '#DAD4CC',
                semantic: {
                    success: '#2D8653',
                    error: '#DC2626',
                    warning: '#D97706',
                    info: '#1B4F8A'
                }
            },
            fontFamily: {
                sans: ['"DM Sans"', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
