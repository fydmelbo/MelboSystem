import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from '../utils/format';

describe('formatCurrency', () => {
  it('formats a valid number as Q currency', () => {
    expect(formatCurrency(100)).toBe('Q100.00');
  });

  it('formats decimals correctly', () => {
    expect(formatCurrency(100.5)).toBe('Q100.50');
  });

  it('returns Q0.00 for null', () => {
    expect(formatCurrency(null)).toBe('Q0.00');
  });

  it('returns Q0.00 for undefined', () => {
    expect(formatCurrency(undefined)).toBe('Q0.00');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('Q0.00');
  });

  it('formats large numbers', () => {
    expect(formatCurrency(1234567.89)).toBe('Q1234567.89');
  });
});

describe('formatDate', () => {
  it('formats a valid date string in es-GT locale', () => {
    const result = formatDate('2024-01-15');
    expect(result).toMatch(/\d{2}\/01\/2024/);
  });
});
