/**
 * Core grapheme segmentation logic for extended grapheme clusters.
 *
 * This implementation follows UAX #29 (Unicode Text Segmentation), Revision 41,
 * covering the boundary rules GP, GB1 through GB12, and GB999.
 *
 * We deliberately target a pragmatic, well-defined subset:
 *   - Surrogate pairs (GB2)
 *   - Combining marks and modifiers (GB6, GB7, GB8a, GB9, GB9a, GB9b)
 *   - ZWJ sequences (GB9)
 *   - CRLF (GB3)
 *
 * We do NOT attempt the full tailoring of emoji ZWJ sequences with specific
 * property tables (e.g., Emoji_Modifier vs. Extend). Instead, we use general
 * category-based rules which handle the vast majority of real-world text.
 * This is a documented trade-off: smaller, dependency-free, and deterministic,
 * at the cost of not splitting certain rare emoji ligatures.
 */

/**
 * Check if a code point is a high surrogate (D800–DBFF).
 * Required to validate surrogate pairs before combining with the low half.
 */
function isHighSurrogate(cp) {
  return cp >= 0xd800 && cp <= 0xdbff;
}

/**
 * Check if a code point is a low surrogate (DC00–DFFF).
 */
function isLowSurrogate(cp) {
  return cp >= 0xdc00 && cp <= 0xdfff;
}

/**
 * Decode a UTF-16 string into an array of Unicode code points.
 * Surrogate pairs are combined into single code points per UTF-16.
 * Lone surrogates are preserved as-is (they are valid in JS strings).
 */
export function stringToCodePoints(str) {
  const cps = [];
  for (let i = 0; i < str.length; ) {
    const a = str.charCodeAt(i);
    if (isHighSurrogate(a) && i + 1 < str.length) {
      const b = str.charCodeAt(i + 1);
      if (isLowSurrogate(b)) {
        cps.push(0x10000 + ((a - 0xd800) << 10) + (b - 0xdc00));
        i += 2;
        continue;
      }
    }
    cps.push(a);
    i += 1;
  }
  return cps;
}

/**
 * Check if a code point is a combining mark or other extending character.
 * Covers general categories Mn, Mc, Me, plus a handful of common extenders
 * from the Grapheme_Extend property that are not in those categories.
 */
