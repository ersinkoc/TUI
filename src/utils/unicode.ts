/**
 * @oxog/tui - Unicode Width Handling
 * @packageDocumentation
 */

// ============================================================
// Character Width Detection
// ============================================================

/**
 * East Asian Width ranges for double-width characters.
 * Based on Unicode Standard Annex #11.
 */
const WIDE_RANGES: [number, number][] = [
  [0x1100, 0x115f], // Hangul Jamo
  [0x231a, 0x231b], // Watch, Hourglass
  [0x2329, 0x232a], // Angle brackets
  [0x23e9, 0x23f3], // Various symbols
  [0x23f8, 0x23fa], // Various symbols
  [0x25fd, 0x25fe], // Medium squares
  [0x2614, 0x2615], // Umbrella, Hot beverage
  [0x2648, 0x2653], // Zodiac
  [0x267f, 0x267f], // Wheelchair
  [0x2693, 0x2693], // Anchor
  [0x26a1, 0x26a1], // High voltage
  [0x26aa, 0x26ab], // Circles
  [0x26bd, 0x26be], // Soccer, Baseball
  [0x26c4, 0x26c5], // Snowman, Sun
  [0x26ce, 0x26ce], // Ophiuchus
  [0x26d4, 0x26d4], // No entry
  [0x26ea, 0x26ea], // Church
  [0x26f2, 0x26f3], // Fountain, Golf
  [0x26f5, 0x26f5], // Sailboat
  [0x26fa, 0x26fa], // Tent
  [0x26fd, 0x26fd], // Fuel pump
  [0x2702, 0x2702], // Scissors
  [0x2705, 0x2705], // Check mark
  [0x2708, 0x270d], // Various symbols
  [0x270f, 0x270f], // Pencil
  [0x2712, 0x2712], // Black nib
  [0x2714, 0x2714], // Check mark
  [0x2716, 0x2716], // X mark
  [0x271d, 0x271d], // Latin cross
  [0x2721, 0x2721], // Star of David
  [0x2728, 0x2728], // Sparkles
  [0x2733, 0x2734], // Eight spoked asterisk
  [0x2744, 0x2744], // Snowflake
  [0x2747, 0x2747], // Sparkle
  [0x274c, 0x274c], // Cross mark
  [0x274e, 0x274e], // Cross mark
  [0x2753, 0x2755], // Question marks
  [0x2757, 0x2757], // Exclamation mark
  [0x2763, 0x2764], // Heart exclamation
  [0x2795, 0x2797], // Math symbols
  [0x27a1, 0x27a1], // Right arrow
  [0x27b0, 0x27b0], // Curly loop
  [0x27bf, 0x27bf], // Double curly loop
  [0x2934, 0x2935], // Arrows
  [0x2b05, 0x2b07], // Arrows
  [0x2b1b, 0x2b1c], // Squares
  [0x2b50, 0x2b50], // Star
  [0x2b55, 0x2b55], // Circle
  [0x2e80, 0x2e99], // CJK Radicals
  [0x2e9b, 0x2ef3], // CJK Radicals
  [0x2f00, 0x2fd5], // Kangxi Radicals
  [0x2ff0, 0x2ffb], // Ideographic Description
  [0x3000, 0x303e], // CJK Symbols
  [0x3041, 0x3096], // Hiragana
  [0x3099, 0x30ff], // Katakana
  [0x3105, 0x312f], // Bopomofo
  [0x3131, 0x318e], // Hangul Compatibility Jamo
  [0x3190, 0x31e3], // Kanbun, CJK Strokes
  [0x31f0, 0x321e], // Katakana Extensions
  [0x3220, 0x3247], // Enclosed CJK
  [0x3250, 0x4dbf], // CJK Extension A
  [0x4e00, 0x9fff], // CJK Unified Ideographs
  [0xa000, 0xa48c], // Yi Syllables
  [0xa490, 0xa4c6], // Yi Radicals
  [0xa960, 0xa97c], // Hangul Jamo Extended-A
  [0xac00, 0xd7a3], // Hangul Syllables
  [0xf900, 0xfaff], // CJK Compatibility Ideographs
  [0xfe10, 0xfe19], // Vertical Forms
  [0xfe30, 0xfe6b], // CJK Compatibility Forms
  [0xff00, 0xff60], // Fullwidth Forms
  [0xffe0, 0xffe6], // Fullwidth Forms
  [0x1b000, 0x1b0ff], // Kana Supplement
  [0x1f004, 0x1f004], // Mahjong
  [0x1f0cf, 0x1f0cf], // Playing card
  [0x1f18e, 0x1f18e], // AB button
  [0x1f191, 0x1f19a], // Squared letters
  [0x1f200, 0x1f202], // Squared CJK
  [0x1f210, 0x1f23b], // Squared CJK
  [0x1f240, 0x1f248], // Tortoise shell
  [0x1f250, 0x1f251], // Circled ideograph
  [0x1f260, 0x1f265], // Rounded symbols
  [0x1f300, 0x1f64f], // Misc Symbols and Pictographs, Emoticons
  [0x1f680, 0x1f6ff], // Transport and Map Symbols
  [0x1f700, 0x1f77f], // Alchemical Symbols
  [0x1f780, 0x1f7ff], // Geometric Shapes Extended
  [0x1f800, 0x1f8ff], // Supplemental Arrows-C
  [0x1f900, 0x1f9ff], // Supplemental Symbols and Pictographs
  [0x1fa00, 0x1fa6f], // Chess Symbols
  [0x1fa70, 0x1faff], // Symbols and Pictographs Extended-A
  [0x20000, 0x2fffd], // CJK Extension B, C, D, E, F
  [0x30000, 0x3fffd] // CJK Extension G
]

