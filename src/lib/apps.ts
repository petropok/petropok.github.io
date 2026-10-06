export type AppId = 'about' | 'experience' | 'projects' | 'contact' | 'personalization';

export type AppDefinition = {
  id: AppId;
  title: string;
  icon: string;
  shortLabel: string;

  desktopPosition: {
    x: string;
    y: string;
    width: string;
    height: string;
  };

  initialRect: {
    width: number;
    height: number;
  };

  initialOpen?: boolean;
};

export const apps: AppDefinition[] = [
  {
    id: 'about',
    title: 'About Me',
    icon: '👤',
    shortLabel: 'About',

    desktopPosition: {
      x: '7vw',
      y: '8vh',
      width: '620px',
      height: '540px',
    },

    initialRect: {
      width: 620,
      height: 540,
    },

    initialOpen: true,
  },
  {
    id: 'experience',
    title: 'Experience',
    icon: '🗂️',
    shortLabel: 'Experience',

    desktopPosition: {
      x: '44vw',
      y: '13vh',
      width: '660px',
      height: '280px',
    },

    initialRect: {
      width: 660,
      height: 280,
    },

    initialOpen: false,
  },
  {
    id: 'projects',
    title: 'Projects',
    icon: '🖼️',
    shortLabel: 'Projects',

    desktopPosition: { 
      x: '14vw', 
      y: '41vh', 
      width: 'min(760px, 65vw)', 
      height: 'min(560px, 72vh)' 
    },
    initialRect: {
      width: 660,
      height: 520,
    },
    initialOpen: false,
  },
  {
    id: 'contact',
    title: 'Contact',
    icon: '✉️',
    shortLabel: 'Contact',
    desktopPosition: { x: '57vw', y: '48vh', width: 'min(520px, 48vw)', height: 'min(430px, 58vh)' },
    initialRect: {
      width: 660,
      height: 520,
    },
    initialOpen: false,
  },
  {
    id: 'personalization',
    title: 'Personalize',
    icon: '🎨',
    shortLabel: 'Themes',
    desktopPosition: {
      x: '25vw',
      y: '12vh',
      width: 'min(620px, 58vw)',
      height: 'min(500px, 68vh)',
    },
    initialRect: {
      width: 660,
      height: 520,
    },
    initialOpen: false,
  },
];

export const appById = Object.fromEntries(apps.map((app) => [app.id, app])) as Record<AppId, AppDefinition>;
