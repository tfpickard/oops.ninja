import { headers } from 'next/headers';

export function getUserContext() {
  const h = headers();
  const bearer = h.get('authorization');
  const explicit = h.get('x-demo-user');
  if (explicit) return { userId: explicit, authType: 'header' };
  if (bearer?.startsWith('Bearer ')) return { userId: 'api-user', authType: 'bearer' };
  const apiKey = h.get('x-api-key');
  if (apiKey?.startsWith('onk_')) return { userId: 'api-key-user', authType: 'api-key' };
  return { userId: 'alpha-user', authType: 'anonymous' };
}