/**
 * Check if a code point is in wide character ranges.
 *
 * @param code - Unicode code point
 * @returns True if wide character
 */
function isWideCodePoint(code: number): boolean {
  // Binary search for efficiency
  let low = 0
  let high = WIDE_RANGES.length - 1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const range = WIDE_RANGES[mid]!

    if (code < range[0]) {
      high = mid - 1
    } else if (code > range[1]) {
      low = mid + 1
    } else {
      return true
    }
  }

  return false
}

/**
 * Get display width of a single character.
 *
 * @param char - Single character
 * @returns Display width (0, 1, or 2)
 *
 * @example
 * ```typescript
 * getCharWidth('a')  // 1
 * getCharWidth('漢') // 2
 * getCharWidth('\t') // 0
 * ```
 */
export function getCharWidth(char: string): number {
  const code = char.codePointAt(0)
  if (code === undefined) {
    return 0
  }

  // Control characters have no width
  if (code < 32 || (code >= 0x7f && code < 0xa0)) {
    return 0
  }

  // ASCII printable characters
  if (code < 127) {
    return 1
  }

  // Combining characters (zero width)
  if (
    (code >= 0x0300 && code <= 0x036f) || // Combining Diacritical Marks
    (code >= 0x1ab0 && code <= 0x1aff) || // Combining Diacritical Marks Extended
    (code >= 0x1dc0 && code <= 0x1dff) || // Combining Diacritical Marks Supplement
    (code >= 0x20d0 && code <= 0x20ff) || // Combining Diacritical Marks for Symbols
    (code >= 0xfe20 && code <= 0xfe2f) // Combining Half Marks
  ) {
    return 0
  }

  // Check wide character ranges
  if (isWideCodePoint(code)) {
    return 2
  }

  return 1
}

/**
 * Get display width of a string.
 *
 * @param str - Input string
 * @returns Total display width
 *
 * @example
 * ```typescript
 * stringWidth('hello')  // 5
 * stringWidth('漢字')   // 4
 * stringWidth('a漢b')   // 4
 * ```
 */
export function stringWidth(str: string): number {
  let width = 0

  // Use Array.from to handle surrogate pairs correctly
  for (const char of str) {
    width += getCharWidth(char)
  }

  return width
}

/**
 * Truncate string to fit within display width.
 *
 * @param str - Input string
 * @param maxWidth - Maximum display width
 * @param ellipsis - Ellipsis string to append (default: '')
 * @returns Truncated string
 *
 * @example
 * ```typescript
 * truncateToWidth('hello world', 8)      // 'hello wo'
 * truncateToWidth('hello world', 8, '…') // 'hello w…'
 * truncateToWidth('漢字テスト', 6)       // '漢字テ'
 * ```
 */
