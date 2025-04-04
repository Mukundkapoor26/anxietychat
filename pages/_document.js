import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
        {/* This script ensures localStorage is defined during SSR */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if (typeof window === 'undefined') {
              global.localStorage = {
                getItem: () => null,
                setItem: () => null,
                removeItem: () => null,
              };
            }
          `,
        }} />
      </body>
    </Html>
  )
}
