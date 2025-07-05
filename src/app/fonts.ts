import localFont from 'next/font/local'

export const nytFont = localFont({
  src: './nyt.ttf',
  display: 'swap',
  variable: '--font-custom',
})