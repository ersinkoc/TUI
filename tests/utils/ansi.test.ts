/**
 * @oxog/tui - ANSI Utils Tests
 */

import { describe, it, expect } from 'vitest'
import {
  // Cursor
  cursorTo,
  cursorUp,
  cursorDown,
  cursorForward,
  cursorBack,
  cursorHide,
  cursorShow,
  cursorSave,
  cursorRestore,
  // Screen
  clearScreen,
  clearLine,
  clearToEnd,
  clearToStart,
  alternateScreen,
  mainScreen,
  // Colors
  fgRgb,
  bgRgb,
  fgDefault,
  bgDefault,
  packedToFgAnsi,
  packedToBgAnsi,
  // Attributes
  reset,
  bold,
  dim,
  italic,
  underline,
  inverse,
  strikethrough,
  attrsToAnsi,
  // Mouse
  mouseOn,
  mouseOff,
  // ANSI object
  ANSI,
  // Aliases
  hideCursor,
  showCursor,
  saveCursor,
  restoreCursor,
  cursorColumn,
  cursorPosition,
  enterAltScreen,
  exitAltScreen,
  clearToEndOfLine,
  clearToEndOfScreen,
  scrollUp,
  scrollDown,
  fgReset,
  bgReset,
  boldOn,
  italicOn,
  underlineOn,
  dimOn,
  inverseOn,
  allOff,
  enableMouse,
  disableMouse,
  setTitle,
  bell,
  enableBracketedPaste,
  disableBracketedPaste
} from '../../src/utils/ansi'

