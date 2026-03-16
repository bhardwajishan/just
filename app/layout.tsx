import type { Metadata } from 'next';
import { Sora, DM_Sans } from 'next/font/google';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import './globals.css';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['400', '600', '700', '800'],
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Suite Compile — The Complete Testing Platform',
  description:
    'AI-powered manual test case generation, web automation, mobile automation, and test management in one tool. Generate structured test cases from your PRD or Figma design instantly.',
  keywords:
    'test case generator, QA automation, AI testing tool, manual testing, test management',
  openGraph: {
    title: 'Suite Compile — The Complete Testing Platform',
    description: 'Generate manual test cases with AI. Web and mobile automation coming soon.',
    url: 'https://suitecompile.com',
    siteName: 'Suite Compile',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Suite Compile — The Complete Testing Platform',
    description: 'Generate manual test cases with AI. Web and mobile automation coming soon.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sora.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
