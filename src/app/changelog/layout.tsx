import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'ABRAM Changelog',
    template: '%s | ABRAM Changelog',
  },
};

export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
