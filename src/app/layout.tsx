import type { Metadata, Viewport } from 'next';
import { Providers } from '@/lib/providers';
import { ToastProvider } from '@/components/ui/ToastProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'WESCO WORKS',
  description: 'WESCO 업무 관리 시스템',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#E1431B',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          {children}
          <ToastProvider />
        </Providers>
      </body>
    </html>
  );
}
