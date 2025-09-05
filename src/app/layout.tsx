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
          /* Global styles for the app */
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          html, body {
            height: 100%;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }
          
          /* Critical gradient background */
          .min-h-screen {
            min-height: 100vh;
            background: linear-gradient(to bottom right, #4c1d95, #581c87, #312e81) !important;
          }
          
          /* Text gradient for title */
          .bg-clip-text {
            background: linear-gradient(to right, #67e8f9, #c4b5fd, #f9a8d4) !important;
            -webkit-background-clip: text !important;
            background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            color: transparent !important;
          }
          
          /* Card styles */
          [data-slot="card"] {
            background-color: rgba(255, 255, 255, 0.1) !important;
            backdrop-filter: blur(4px) !important;
            -webkit-backdrop-filter: blur(4px) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            border-radius: 0.75rem !important;
          }
          
          /* Button styles */
          button {
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          button:hover {
            opacity: 0.9;
            transform: translateY(-1px);
          }
          
          button:disabled {
            cursor: not-allowed;
            opacity: 0.5;
          }
          
          /* Input styles */
          input {
            background-color: rgba(255, 255, 255, 0.1) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            color: white !important;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
          }
          
          input::placeholder {
            color: rgba(255, 255, 255, 0.6) !important;
          }
          
          input:focus {
            outline: none;
            border-color: #67e8f9 !important;
            box-shadow: 0 0 0 3px rgba(103, 232, 249, 0.2) !important;
          }
          
          /* Text colors */
          p, span, div {
            color: white;
          }
          
          /* Ensure all text is visible */
          .text-white\\/80 { color: rgba(255, 255, 255, 0.8) !important; }
          .text-white\\/70 { color: rgba(255, 255, 255, 0.7) !important; }
          .text-white\\/60 { color: rgba(255, 255, 255, 0.6) !important; }
          .text-white\\/50 { color: rgba(255, 255, 255, 0.5) !important; }
          .text-white\\/40 { color: rgba(255, 255, 255, 0.4) !important; }
          
          /* Button specific colors */
          .bg-white\\/10 { 
            background-color: rgba(255, 255, 255, 0.1) !important; 
          }
          
          .bg-white\\/20 { 
            background-color: rgba(255, 255, 255, 0.2) !important; 
          }
          
          .border-white\\/20 { 
            border-color: rgba(255, 255, 255, 0.2) !important; 
          }
          
          .border-white\\/30 { 
            border-color: rgba(255, 255, 255, 0.3) !important; 
          }
          
          /* Gradient backgrounds */
          .bg-gradient-to-r {
            background-image: linear-gradient(to right, var(--tw-gradient-stops)) !important;
          }
          
          .bg-gradient-to-br {
            background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)) !important;
          }
          
          .from-violet-500 {
            --tw-gradient-from: #8b5cf6;
            --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, transparent);
          }
          
          .to-purple-600 {
            --tw-gradient-to: #9333ea;
          }
          
          .from-violet-900 {
            --tw-gradient-from: #4c1d95;
            --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, transparent);
          }
          
          .via-purple-900 {
            --tw-gradient-stops: var(--tw-gradient-from), #581c87, var(--tw-gradient-to, transparent);
          }
          
          .to-indigo-900 {
            --tw-gradient-to: #312e81;
          }
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
