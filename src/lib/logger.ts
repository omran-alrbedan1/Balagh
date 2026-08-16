import { captureException } from '@/lib/sentry';

export function logError(error: unknown, scope?: string) {
  // This stays intentionally narrow: route boundaries call it only after a real failure.
  console.error(scope ? `[${scope}]` : '[AppError]', error);
  captureException(error);
}
