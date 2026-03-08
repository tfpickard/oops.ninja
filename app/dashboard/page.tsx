import Link from 'next/link';
import { GeneratorClient } from '@/components/generator-client';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <main>
      <h1>Operations Console</h1>
      <p>Generate controlled narrative responses, monitor usage, and coordinate beta workspace controls.</p>
      <p><Link href="/admin">Open Admin Command Center</Link> · <Link href="/docs">View API & SDK documentation</Link></p>
      <GeneratorClient />
    </main>
  );
}