function isExtend(cp) {
  if (cp < 0x300) return false;
  // Combining Diacritical Marks
  if (cp <= 0x36f) return true;
  if (cp === 0x483 || cp === 0x484 || cp === 0x485 || cp === 0x486 || cp === 0x487) return true;
  if (cp >= 0x591 && cp <= 0x5bd) return true;
  if (cp === 0x5bf) return true;
  if (cp >= 0x610 && cp <= 0x61a) return true;
  if (cp >= 0x64b && cp <= 0x65f) return true;
  if (cp === 0x670) return true;
  if (cp >= 0x6d6 && cp <= 0x6dc) return true;
  if (cp >= 0x6df && cp <= 0x6e4) return true;
  if (cp >= 0x6e7 && cp <= 0x6e8) return true;
  if (cp >= 0x6ea && cp <= 0x6ed) return true;
  if (cp >= 0x711 && cp <= 0x711) return true;
  if (cp >= 0x730 && cp <= 0x74a) return true;
  if (cp >= 0x7a6 && cp <= 0x7b0) return true;
  if (cp === 0x7eb || cp === 0x7ec || cp === 0x7ed || cp === 0x7ee || cp === 0x7ef || cp === 0x7f0 || cp === 0x7f1 || cp === 0x7f2 || cp === 0x7f3) return true;
  if (cp >= 0x816 && cp <= 0x819) return true;
  if (cp === 0x81b || cp === 0x81c || cp === 0x81d || cp === 0x81e || cp === 0x81f) return true;
  if (cp >= 0x820 && cp <= 0x82c) return true;
  if (cp >= 0x900 && cp <= 0x902) return true;
  if (cp === 0x93a) return true;
  if (cp === 0x93c) return true;
  if (cp >= 0x93e && cp <= 0x94f) return true;
  if (cp >= 0x951 && cp <= 0x957) return true;
  if (cp === 0x962 || cp === 0x963) return true;
  // Virama / sign groups for other Indic scripts
  if (cp >= 0x981 && cp <= 0x983) return true;
  if (cp === 0x9bc) return true;
  if (cp === 0x9be) return true;
  if (cp === 0x9bf) return true;
  if (cp >= 0x9c0 && cp <= 0x9c4) return true;
  if (cp >= 0x9c7 && cp <= 0x9c8) return true;
  if (cp >= 0x9cb && cp <= 0x9cd) return true;
  if (cp === 0x9d7) return true;
  if (cp >= 0x9e2 && cp <= 0x9e3) return true;
  // Common combining ranges
  if (cp >= 0xa01 && cp <= 0xa03) return true;
  if (cp === 0xa3c) return true;
  if (cp >= 0xa3e && cp <= 0xa42) return true;
  if (cp >= 0xa47 && cp <= 0xa48) return true;
  if (cp >= 0xa4b && cp <= 0xa4d) return true;
  if (cp === 0xa51) return true;
  if (cp >= 0xa70 && cp <= 0xa73) return true;
  if (cp >= 0xa75 && cp <= 0xa75) return true;
  if (cp >= 0xa81 && cp <= 0xa83) return true;
  if (cp === 0xabc) return true;
  if (cp >= 0xabe && cp <= 0xacd) return true;
  if (cp >= 0xae2 && cp <= 0xae3) return true;
  if (cp >= 0xb01 && cp <= 0xb03) return true;
  if (cp === 0xb3c) return true;
  if (cp >= 0xb3e && cp <= 0xb44) return true;
  if (cp >= 0xb47 && cp <= 0xb48) return true;
  if (cp >= 0xb4b && cp <= 0xb4d) return true;
  if (cp === 0xb56 || cp === 0xb57) return true;
  if (cp >= 0xb82 && cp <= 0xb82) return true;
  if (cp === 0xbbe || cp === 0xbbf) return true;
  if (cp >= 0xbc0 && cp <= 0xbc2) return true;
  if (cp >= 0xbc6 && cp <= 0xbc8) return true;
  if (cp >= 0xbca && cp <= 0xbcd) return true;
  if (cp === 0xbd7) return true;
  // Combining Half Marks and beyond
  if (cp >= 0xfe00 && cp <= 0xfe0f) return true;
  if (cp >= 0xfe20 && cp <= 0xfe2f) return true;
  // Variation selectors supplement
  if (cp >= 0xe0100 && cp <= 0xe01ef) return true;
  return false;
}

/**
 * Check if a code point is aprepend character (GB9b).
 * These attach to the following base, e.g., Devanagari consonant medials.
 */
function isPrepend(cp) {
  // A small but representative set from the Prepend property.
  if (cp >= 0x0600 && cp <= 0x0605) return true;
  if (cp === 0x06dd || cp === 0x070f) return true;
  if (cp >= 0x0890 && cp <= 0x0891) return true;
  if (cp >= 0x0898 && cp <= 0x089f) return true;
  if (cp === 0x110bd || cp === 0x110cd) return true;
  return false;
}

/**
 * Check if a code point is the Zero Width Joiner (U+200D).
 * Used in GB8a/GB9: a ZWJ always binds to the preceding grapheme,
 * and if followed by an emoji, forms a ZWJ sequence.
 */
function isZWJ(cp) {
  return cp === 0x200d;
}

/**
 * Check if a code point is an extended pictographic character.
 * This covers the common emoji ranges used in ZWJ sequences.
 */
function isExtendedPictographic(cp) {
  if (cp >= 0x1f300 && cp <= 0x1f5ff) return true;
  if (cp >= 0x1f600 && cp <= 0x1f64f) return true;
  if (cp >= 0x1f680 && cp <= 0x1f6ff) return true;
  if (cp >= 0x1f900 && cp <= 0x1f9ff) return true;
  if (cp >= 0x1fa70 && cp <= 0x1faff) return true;
  if (cp >= 0x2600 && cp <= 0x26ff) return true;
  if (cp >= 0x2700 && cp <= 0x27bf) return true;
  return false;
}

/**
 * Check if a code point is a spacing mark (GB9a, general category Mc).
 * These attach to the preceding base rather than starting a new cluster.
 */
