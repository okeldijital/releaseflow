import type { Metadata } from 'next';
import { AppProviders } from '@/components/app-providers';
import './globals.css';
import '@/styles/theme.css';
import '@/styles/studio.css';

export const metadata: Metadata = {
  title: 'ReleaseFlow',
  description: 'Assignment-first release collaboration platform',
  applicationName: 'ReleaseFlow',
  manifest: '/manifest.webmanifest',
  themeColor: '#101219',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ReleaseFlow',
  },
  icons: {
    icon: [
      { url: '/icons/ReleaseFlow-Logo.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    shortcut: [{ url: '/icons/ReleaseFlow-Logo.svg', type: 'image/svg+xml' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
