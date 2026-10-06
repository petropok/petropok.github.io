import type { ThemeDefinition, ThemeId } from './themes';
import { themes } from './themes';

const STORAGE_KEY = 'aerodesk-theme';

class ThemeManager {
  private themes = themes;
  private currentThemeId: ThemeId = 'aero';

  init() {
    const saved =
      localStorage.getItem(STORAGE_KEY) as ThemeId | null;

    if (
      saved &&
      this.themes.some(
        (theme) => theme.id === saved,
      )
    ) {
      this.currentThemeId = saved;
    }

    this.apply(this.currentThemeId, false);
  }

  apply(
    themeId: ThemeId,
    persist = true,
  ) {
    const theme = this.themes.find(
      (candidate) => candidate.id === themeId,
    );

    if (!theme) return;

    const root = document.documentElement;

    for (
      const [property, value]
      of Object.entries(theme.variables)
    ) {
      root.style.setProperty(
        property,
        value,
      );
    }

    root.dataset.theme = theme.id;

    this.currentThemeId = theme.id;

    if (persist) {
      localStorage.setItem(
        STORAGE_KEY,
        theme.id,
      );
    }

    window.dispatchEvent(
      new CustomEvent('themechange', {
        detail: theme,
      }),
    );
  }

  getCurrentTheme() {
    return this.themes.find(
      (theme) =>
        theme.id === this.currentThemeId,
    );
  }

  getThemes() {
    return this.themes;
  }
}

export const themeManager =
  new ThemeManager();