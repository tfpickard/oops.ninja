const restrictedTerms = [
  'fraud', 'impersonation', 'fake alibi', 'defamation', 'blackmail', 'extortion',
  'phishing', 'fabricate evidence', 'evade law enforcement', 'lie in court',
];

export function moderateScenario(input: string): { allowed: boolean; reason?: string } {
  const lower = input.toLowerCase();
  const hit = restrictedTerms.find((term) => lower.includes(term));
  if (hit) {
    return {
      allowed: false,
      reason: 'This scenario exceeds supported narrative categories. Accountability-forward or neutral incident workflows are available.',
    };
  }
  return { allowed: true };
}
