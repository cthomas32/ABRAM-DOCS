import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'ABRAM Docs',
    template: '%s | ABRAM Docs',
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
