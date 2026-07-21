import type { Metadata } from 'next';
import type { JSX }      from 'react';
import './globals.css';

export const metadata: Metadata = {
  title:       'Synapse',
  description: 'Governance layer for team AI context',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en" className="bg-gray-950 text-gray-100">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
