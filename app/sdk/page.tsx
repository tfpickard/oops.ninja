import Link from 'next/link';
import { typescriptSdkSnippet } from '@/lib/sdk';

export default function SdkPage() {
  return (
    <main>
      <h1>SDK Resources</h1>
      <p>Accelerate integration through typed client scaffolds and standards-aligned request structures.</p>
      <section className="card">
        <h2>TypeScript SDK</h2>
        <pre>{typescriptSdkSnippet}</pre>
      </section>
      <p><Link href="/docs">Back to docs</Link></p>
    </main>
  );
}
