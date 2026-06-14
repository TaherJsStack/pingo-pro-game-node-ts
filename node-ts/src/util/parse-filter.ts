export function parseFilter(filter: any): Record<string, any> {
  try {
    const parsed = typeof filter === 'string' ? JSON.parse(filter) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (key.startsWith('$')) continue;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const nested: Record<string, any> = {};
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          if (!nestedKey.startsWith('$')) nested[nestedKey] = nestedValue;
        }
        sanitized[key] = nested;
        continue;
      }
      sanitized[key] = value;
    }

    return sanitized;
  } catch {
    return {};
  }
}
