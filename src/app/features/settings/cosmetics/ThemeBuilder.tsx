import React, {
  useState,
  useMemo,
  Dispatch,
  SetStateAction,
  ChangeEvent,
  useEffect,
  useCallback,
} from 'react';
import chroma from 'chroma-js';
import { HexColorPicker } from 'react-colorful';
import { Box, Button, Input, Text, config, toRem, Icon, Icons } from 'folds';
import { useSetting } from '$state/hooks/settings';
import { settingsAtom } from '$state/settings';
import { CustomTheme } from '$hooks/useTheme';
import { generateSableVariables, ThemeKind, ThemeSettings } from '$appUtils/themeGenerator';
import { SequenceCard } from '$components/sequence-card';
import { SettingTile } from '$components/setting-tile';
import { HexColorPickerPopOut } from '$components/HexColorPickerPopOut';
import { SequenceCardStyle } from '../styles.css';

interface ThemeClipboardData {
  n: string;
  p: string;
  b: string;
  c: number;
}

export function ThemeBuilder() {
  const [name, setName] = useState('My Custom Theme');
  const [primary, setPrimary] = useState('#6e56cf');
  const [bg, setBg] = useState('#1b1a21');
  const [contrast, setContrast] = useState(4.6);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [customThemes, setCustomThemes] = useSetting(settingsAtom, 'customThemes') as [
    CustomTheme[] | undefined,
    Dispatch<SetStateAction<CustomTheme[] | undefined>>,
  ];

  const previewTokens = useMemo(() => {
    const settings: ThemeSettings = {
      id: 'preview',
      name: 'Preview',
      primary,
      bg,
      contrast,
    };
    return generateSableVariables(settings);
  }, [primary, bg, contrast]);

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleUpdatePrimary = (val: string) => setPrimary(val.startsWith('#') ? val : `#${val}`);
  const handleUpdateBg = (val: string) => setBg(val.startsWith('#') ? val : `#${val}`);

  const handleExport = useCallback(
    (data: CustomTheme | { name: string; primary: string; bg: string; contrast: number }) => {
      const s = 'settings' in data ? data.settings : data;
      const exportName = 'name' in data ? data.name : name;

      const clipboardData: ThemeClipboardData = {
        n: exportName,
        p: s.primary,
        b: s.bg,
        c: s.contrast,
      };

      navigator.clipboard
        .writeText(JSON.stringify(clipboardData))
        .then(() => showStatus(`Exported "${exportName}" to clipboard!`))
        .catch(() => showStatus('Failed to export.'));
    },
    [name]
  );

  const handleImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = JSON.parse(text) as Partial<ThemeClipboardData>;

      if (typeof parsed.n === 'string') setName(parsed.n);
      if (typeof parsed.p === 'string') setPrimary(parsed.p);
      if (typeof parsed.b === 'string') setBg(parsed.b);
      if (typeof parsed.c === 'number') setContrast(parsed.c);

      showStatus(parsed.n ? `Imported "${parsed.n}"!` : 'Imported from clipboard!');
    } catch {
      showStatus('Failed to import.');
    }
  };

  const handleSave = () => {
    const newId = `custom-${Date.now()}`;
    const isDark = chroma(bg).luminance() < 0.5;
    const newTheme: CustomTheme = {
      id: newId,
      name: name.trim() || 'Untitled Theme',
      kind: isDark ? ThemeKind.Dark : ThemeKind.Light,
      settings: { id: newId, name: name.trim(), primary, bg, contrast },
    };
    setCustomThemes((prev) => [...(prev || []), newTheme]);
    showStatus('Theme saved!');
  };

  useEffect(() => {
    const onLabLoad = (e: Event) => {
      const detail = (e as any).detail;

      const fullTheme = customThemes?.find((t) => t.id === detail.id);

      if (!fullTheme || !fullTheme.settings) {
        showStatus('Cannot edit theme.');
        return;
      }

      setName(fullTheme.name);
      setPrimary(fullTheme.settings.primary);
      setBg(fullTheme.settings.bg);
      setContrast(fullTheme.settings.contrast);
      showStatus(`Editing ${fullTheme.name}`);
    };

    const onLabExport = (e: Event) => {
      const detail = (e as any).detail;
      const fullTheme = customThemes?.find((t) => t.id === detail.id);
      if (fullTheme) {
        handleExport(fullTheme);
      } else {
        handleExport({ name, primary, bg, contrast });
      }
    };

    window.addEventListener('lab-load-theme', onLabLoad);
    window.addEventListener('lab-export-theme', onLabExport);

    return () => {
      window.removeEventListener('lab-load-theme', onLabLoad);
      window.removeEventListener('lab-export-theme', onLabExport);
    };
  }, [handleExport, customThemes, name, primary, bg, contrast]);

  return (
    <SequenceCard className={SequenceCardStyle} variant="SurfaceVariant" direction="Column">
      <Box
        gap="400"
        alignItems="Center"
        style={{ padding: `${config.space.S400} ${config.space.S400} 0` }}
      >
        <Text size="T300" style={{ flex: 1 }}>
          Name
        </Text>
        <Input
          size="300"
          radii="300"
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          variant="Secondary"
          outlined
          style={{ width: toRem(240) }}
        />
      </Box>
      <Box gap="400" wrap="Wrap" style={{ padding: config.space.S400 }}>
        <Box gap="200" alignItems="Center" style={{ flex: 1 }}>
          <Text size="T300">Primary</Text>
          <HexColorPickerPopOut
            picker={<HexColorPicker color={primary} onChange={handleUpdatePrimary} />}
          >
            {(onOpen, opened) => (
              <Button
                onClick={onOpen}
                size="300"
                variant="Secondary"
                fill="None"
                radii="300"
                style={{
                  padding: config.space.S100,
                  border: opened ? `2px solid var(--sable-primary-main)` : '2px solid transparent',
                }}
              >
                <Box
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: primary,
                  }}
                />
              </Button>
            )}
          </HexColorPickerPopOut>
          <Input
            size="300"
            radii="300"
            value={primary}
            onChange={(e) => handleUpdatePrimary(e.target.value)}
            variant="Secondary"
            outlined
            style={{ width: toRem(100), fontFamily: 'monospace' }}
          />
        </Box>
        <Box gap="200" alignItems="Center" style={{ flex: 1 }}>
          <Text size="T300">Background</Text>
          <HexColorPickerPopOut picker={<HexColorPicker color={bg} onChange={handleUpdateBg} />}>
            {(onOpen, opened) => (
              <Button
                onClick={onOpen}
                size="300"
                variant="Secondary"
                fill="None"
                radii="300"
                style={{
                  padding: config.space.S100,
                  border: opened ? `2px solid var(--sable-primary-main)` : '2px solid transparent',
                }}
              >
                <Box
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: bg,
                  }}
                />
              </Button>
            )}
          </HexColorPickerPopOut>
          <Input
            size="300"
            radii="300"
            value={bg}
            onChange={(e) => handleUpdateBg(e.target.value)}
            variant="Secondary"
            outlined
            style={{ width: toRem(100), fontFamily: 'monospace' }}
          />
        </Box>
      </Box>
      <Box
        style={{
          padding: config.space.S400,
          borderTop: `1px solid var(--sable-surface-container-line)`,
        }}
      >
        <SettingTile
          title={<Text size="T300">Target Contrast</Text>}
          description={
            <Box as="span" style={{ display: 'inline-flex', width: toRem(160) }}>
              <Text priority="300" size="T300">
                Ratio: {contrast.toFixed(1)}:1
              </Text>
            </Box>
          }
          after={
            <Box justifyContent="End" alignItems="Center" style={{ flex: 1 }}>
              <input
                type="range"
                min="3"
                max="7"
                step="0.1"
                value={contrast}
                onChange={(e) => setContrast(parseFloat(e.target.value))}
                style={{
                  width: toRem(160),
                  cursor: 'pointer',
                  appearance: 'none',
                  height: toRem(6),
                  borderRadius: config.radii.Pill,
                  backgroundColor: 'var(--sable-surface-container-line)',
                  accentColor: 'var(--sable-primary-main)',
                }}
              />
            </Box>
          }
        />
      </Box>
      <Box
        direction="Column"
        gap="200"
        style={{
          padding: config.space.S400,
          borderTop: `1px solid var(--sable-surface-container-line)`,
        }}
      >
        <Text size="T400" priority="300">
          Theme Preview
        </Text>
        <Box direction="Column" style={{ overflow: 'hidden' }}>
          {[
            '--sable-bg-container',
            '--sable-surface-container',
            '--sable-surface-var-container',
          ].map((bgKey) => (
            <Box
              key={bgKey}
              direction="Column"
              gap="200"
              style={{
                backgroundColor: previewTokens[bgKey],
                padding: config.space.S300,
                borderBottom: `1px solid ${previewTokens['--sable-bg-container-line']}`,
              }}
            >
              <Box alignItems="Center" gap="400">
                <Text
                  size="T300"
                  style={{
                    minWidth: toRem(80),
                    color:
                      previewTokens[
                        bgKey === '--sable-bg-container'
                          ? '--sable-bg-on-container'
                          : '--sable-surface-on-container'
                      ],
                  }}
                >
                  {bgKey.split('-').slice(2).join(' ')}
                </Text>
                <Text size="T300" style={{ color: previewTokens['--sable-primary-main'], flex: 1 }}>
                  Primary Text
                </Text>
              </Box>
              <Box gap="100" wrap="Wrap">
                {['primary-main', 'sec-main', 'success-main', 'warn-main', 'crit-main'].map(
                  (token) => (
                    <Box
                      key={token}
                      alignItems="Center"
                      justifyContent="Center"
                      style={{
                        width: toRem(40),
                        height: toRem(24),
                        backgroundColor: previewTokens[`--sable-${token}`],
                        borderRadius: config.radii.Pill,
                        border: `1px solid ${previewTokens['--sable-bg-container-line']}`,
                      }}
                    >
                      <Text
                        size="T300"
                        style={{
                          fontSize: toRem(10),
                          color: previewTokens[`--sable-${token.split('-')[0]}-on-main`],
                        }}
                      >
                        Aa
                      </Text>
                    </Box>
                  )
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
      <Box
        gap="200"
        style={{
          padding: config.space.S400,
          borderTop: `1px solid var(--sable-primary-main-line)`,
        }}
      >
        <Button
          onClick={() => handleExport({ name, primary, bg, contrast })}
          size="400"
          variant="Secondary"
          fill="Soft"
          outlined
          radii="300"
          style={{ flex: 1 }}
          after={<Icon size="200" src={Icons.Sticker} />}
        >
          <Text size="B300">Export</Text>
        </Button>
        <Button
          onClick={void handleImport}
          size="400"
          variant="Secondary"
          fill="Soft"
          outlined
          radii="300"
          style={{ flex: 1 }}
          after={<Icon size="200" src={Icons.Download} />}
        >
          <Text size="B300">Import</Text>
        </Button>
        <Button onClick={handleSave} size="400" variant="Primary" radii="300" style={{ flex: 1 }}>
          <Text size="B300">Save</Text>
        </Button>
      </Box>

      {statusMsg && (
        <Box
          justifyContent="Center"
          style={{ padding: `0 ${config.space.S400} ${config.space.S400}` }}
        >
          <Text size="T300" priority="300" style={{ color: 'var(--sable-success-main)' }}>
            {statusMsg}
          </Text>
        </Box>
      )}
    </SequenceCard>
  );
}
