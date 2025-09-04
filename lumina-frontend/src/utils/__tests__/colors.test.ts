import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { colors, validateColorConfig, getColorWithFallback } from '../colors';

describe('Color utilities', () => {
  describe('colors config', () => {
    it('should have all required color palettes', () => {
      const requiredPalettes = [
        'primary',
        'secondary',
        'neutral',
        'success',
        'warning',
        'error',
        'info',
      ];

      requiredPalettes.forEach(palette => {
        expect(colors).toHaveProperty(palette);
        expect(colors[palette as keyof typeof colors]).toBeTypeOf('object');
      });
    });

    it('should have consistent color shades', () => {
      const expectedShades = [
        '50',
        '100',
        '200',
        '300',
        '400',
        '500',
        '600',
        '700',
        '800',
        '900',
      ];

      Object.entries(colors).forEach(([paletteName, palette]) => {
        if (paletteName !== 'neutral') {
          // neutral has additional white/black
          expectedShades.forEach(shade => {
            expect(palette).toHaveProperty(shade);
            expect(palette[shade as keyof typeof palette]).toMatch(
              /^#[0-9a-fA-F]{6}$/
            );
          });
        }
      });
    });

    it('should have neutral white and black colors', () => {
      expect(colors.neutral).toHaveProperty('white', '#ffffff');
      expect(colors.neutral).toHaveProperty('black', '#000000');
    });
  });

  describe('validateColorConfig', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should return true for valid color configuration', () => {
      const result = validateColorConfig();
      expect(result).toBe(true);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should validate all required color palettes exist', () => {
      const result = validateColorConfig();
      expect(result).toBe(true);

      const requiredColors = [
        'primary',
        'secondary',
        'neutral',
        'success',
        'warning',
        'error',
        'info',
      ];
      requiredColors.forEach(colorName => {
        expect(colors[colorName as keyof typeof colors]).toBeDefined();
      });
    });
  });

  describe('getColorWithFallback', () => {
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should return correct color value for valid inputs', () => {
      const color = getColorWithFallback('primary', '500');
      expect(color).toBe('#667eea');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should return fallback for invalid palette', () => {
      const color = getColorWithFallback(
        'invalid' as keyof typeof colors,
        '500',
        '#ff0000'
      );
      expect(color).toBe('#ff0000');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Color not found: invalid.500')
      );
    });

    it('should return fallback for invalid shade', () => {
      const color = getColorWithFallback('primary', 'invalid', '#ff0000');
      expect(color).toBe('#ff0000');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Color not found: primary.invalid')
      );
    });

    it('should use default fallback when none provided', () => {
      const color = getColorWithFallback(
        'invalid' as keyof typeof colors,
        '500'
      );
      expect(color).toBe('#000000');
    });

    it('should handle neutral white and black colors', () => {
      expect(getColorWithFallback('neutral', 'white')).toBe('#ffffff');
      expect(getColorWithFallback('neutral', 'black')).toBe('#000000');
    });

    it('should handle numeric shade inputs', () => {
      const color = getColorWithFallback('primary', 500);
      expect(color).toBe('#667eea');
    });
  });

  describe('color value formats', () => {
    it('should have valid hex color formats', () => {
      const hexPattern = /^#[0-9a-fA-F]{6}$/;

      Object.values(colors).forEach(palette => {
        Object.values(palette).forEach(color => {
          expect(color).toMatch(hexPattern);
        });
      });
    });

    it('should have consistent primary color values', () => {
      expect(colors.primary['500']).toBe('#667eea');
      expect(colors.primary['50']).toBe('#f0f0ff');
      expect(colors.primary['900']).toBe('#22339a');
    });

    it('should have consistent neutral color values', () => {
      expect(colors.neutral.white).toBe('#ffffff');
      expect(colors.neutral.black).toBe('#000000');
      expect(colors.neutral['500']).toBe('#6b7280');
    });
  });
});
