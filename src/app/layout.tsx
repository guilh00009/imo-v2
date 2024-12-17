import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Imo - AI Character Chat Platform",
  description: "Create and chat with AI characters in a beautiful, modern interface.",
  openGraph: {
    title: "Imo - AI Character Chat Platform",
    description: "Create and chat with AI characters in a beautiful, modern interface.",
    type: 'website',
  },
  twitter: {
    card: "summary_large_image",
    title: "Imo - AI Character Chat Platform",
    description: "Create and chat with AI characters in a beautiful, modern interface.",
  },
};

// Initialize database

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
