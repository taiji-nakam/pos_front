import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <meta name="format-detection" content="telephone=no, address=no" /> {/* ✅ 住所認識を無効化 */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}