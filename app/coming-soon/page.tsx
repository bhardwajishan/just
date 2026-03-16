import { Sora, DM_Sans } from 'next/font/google';
import { ComingSoonContent } from './ComingSoonContent';

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

export const metadata = {
  title: 'Coming Soon — Suite Compile',
  description:
    'Web automation, mobile automation, and test management are coming to Suite Compile. Join the waitlist.',
};

export default function ComingSoonPage() {
  return (
    <div className={`${sora.variable} ${dmSans.variable}`}>
      <ComingSoonContent />
    </div>
  );
}