function isSpacingMark(cp) {
  // A subset of Mc; we focus on the highest-frequency ranges.
  if (cp >= 0x903 && cp <= 0x903) return true;
  if (cp >= 0x93b && cp <= 0x93b) return true;
  if (cp >= 0x93e && cp <= 0x940) return true;
  if (cp >= 0x949 && cp <= 0x94c) return true;
  if (cp === 0x954 || cp === 0x955) return true;
  if (cp >= 0x963 && cp <= 0x963) return true;
  if (cp >= 0x982 && cp <= 0x983) return true;
  if (cp >= 0x9be && cp <= 0x9c0) return true;
  if (cp >= 0x9c7 && cp <= 0x9c8) return true;
  if (cp >= 0x9cb && cp <= 0x9cc) return true;
  if (cp === 0x9d7) return true;
  if (cp >= 0xa03 && cp <= 0xa03) return true;
  if (cp >= 0xa3e && cp <= 0xa40) return true;
  if (cp >= 0xa83 && cp <= 0xa83) return true;
  if (cp >= 0xabe && cp <= 0xac0) return true;
  if (cp >= 0xac9 && cp <= 0xac9) return true;
  if (cp >= 0xacb && cp <= 0xacc) return true;
  if (cp >= 0xb02 && cp <= 0xb03) return true;
  if (cp >= 0xb3e && cp <= 0xb40) return true;
  if (cp >= 0xb47 && cp <= 0xb48) return true;
  if (cp >= 0xb4b && cp <= 0xb4c) return true;
  if (cp === 0xb57) return true;
  if (cp >= 0xbbe && cp <= 0xbbf) return true;
  if (cp >= 0xbc1 && cp <= 0xbc2) return true;
  if (cp >= 0xbc6 && cp <= 0xbc8) return true;
  if (cp >= 0xbca && cp <= 0xbcc) return true;
  if (cp === 0xbd7) return true;
  return false;
}

/**
 * Determine whether a grapheme boundary exists BETWEEN two code points
 * (i.e., after `prev` and before `next`), per UAX #29 GB rules.
 */
export function isBoundary(prev, next) {
  // GB3: CR × LF — no boundary between CR and LF
  if (prev === 0x000d && next === 0x000a) return false;
  // GB4: (Control | CR | LF) ÷ — boundary after a control/CR/LF
  if (prev === 0x000d || prev === 0x000a) return true;
  if (isControl(prev)) return true;
  // GB5: ÷ (Control | CR | LF) — boundary before a control/CR/LF
  if (next === 0x000d || next === 0x000a) return true;
  if (isControl(next)) return true;
  // GB6: Hangul L × (L | V | LV | LVT)
  if (isHangulL(prev) && (isHangulL(next) || isHangulV(next) || isHangulLV(next) || isHangulLVT(next))) return false;
  // GB7: Hangul (LV | V) × V
  if ((isHangulLV(prev) || isHangulV(prev)) && isHangulV(next)) return false;
  // GB8: Hangul (LV | V | LVT) × T
  if ((isHangulLV(prev) || isHangulV(prev) || isHangulLVT(prev)) && isHangulT(next)) return false;
  // GB8a: Hangul T × T
  if (isHangulT(prev) && isHangulT(next)) return false;
  // GB9: × ZWJ
  if (isZWJ(next)) return false;
  // GB9: ZWJ × Extended_Pictographic
  if (isZWJ(prev) && isExtendedPictographic(next)) return false;
  // GB9a: × Extend
  if (isExtend(next)) return false;
  // GB9a: × SpacingMark
  if (isSpacingMark(next)) return false;
  // GB9b: Prepend ×
  if (isPrepend(prev)) return false;
  // GB999: ÷ — otherwise, boundary
  return true;
}

function isControl(cp) {
  // C0 controls (except CR/LF which are handled separately), C1, and explicit format chars.
  if (cp <= 0x001f || (cp >= 0x007f && cp <= 0x009f)) return true;
  return false;
}

// Hangul syllable type checks based on code point ranges.
function isHangulL(cp) {
  return cp >= 0x1100 && cp <= 0x115f;
}
function isHangulV(cp) {
  return cp >= 0x1160 && cp <= 0x11a7;
}
function isHangulT(cp) {
  return cp >= 0x11a8 && cp <= 0x11ff;
}
function isHangulLV(cp) {
  // Precomposed Hangul syllables LV (every 28th, starting at AC00)
  if (cp < 0xac00 || cp > 0xd7a3) return false;
  return (cp - 0xac00) % 28 === 0;
}
function isHangulLVT(cp) {
  if (cp < 0xac00 || cp > 0xd7a3) return false;
  return (cp - 0xac00) % 28 !== 0;
}
