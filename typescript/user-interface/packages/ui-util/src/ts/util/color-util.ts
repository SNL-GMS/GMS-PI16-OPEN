/* eslint-disable @typescript-eslint/no-magic-numbers */
import { uniqueNumberFromString } from '@gms/common-util';
import * as Immutable from 'immutable';

// CONSTANTS
const GOLDEN_RATIO_CONJUGATE = 0.618033988749895;
const DEGREES_IN_A_CIRCLE = 360;
const HUNDRED_PERCENT = 100;
const DEFAULT_SATURATION = 0.5;
const DEFAULT_VALUE = 0.7;

/**
 * A HSV Color
 * hue: 0 to 360 degrees
 * saturation: 0 to 100 percent
 * value: 0 to 100 percent
 */
export interface HSL {
  hue: number;
  saturation: number;
  lightness: number;
}

/**
 * Converts HSV to HSL colors based on this Stack Overflow
 * discussion: https://stackoverflow.com/questions/3423214/convert-hsb-hsv-color-to-hsl
 *
 * @param h hue between 0 and 360 degrees
 * @param s saturation between 0 and 100 percent
 * @param v value between 0 and 100 percent
 */
export function hsvToHSL(h: number, s: number, v: number): HSL {
  const lightness = ((2 - s) * v) / 2;
  const saturation =
    lightness === 0 || lightness === 1 ? 0 : (v - lightness) / Math.min(lightness, 1 - lightness);
  return {
    hue: h,
    saturation: saturation * HUNDRED_PERCENT,
    lightness: lightness * HUNDRED_PERCENT
  };
}

/**
 * Converts an HSL color into a css-formatted string of the form:
 *   hsl(<hue>deg, <saturation>%, <lightness>%)
 *
 * @param color the HSL color to convert
 */
export const hslToString = (color: HSL): string =>
  `hsl(${color.hue}deg, ${color.saturation}%, ${color.lightness}%)`;

// eslint-disable-next-line complexity
export const hslToHex = (color: HSL): string => {
  // see https://css-tricks.com/converting-color-spaces-in-javascript/
  const h = color.hue;
  // Must be fractions of 1
  const s = color.saturation / 100;
  const l = color.lightness / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
  } else if (h >= 120 && h < 180) {
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    b = x;
  } else {
    throw new RangeError(`Hue must be between 0 and 360, was ${h}`);
  }
  // Having obtained RGB, convert channels to hex
  let rStr = Math.round((r + m) * 255).toString(16);
  let gStr = Math.round((g + m) * 255).toString(16);
  let bStr = Math.round((b + m) * 255).toString(16);

  // Prepend 0s, if necessary
  if (rStr.length === 1) {
    rStr = `0${r}`;
  }
  if (gStr.length === 1) {
    gStr = `0${g}`;
  }
  if (bStr.length === 1) {
    bStr = `0${b}`;
  }

  return `#${rStr}${gStr}${bStr}`;
};

/**
 * Generates colors that are guaranteed to have a different hue.
 * Colors are generated in HSL format.
 */
export class DistinctColorPalette {
  /**
   * Start as random value. Each time generateRandomColorHSL
   * is called, this will update. Used to ensure that the new
   * color is sufficiently different from previously generated
   * colors.
   */
  private nextHue: number;

  /**
   * The internal map of colors in the palette
   */
  private colorMap: Immutable.Map<string | number, HSL>;

  /**
   * A color palette with distinct colors. Each color will have the same
   * saturation and lightness, and a unique hue.
   *
   * @param size the number of colors to generate.
   * @param keys array of keys
   * @param seed an optional number or string that sets the starting hue.
   * The same seed will always generate the same palette
   */
  public constructor(keys: string[] | number[], seed?: number | string) {
    this.nextHue = this.getHueFromSeed(seed);
    this.colorMap = Immutable.Map<string | number, HSL>();

    this.generateNewListOfDistinctColorsWithKeysHSL(keys);
  }

