import RAW from './cities.json';

export interface City {
  city: string;
  country: string;
  code: string;
}

export function flag(code: string): string {
  return [...code.toUpperCase()].map((c) =>
    String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0))
  ).join('');
}

const seen = new Set<string>();
export const CITIES: City[] = (RAW as City[])
  .filter((c) => {
    const key = c.city.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  })
  .sort((a, b) => a.city.localeCompare(b.city));
