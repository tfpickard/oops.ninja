'use client';

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <main>
      <section className="card">
        <h1>Console temporarily unavailable</h1>
        <p>The operations console encountered an unexpected failure. Please retry initialization.</p>
        <button onClick={reset}>Retry</button>
      </section>
    </main>
  );
}
