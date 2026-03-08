import Image from 'next/image';
import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';

export default function HomePage() {
  return (
    <SiteShell
      current="home"
      eyebrow="Calibrated narrative control"
      title="Write the version of events you actually want to send."
      description="A premium utility for shaping incident language across executive, internal, and public contexts without dropping into raw prompt engineering."
      actions={
        <>
          <Link className="button-link" href="/dashboard">
            Open the studio
          </Link>
          <Link className="button-link button-link--ghost" href="/docs">
            Review the platform
          </Link>
        </>
      }
      aside={
        <div className="shell-preview shell-preview--hero">
          <div className="shell-preview__art" aria-hidden="true">
            <Image
              src="/generated/home-signal-field.svg"
              alt=""
              width={960}
              height={720}
              className="shell-preview__art-image"
            />
          </div>
          <div className="shell-preview__screen">
            <div className="shell-preview__signal" aria-hidden="true" />
            <p className="eyebrow">Product posture</p>
            <h2>Premium utility, not dashboard clutter.</h2>
            <p>
              Quiet surfaces, clear hierarchy, and just enough motion to make the console feel alive without
              pulling attention away from the work.
            </p>
          </div>
          <div className="shell-preview__stack">
            <div className="shell-preview__tile">
              <span>Studio</span>
              <strong>Composed outputs</strong>
            </div>
            <div className="shell-preview__tile">
              <span>Diagnostics</span>
              <strong>Inline JSON</strong>
            </div>
            <div className="shell-preview__tile">
              <span>Platform</span>
              <strong>Typed, policy-aware</strong>
            </div>
          </div>
        </div>
      }
    >
      <div className="panel-grid panel-grid--feature">
        <section className="card feature-card">
          <span className="feature-card__mark" aria-hidden="true">
            <Image src="/brand/site-mark.svg" alt="" width={22} height={22} />
          </span>
          <p className="eyebrow">Studio</p>
          <h2>Incident response language engine</h2>
          <p>Compose deliberate responses, compare structured variants, and ship copy that sounds prepared.</p>
          <Link className="button-inline" href="/dashboard">
            Open narrative studio
          </Link>
        </section>
        <section className="card feature-card">
          <span className="feature-card__mark" aria-hidden="true">
            <Image src="/brand/site-mark.svg" alt="" width={22} height={22} />
          </span>
          <p className="eyebrow">Platform</p>
          <h2>Contracts, docs, and SDK surfaces</h2>
          <p>Reference the API, inspect the OpenAPI contract, and scaffold integrations without leaving the shell.</p>
          <div className="feature-card__links">
            <Link className="button-inline" href="/docs">
              Open docs
            </Link>
            <Link className="button-inline" href="/sdk">
              Review SDK
            </Link>
          </div>
        </section>
        <section className="card feature-card">
          <span className="feature-card__mark" aria-hidden="true">
            <Image src="/brand/site-mark.svg" alt="" width={22} height={22} />
          </span>
          <p className="eyebrow">Governance</p>
          <h2>Operational oversight without visual noise</h2>
          <p>Keep moderation posture, usage, and access controls available, but out of the main composition flow.</p>
          <Link className="button-inline" href="/admin">
            Open admin
          </Link>
        </section>
      </div>
    </SiteShell>
  );
}
