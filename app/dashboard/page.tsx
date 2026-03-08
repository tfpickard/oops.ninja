import Image from 'next/image';
import Link from 'next/link';
import { GeneratorClient } from '@/components/generator-client';
import { SiteShell } from '@/components/site-shell';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <SiteShell
      current="dashboard"
      density="compact"
      eyebrow="Narrative Studio"
      title="Compose with clarity and control."
      description="Keep the primary workflow calm and obvious: define the situation, steer the posture, compare polished variants, and reveal raw JSON only when you need it."
      actions={
        <>
          <Link className="button-link" href="/docs">
            Explore the API
          </Link>
          <Link className="button-link button-link--ghost" href="/sdk">
            Review the SDK
          </Link>
        </>
      }
      aside={
        <div className="shell-preview">
          <div className="shell-preview__art" aria-hidden="true">
            <Image
              src="/generated/console-orbit.svg"
              alt=""
              width={760}
              height={560}
              className="shell-preview__art-image shell-preview__art-image--console"
            />
          </div>
          <div className="shell-preview__screen shell-preview__screen--tall">
            <div className="shell-preview__halo" aria-hidden="true" />
            <p className="eyebrow">Console direction</p>
            <h2>Sharper hierarchy. Quieter chrome. Faster decisions.</h2>
            <p>
              Compose and results own the page. Rewrite, history, billing, and workspace tools stay close,
              but out of the way.
            </p>
          </div>
          <div className="shell-preview__stack">
            <div className="shell-preview__tile">
              <span>Outputs</span>
              <strong>Selected result view</strong>
            </div>
            <div className="shell-preview__tile">
              <span>Diagnostics</span>
              <strong>Hidden request/response JSON</strong>
            </div>
          </div>
        </div>
      }
    >
      <GeneratorClient />
    </SiteShell>
  );
}