export function truncateToWidth(str: string, maxWidth: number, ellipsis: string = ''): string {
  const ellipsisWidth = stringWidth(ellipsis)
  const targetWidth = maxWidth - ellipsisWidth

  if (targetWidth <= 0) {
    return ellipsis.slice(0, maxWidth)
  }

  let width = 0
  let result = ''

  for (const char of str) {
    const charWidth = getCharWidth(char)

    if (width + charWidth > targetWidth) {
      return result + ellipsis
    }

    width += charWidth
    result += char
  }

  return result
}

/**
 * Pad string to exact display width.
 *
 * @param str - Input string
 * @param width - Target display width
 * @param align - Alignment ('left', 'center', 'right')
 * @param char - Padding character (default: ' ')
 * @returns Padded string
 *
 * @example
 * ```typescript
 * padToWidth('hi', 5, 'left')   // 'hi   '
 * padToWidth('hi', 5, 'right')  // '   hi'
 * padToWidth('hi', 5, 'center') // ' hi  '
 * padToWidth('漢', 4, 'left')   // '漢  '
 * ```
 */
export function padToWidth(
  str: string,
  width: number,
  align: 'left' | 'center' | 'right' = 'left',
  char: string = ' '
): string {
  const currentWidth = stringWidth(str)

  if (currentWidth >= width) {
    return truncateToWidth(str, width)
  }

  const padding = width - currentWidth
  /* c8 ignore next */
  const padChar = char[0] || ' '

  switch (align) {
    case 'left':
      return str + padChar.repeat(padding)
    case 'right':
      return padChar.repeat(padding) + str
    case 'center': {
      const left = Math.floor(padding / 2)
      const right = padding - left
      return padChar.repeat(left) + str + padChar.repeat(right)
    }
  }
}

/**
 * Wrap text to fit within display width.
 *
 * @param str - Input string
 * @param width - Maximum display width per line
 * @returns Array of wrapped lines
 *
 * @example
 * ```typescript
 * wrapText('hello world', 6)
 * // ['hello', 'world']
 * ```
 */
