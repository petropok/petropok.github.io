export type ThemeId =
  | 'aero'
  | 'midnight'
  | 'spring'
  | 'sunset';

export type ThemeDefinition = {
  id: ThemeId;
  name: string;
  description: string;

  background: {
    base: string;
    accent: string;
    image?: string;
  };

  variables: Record<string, string>;
};

export const themes: ThemeDefinition[] = [
  {
    id: 'aero',
    name: 'Aero',
    description: 'Classic blue-sky Frutiger Aero',
    background: {
      base: '#7fd5ff',
      accent: '#dfffd9',
    },
    variables: {
      '--sky': '#7fd5ff',
      '--sky-deep': '#3ca6e6',
      '--aqua': '#88e8f1',
      '--mint': '#dfffd9',
      '--ink': '#194768',
      '--ink-soft': '#55788f',
      '--panel': 'rgba(243, 251, 255, 0.76)',
      '--panel-strong': 'rgba(252, 255, 255, 0.94)',
      '--line': 'rgba(66, 125, 155, 0.38)',
      '--shadow': 'rgba(19, 79, 118, 0.25)',
      '--taskbar-bg': `linear-gradient(
          180deg,
          rgba(230,251,255,.9),
          rgba(139,205,224,.92)
        )`,
    },
  },

  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Dark glass with electric blue highlights',
    background: {
      base: '#101d3a',
      accent: '#152a55',
      image: '/themes/Wallpaper2.webp',
    },
    variables: {
      '--sky': '#172c51',
      '--sky-deep': '#214d91',
      '--aqua': '#54d8f4',
      '--mint': '#a6f4df',
      '--ink': '#dff7ff',
      '--ink-soft': '#9dbbc9',
      '--panel': 'rgba(20, 40, 68, 0.78)',
      '--panel-strong': 'rgba(28, 52, 82, 0.94)',
      '--line': 'rgba(130, 206, 235, 0.32)',
      '--shadow': 'rgba(0, 0, 0, 0.42)',
      '--taskbar-bg': `linear-gradient(
          180deg,
          rgba(74, 79, 99, 0.9),
          rgba(9, 21, 24, 0.92)
        )`,
    },
  },

  {
    id: 'spring',
    name: 'Spring',
    description: 'Fresh green and cyan desktop',
    background: {
      base: '#9de6cb',
      accent: '#efffd4',
      image: 'themes/Wallpaper.webp',
    },
    variables: {
      '--sky': '#9de6cb',
      '--sky-deep': '#56bfa0',
      '--aqua': '#7fe9ef',
      '--mint': '#eaffc8',
      '--ink': '#20534d',
      '--ink-soft': '#678983',
      '--panel': 'rgba(247, 255, 248, 0.78)',
      '--panel-strong': 'rgba(255, 255, 255, 0.95)',
      '--line': 'rgba(72, 139, 121, 0.32)',
      '--shadow': 'rgba(31, 100, 87, 0.22)',
      // '--desktop-bg': `
      //   linear-gradient(
      //     180deg,
      //     rgba(72, 189, 221, .45),
      //     rgba(205, 248, 255, .65)
      //   )
      // `,
    },
  },
];