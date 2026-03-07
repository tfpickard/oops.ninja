import { GeneratorClient } from '@/components/generator-client';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <main>
      <h1>Alpha Console</h1>
      <p>Generate controlled narrative responses with policy-enforced guardrails.</p>
      <GeneratorClient />
    </main>
  );
}
