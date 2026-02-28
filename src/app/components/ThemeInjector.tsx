import { generateSableVariables } from '$appUtils/themeGenerator';
import { CustomTheme } from '$hooks/useTheme';
import { useSetting } from '$state/hooks/settings';
import { settingsAtom } from '$state/settings';
import { useEffect } from 'react';

export function ThemeInjector() {
  const [customThemes] = useSetting(settingsAtom, 'customThemes') as [
    CustomTheme[] | undefined,
    unknown,
  ];

  useEffect(() => {
    const styleId = 'sable-custom-themes';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!Array.isArray(customThemes) || customThemes.length === 0) {
      if (styleTag) styleTag.innerHTML = '';
      return;
    }

    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    const cssString = customThemes
      .map((theme: CustomTheme) => {
        const vars = generateSableVariables(theme.settings);
        const varString = Object.entries(vars)
          .map(([key, val]) => `  ${key}: ${val};`)
          .join('\n');

        return `.${theme.id} {\n${varString}\n}`;
      })
      .join('\n\n');

    styleTag.innerHTML = cssString;

    return () => {};
  }, [customThemes]);

  return null;
}
