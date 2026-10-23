import { stringToCodePoints, isBoundary } from './core.js';

/**
 * Split a string into an array of extended grapheme clusters.
 *
 * Each returned element is a complete grapheme cluster as a substring,
 * preserving the original UTF-16 encoding (including surrogate pairs).
 *
 * The algorithm walks the code point sequence and applies UAX #29 GB rules
 * to find cluster boundaries, then maps back to the original string indices.
 */
export function splitGraphemes(str) {
  if (typeof str !== 'string') {
    throw new TypeError('splitGraphemes expects a string');
  }
  if (str.length === 0) return [];

  // Track original string indices alongside code points so we can slice
  // the original string and preserve surrogate pair encoding.
  const cpInfo = []; // { cp, start, end }
  for (let i = 0; i < str.length; ) {
    const a = str.charCodeAt(i);
    if (a >= 0xd800 && a <= 0xdbff && i + 1 < str.length) {
      const b = str.charCodeAt(i + 1);
      if (b >= 0xdc00 && b <= 0xdfff) {
        const cp = 0x10000 + ((a - 0xd800) << 10) + (b - 0xdc00);
        cpInfo.push({ cp, start: i, end: i + 2 });
        i += 2;
        continue;
      }
    }
    cpInfo.push({ cp: a, start: i, end: i + 1 });
    i += 1;
  }

  const clusters = [];
  let clusterStart = cpInfo.length > 0 ? cpInfo[0].start : 0;

  for (let i = 1; i < cpInfo.length; i++) {
    const prev = cpInfo[i - 1].cp;
    const next = cpInfo[i].cp;
    if (isBoundary(prev, next)) {
      // Close the current cluster at this boundary.
      const clusterEnd = cpInfo[i - 1].end;
      clusters.push(str.slice(clusterStart, clusterEnd));
      clusterStart = cpInfo[i].start;
    }
  }

  // Flush the final cluster.
  if (cpInfo.length > 0) {
    const lastEnd = cpInfo[cpInfo.length - 1].end;
    clusters.push(str.slice(clusterStart, lastEnd));
  }

  return clusters;
}

/**
 * Count the number of grapheme clusters in a string.
 * Equivalent to splitGraphemes(str).length but avoids building the array
 * of substrings, which is cheaper for large inputs.
 */
export function countGraphemes(str) {
  if (typeof str !== 'string') {
    throw new TypeError('countGraphemes expects a string');
  }
  if (str.length === 0) return 0;

  const cps = stringToCodePoints(str);
  let count = 1;
  for (let i = 1; i < cps.length; i++) {
    if (isBoundary(cps[i - 1], cps[i])) {
      count++;
    }
  }
  return count;
}

// Re-export core utilities for direct testing and advanced use.
export { stringToCodePoints, isBoundary } from './core.js';
