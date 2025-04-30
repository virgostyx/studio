import type {Metadata} from 'next';
// Removed: import { GeistSans } from 'geist/font/sans';
// Removed: import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Providers } from '@/components/providers'; // Import Providers

export const metadata: Metadata = {
  title: 'Office Tracker', // Updated App Name
  description: 'Track employee presence in the office.', // Updated Description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en"> 
      <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="mobile-web-app-capable" content="yes" />
      </head>
        <body className={`antialiased`}>
          <Providers>
            {children}
          </Providers>
        </body>
      </html>
  );
}
