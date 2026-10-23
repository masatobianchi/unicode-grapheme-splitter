import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitGraphemes, countGraphemes, stringToCodePoints, isBoundary } from '../src/index.js';

// --- ASCII basics ---

test('empty string yields zero clusters and zero count', () => {
  assert.deepEqual(splitGraphemes(''), []);
  assert.equal(countGraphemes(''), 0);
});

test('plain ASCII splits one cluster per character', () => {
  assert.deepEqual(splitGraphemes('hello'), ['h', 'e', 'l', 'l', 'o']);
  assert.equal(countGraphemes('hello'), 5);
});

test('space and punctuation are each their own cluster', () => {
  assert.deepEqual(splitGraphemes('a b!'), ['a', ' ', 'b', '!']);
});

// --- Combining marks ---

test('base letter with combining acute forms one cluster', () => {
  // U+0061 LATIN SMALL LETTER A + U+0301 COMBINING ACUTE
  const s = 'a\u0301';
  assert.deepEqual(splitGraphemes(s), [s]);
  assert.equal(countGraphemes(s), 1);
});

test('multiple combining marks stay attached to the base', () => {
  // a + acute + diaeresis below + cedilla
  const s = 'a\u0301\u0323\u0327';
  assert.deepEqual(splitGraphemes(s), [s]);
});

test('two bases each with one combiner split into two clusters', () => {
  const a = 'a\u0301';
  const e = 'e\u0301';
  assert.deepEqual(splitGraphemes(a + e), [a, e]);
});

test('combining mark at string start still forms a cluster', () => {
  const s = '\u0301';
  assert.deepEqual(splitGraphemes(s), [s]);
});

// --- Surrogate pairs ---

test('astral character (emoji) is one cluster', () => {
  // U+1F600 GRINNING FACE is encoded as a surrogate pair in JS.
  const s = '\ud83d\ude00';
  assert.deepEqual(splitGraphemes(s), [s]);
  assert.equal(countGraphemes(s), 1);
});

test('astral character plus combining mark stays one cluster', () => {
  // U+1F600 + U+FE0F emoji variation selector
  const s = '\ud83d\ude00\ufe0f';
  assert.deepEqual(splitGraphemes(s), [s]);
});

test('lone high surrogate is treated as a single unit', () => {
  // Not a valid Unicode scalar, but JS strings allow it.
  const s = '\ud800x';
  assert.deepEqual(splitGraphemes(s), ['\ud800', 'x']);
});

test('multiple distinct astral emoji split correctly', () => {
  const a = '\ud83d\ude00'; // 😀
  const b = '\ud83d\ude01'; // 😁
  assert.deepEqual(splitGraphemes(a + b), [a, b]);
  assert.equal(countGraphemes(a + b), 2);
});

// --- ZWJ sequences ---

test('ZWJ binds two emoji into one cluster', () => {
  // U+1F468 MAN + ZWJ + U+1F468 MAN
  const man = '\ud83d\udc68';
  const zwj = '\u200d';
  const s = man + zwj + man;
  assert.deepEqual(splitGraphemes(s), [s]);
  assert.equal(countGraphemes(s), 1);
});

test('ZWJ binds a base letter with a combiner sequence', () => {
  // a + ZWJ + combining mark
  const s = 'a\u200d\u0301';
  assert.deepEqual(splitGraphemes(s), [s]);
});

// --- CRLF ---

test('CR followed by LF is one cluster', () => {
  assert.deepEqual(splitGraphemes('\r\n'), ['\r\n']);
  assert.equal(countGraphemes('\r\n'), 1);
});

test('CR not followed by LF is its own cluster', () => {
  assert.deepEqual(splitGraphemes('\rx'), ['\r', 'x']);
});

test('LF is its own cluster', () => {
  assert.deepEqual(splitGraphemes('a\nb'), ['a', '\n', 'b']);
});

// --- Hangul ---

test('Hangul L + V syllable composes into one cluster', () => {
  // U+1100 ᄀ + U+1161 ᅡ -> 가
  const s = '\u1100\u1161';
  assert.deepEqual(splitGraphemes(s), [s]);
});

test('Hangul L + V + T syllable composes into one cluster', () => {
  // U+1100 + U+1161 + U+11A8 -> 각
  const s = '\u1100\u1161\u11a8';
  assert.deepEqual(splitGraphemes(s), [s]);
});

test('two precomposed Hangul syllables split into two clusters', () => {
  const ga = '\uac00';
  const gag = '\uac01';
  assert.deepEqual(splitGraphemes(ga + gag), [ga, gag]);
});

// --- Mixed real-world text ---

test('mixed Latin, combining, and astral emoji split correctly', () => {
  const emoji = '\ud83d\ude00'; // 😀
  const s = 'cafe\u0301 ' + emoji;
  assert.deepEqual(splitGraphemes(s), ['c', 'a', 'f', 'e\u0301', ' ', emoji]);
});

// --- Type safety ---

test('splitGraphemes throws on non-string input', () => {
  assert.throws(() => splitGraphemes(42), TypeError);
  assert.throws(() => splitGraphemes(null), TypeError);
});

test('countGraphemes throws on non-string input', () => {
  assert.throws(() => countGraphemes(undefined), TypeError);
});

// --- Internals ---

test('stringToCodePoints decodes surrogate pairs', () => {
  assert.deepEqual(stringToCodePoints('A\ud83d\ude00B'), [0x41, 0x1f600, 0x42]);
});

test('stringToCodePoints preserves lone surrogates', () => {
  assert.deepEqual(stringToCodePoints('\ud800'), [0xd800]);
});

test('isBoundary returns false for CR-LF', () => {
  assert.equal(isBoundary(0x000d, 0x000a), false);
});

test('isBoundary returns true between ASCII letters', () => {
  assert.equal(isBoundary(0x0061, 0x0062), true);
});

test('isBoundary returns false before a combining mark', () => {
  assert.equal(isBoundary(0x0061, 0x0301), false);
});
