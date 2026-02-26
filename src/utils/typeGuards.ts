// Type guards for table render functions

export function asNumber(value: string | number | boolean | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function asString(value: string | number | boolean | undefined): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

export function formatCost(value: string | number | boolean | undefined): string {
  const num = asNumber(value);
  return `$${num.toFixed(2)}`;
}

export function formatTokens(value: string | number | boolean | undefined): string {
  const num = asNumber(value);
  return num.toLocaleString();
}

export function formatEfficiency(value: string | number | boolean | undefined): string {
  const num = asNumber(value);
  return `$${num.toFixed(3)}`;
}