describe('ANSI Utils', () => {
  const ESC = '\x1b'
  const CSI = `${ESC}[`

  describe('cursor control', () => {
    describe('cursorTo()', () => {
      it('should move cursor to position (1-indexed in output)', () => {
        expect(cursorTo(0, 0)).toBe(`${CSI}1;1H`)
        expect(cursorTo(10, 5)).toBe(`${CSI}6;11H`)
      })

      it('should handle various positions', () => {
        expect(cursorTo(79, 23)).toBe(`${CSI}24;80H`)
        expect(cursorTo(0, 100)).toBe(`${CSI}101;1H`)
      })
    })

    describe('cursorUp()', () => {
      it('should move cursor up by n rows', () => {
        expect(cursorUp()).toBe(`${CSI}1A`)
        expect(cursorUp(1)).toBe(`${CSI}1A`)
        expect(cursorUp(5)).toBe(`${CSI}5A`)
      })
    })

    describe('cursorDown()', () => {
      it('should move cursor down by n rows', () => {
        expect(cursorDown()).toBe(`${CSI}1B`)
        expect(cursorDown(1)).toBe(`${CSI}1B`)
        expect(cursorDown(10)).toBe(`${CSI}10B`)
      })
    })

    describe('cursorForward()', () => {
      it('should move cursor forward by n columns', () => {
        expect(cursorForward()).toBe(`${CSI}1C`)
        expect(cursorForward(1)).toBe(`${CSI}1C`)
        expect(cursorForward(20)).toBe(`${CSI}20C`)
      })
    })

    describe('cursorBack()', () => {
      it('should move cursor back by n columns', () => {
        expect(cursorBack()).toBe(`${CSI}1D`)
        expect(cursorBack(1)).toBe(`${CSI}1D`)
        expect(cursorBack(15)).toBe(`${CSI}15D`)
      })
    })

    describe('cursorHide()', () => {
      it('should return cursor hide sequence', () => {
        expect(cursorHide()).toBe(`${CSI}?25l`)
      })
    })

    describe('cursorShow()', () => {
      it('should return cursor show sequence', () => {
        expect(cursorShow()).toBe(`${CSI}?25h`)
      })
    })

    describe('cursorSave()', () => {
      it('should return cursor save sequence', () => {
        expect(cursorSave()).toBe(`${ESC}7`)
      })
    })

    describe('cursorRestore()', () => {
      it('should return cursor restore sequence', () => {
        expect(cursorRestore()).toBe(`${ESC}8`)
      })
    })
  })

  describe('screen control', () => {
    describe('clearScreen()', () => {
      it('should return clear screen sequence', () => {
        expect(clearScreen()).toBe(`${CSI}2J`)
      })
    })

    describe('clearLine()', () => {
      it('should return clear line sequence', () => {
        expect(clearLine()).toBe(`${CSI}2K`)
      })
    })

    describe('clearToEnd()', () => {
      it('should return clear to end sequence', () => {
        expect(clearToEnd()).toBe(`${CSI}0J`)
      })
    })

    describe('clearToStart()', () => {
      it('should return clear to start sequence', () => {
        expect(clearToStart()).toBe(`${CSI}1J`)
      })
    })

    describe('alternateScreen()', () => {
      it('should return alternate screen sequence', () => {
        expect(alternateScreen()).toBe(`${CSI}?1049h`)
      })
    })

    describe('mainScreen()', () => {
      it('should return main screen sequence', () => {
        expect(mainScreen()).toBe(`${CSI}?1049l`)
      })
    })
  })

  describe('color control', () => {
    describe('fgRgb()', () => {
      it('should return 24-bit foreground color sequence', () => {
        expect(fgRgb(255, 0, 0)).toBe(`${CSI}38;2;255;0;0m`)
        expect(fgRgb(0, 255, 0)).toBe(`${CSI}38;2;0;255;0m`)
        expect(fgRgb(0, 0, 255)).toBe(`${CSI}38;2;0;0;255m`)
      })

      it('should handle various color values', () => {
        expect(fgRgb(128, 128, 128)).toBe(`${CSI}38;2;128;128;128m`)
        expect(fgRgb(0, 0, 0)).toBe(`${CSI}38;2;0;0;0m`)
        expect(fgRgb(255, 255, 255)).toBe(`${CSI}38;2;255;255;255m`)
      })
    })

    describe('bgRgb()', () => {
      it('should return 24-bit background color sequence', () => {
        expect(bgRgb(255, 0, 0)).toBe(`${CSI}48;2;255;0;0m`)
        expect(bgRgb(0, 255, 0)).toBe(`${CSI}48;2;0;255;0m`)
        expect(bgRgb(0, 0, 255)).toBe(`${CSI}48;2;0;0;255m`)
      })
    })

    describe('fgDefault()', () => {
      it('should return default foreground color sequence', () => {
        expect(fgDefault()).toBe(`${CSI}39m`)
      })
    })

    describe('bgDefault()', () => {
      it('should return default background color sequence', () => {
        expect(bgDefault()).toBe(`${CSI}49m`)
      })
    })

    describe('packedToFgAnsi()', () => {
      it('should convert packed color to foreground ANSI', () => {
        // Red (0xff0000ff)
        const red = (255 << 24) | (0 << 16) | (0 << 8) | 255
        expect(packedToFgAnsi(red)).toBe(`${CSI}38;2;255;0;0m`)

        // Green (0x00ff00ff)
        const green = (0 << 24) | (255 << 16) | (0 << 8) | 255
        expect(packedToFgAnsi(green)).toBe(`${CSI}38;2;0;255;0m`)
      })

      it('should handle unsigned 32-bit values', () => {
        // White (0xffffffff)
        const white = 0xffffffff >>> 0
        expect(packedToFgAnsi(white)).toBe(`${CSI}38;2;255;255;255m`)
      })
    })

    describe('packedToBgAnsi()', () => {
      it('should convert packed color to background ANSI', () => {
        // Blue (0x0000ffff)
        const blue = (0 << 24) | (0 << 16) | (255 << 8) | 255
        expect(packedToBgAnsi(blue)).toBe(`${CSI}48;2;0;0;255m`)
      })

      it('should return default for transparent colors', () => {
        // Transparent (alpha = 0)
        const transparent = (255 << 24) | (0 << 16) | (0 << 8) | 0
        expect(packedToBgAnsi(transparent)).toBe(`${CSI}49m`)
      })
    })
  })

  describe('text attributes', () => {
    describe('reset()', () => {
      it('should return reset sequence', () => {
        expect(reset()).toBe(`${CSI}0m`)
      })
    })

    describe('bold()', () => {
      it('should return bold sequence', () => {
        expect(bold()).toBe(`${CSI}1m`)
      })
    })

    describe('dim()', () => {
      it('should return dim sequence', () => {
        expect(dim()).toBe(`${CSI}2m`)
      })
    })

    describe('italic()', () => {
      it('should return italic sequence', () => {
        expect(italic()).toBe(`${CSI}3m`)
      })
    })

    describe('underline()', () => {
      it('should return underline sequence', () => {
        expect(underline()).toBe(`${CSI}4m`)
      })
    })

    describe('inverse()', () => {
      it('should return inverse sequence', () => {
        expect(inverse()).toBe(`${CSI}7m`)
      })
    })

    describe('strikethrough()', () => {
      it('should return strikethrough sequence', () => {
        expect(strikethrough()).toBe(`${CSI}9m`)
      })
    })

    describe('attrsToAnsi()', () => {
      it('should return empty string for no attributes', () => {
        expect(attrsToAnsi(0)).toBe('')
      })

      it('should convert bold attribute (0x01)', () => {
        expect(attrsToAnsi(0x01)).toBe(`${CSI}1m`)
      })

      it('should convert italic attribute (0x02)', () => {
        expect(attrsToAnsi(0x02)).toBe(`${CSI}3m`)
      })

      it('should convert underline attribute (0x04)', () => {
        expect(attrsToAnsi(0x04)).toBe(`${CSI}4m`)
      })

      it('should convert dim attribute (0x08)', () => {
        expect(attrsToAnsi(0x08)).toBe(`${CSI}2m`)
      })

      it('should convert strikethrough attribute (0x10)', () => {
        expect(attrsToAnsi(0x10)).toBe(`${CSI}9m`)
      })

      it('should convert inverse attribute (0x20)', () => {
        expect(attrsToAnsi(0x20)).toBe(`${CSI}7m`)
      })

      it('should combine multiple attributes', () => {
        // Bold + Underline (0x01 | 0x04 = 0x05)
        expect(attrsToAnsi(0x05)).toBe(`${CSI}1;4m`)

        // Bold + Italic + Underline (0x01 | 0x02 | 0x04 = 0x07)
        expect(attrsToAnsi(0x07)).toBe(`${CSI}1;3;4m`)
      })
    })
  })

  describe('mouse control', () => {
    describe('mouseOn()', () => {
      it('should return mouse on sequence', () => {
        expect(mouseOn()).toBe(`${CSI}?1000h${CSI}?1006h`)
      })
    })

    describe('mouseOff()', () => {
      it('should return mouse off sequence', () => {
        expect(mouseOff()).toBe(`${CSI}?1000l${CSI}?1006l`)
      })
    })
  })

  describe('ANSI object', () => {
    it('should expose cursor functions', () => {
      expect(ANSI.cursorTo(0, 0)).toBe(cursorTo(0, 0))
      expect(ANSI.cursorUp(1)).toBe(cursorUp(1))
      expect(ANSI.cursorDown(1)).toBe(cursorDown(1))
      expect(ANSI.cursorForward(1)).toBe(cursorForward(1))
      expect(ANSI.cursorBack(1)).toBe(cursorBack(1))
      expect(ANSI.cursorHide()).toBe(cursorHide())
      expect(ANSI.cursorShow()).toBe(cursorShow())
      expect(ANSI.cursorSave()).toBe(cursorSave())
      expect(ANSI.cursorRestore()).toBe(cursorRestore())
    })

    it('should expose screen functions', () => {
      expect(ANSI.clearScreen()).toBe(clearScreen())
      expect(ANSI.clearLine()).toBe(clearLine())
      expect(ANSI.clearToEnd()).toBe(clearToEnd())
      expect(ANSI.clearToStart()).toBe(clearToStart())
      expect(ANSI.alternateScreen()).toBe(alternateScreen())
      expect(ANSI.mainScreen()).toBe(mainScreen())
    })

    it('should expose color functions', () => {
      expect(ANSI.fgRgb(255, 0, 0)).toBe(fgRgb(255, 0, 0))
      expect(ANSI.bgRgb(0, 0, 255)).toBe(bgRgb(0, 0, 255))
      expect(ANSI.fgDefault()).toBe(fgDefault())
      expect(ANSI.bgDefault()).toBe(bgDefault())
    })

    it('should expose attribute functions', () => {
      expect(ANSI.reset()).toBe(reset())
      expect(ANSI.bold()).toBe(bold())
      expect(ANSI.dim()).toBe(dim())
      expect(ANSI.italic()).toBe(italic())
      expect(ANSI.underline()).toBe(underline())
      expect(ANSI.inverse()).toBe(inverse())
      expect(ANSI.strikethrough()).toBe(strikethrough())
    })

    it('should expose mouse functions', () => {
      expect(ANSI.mouseOn()).toBe(mouseOn())
      expect(ANSI.mouseOff()).toBe(mouseOff())
    })
  })

  describe('aliases', () => {
    describe('cursor aliases', () => {
      it('hideCursor should equal cursorHide', () => {
        expect(hideCursor()).toBe(cursorHide())
      })

      it('showCursor should equal cursorShow', () => {
        expect(showCursor()).toBe(cursorShow())
      })

      it('saveCursor should equal cursorSave', () => {
        expect(saveCursor()).toBe(cursorSave())
      })

      it('restoreCursor should equal cursorRestore', () => {
        expect(restoreCursor()).toBe(cursorRestore())
      })

      it('cursorPosition should equal cursorTo', () => {
        expect(cursorPosition(5, 10)).toBe(cursorTo(5, 10))
      })

      it('cursorColumn should move to column', () => {
        expect(cursorColumn(0)).toBe(`${CSI}1G`)
        expect(cursorColumn(10)).toBe(`${CSI}11G`)
      })
    })

    describe('screen aliases', () => {
      it('enterAltScreen should equal alternateScreen', () => {
        expect(enterAltScreen()).toBe(alternateScreen())
      })

      it('exitAltScreen should equal mainScreen', () => {
        expect(exitAltScreen()).toBe(mainScreen())
      })

      it('clearToEndOfLine should return correct sequence', () => {
        expect(clearToEndOfLine()).toBe(`${CSI}0K`)
      })

      it('clearToEndOfScreen should equal clearToEnd', () => {
        expect(clearToEndOfScreen()).toBe(clearToEnd())
      })

      it('scrollUp should return scroll up sequence', () => {
        expect(scrollUp()).toBe(`${CSI}1S`)
        expect(scrollUp(5)).toBe(`${CSI}5S`)
      })

      it('scrollDown should return scroll down sequence', () => {
        expect(scrollDown()).toBe(`${CSI}1T`)
        expect(scrollDown(3)).toBe(`${CSI}3T`)
      })
    })

    describe('attribute aliases', () => {
      it('fgReset should equal fgDefault', () => {
        expect(fgReset()).toBe(fgDefault())
      })

      it('bgReset should equal bgDefault', () => {
        expect(bgReset()).toBe(bgDefault())
      })

      it('boldOn should equal bold', () => {
        expect(boldOn()).toBe(bold())
      })

      it('italicOn should equal italic', () => {
        expect(italicOn()).toBe(italic())
      })

      it('underlineOn should equal underline', () => {
        expect(underlineOn()).toBe(underline())
      })

      it('dimOn should equal dim', () => {
        expect(dimOn()).toBe(dim())
      })

      it('inverseOn should equal inverse', () => {
        expect(inverseOn()).toBe(inverse())
      })

      it('allOff should equal reset', () => {
        expect(allOff()).toBe(reset())
      })
    })

    describe('mouse aliases', () => {
      it('enableMouse should enable mouse tracking', () => {
        // With SGR mode (default)
        expect(enableMouse()).toBe(`${CSI}?1000h${CSI}?1002h${CSI}?1006h`)
        expect(enableMouse(true)).toBe(`${CSI}?1000h${CSI}?1002h${CSI}?1006h`)
      })

      it('enableMouse without SGR should use basic mode', () => {
        expect(enableMouse(false)).toBe(`${CSI}?1000h${CSI}?1002h`)
      })

      it('disableMouse should disable mouse tracking', () => {
        expect(disableMouse()).toBe(`${CSI}?1006l${CSI}?1002l${CSI}?1000l`)
      })
    })
  })

  describe('terminal utilities', () => {
    describe('setTitle()', () => {
      it('should set terminal title', () => {
        expect(setTitle('My App')).toBe(`${ESC}]2;My App\x07`)
        expect(setTitle('Test')).toBe(`${ESC}]2;Test\x07`)
      })

      it('should handle empty title', () => {
        expect(setTitle('')).toBe(`${ESC}]2;\x07`)
      })
    })

    describe('bell()', () => {
      it('should return bell character', () => {
        expect(bell()).toBe('\x07')
      })
    })

    describe('bracketed paste mode', () => {
      it('enableBracketedPaste should return enable sequence', () => {
        expect(enableBracketedPaste()).toBe(`${CSI}?2004h`)
      })

      it('disableBracketedPaste should return disable sequence', () => {
        expect(disableBracketedPaste()).toBe(`${CSI}?2004l`)
      })
    })
  })

  describe('sequence composition', () => {
    it('should allow chaining sequences', () => {
      const combined = cursorTo(0, 0) + fgRgb(255, 0, 0) + bold() + 'Hello' + reset()
      expect(combined).toContain(`${CSI}1;1H`)
      expect(combined).toContain(`${CSI}38;2;255;0;0m`)
      expect(combined).toContain(`${CSI}1m`)
      expect(combined).toContain('Hello')
      expect(combined).toContain(`${CSI}0m`)
    })

    it('should create valid terminal output', () => {
      const output =
        alternateScreen() +
        cursorHide() +
        clearScreen() +
        cursorTo(0, 0) +
        fgRgb(255, 255, 255) +
        bgRgb(0, 0, 128) +
        'Test' +
        reset() +
        cursorShow() +
        mainScreen()

      expect(output).toBeDefined()
      expect(typeof output).toBe('string')
      expect(output.length).toBeGreaterThan(0)
    })
  })
})