export function wrapText(str: string, width: number): string[] {
  if (width <= 0) {
    return []
  }

  const lines: string[] = []
  const inputLines = str.split('\n')

  for (const line of inputLines) {
    if (stringWidth(line) <= width) {
      lines.push(line)
      continue
    }

    // Word wrap
    const words = line.split(/\s+/)
    let currentLine = ''
    let currentWidth = 0

    for (const word of words) {
      const wordWidth = stringWidth(word)

      if (currentWidth === 0) {
        // First word on line
        if (wordWidth > width) {
          // Word too long, force break
          let remaining = word
          while (stringWidth(remaining) > width) {
            const truncated = truncateToWidth(remaining, width)
            lines.push(truncated)
            remaining = remaining.slice(truncated.length)
          }
          if (remaining) {
            currentLine = remaining
            currentWidth = stringWidth(remaining)
          }
        } else {
          currentLine = word
          currentWidth = wordWidth
        }
      } else if (currentWidth + 1 + wordWidth <= width) {
        // Word fits on current line
        currentLine += ' ' + word
        currentWidth += 1 + wordWidth
      } else {
        // Start new line
        lines.push(currentLine)
        currentLine = word
        currentWidth = wordWidth
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }
  }

  return lines
}

/**
 * Slice string by display width positions.
 *
 * @param str - Input string
 * @param start - Start position (display width)
 * @param end - End position (display width)
 * @returns Sliced string
 */
export function sliceByWidth(str: string, start: number, end?: number): string {
  let currentWidth = 0
  let startIndex = 0
  let endIndex = str.length

  const chars = Array.from(str)

  for (let i = 0; i < chars.length; i++) {
    const charWidth = getCharWidth(chars[i]!)

    if (currentWidth < start) {
      startIndex = i + 1
    }

    if (end !== undefined && currentWidth >= end) {
      endIndex = i
      break
    }

    currentWidth += charWidth
  }

  return chars.slice(startIndex, endIndex).join('')
}

// ============================================================
// Grapheme Cluster Support
// ============================================================

/**
 * Check if code point is a regional indicator symbol (used for flags like 🇹🇷).
 * Regional indicators are in the range U+1F1E6 to U+1F1FF.
 *
 * @param code - Unicode code point
 * @returns True if regional indicator
 */
function isRegionalIndicator(code: number): boolean {
  return code >= 0x1f1e6 && code <= 0x1f1ff
}

/**
 * Check if a string is an emoji sequence that should be treated as a single
 * double-width character.
 *
 * Detects:
 * - ZWJ (Zero Width Joiner) sequences: 👨‍👩‍👧‍👦 (family), 👩‍💻 (woman technologist)
 * - Skin tone modifiers: 👋🏽 (waving hand with skin tone)
 * - Keycap sequences: 1️⃣ (keycap digit one)
 * - Flag sequences: 🇹🇷 (flag: Turkey)
 * - Tag sequences: 🏴󠁧󠁢󠁥󠁮󠁧󠁿 (flag: England)
 *
 * @param grapheme - A single grapheme cluster
 * @returns True if this is an emoji sequence
 */
function isEmojiSequence(grapheme: string): boolean {
  if (grapheme.length === 0) return false

  // Get all code points in the grapheme
  const codePoints: number[] = []
  for (const char of grapheme) {
    const code = char.codePointAt(0)
    if (code !== undefined) {
      codePoints.push(code)
    }
  }

  if (codePoints.length === 0) return false

  // Check for ZWJ (U+200D) - Zero Width Joiner
  // Used in family emoji, profession emoji, etc.
  const ZWJ = 0x200d
  if (codePoints.includes(ZWJ)) {
    return true
  }

  // Check for skin tone modifiers (U+1F3FB to U+1F3FF)
  // Fitzpatrick skin types
  for (const code of codePoints) {
    if (code >= 0x1f3fb && code <= 0x1f3ff) {
      return true
    }
  }

  // Check for keycap sequence (digit + FE0F + 20E3)
  // e.g., 1️⃣ = 0x31 + 0xFE0F + 0x20E3
  const KEYCAP_COMBINING = 0x20e3
  if (codePoints.includes(KEYCAP_COMBINING)) {
    return true
  }

  // Check for variation selector-16 (U+FE0F) - emoji presentation
  const VS16 = 0xfe0f
  if (codePoints.includes(VS16)) {
    return true
  }

  // Check for regional indicators (flags)
  // Two regional indicator symbols form a flag
  if (codePoints.length >= 2 && isRegionalIndicator(codePoints[0]!)) {
    return true
  }

  // Check for tag sequences (subdivision flags like 🏴󠁧󠁢󠁥󠁮󠁧󠁿)
  // Tags are in range U+E0000 to U+E007F
  for (const code of codePoints) {
    if (code >= 0xe0000 && code <= 0xe007f) {
      return true
    }
  }

  // Check if it's a base emoji in the emoji ranges
  const firstCode = codePoints[0]!

  // Common emoji ranges that are typically double-width
  if (
    (firstCode >= 0x1f300 && firstCode <= 0x1f9ff) || // Misc Symbols, Emoticons, etc
    (firstCode >= 0x1fa00 && firstCode <= 0x1faff) || // Symbols Extended-A
    (firstCode >= 0x2600 && firstCode <= 0x26ff) ||   // Misc Symbols
    (firstCode >= 0x2700 && firstCode <= 0x27bf)      // Dingbats
  ) {
    return true
  }

  return false
}

/**
 * Split string into grapheme clusters using Intl.Segmenter.
 *
 * IMPORTANT: Intl.Segmenter is REQUIRED for correct Unicode handling.
 * The fallback is intentionally limited to prevent silent bugs with complex emoji.
 *
 * @param str - Input string
 * @returns Array of grapheme clusters
 * @throws Error if Intl.Segmenter is not available (Node.js 16+ required)
 *
 * @example
 * ```typescript
 * splitGraphemes('👨‍👩‍👧‍👦')  // ['👨‍👩‍👧‍👦'] (family emoji as single cluster)
 * splitGraphemes('🇹🇷')        // ['🇹🇷'] (flag as single cluster)
 * splitGraphemes('hello')      // ['h', 'e', 'l', 'l', 'o']
 * ```
 */
export function splitGraphemes(str: string): string[] {
  // Intl.Segmenter is required for correct Unicode grapheme handling
  // Node.js 16+ (released April 2021) has built-in support
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
      return Array.from(segmenter.segment(str), s => s.segment)
    } catch (error) {
      // If Intl.Segmenter exists but fails, fall through to error
      console.error('[unicode] Intl.Segmenter failed:', error)
    }
  }

  // If we reach here, Intl.Segmenter is not available - use fallback
  // This WILL PRODUCE INCORRECT RESULTS for complex emoji and combining marks
  // Examples of broken output:
  //   '👨‍👩‍👧‍👦' → ['👨', '‍', '👩', '‍', '👧', '‍', '👦'] instead of single cluster
  //   'café' with combining accent → may render incorrectly
  if (typeof Intl === 'undefined' || !('Segmenter' in Intl)) {
    console.warn(
      '\n' +
      '╔════════════════════════════════════════════════════════════════════════╗\n' +
      '║  WARNING: Intl.Segmenter not available - Unicode support degraded        ║\n' +
      '╚════════════════════════════════════════════════════════════════════════╝\n' +
      '\n' +
      'Complex emoji (family emoji, skin tone modifiers, flags) and combining\n' +
      'characters will NOT render correctly. Please upgrade to Node.js 16+.\n\n' +
      'Current Node.js version: ' + process.version + '\n' +
      'Required: Node.js >= 16.0.0\n\n'
    )
  }

  // Fallback: split by character units (code points, not UTF-16 code units)
  // This is the best we can do without Intl.Segmenter, but it's WRONG for grapheme clusters
  const chars = Array.from(str)
  return chars
}

