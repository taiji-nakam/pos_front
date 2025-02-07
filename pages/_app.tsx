import '../app/globals.css';
import type { AppProps } from 'next/app';
import { TaxProvider } from "../contexts/TaxContext";

function MyApp({ Component, pageProps }: AppProps) {
    return (
      <TaxProvider>
        <Component {...pageProps} />
      </TaxProvider>
    );
  }

export default MyApp;