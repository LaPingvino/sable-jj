import { ThemeKind } from '$appUtils/themeGenerator';
import chroma from 'chroma-js';

export const accessibleColor = (themeKind: ThemeKind, color: string): string => {
  //eslint-disable-next-line import/no-named-as-default-member
  if (!chroma.valid(color)) return color;

  let lightness = chroma(color).lab()[0];
  if (themeKind === ThemeKind.Dark && lightness < 60) {
    lightness = 60;
  }
  if (themeKind === ThemeKind.Light && lightness > 50) {
    lightness = 50;
  }

  return chroma(color).set('lab.l', lightness).hex();
};
