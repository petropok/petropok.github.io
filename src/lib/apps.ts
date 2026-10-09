export type AppId = 'about' | 'experience' | 'projects' | 'contact' | 'settings';

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
      x: '6vw',
      y: '7vh',
      width: '660px', 
      height: '520px',
    },

    initialRect: {
      width: 660,
      height: 520,
    },

    initialOpen: false,
  },
  {
    id: 'projects',
    title: 'Projects',
    icon: '🖼️',
    shortLabel: 'Projects',

    desktopPosition: { 
      x: '9vw', 
      y: '8vh', 
      width: '660px', 
      height: '520px',
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
    desktopPosition: { 
      x: '10vw',
      y: '7vh',
      width: '660px',
      height: '520px',
    },
    initialRect: {
      width: 660,
      height: 520,
    },
    initialOpen: false,
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: '⚙️',
    shortLabel: 'Settings',
    desktopPosition: {
      x: '11vw',
      y: '9vh',
      width: '620px',
      height: '520px',
    },
    initialRect: {
      width: 660,
      height: 520,
    },
    initialOpen: false,
  },
];

export const appById = Object.fromEntries(apps.map((app) => [app.id, app])) as Record<AppId, AppDefinition>;
