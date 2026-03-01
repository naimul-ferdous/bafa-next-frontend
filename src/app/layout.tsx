import { Outfit } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';
import Providers from '@/components/Providers';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'BAFA - Bangladesh Air Force Academy',
    template: '%s | BAFA - Bangladesh Air Force Academy',
  },
  description: 'Bangladesh Air Force Academy - Training the future leaders of Bangladesh Air Force',
  keywords: ['BAFA', 'Bangladesh Air Force', 'Bangladesh Air Force Academy', 'Air Force Training', 'Military Academy'],
  authors: [{ name: 'Bangladesh Air Force Academy' }],
  creator: 'Bangladesh Air Force Academy',
  publisher: 'Bangladesh Air Force Academy',
  robots: 'index, follow',
  openGraph: {
    title: 'BAFA - Bangladesh Air Force Academy',
    description: 'Bangladesh Air Force Academy - Training the future leaders of Bangladesh Air Force',
    siteName: 'Bangladesh Air Force Academy',
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} dark:bg-gray-900`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
