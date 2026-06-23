import type { Metadata } from 'next';
import ClientIntakeClient from './ClientIntakeClient';

export const metadata: Metadata = {
  title: 'Client Request & Brief Intake Portal | ABRAM Network',
  description: 'Build custom project request forms and parse briefs using AI. Explore our creative operations platform to extract deliverables and estimate workloads.',
  keywords: [
    'creative production software', 'creative production tools', 'creative operations platform',
    'project request intake', 'brief intelligence', 'ai brief analyzer',
    'custom client forms', 'scoping automated', 'brief scoping portal'
  ],
  alternates: {
    canonical: 'https://abram.network/agency/client-intake',
  },
  openGraph: {
    title: 'Client Request & Brief Intake Portal | ABRAM Network',
    description: 'Build custom project request forms and parse briefs using AI. Explore our creative operations platform to extract deliverables and estimate workloads.',
    type: 'website',
    url: 'https://abram.network/agency/client-intake',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Client Request & Brief Intake Portal | ABRAM Network',
    description: 'Build custom project request forms and parse briefs using AI. Explore our creative operations platform to extract deliverables and estimate workloads.',
  },
};

export default function ClientIntakePage() {
  return <ClientIntakeClient />;
}
