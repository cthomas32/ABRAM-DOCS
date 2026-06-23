import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'ABRAM Blog',
    template: '%s | ABRAM Blog',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
