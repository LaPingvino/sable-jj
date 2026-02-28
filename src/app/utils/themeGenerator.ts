import chroma from 'chroma-js';

export enum ThemeKind {
  Light = 'light',
  Dark = 'dark',
}

export interface ThemeSettings {
  id: string;
  name: string;
  primary: string;
  bg: string;
  contrast: number;
}

export type ThemeTokens = Record<string, string>;

export function generateSableVariables(settings: ThemeSettings): ThemeTokens {
  const { primary: primarySeed, bg: bgSeed, contrast: floor } = settings;
  const isDark = chroma(bgSeed).luminance() < 0.5;
  const p = chroma(primarySeed).oklch();

  const step = (color: string, offset: number) => {
    const [l, c, h] = chroma(color).oklch();
    return chroma.oklch(Math.min(1, Math.max(0, l + offset)), c, isNaN(h) ? 0 : h).hex();
  };

  const depthStep = (baseColor: string, offset: number) => {
    const [l, c, h] = chroma(baseColor).oklch();
    let nextL = isDark ? l + offset : l - offset;
    if (nextL > 0.98 || nextL < 0.02) {
      nextL = isDark ? l - offset * 2 : l + offset * 2;
    }
    return chroma.oklch(Math.min(0.99, Math.max(0.01, nextL)), c, isNaN(h) ? 0 : h).hex();
  };

  const stateStep = (color: string, offset: number) =>
    isDark ? depthStep(color, offset) : depthStep(color, -offset);

  const nudgePolar = (hex: string, direction: 'lighter' | 'darker'): string => {
    const [l, c, h] = chroma(hex).oklch();
    const amt = 0.01;
    let newL = direction === 'lighter' ? Math.min(1, l + amt) : Math.max(0, l - amt);

    if (direction === 'lighter' && newL < 0.05) newL = 0.08;
    if (direction === 'darker' && newL > 0.95) newL = 0.92;

    return chroma.oklch(newL, c, isNaN(h) ? 0 : h).hex();
  };

  const getAutoOn = (hex: string) => {
    const white = '#eae8f0';
    const black = '#1b1a21';

    // eslint-disable-next-line import/no-named-as-default-member
    return chroma.contrast(hex, white) > chroma.contrast(hex, black) ? white : black;
  };

  const tokens: ThemeTokens = {};

  const bgMain = isDark
    ? chroma(bgSeed)
        .luminance(Math.min(chroma(bgSeed).luminance(), 0.05))
        .hex()
    : chroma(bgSeed)
        .luminance(Math.max(chroma(bgSeed).luminance(), 0.85))
        .hex();

  tokens['--sable-bg-container'] = bgMain;
  tokens['--sable-bg-container-hover'] = stateStep(bgMain, 0.03);
  tokens['--sable-bg-container-active'] = stateStep(bgMain, 0.06);
  tokens['--sable-bg-container-line'] = stateStep(bgMain, 0.12);
  tokens['--sable-bg-on-container'] = getAutoOn(bgMain);

  const sContainer = depthStep(bgMain, 0.06);
  tokens['--sable-surface-container'] = sContainer;
  tokens['--sable-surface-container-hover'] = stateStep(sContainer, 0.03);
  tokens['--sable-surface-container-active'] = stateStep(sContainer, 0.06);
  tokens['--sable-surface-container-line'] = stateStep(sContainer, 0.1);
  tokens['--sable-surface-on-container'] = getAutoOn(sContainer);

  const vContainer = depthStep(bgMain, -0.04);
  tokens['--sable-surface-var-container'] = vContainer;
  tokens['--sable-surface-var-container-hover'] = bgMain;
  tokens['--sable-surface-var-container-active'] = stateStep(bgMain, 0.03);
  tokens['--sable-surface-var-container-line'] = stateStep(bgMain, 0.1);

  const sets = ['primary', 'sec', 'success', 'warn', 'crit'];

  tokens['--sable-primary-main'] = primarySeed;
  tokens['--sable-primary-container'] = chroma.oklch(isDark ? 0.25 : 0.95, p[1] * 0.4, p[2]).hex();

  tokens['--sable-sec-main'] = chroma.oklch(isDark ? 0.8 : 0.3, p[1] * 0.05, p[2]).hex();
  tokens['--sable-sec-container'] = step(vContainer, isDark ? 0.08 : -0.08);

  tokens['--sable-success-main'] = chroma.oklch(0.65, 0.15, 145).hex();
  tokens['--sable-success-container'] = chroma.oklch(isDark ? 0.15 : 0.95, 0.02, 145).hex();

  tokens['--sable-warn-main'] = chroma.oklch(0.65, 0.15, 75).hex();
  tokens['--sable-warn-container'] = chroma.oklch(isDark ? 0.15 : 0.95, 0.02, 75).hex();

  tokens['--sable-crit-main'] = chroma.oklch(0.65, 0.15, 25).hex();
  tokens['--sable-crit-container'] = chroma.oklch(isDark ? 0.15 : 0.95, 0.02, 25).hex();

  const bgLayers = [bgMain, sContainer, vContainer];
  let isClean = false;
  let safety = 0;

  while (!isClean && safety < 500) {
    isClean = true;

    for (const prefix of sets) {
      const mainKey = `--sable-${prefix}-main`;
      const containerKey = `--sable-${prefix}-container`;

      for (const surface of bgLayers) {
        // eslint-disable-next-line import/no-named-as-default-member
        if (chroma.contrast(surface, tokens[mainKey]) < floor) {
          isClean = false;
          tokens[mainKey] = nudgePolar(tokens[mainKey], isDark ? 'lighter' : 'darker');
        }
      }

      const anchor = prefix === 'sec' || prefix === 'primary' ? vContainer : bgMain;

      // eslint-disable-next-line import/no-named-as-default-member
      if (chroma.contrast(anchor, tokens[containerKey]) < 1.15) {
        isClean = false;
        tokens[containerKey] = nudgePolar(tokens[containerKey], isDark ? 'lighter' : 'darker');
      }
    }
    safety++;
  }

  sets.forEach((prefix) => {
    const main = tokens[`--sable-${prefix}-main`];
    const container = tokens[`--sable-${prefix}-container`];

    tokens[`--sable-${prefix}-main-hover`] = stateStep(main, 0.07);
    tokens[`--sable-${prefix}-main-active`] = stateStep(main, 0.12);
    tokens[`--sable-${prefix}-main-line`] = stateStep(main, 0.18);
    tokens[`--sable-${prefix}-on-main`] = getAutoOn(main);

    tokens[`--sable-${prefix}-container-hover`] = stateStep(container, 0.04);
    tokens[`--sable-${prefix}-container-active`] = stateStep(container, 0.08);
    tokens[`--sable-${prefix}-container-line`] = stateStep(container, 0.12);

    let onC = getAutoOn(container);
    let tSafety = 0;
    // eslint-disable-next-line import/no-named-as-default-member
    while (chroma.contrast(container, onC) < floor && tSafety < 50) {
      onC = nudgePolar(onC, chroma(onC).luminance() > 0.5 ? 'lighter' : 'darker');
      tSafety++;
    }
    tokens[`--sable-${prefix}-on-container`] = onC;
  });

  tokens['--sable-surface-var-on-container'] = tokens['--sable-primary-main'];
  tokens['--sable-focus-ring'] = chroma(tokens['--sable-primary-main']).alpha(0.5).css();
  tokens['--sable-shadow'] = isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.12)';
  tokens['--sable-overlay'] = chroma(bgMain).alpha(0.85).css();

  return tokens;
}