  /**
   * Adds a new color to the internal color palette.
   * The new color will appear at the end of the list.
   *
   * @returns the HSL color generated
   */
  public addColor(): HSL {
    this.colorMap = this.colorMap.set(this.colorMap.size, this.generateDistinctColorHSL());
    return this.colorMap.get(this.colorMap.size - 1);
  }

  /**
   * Gets all of the HSL colors from the palette.
   *
   * hue: 0 to 360
   * saturation: 0% to 100%
   * value: 0% to 100%
   *
   * @returns the map of HSL colors by predefined key
   */
  public getColors(): Immutable.Map<string | number, HSL> {
    return this.colorMap;
  }

  /**
   * Gets the HSL color with the given key from the palette.
   *
   * hue: 0 to 360
   * saturation: 0% to 100%
   * value: 0% to 100%
   *
   * @throws Error if a key is not in the palette
   * @param key the key of the color in the palette list
   * @returns the HSL color at the given index
   */
  public getColor(key: number | string): HSL {
    if (!key || !this.colorMap.has(key)) {
      throw new Error(`Unknown color key: ${key}`);
    }
    return this.colorMap.get(key);
  }

  /**
   * Returns the keys of the palette
   *
   * @returns keys as (string | number)[]
   */
  public getKeys(): (string | number)[] {
    return [...this.colorMap.keys()];
  }

  /**
   * Get an iterator for colorMap.
   *
   * hue: 0 to 360
   * saturation: 0% to 100%
   * value: 0% to 100%
   *
   * @returns the a iterator of color map
   */
  public getColorStrings(): IterableIterator<HSL> {
    return this.colorMap.values();
  }

  /**
   * Gets a css friendly HSL color string of the format:
   *
   * hsl(30deg, 80%, 95%);
   *
   * hue: 0 to 360
   * saturation: 0% to 100%
   * value: 0% to 100%
   *
   * @param key the key of the color from the palette
   * @returns the color in a css-friendly string
   */
  public getColorString(key: number | string): string {
    return hslToString(this.getColor(key));
  }

  /**
   * Returns the number of colors in the color palette.
   *
   * @returns the number of colors
   */
  public getSize(): number {
    return this.colorMap.size;
  }

  /**
   * Generates a color that is significantly different
   * from previously generated colors, starting from a
   * random seed value. Adds the color to the list
   *
   * @returns HSL color value with fixed saturation and lightness
   */
  private readonly generateDistinctColorHSL = (): HSL => {
    this.nextHue += GOLDEN_RATIO_CONJUGATE * DEGREES_IN_A_CIRCLE;
    this.nextHue %= DEGREES_IN_A_CIRCLE;
    const hslColor = hsvToHSL(this.nextHue, DEFAULT_SATURATION, DEFAULT_VALUE);
    return hslColor;
  };

  /**
   * Generates a color palette where each color is as distinct.
   *
   * @param keys
   * @returns an array of HSL colors, each of which has a hue
   * that is the golden ratio away from the preceding color in the list
   * hue is 0 to 360 deg
   * saturation is 0 to 100 percent
   * value is 0 to 100 percent
   */
  private readonly generateNewListOfDistinctColorsWithKeysHSL = (
    keys: string[] | number[]
  ): void => {
    this.generateNewColorList(keys.length).forEach((color, index) => {
      this.colorMap = this.colorMap.set(keys[index], color);
    });
  };

  private readonly generateNewColorList = (size: number): HSL[] => {
    const colorList = new Array(size).fill(0); // Fill it with 0s so the array is not an empty array of length n
    return colorList.map(() => this.generateDistinctColorHSL());
  };

  /**
   * Generates a number of degrees on the color wheel to use as our
   * starting hue.
   *
   * @param seed a seed number or string from which to generate the hue
   * @returns a number between 0 and 360 representing a number of degrees
   * in a circle. If the seed is falsy, return 0;
   */
  private readonly getHueFromSeed = (seed: number | string): number => {
    if (!seed) {
      return 0;
    }
    const seedNum: number = typeof seed === 'string' ? uniqueNumberFromString(seed) : seed;
    return seedNum % DEGREES_IN_A_CIRCLE;
  };
}
