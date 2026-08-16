export function normalizeComplaintId(value: unknown): string | null {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value > 0 ? String(value) : null;
  }

  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return null;
  }

  try {
    const normalized = BigInt(value);
    return normalized > 0n ? normalized.toString() : null;
  } catch {
    return null;
  }
}

export function requireComplaintId(value: unknown): string {
  const complaintId = normalizeComplaintId(value);
  if (!complaintId) {
    throw new Error('Invalid complaint identifier.');
  }

  return complaintId;
}
