# unicode-grapheme-splitter

Splits JavaScript strings into extended grapheme clusters, handling combining marks, surrogate pairs, ZWJ sequences, Hangul composition, and CRLF.

## Usage

```js
import { splitGraphemes, countGraphemes } from 'unicode-grapheme-splitter';

const clusters = splitGraphemes('café\ud83d\ude00');
// ['caf', 'é', '😀']  (assuming a precomposed é; with a combining mark it stays one cluster)

const n = countGraphemes('a\u0301b'); // 2 — 'a' + combining acute, then 'b'
```

Exports:
- `splitGraphemes(str)` — returns `string[]`, one entry per grapheme cluster.
- `countGraphemes(str)` — returns `number`, the cluster count without allocating substrings.
- `stringToCodePoints(str)` — decodes UTF-16 into an array of Unicode code points.
- `isBoundary(prev, next)` — low-level predicate; `true` if a grapheme boundary exists between two code points.

## Why

JavaScript's `String.prototype.split('')` splits on UTF-16 code units, which breaks emoji, astral characters, and accented letters built with combining marks. This library provides a small, dependency-free implementation of UAX #29 extended grapheme cluster boundaries.

The trade-off: we use general-category-based rules for combining marks and Hangul composition, plus ZWJ handling, rather than carrying the full Unicode emoji property tables. This covers essentially all real-world text — Latin diacritics, Devanagari, Hangul, common emoji — but will not correctly split certain rare emoji ZWJ ligatures that depend on specific `Extended_Pictographic` properties. That decision keeps the library small, self-contained, and deterministic.

## Edge cases

- Lone surrogates (e.g., a stray `\ud800`) are passed through as single units rather than rejected. JavaScript strings can hold them, and this library treats them as opaque.
- A leading combining mark (no base before it) forms a single cluster of its own, mirroring what most rendering engines do.
- CR-LF (`\r\n`) is one cluster per UAX #29 GB3.
