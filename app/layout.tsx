import './globals.css';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Sora } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';

const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
});

const displayFont = Sora({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'oops.ninja — Narrative Recovery Platform',
  description: 'Operational language for high-variance human events.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
