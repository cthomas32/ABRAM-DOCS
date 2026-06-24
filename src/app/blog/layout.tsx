import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Subscribe to ABRAM Intelligence',
    template: '%s | Subscribe to ABRAM Intelligence',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
