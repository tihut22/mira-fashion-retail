/**
 * Recursively removes any `undefined` or `null` properties from objects and arrays before writing to Firestore.
 * Firestore strictly forbids `undefined` field values and throws:
 * "Unsupported field value: undefined"
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }

  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = sanitizeForFirestore(value);
      } else {
        console.warn(`Sanitizer: Stripping key '${key}' because value is ${value}`);
      }
    }
    return cleaned as T;
  }

  return data;
}