/**
 * Get display width of a string using grapheme cluster awareness.
 * More accurate than stringWidth for emoji and complex scripts.
 *
 * Handles:
 * - ZWJ sequences (family emoji, profession emoji): width 2
 * - Skin tone modifiers: width 2
 * - Flag sequences: width 2
 * - Keycap sequences: width 2
 * - CJK characters: width 2
 * - Regular ASCII: width 1
 * - Control characters: width 0
 *
 * @param str - Input string
 * @returns Total display width
 *
 * @example
 * ```typescript
 * graphemeWidth('👨‍👩‍👧‍👦')  // 2 (family emoji takes 2 cells)
 * graphemeWidth('🇹🇷')        // 2 (flag takes 2 cells)
 * graphemeWidth('👋🏽')        // 2 (emoji with skin tone)
 * graphemeWidth('hello')      // 5
 * ```
 */
export function graphemeWidth(str: string): number {
  const graphemes = splitGraphemes(str)
  let width = 0

  for (const grapheme of graphemes) {
    // Check if it's an emoji sequence first (ZWJ, skin tones, flags, etc.)
    if (isEmojiSequence(grapheme)) {
      width += 2
      continue
    }

    // Get the base character width (first code point determines width)
    const code = grapheme.codePointAt(0) ?? 0

    // CJK and other wide characters
    if (isWideCodePoint(code) || isRegionalIndicator(code)) {
      width += 2
    } else if (code >= 32) {
      width += 1
    }
    // Control characters and combining marks add 0 width
  }

  return width
}

/**
 * Truncate string by grapheme clusters to fit within display width.
 * More accurate than truncateToWidth for emoji and complex scripts.
 *
 * Handles:
 * - ZWJ sequences (family emoji, profession emoji): width 2
 * - Skin tone modifiers: width 2
 * - Flag sequences: width 2
 * - Keycap sequences: width 2
 * - CJK characters: width 2
 *
 * @param str - Input string
 * @param maxWidth - Maximum display width
 * @param ellipsis - Ellipsis string to append (default: '')
 * @returns Truncated string
 */
export function truncateByGrapheme(str: string, maxWidth: number, ellipsis: string = ''): string {
  const ellipsisWidth = graphemeWidth(ellipsis)
  const targetWidth = maxWidth - ellipsisWidth

  if (targetWidth <= 0) {
    return ellipsis.slice(0, maxWidth)
  }

  const graphemes = splitGraphemes(str)
  let width = 0
  let result = ''

  for (const grapheme of graphemes) {
    let graphemeW: number

    // Check emoji sequences first (ZWJ, skin tones, flags, etc.)
    if (isEmojiSequence(grapheme)) {
      graphemeW = 2
    } else {
      const code = grapheme.codePointAt(0) ?? 0
      if (isWideCodePoint(code) || isRegionalIndicator(code)) {
        graphemeW = 2
      } else if (code < 32) {
        graphemeW = 0
      } else {
        graphemeW = 1
      }
    }

    if (width + graphemeW > targetWidth) {
      return result + ellipsis
    }

    width += graphemeW
    result += grapheme
  }

  return result
}
