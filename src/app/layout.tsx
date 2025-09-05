import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { ErrorBoundary } from "@/components/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "VibeScope - AI-Powered Semantic Analysis Tool",
    template: "%s | VibeScope"
  },
  description: "Discover hidden emotional and semantic dimensions of words and sentences. Analyze text for manipulation patterns, propaganda techniques, and explore semantic embeddings with AI-powered insights.",
  keywords: [
    "semantic analysis", 
    "text analysis", 
    "AI", 
    "propaganda detection", 
    "word embeddings", 
    "sentiment analysis", 
    "manipulation detection",
    "text visualization"
  ],
  authors: [{ name: "VibeScope Team" }],
  creator: "VibeScope",
  publisher: "VibeScope",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || 'https://vibescope.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: '/',
    title: "VibeScope - AI-Powered Semantic Analysis Tool",
    description: "Discover hidden emotional and semantic dimensions of words and sentences with AI-powered analysis.",
    siteName: "VibeScope",
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'VibeScope - Semantic Analysis Tool',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VibeScope - AI-Powered Semantic Analysis Tool",
    description: "Discover hidden emotional and semantic dimensions of words and sentences with AI-powered analysis.",
    images: ['/api/og'],
    creator: "@vibescope",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1625' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <style dangerouslySetInnerHTML={{ __html: `
          /* Critical gradient styles to ensure they load */
          .bg-gradient-to-br {
            background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)) !important;
          }
          .from-violet-900 {
            --tw-gradient-from: #4c1d95 var(--tw-gradient-from-position, );
            --tw-gradient-to: rgb(76 29 149 / 0) var(--tw-gradient-to-position, );
            --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
          }
          .via-purple-900 {
            --tw-gradient-to: rgb(88 28 135 / 0) var(--tw-gradient-to-position, );
            --tw-gradient-stops: var(--tw-gradient-from), #581c87 var(--tw-gradient-via-position, 50%), var(--tw-gradient-to);
          }
          .to-indigo-900 {
            --tw-gradient-to: #312e81 var(--tw-gradient-to-position, );
          }
          .bg-gradient-to-r {
            background-image: linear-gradient(to right, var(--tw-gradient-stops)) !important;
          }
          .from-cyan-300 {
            --tw-gradient-from: #67e8f9 var(--tw-gradient-from-position, );
            --tw-gradient-to: rgb(103 232 249 / 0) var(--tw-gradient-to-position, );
            --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
          }
          .via-violet-300 {
            --tw-gradient-to: rgb(196 181 253 / 0) var(--tw-gradient-to-position, );
            --tw-gradient-stops: var(--tw-gradient-from), #c4b5fd var(--tw-gradient-via-position, 50%), var(--tw-gradient-to);
          }
          .to-pink-300 {
            --tw-gradient-to: #f9a8d4 var(--tw-gradient-to-position, );
          }
          .text-white { color: white !important; }
          .bg-white\\/10 { background-color: rgba(255, 255, 255, 0.1) !important; }
          .border-white\\/20 { border-color: rgba(255, 255, 255, 0.2) !important; }
        ` }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
