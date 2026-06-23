import { permanentRedirect } from 'next/navigation';

export default function ProductionBrainRedirectPage() {
  permanentRedirect('/intelligence/brain');
}
