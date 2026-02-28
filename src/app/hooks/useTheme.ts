import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ThemeKind, ThemeSettings } from '$appUtils/themeGenerator';
import { useSetting } from '$state/hooks/settings';
import { settingsAtom } from '$state/settings';
import { butterTheme, darkTheme, lightTheme, silverTheme } from '../../colors.css';
import { onDarkFontWeight, onLightFontWeight } from '../../config.css';

export interface CustomTheme {
  id: string;
  name: string;
  kind: ThemeKind;
  settings: ThemeSettings;
}

export type Theme = {
  id: string;
  kind: ThemeKind;
  classNames: string[];
};

export const LightTheme: Theme = {
  id: 'light-theme',
  kind: ThemeKind.Light,
  classNames: ['light-theme', lightTheme, onLightFontWeight, 'prism-light'],
};

export const SilverTheme: Theme = {
  id: 'silver-theme',
  kind: ThemeKind.Light,
  classNames: ['silver-theme', silverTheme, onLightFontWeight, 'prism-light'],
};

export const DarkTheme: Theme = {
  id: 'dark-theme',
  kind: ThemeKind.Dark,
  classNames: ['dark-theme', darkTheme, onDarkFontWeight, 'prism-dark'],
};

export const ButterTheme: Theme = {
  id: 'butter-theme',
  kind: ThemeKind.Dark,
  classNames: ['butter-theme', butterTheme, onDarkFontWeight, 'prism-dark'],
};

export const useThemes = (): Theme[] => {
  const [customThemes] = useSetting(settingsAtom, 'customThemes') as [
    CustomTheme[] | undefined,
    Dispatch<SetStateAction<CustomTheme[] | undefined>>,
  ];
  const presets: Theme[] = useMemo(() => [LightTheme, SilverTheme, DarkTheme, ButterTheme], []);

  return useMemo(() => {
    const userThemes: Theme[] = (customThemes || []).map((t) => ({
      id: t.id,
      kind: t.kind,
      classNames: [
        t.id,
        t.kind === ThemeKind.Light ? lightTheme : darkTheme,
        t.kind === ThemeKind.Light ? onLightFontWeight : onDarkFontWeight,
        t.kind === ThemeKind.Light ? 'prism-light' : 'prism-dark',
      ],
    }));
    return [...presets, ...userThemes];
  }, [presets, customThemes]);
};

export const useThemeNames = (): Record<string, string> => {
  const [customThemes] = useSetting(settingsAtom, 'customThemes') as [
    CustomTheme[] | undefined,
    Dispatch<SetStateAction<CustomTheme[] | undefined>>,
  ];

  return useMemo(() => {
    const names: Record<string, string> = {
      [LightTheme.id]: 'Light',
      [SilverTheme.id]: 'Silver',
      [DarkTheme.id]: 'Dark',
      [ButterTheme.id]: 'Butter',
    };

    if (Array.isArray(customThemes)) {
      customThemes.forEach((t) => {
        names[t.id] = t.name;
      });
    }

    return names;
  }, [customThemes]);
};

export const useSystemThemeKind = (): ThemeKind => {
  const darkModeQueryList = useMemo(() => window.matchMedia('(prefers-color-scheme: dark)'), []);

  const [themeKind, setThemeKind] = useState<ThemeKind>(
    darkModeQueryList.matches ? ThemeKind.Dark : ThemeKind.Light
  );

  useEffect(() => {
    const handleMediaQueryChange = () => {
      setThemeKind(darkModeQueryList.matches ? ThemeKind.Dark : ThemeKind.Light);
    };

    darkModeQueryList.addEventListener('change', handleMediaQueryChange);
    return () => {
      darkModeQueryList.removeEventListener('change', handleMediaQueryChange);
    };
  }, [darkModeQueryList]);

  return themeKind;
};

export const useActiveTheme = (): Theme => {
  const systemThemeKind = useSystemThemeKind();
  const themes = useThemes();
  const [systemTheme] = useSetting(settingsAtom, 'useSystemTheme');
  const [themeId] = useSetting(settingsAtom, 'themeId');
  const [lightThemeId] = useSetting(settingsAtom, 'lightThemeId');
  const [darkThemeId] = useSetting(settingsAtom, 'darkThemeId');

  return useMemo(() => {
    if (!systemTheme) {
      return themes.find((theme) => theme.id === themeId) ?? LightTheme;
    }

    const preferredId = systemThemeKind === ThemeKind.Dark ? darkThemeId : lightThemeId;
    const defaultTheme = systemThemeKind === ThemeKind.Dark ? DarkTheme : LightTheme;

    return themes.find((theme) => theme.id === preferredId) ?? defaultTheme;
  }, [systemTheme, systemThemeKind, themeId, lightThemeId, darkThemeId, themes]);
};

const ThemeContext = createContext<Theme | null>(null);
export const ThemeContextProvider = ThemeContext.Provider;

export const useTheme = (): Theme => {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('No theme provided!');
  }
  return theme;
};
