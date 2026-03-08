import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

type ShellRoute = 'home' | 'dashboard' | 'docs' | 'sdk' | 'admin';

type SiteShellProps = {
  current: ShellRoute;
  eyebrow: string;
  title: string;
  description: string;
  density?: 'default' | 'compact';
  actions?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
};

const navigation = [
  { key: 'home', href: '/', label: 'Overview' },
  { key: 'dashboard', href: '/dashboard', label: 'Studio' },
  { key: 'docs', href: '/docs', label: 'Docs' },
  { key: 'sdk', href: '/sdk', label: 'SDK' },
  { key: 'admin', href: '/admin', label: 'Admin' },
] as const satisfies Array<{ key: ShellRoute; href: string; label: string }>;

export function SiteShell({
  current,
  eyebrow,
  title,
  description,
  density = 'default',
  actions,
  aside,
  children,
}: SiteShellProps) {
  return (
    <main className={`shell${density === 'compact' ? ' shell--compact' : ''}`}>
      <div className="shell__ambient" aria-hidden="true">
        <span className="shell__ambient-orb shell__ambient-orb--one" />
        <span className="shell__ambient-orb shell__ambient-orb--two" />
        <span className="shell__ambient-grid" />
      </div>

      <header className="shell__header">
        <Link className="brand-lockup" href="/">
          <span className="site-mark" aria-hidden="true">
            <Image src="/brand/site-mark.svg" alt="" width={38} height={38} />
          </span>
          <span className="brand-lockup__copy">
            <strong>oops.ninja</strong>
            <small>Operational language for high-variance human events.</small>
          </span>
        </Link>

        <nav className="shell__nav" aria-label="Primary">
          {navigation.map((item) => (
            <Link
              key={item.key}
              className={`shell__nav-link${current === item.key ? ' shell__nav-link--active' : ''}`}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <section className={`shell__masthead${aside ? ' shell__masthead--split' : ''}`}>
        <div className="shell__intro">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="shell__description">{description}</p>
          {actions ? <div className="shell__actions">{actions}</div> : null}
        </div>
        {aside ? <div className="shell__aside">{aside}</div> : null}
      </section>

      <section className="shell__content">{children}</section>
    </main>
  );
}
