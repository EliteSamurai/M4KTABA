import { Montserrat } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthProvider from "./context/AuthProvider";
import SupportWidget from "@/components/SupportWidget";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/contexts/CartContext";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export const metadata = {
  title: {
    default: "M4KTABA",
    template: "%s | M4KTABA",
  },
  description: "Discover the best in Islamic-Arabic books and honey products.",
  keywords: "Islamic books, Arabic books, honey products, blog, M4KTABA",
  author: "M4KTABA Team",
  icons: {
    icon: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "96x96",
        url: "/favicon/favicon-96x96.png",
      },
      { rel: "icon", type: "image/svg+xml", url: "/favicon/favicon.svg" },
    ],
    shortcut: "/favicon/favicon.svg",
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
  appleWebApp: {
    title: "M4KTABA",
  },
  openGraph: {
    title: "M4KTABA",
    description: "Discover Islamic-Arabic books and natural honey on M4KTABA.",
    url: "https://m4ktaba.com",
    type: "website",
    images: [
      {
        url: "/default-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "M4KTABA logo and offerings",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "M4KTABA",
    description:
      "Explore a unique collection of Islamic-Arabic books and honey.",
    images: ["/default-og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${montserrat.className} m-8 bg-slate-50 antialiased`}
    >
      <body>
        <SpeedInsights/>
        <Analytics/>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            {children}
            <Footer />
            <SupportWidget />
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
