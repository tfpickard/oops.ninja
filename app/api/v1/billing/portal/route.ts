import crypto from 'crypto';
import { ok } from '@/lib/http';
import { getUserContext } from '@/lib/auth';
import { getBillingSnapshot } from '@/lib/store';

export async function GET() {
  const user = getUserContext();
  const billing = getBillingSnapshot(user.userId);
  return ok({
    billing,
    portal: {
      status: 'available',
      checkoutUrl: '/settings/billing?mode=checkout',
      customerPortalUrl: '/settings/billing?mode=portal',
    },
  }, crypto.randomUUID());
}
