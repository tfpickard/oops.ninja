import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'oops.ninja — Narrative Recovery Platform',
  description: 'Operational language for high-variance human events.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
