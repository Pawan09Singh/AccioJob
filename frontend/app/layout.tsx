import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Component Generator - AI-Powered React Component Builder',
  description: 'Build, preview, and export React components with AI assistance. Create beautiful, responsive components with our intelligent code generator.',
  keywords: ['React', 'Component Generator', 'AI', 'Code Generation', 'Frontend Development'],
  authors: [{ name: 'Component Generator Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Component Generator - AI-Powered React Component Builder',
    description: 'Build, preview, and export React components with AI assistance.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Component Generator - AI-Powered React Component Builder',
    description: 'Build, preview, and export React components with AI assistance.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-color)',
                  border: '1px solid var(--toast-border)',
                },
                success: {
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 