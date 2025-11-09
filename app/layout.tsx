import { Montserrat } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthProvider from './context/AuthProvider';
import SupportWidget from '@/components/SupportWidget';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/contexts/CartContext';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { SupportProvider } from '@/contexts/support-context';
import { Analytics } from '@vercel/analytics/react';
import Script from 'next/script';
import { A11yLiveRegion } from '@/components/A11yLiveRegion';
import VitalsClient from './vitals-client';

// Initialize observability system on server
if (typeof window === 'undefined') {
  import('@/lib/observability/monitor').then(({ initializeObservability }) => {
    initializeObservability();
  });
}

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
});

export const metadata = {
  metadataBase: new URL('https://m4ktaba.com'),
  title: {
    default: 'M4KTABA | Online Islamic-Arabic Books Marketplace',
    template: '%s | M4KTABA',
  },
  description:
    'Discover M4KTABA, the ultimate online marketplace for authentic Islamic-Arabic books and premium Yemeni Sidr honey. Buy, sell, and connect with a vibrant community today!',
  keywords:
    'Islamic books, islamic-arabic book marketplace, Arabic books, Islamic-Arabic books, premium sidr honey, royal honey, yemeni honey, blog, M4KTABA',
  author: 'M4KTABA Team',
  icons: {
    icon: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '96x96',
        url: '/favicon/favicon-96x96.png',
      },
      { rel: 'icon', type: 'image/svg+xml', url: '/favicon/favicon.svg' },
    ],
    shortcut: '/favicon/favicon.svg',
    apple: '/favicon/apple-touch-icon.png',
  },
  manifest: '/favicon/site.webmanifest',
  appleWebApp: {
    title: 'M4KTABA',
  },
  openGraph: {
    title: 'M4KTABA',
    description: 'Discover Islamic-Arabic books and natural honey on M4KTABA.',
    url: 'https://m4ktaba.com',
    type: 'website',
    images: [
      {
        url: '/default-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'M4KTABA logo and offerings',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'M4KTABA',
    description:
      'Explore a unique collection of Islamic-Arabic books and honey.',
    images: ['/default-og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang='en'
      className={`${montserrat.className} m-8 bg-slate-50 antialiased`}
    >
      <head>
        {/* Google Tag (gtag.js) */}
        <Script
          strategy='afterInteractive'
          src='https://www.googletagmanager.com/gtag/js?id=G-N3YCSKEH3E'
        />
        <Script
          id='google-analytics'
          strategy='afterInteractive'
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
  
              gtag('config', 'G-N3YCSKEH3E');
            `,
          }}
        />

        {/* Meta Pixel Script */}
        <Script
          id='fb-pixel'
          strategy='afterInteractive'
          dangerouslySetInnerHTML={{
            __html: `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}');
      fbq('track', 'PageView');
    `,
          }}
        />
        <noscript>
          <img
            height='1'
            width='1'
            style={{ display: 'none' }}
            alt=''
            src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
      </head>
      <body>
        <SpeedInsights />
        <Analytics />
        <AuthProvider>
          <SupportProvider>
            <CartProvider>
              <Navbar />
              <A11yLiveRegion />
              {process.env.NEXT_PUBLIC_DISABLE_VITALS !== 'true' ? (
                <VitalsClient />
              ) : null}
              {children}
              <Footer />
              <SupportWidget />
              <Toaster />
            </CartProvider>
          </SupportProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
