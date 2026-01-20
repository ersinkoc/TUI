/**
 * @oxog/tui - Key Parsing Utilities Tests
 */

import { describe, it, expect } from 'vitest'
import {
  createKeyParser,
  parseKeyAt,
  controlCharName,
  createMouseParser,
  matchKey,
  isPrintable,
  isNavigation,
  keyToString
} from '../../src/utils/keys'

describe('Key Parsing Utilities', () => {
  describe('createKeyParser()', () => {
    it('should create a key parser', () => {
      const parser = createKeyParser()
      expect(parser).toBeDefined()
      expect(parser.parse).toBeInstanceOf(Function)
    })

    it('should parse single character', () => {
      const parser = createKeyParser()
      const events = parser.parse(Buffer.from('a'))
      expect(events.length).toBe(1)
      expect(events[0].name).toBe('a')
    })

    it('should parse multiple characters', () => {
      const parser = createKeyParser()
      const events = parser.parse(Buffer.from('abc'))
      expect(events.length).toBe(3)
      expect(events[0].name).toBe('a')
      expect(events[1].name).toBe('b')
      expect(events[2].name).toBe('c')
    })

    it('should parse uppercase with shift', () => {
      const parser = createKeyParser()
      const events = parser.parse(Buffer.from('A'))
      expect(events[0].name).toBe('A')
      expect(events[0].shift).toBe(true)
    })

    it('should parse escape key', () => {
      const parser = createKeyParser()
      const events = parser.parse(Buffer.from('\x1b'))
      expect(events[0].name).toBe('escape')
    })

    it('should parse arrow keys', () => {
      const parser = createKeyParser()

      const up = parser.parse(Buffer.from('\x1b[A'))
      expect(up[0].name).toBe('up')

      const down = parser.parse(Buffer.from('\x1b[B'))
      expect(down[0].name).toBe('down')

      const right = parser.parse(Buffer.from('\x1b[C'))
      expect(right[0].name).toBe('right')

      const left = parser.parse(Buffer.from('\x1b[D'))
      expect(left[0].name).toBe('left')
    })

    it('should parse home/end keys', () => {
      const parser = createKeyParser()

      const home = parser.parse(Buffer.from('\x1b[H'))
      expect(home[0].name).toBe('home')

      const end = parser.parse(Buffer.from('\x1b[F'))
      expect(end[0].name).toBe('end')
    })

    it('should parse insert/delete/pageup/pagedown', () => {
      const parser = createKeyParser()

      const insert = parser.parse(Buffer.from('\x1b[2~'))
      expect(insert[0].name).toBe('insert')

      const del = parser.parse(Buffer.from('\x1b[3~'))
      expect(del[0].name).toBe('delete')

      const pageup = parser.parse(Buffer.from('\x1b[5~'))
      expect(pageup[0].name).toBe('pageup')

      const pagedown = parser.parse(Buffer.from('\x1b[6~'))
      expect(pagedown[0].name).toBe('pagedown')
    })

    it('should parse control characters', () => {
      const parser = createKeyParser()

      const ctrlC = parser.parse(Buffer.from('\x03'))
      expect(ctrlC[0].name).toBe('c-c')
      expect(ctrlC[0].ctrl).toBe(true)

      const ctrlD = parser.parse(Buffer.from('\x04'))
      expect(ctrlD[0].name).toBe('c-d')
      expect(ctrlD[0].ctrl).toBe(true)
    })

    it('should parse enter key', () => {
      const parser = createKeyParser()
      const events = parser.parse(Buffer.from('\r'))
      expect(events[0].name).toBe('enter')
      expect(events[0].ctrl).toBe(false) // Enter is not treated as ctrl
    })

    it('should parse tab key', () => {
      const parser = createKeyParser()
      const events = parser.parse(Buffer.from('\t'))
      expect(events[0].name).toBe('tab')
      expect(events[0].ctrl).toBe(false) // Tab is not treated as ctrl
    })

    it('should parse backspace key', () => {
      const parser = createKeyParser()
      const events = parser.parse(Buffer.from('\x7f'))
      expect(events[0].name).toBe('backspace')
    })

    it('should parse alt+key combination', () => {
      const parser = createKeyParser()
      const events = parser.parse(Buffer.from('\x1ba'))
      expect(events[0].name).toBe('a')
      expect(events[0].alt).toBe(true)
    })

    it('should parse alt+shift+key combination', () => {
      const parser = createKeyParser()
      const events = parser.parse(Buffer.from('\x1bA'))
      expect(events[0].name).toBe('A')
      expect(events[0].alt).toBe(true)
      expect(events[0].shift).toBe(true)
    })

    it('should parse SS3 sequences (numpad)', () => {
      const parser = createKeyParser()

      const f1 = parser.parse(Buffer.from('\x1bOP'))
      expect(f1[0].name).toBe('f1')

      const f2 = parser.parse(Buffer.from('\x1bOQ'))
      expect(f2[0].name).toBe('f2')
    })

    it('should parse modified arrow keys', () => {
      const parser = createKeyParser()

      // Shift+Up: ESC[1;2A
      const shiftUp = parser.parse(Buffer.from('\x1b[1;2A'))
      expect(shiftUp[0].name).toBe('up')
      expect(shiftUp[0].shift).toBe(true)

      // Alt+Up: ESC[1;3A
      const altUp = parser.parse(Buffer.from('\x1b[1;3A'))
      expect(altUp[0].name).toBe('up')
      expect(altUp[0].alt).toBe(true)

      // Ctrl+Up: ESC[1;5A
      const ctrlUp = parser.parse(Buffer.from('\x1b[1;5A'))
      expect(ctrlUp[0].name).toBe('up')
      expect(ctrlUp[0].ctrl).toBe(true)
    })

    it('should handle empty buffer', () => {
      const parser = createKeyParser()
      const events = parser.parse(Buffer.from(''))
      expect(events.length).toBe(0)
    })
  })

  describe('parseKeyAt()', () => {
    it('should parse single character at position', () => {
      const result = parseKeyAt('abc', 0)
      expect(result.key.name).toBe('a')
      expect(result.consumed).toBe(1)
    })

    it('should parse at offset position', () => {
      const result = parseKeyAt('abc', 1)
      expect(result.key.name).toBe('b')
      expect(result.consumed).toBe(1)
    })

    it('should handle end of string', () => {
      const result = parseKeyAt('a', 1)
      expect(result.key.name).toBe('')
      expect(result.consumed).toBe(0)
    })

    it('should parse escape sequence at position', () => {
      const result = parseKeyAt('x\x1b[Ay', 1)
      expect(result.key.name).toBe('up')
      expect(result.consumed).toBe(3)
    })

    it('should return fallback name for unknown CSI sequence', () => {
      // Unknown CSI sequence should return 'csi-{params}-{finalByte}'
      const result = parseKeyAt('\x1b[99X', 0)
      expect(result.key.name).toBe('csi-99-X')
      expect(result.consumed).toBe(5)
    })

    it('should return fallback name for unknown tilde sequence', () => {
      // Unknown tilde sequence: ESC[99~ with param not in CSI_PARAM_KEY_NAMES
      const result = parseKeyAt('\x1b[99~', 0)
      expect(result.key.name).toBe('csi-99-~')
      expect(result.consumed).toBe(5)
    })

    it('should handle mouse event CSI sequence', () => {
      // SGR mouse: ESC[<0;1;1M - returns 'mouse' key
      const result = parseKeyAt('\x1b[<0;1;1M', 0)
      expect(result.key.name).toBe('mouse')
    })

    it('should handle non-SGR M sequence as regular key', () => {
      // M without < prefix is treated as regular CSI sequence, not mouse
      const result = parseKeyAt('\x1b[1M', 0)
      expect(result.key.name).toBe('csi-1-M')
      expect(result.consumed).toBe(4)
    })

    it('should handle mouse release sequence', () => {
      // SGR mouse release: ESC[<0;1;1m - returns 'mouse' key
      const result = parseKeyAt('\x1b[<0;1;1m', 0)
      expect(result.key.name).toBe('mouse')
    })
  })

  describe('controlCharName()', () => {
    it('should return tab for code 9', () => {
      expect(controlCharName(9)).toBe('tab')
    })

    it('should return enter for code 13', () => {
      expect(controlCharName(13)).toBe('enter')
    })

    it('should return backspace for code 127', () => {
      expect(controlCharName(127)).toBe('backspace')
    })

    it('should return c-a for code 1', () => {
      expect(controlCharName(1)).toBe('c-a')
    })

    it('should return c-z for code 26', () => {
      expect(controlCharName(26)).toBe('c-z')
    })

    it('should return c-@ for code 0', () => {
      // Code 0 is defined in CONTROL_CHAR_NAMES as 'c-@'
      expect(controlCharName(0)).toBe('c-@')
    })

    it('should return fallback for unknown codes > 26', () => {
      // Codes > 26 that aren't in CONTROL_CHAR_NAMES get fallback
      // Code 28 is 'c-\\' which is in constants, so use a high code
      expect(controlCharName(200)).toBe('ctrl-200')
    })
  })

  describe('createMouseParser()', () => {
    it('should create a mouse parser', () => {
      const parser = createMouseParser()
      expect(parser).toBeDefined()
      expect(parser.parse).toBeInstanceOf(Function)
    })

    it('should parse left button press', () => {
      const parser = createMouseParser()
      // SGR format: ESC[<0;10;20M (button 0 = left, x=10, y=20, M=press)
      const events = parser.parse(Buffer.from('\x1b[<0;10;20M'))
      expect(events.length).toBe(1)
      expect(events[0].button).toBe('left')
      expect(events[0].action).toBe('press')
      expect(events[0].x).toBe(9) // 0-indexed
      expect(events[0].y).toBe(19)
    })

    it('should parse left button release', () => {
      const parser = createMouseParser()
      const events = parser.parse(Buffer.from('\x1b[<0;10;20m')) // lowercase m = release
      expect(events[0].button).toBe('left')
      expect(events[0].action).toBe('release')
    })

    it('should parse middle button', () => {
      const parser = createMouseParser()
      const events = parser.parse(Buffer.from('\x1b[<1;5;5M'))
      expect(events[0].button).toBe('middle')
    })

    it('should parse right button', () => {
      const parser = createMouseParser()
      const events = parser.parse(Buffer.from('\x1b[<2;5;5M'))
      expect(events[0].button).toBe('right')
    })

    it('should parse mouse motion', () => {
      const parser = createMouseParser()
      // Button 32 = motion flag
      const events = parser.parse(Buffer.from('\x1b[<32;15;25M'))
      expect(events[0].action).toBe('move')
    })

    it('should parse scroll up', () => {
      const parser = createMouseParser()
      // Button 64 = scroll flag, 0 = up
      const events = parser.parse(Buffer.from('\x1b[<64;5;5M'))
      expect(events[0].action).toBe('scroll')
      expect(events[0].scroll).toBe('up')
      expect(events[0].button).toBe('none')
    })

    it('should parse scroll down', () => {
      const parser = createMouseParser()
      // Button 65 = scroll flag + 1 (down)
      const events = parser.parse(Buffer.from('\x1b[<65;5;5M'))
      expect(events[0].action).toBe('scroll')
      expect(events[0].scroll).toBe('down')
    })

    it('should parse modifier keys', () => {
      const parser = createMouseParser()
      // Button 4 = shift, 8 = alt, 16 = ctrl
      const shift = parser.parse(Buffer.from('\x1b[<4;5;5M'))
      expect(shift[0].shift).toBe(true)

      const alt = parser.parse(Buffer.from('\x1b[<8;5;5M'))
      expect(alt[0].alt).toBe(true)

      const ctrl = parser.parse(Buffer.from('\x1b[<16;5;5M'))
      expect(ctrl[0].ctrl).toBe(true)
    })

    it('should parse multiple mouse events', () => {
      const parser = createMouseParser()
      const events = parser.parse(Buffer.from('\x1b[<0;1;1M\x1b[<0;2;2M'))
      expect(events.length).toBe(2)
    })

    it('should handle no mouse events', () => {
      const parser = createMouseParser()
      const events = parser.parse(Buffer.from('abc'))
      expect(events.length).toBe(0)
    })
  })

  describe('matchKey()', () => {
    // Note: 'a', 'c', 's' are modifier shortcuts (alt, ctrl, shift)
    // Use other letters like 'x', 'y', 'z' for simple key matching

    it('should match simple key', () => {
      // Use 'x' which isn't a modifier shorthand
      const event = { name: 'x', sequence: 'x', ctrl: false, alt: false, shift: false, meta: false }
      expect(matchKey(event, 'x')).toBe(true)
      expect(matchKey(event, 'y')).toBe(false)
    })

    it('should match ctrl combination with ctrl-key format', () => {
      const event = {
        name: 'x',
        sequence: '\x18',
        ctrl: true,
        alt: false,
        shift: false,
        meta: false
      }
      expect(matchKey(event, 'c-x')).toBe(true)
      expect(matchKey(event, 'ctrl-x')).toBe(true)
    })

    it('should match alt combination', () => {
      const event = {
        name: 'x',
        sequence: '\x1bx',
        ctrl: false,
        alt: true,
        shift: false,
        meta: false
      }
      expect(matchKey(event, 'a-x')).toBe(true)
      expect(matchKey(event, 'alt-x')).toBe(true)
    })

    it('should match shift combination', () => {
      const event = {
        name: 'tab',
        sequence: '\x1b[Z',
        ctrl: false,
        alt: false,
        shift: true,
        meta: false
      }
      expect(matchKey(event, 's-tab')).toBe(true)
      expect(matchKey(event, 'shift-tab')).toBe(true)
    })

    it('should match multiple modifiers', () => {
      const event = { name: 'x', sequence: '', ctrl: true, alt: true, shift: false, meta: false }
      expect(matchKey(event, 'c-a-x')).toBe(true)
      expect(matchKey(event, 'ctrl-alt-x')).toBe(true)
    })

    it('should be case insensitive', () => {
      const event = {
        name: 'enter',
        sequence: '\r',
        ctrl: false,
        alt: false,
        shift: false,
        meta: false
      }
      expect(matchKey(event, 'Enter')).toBe(true)
      expect(matchKey(event, 'ENTER')).toBe(true)
    })

    it('should match navigation keys', () => {
      const up = {
        name: 'up',
        sequence: '\x1b[A',
        ctrl: false,
        alt: false,
        shift: false,
        meta: false
      }
      expect(matchKey(up, 'up')).toBe(true)
    })
  })

  describe('isPrintable()', () => {
    it('should return true for regular characters', () => {
      const event = { name: 'a', sequence: 'a', ctrl: false, alt: false, shift: false, meta: false }
      expect(isPrintable(event)).toBe(true)
    })

    it('should return true for uppercase with shift', () => {
      const event = { name: 'A', sequence: 'A', ctrl: false, alt: false, shift: true, meta: false }
      expect(isPrintable(event)).toBe(true)
    })

    it('should return true for space', () => {
      const event = { name: ' ', sequence: ' ', ctrl: false, alt: false, shift: false, meta: false }
      expect(isPrintable(event)).toBe(true)
    })

    it('should return false for control keys', () => {
      const event = {
        name: 'c',
        sequence: '\x03',
        ctrl: true,
        alt: false,
        shift: false,
        meta: false
      }
      expect(isPrintable(event)).toBe(false)
    })

    it('should return false for alt keys', () => {
      const event = {
        name: 'a',
        sequence: '\x1ba',
        ctrl: false,
        alt: true,
        shift: false,
        meta: false
      }
      expect(isPrintable(event)).toBe(false)
    })

    it('should return false for special keys', () => {
      const event = {
        name: 'up',
        sequence: '\x1b[A',
        ctrl: false,
        alt: false,
        shift: false,
        meta: false
      }
      expect(isPrintable(event)).toBe(false)
    })

    it('should return false for control characters', () => {
      const event = {
        name: '\x00',
        sequence: '\x00',
        ctrl: false,
        alt: false,
        shift: false,
        meta: false
      }
      expect(isPrintable(event)).toBe(false)
    })
  })

  describe('isNavigation()', () => {
    it('should return true for arrow keys', () => {
      const up = { name: 'up', sequence: '', ctrl: false, alt: false, shift: false, meta: false }
      const down = {
        name: 'down',
        sequence: '',
        ctrl: false,
        alt: false,
        shift: false,
        meta: false
      }
      const left = {
        name: 'left',
        sequence: '',
        ctrl: false,
        alt: false,
        shift: false,
        meta: false
      }
      const right = {
        name: 'right',
        sequence: '',
        ctrl: false,
        alt: false,
        shift: false,
        meta: false
      }

      expect(isNavigation(up)).toBe(true)
      expect(isNavigation(down)).toBe(true)
      expect(isNavigation(left)).toBe(true)
      expect(isNavigation(right)).toBe(true)
    })

    it('should return true for home/end', () => {
      const home = {
        name: 'home',
        sequence: '',
        ctrl: false,
        alt: false,
        shift: false,
        meta: false
      }
      const end = { name: 'end', sequence: '', ctrl: false, alt: false, shift: false, meta: false }

      expect(isNavigation(home)).toBe(true)
      expect(isNavigation(end)).toBe(true)
    })

    it('should return true for pageup/pagedown', () => {
      const pageup = {
        name: 'pageup',
        sequence: '',
        ctrl: false,
        alt: false,
        shift: false,
        meta: false
      }
      const pagedown = {
        name: 'pagedown',
        sequence: '',
        ctrl: false,
        alt: false,
        shift: false,
        meta: false
      }

      expect(isNavigation(pageup)).toBe(true)
      expect(isNavigation(pagedown)).toBe(true)
    })

    it('should return false for regular characters', () => {
      const event = { name: 'a', sequence: 'a', ctrl: false, alt: false, shift: false, meta: false }
      expect(isNavigation(event)).toBe(false)
    })

    it('should return false for enter/tab', () => {
      const enter = {
        name: 'enter',
        sequence: '\r',
        ctrl: false,
        alt: false,
        shift: false,
        meta: false
      }
      const tab = {
        name: 'tab',
        sequence: '\t',
        ctrl: false,
        alt: false,
        shift: false,
        meta: false
      }

      expect(isNavigation(enter)).toBe(false)
      expect(isNavigation(tab)).toBe(false)
    })
  })

  describe('keyToString()', () => {
    it('should convert simple key', () => {
      const event = { name: 'a', sequence: 'a', ctrl: false, alt: false, shift: false, meta: false }
      expect(keyToString(event)).toBe('A')
    })

    it('should convert ctrl combination', () => {
      const event = {
        name: 'c',
        sequence: '\x03',
        ctrl: true,
        alt: false,
        shift: false,
        meta: false
      }
      expect(keyToString(event)).toBe('Ctrl+C')
    })

    it('should convert alt combination', () => {
      const event = {
        name: 'a',
        sequence: '\x1ba',
        ctrl: false,
        alt: true,
        shift: false,
        meta: false
      }
      expect(keyToString(event)).toBe('Alt+A')
    })

    it('should convert shift combination', () => {
      const event = { name: 'tab', sequence: '', ctrl: false, alt: false, shift: true, meta: false }
      expect(keyToString(event)).toBe('Shift+Tab')
    })

    it('should convert meta combination', () => {
      const event = { name: 'a', sequence: '', ctrl: false, alt: false, shift: false, meta: true }
      expect(keyToString(event)).toBe('Meta+A')
    })

    it('should convert multiple modifiers', () => {
      const event = { name: 'a', sequence: '', ctrl: true, alt: true, shift: true, meta: false }
      expect(keyToString(event)).toBe('Ctrl+Alt+Shift+A')
    })

    it('should capitalize key name', () => {
      const event = {
        name: 'enter',
        sequence: '\r',
        ctrl: false,
        alt: false,
        shift: false,
        meta: false
      }
      expect(keyToString(event)).toBe('Enter')
    })
  })
})
