import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Drop — Instant Free Website Deployment',
  description: 'Drop it. Link it. Completely free static website deployment platform. Deploy HTML, ZIP archives, and folders instantly to a public URL with no accounts, no ads, and zero injected branding.',
  openGraph: {
    title: 'Drop — Instant Free Website Deployment',
    description: 'Drop it. Link it. Completely free static website deployment platform.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Drop — Instant Free Website Deployment',
    description: 'Drop it. Link it. Completely free static website deployment platform.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
