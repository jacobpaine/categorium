/**
 * Theme metadata, split out from the main `data` barrel so importing it does NOT pull in the
 * eager puzzle-JSON glob (see ./index.ts). The landing screen needs only the theme list, so it
 * imports from here and keeps the heavy puzzle data out of the initial bundle.
 */
import { parseThemes } from '../schemas';
import type { Theme } from '../schemas';
import themesJson from './themes.json';

export const THEMES: Theme[] = parseThemes(themesJson);

export function getTheme(id: string): Theme | undefined {
  return THEMES.find((t) => t.id === id);
}
