import { apps } from './apps';

import {
  calculateResize,
  cloneRect,
  getDeviceCapabilities,
  getViewportSnap,
  snapToTargets,
  snapToViewport,
  TASKBAR_HEIGHT,
  updateMaximizedRect,
  type DeviceCapabilities,
  type WindowMode,
  type WindowRect,
} from './windowing';

type WindowState = {
  id: string;
  rect: WindowRect;
  previousRect?: WindowRect;
  mode: WindowMode;
  zIndex: number;
};

type DragSession = {
  pointerId: number;
  startPointerX: number;
  startPointerY: number;
  startRect: WindowRect;
};

type ResizeSession = DragSession & {
  direction: string;
};

type SnapTargetCache = { left: number; top: number; right: number; bottom: number }[];

export class WindowManager {
  private readonly root: HTMLElement;
  private readonly windows = new Map<string, { el: HTMLElement; state: WindowState }>();
  private readonly taskButtons: HTMLButtonElement[];
  private readonly mobileQuery: MediaQueryList;
  private activeId: string | null = null;
  private nextZ = 50;
  private dragSession: DragSession | null = null;
  private resizeSession: ResizeSession | null = null;
  private snapTargets: SnapTargetCache = [];
  private activeViewportSnap: ReturnType<typeof getViewportSnap> = null;
  private capabilities: DeviceCapabilities;
  private renderQueued = false;

  constructor(root: HTMLElement) {
    this.root = root;
    this.capabilities = getDeviceCapabilities();
    this.mobileQuery = window.matchMedia('(max-width: 760px)');
    this.taskButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-task-button]'));

    this.registerWindows();
    this.bindGlobalEvents();
    this.bindTaskbar();
    this.syncResponsiveLayout();
    this.syncTaskbar();

    const firstWindow = Array.from(this.windows.values()).find(({ state }) => state.mode === 'normal');
    if (firstWindow) this.focus(firstWindow.state.id);
  }

  private registerWindows() {
    const elements = Array.from(this.root.querySelectorAll<HTMLElement>('[data-window-id]'));

    elements.forEach((el, index) => {
      const id = el.dataset.windowId;
      if (!id) return;

      const domRect = el.getBoundingClientRect();
      const rect = {
        x: domRect.left,
        y: domRect.top,
        width: domRect.width || 520,
        height: domRect.height || 420,
      };

      const app = apps.find((candidate) => candidate.id === id);

      const state: WindowState = {
        id,
        rect,
        mode: app?.initialOpen === true ? 'normal' : 'closed',
        zIndex: index + 10,
      };

      this.windows.set(id, { el, state });
      this.bindWindow(el, state);
    });
  }

  private bindGlobalEvents() {
    window.addEventListener('resize', () => this.syncResponsiveLayout());
    window.visualViewport?.addEventListener('resize', () => this.syncResponsiveLayout());
    this.mobileQuery.addEventListener('change', () => this.syncResponsiveLayout());

    document.addEventListener('keydown', (event) => {
      if (!this.activeId) return;

      if (event.key === 'Escape') {
        this.close(this.activeId);
      }

      if (event.altKey && event.key === 'F4') {
        event.preventDefault();
        this.close(this.activeId);
      }
    });

    window.addEventListener('blur', () => this.endPointerInteraction());
  }

  private bindTaskbar() {
    this.taskButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.taskButton;
        if (!id) return;
        const item = this.windows.get(id);
        if (!item) return;

        if (item.state.mode === 'closed' || item.state.mode === 'minimized') {
          this.open(id);
          return;
        }

        if (this.activeId === id) {
          this.minimize(id);
        } else {
          this.focus(id);
        }
      });
    });
  }

  private bindWindow(el: HTMLElement, state: WindowState) {
    el.addEventListener('pointerdown', () => this.focus(state.id));

    el.querySelectorAll<HTMLButtonElement>('[data-window-action]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const action = button.dataset.windowAction;
        if (action === 'minimize') this.minimize(state.id);
        if (action === 'maximize') this.toggleMaximize(state.id);
        if (action === 'close') this.close(state.id);
      });
    });

    const handle = el.querySelector<HTMLElement>('[data-drag-handle]');
    if (handle) {
      handle.addEventListener('dblclick', (event) => {
        if (this.capabilities.isMobile) return;
        const target = event.target as HTMLElement;
        if (target.closest('[data-window-action]')) return;
        this.toggleMaximize(state.id);
      });
      handle.addEventListener('pointerdown', (event) => {
        if (this.capabilities.isMobile || event.pointerType === 'touch') return;
        const target = event.target as HTMLElement;
        if (target.closest('[data-window-action]')) return;
        if (state.mode === 'maximized') return;

        event.preventDefault();
        this.focus(state.id);
        this.dragSession = {
          pointerId: event.pointerId,
          startPointerX: event.clientX,
          startPointerY: event.clientY,
          startRect: cloneRect(state.rect),
        };
        this.snapTargets = this.collectSnapTargets(el);
        this.activeViewportSnap = null;
        handle.setPointerCapture(event.pointerId);
        document.body.classList.add('dragging-window');
      });

      handle.addEventListener('pointermove', (event) => {
        if (!this.dragSession || event.pointerId !== this.dragSession.pointerId) return;
        const dx = event.clientX - this.dragSession.startPointerX;
        const dy = event.clientY - this.dragSession.startPointerY;
        state.rect = {
          ...this.dragSession.startRect,
          x: this.dragSession.startRect.x + dx,
          y: this.dragSession.startRect.y + dy,
        };

        this.activeViewportSnap = getViewportSnap(state.rect);
        this.updateSnapPreview(state.rect);
        this.scheduleRender();
      });

      handle.addEventListener('pointerup', (event) => {
        if (!this.dragSession || event.pointerId !== this.dragSession.pointerId) return;

        // Recompute from the final pointer position first so the last few pixels
        // of the drag cannot be lost between pointermove and pointerup.
        const dx = event.clientX - this.dragSession.startPointerX;
        const dy = event.clientY - this.dragSession.startPointerY;
        state.rect = {
          ...this.dragSession.startRect,
          x: this.dragSession.startRect.x + dx,
          y: this.dragSession.startRect.y + dy,
        };

        // Commit the exact rectangle represented by the visible preview.
        // This keeps the preview and final window geometry perfectly in sync.
        const viewportSnap = this.activeViewportSnap ?? getViewportSnap(state.rect);

        if (viewportSnap) {
          state.previousRect = cloneRect(this.dragSession.startRect);
          state.rect = cloneRect(viewportSnap.rect);
          state.mode = viewportSnap.zone === 'top-maximize' ? 'maximized' : 'normal';
        } else {
          state.rect = snapToViewport(state.rect);
          state.rect = snapToTargets(state.rect, this.snapTargets);
          state.mode = 'normal';
        }

        // Render before releasing the interaction state so the real window
        // receives the exact geometry that was previewed.
        this.render();
        this.endPointerInteraction();
      });

      handle.addEventListener('pointercancel', () => this.endPointerInteraction());
    }

    el.querySelectorAll<HTMLElement>('[data-resize]').forEach((resizeHandle) => {
      resizeHandle.addEventListener('pointerdown', (event) => {
        if (this.capabilities.isMobile || event.pointerType === 'touch') return;
        if (state.mode === 'maximized') return;

        event.preventDefault();
        event.stopPropagation();
        this.focus(state.id);
        this.resizeSession = {
          pointerId: event.pointerId,
          direction: resizeHandle.dataset.resize ?? 'se',
          startPointerX: event.clientX,
          startPointerY: event.clientY,
          startRect: cloneRect(state.rect),
        };
        this.snapTargets = this.collectSnapTargets(el);
        resizeHandle.setPointerCapture(event.pointerId);
        document.body.classList.add('resizing-window');
      });

      resizeHandle.addEventListener('pointermove', (event) => {
        if (!this.resizeSession || event.pointerId !== this.resizeSession.pointerId) return;
        const dx = event.clientX - this.resizeSession.startPointerX;
        const dy = event.clientY - this.resizeSession.startPointerY;
        state.rect = calculateResize(
          this.resizeSession.startRect,
          this.resizeSession.direction,
          dx,
          dy,
        );
        this.scheduleRender();
      });

      const endResize = () => {
        if (!this.resizeSession) return;
        state.rect = snapToViewport(state.rect);
        this.hideSnapPreview();
        this.endPointerInteraction();
        this.render();
      };

      resizeHandle.addEventListener('pointerup', endResize);
      resizeHandle.addEventListener('pointercancel', endResize);
    });

    el.querySelectorAll<HTMLElement>('[data-window-tab-close]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const tabId = button.dataset.windowTabClose;
        const tab = tabId ? el.querySelector<HTMLElement>(`[data-window-tab="${tabId}"]`) : null;
        if (tab) tab.remove();

        const remainingTabs = el.querySelectorAll('[data-window-tab]');
        if (remainingTabs.length === 0) this.close(state.id);
      });
    });
  }

  private collectSnapTargets(currentWindow: HTMLElement) {
    return Array.from(this.root.querySelectorAll<HTMLElement>('[data-window-id], [data-snap-target]'))
      .filter((el) => el !== currentWindow && !el.hidden && el.dataset.state !== 'closed' && el.dataset.state !== 'minimized')
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
      });
  }

  private updateSnapPreview(rect: WindowRect) {
    const preview = this.root.querySelector<HTMLElement>('[data-snap-preview]');
    if (!preview || this.capabilities.isMobile) return;

    const viewportSnap = this.activeViewportSnap ?? getViewportSnap(rect);

    if (!viewportSnap) {
      preview.classList.remove('visible');
      return;
    }

    const next = viewportSnap.rect;
    preview.classList.add('visible');
    preview.dataset.snapZone = viewportSnap.zone;
    preview.style.left = `${next.x}px`;
    preview.style.top = `${next.y}px`;
    preview.style.width = `${next.width}px`;
    preview.style.height = `${next.height}px`;
  }

  private hideSnapPreview() {
    this.root.querySelector<HTMLElement>('[data-snap-preview]')?.classList.remove('visible');
  }

  private endPointerInteraction() {
    this.dragSession = null;
    this.resizeSession = null;
    this.activeViewportSnap = null;
    this.snapTargets = [];
    this.hideSnapPreview();
    document.body.classList.remove('dragging-window', 'resizing-window');
  }

  focus(id: string) {
    const item = this.windows.get(id);
    if (!item || item.state.mode === 'closed') return;

    item.state.zIndex = ++this.nextZ;
    this.activeId = id;
    this.windows.forEach(({ el }) => {
      el.dataset.focused = el === item.el ? 'true' : 'false';
    });
    this.render();
  }

  open(id: string) {
    const item = this.windows.get(id);
    if (!item) return;

    if (item.state.mode === 'closed') {
      this.ensureDefaultTab(item.el);
      if (!item.state.rect.width || !item.state.rect.height) {
        item.state.rect = this.getFallbackRect(item.el);
      }
    }

    item.state.mode = 'normal';
    item.el.removeAttribute('hidden');
    this.focus(id);
  }

  minimize(id: string) {
    const item = this.windows.get(id);
    if (!item || item.state.mode === 'closed') return;
    item.state.mode = 'minimized';
    this.pickNextActive(id);
    this.render();
  }

  close(id: string) {
    const item = this.windows.get(id);
    if (!item) return;
    item.state.mode = 'closed';
    this.pickNextActive(id);
    this.render();
  }

  toggleMaximize(id: string) {
    const item = this.windows.get(id);
    if (!item || this.capabilities.isMobile) return;

    if (item.state.mode === 'maximized') {
      this.restore(id);
      return;
    }

    item.state.previousRect = cloneRect(item.state.rect);
    item.state.mode = 'maximized';
    item.state.rect = updateMaximizedRect();
    this.focus(id);
  }

  restore(id: string) {
    const item = this.windows.get(id);
    if (!item) return;

    item.state.rect = item.state.previousRect
      ? cloneRect(item.state.previousRect)
      : this.getFallbackRect(item.el);
    item.state.previousRect = undefined;
    item.state.mode = 'normal';
    this.focus(id);
  }

  private ensureDefaultTab(el: HTMLElement) {
    const tabList = el.querySelector<HTMLElement>('[data-tab-list]');
    if (!tabList || tabList.querySelector('[data-window-tab]')) return;

    const title = el.querySelector<HTMLElement>('.window-title h2')?.textContent ?? 'App';
    const icon = el.querySelector<HTMLElement>('.window-icon')?.textContent ?? '◼';
    const tab = document.createElement('button');
    tab.className = 'window-tab is-active';
    tab.type = 'button';
    tab.dataset.windowTab = 'main';
    tab.setAttribute('aria-selected', 'true');

    const iconSpan = document.createElement('span');
    iconSpan.setAttribute('aria-hidden', 'true');
    iconSpan.textContent = icon;

    const titleSpan = document.createElement('span');
    titleSpan.textContent = title;

    const close = document.createElement('span');
    close.className = 'window-tab-close';
    close.setAttribute('role', 'button');
    close.tabIndex = 0;
    close.dataset.windowTabClose = 'main';
    close.setAttribute('aria-label', `Close ${title} tab`);
    close.title = 'Close tab';
    close.textContent = '×';

    tab.append(iconSpan, titleSpan, close);
    tabList.append(tab);

    tab.addEventListener('click', (event) => {
      if ((event.target as HTMLElement).closest('[data-window-tab-close]')) return;
      tabList.querySelectorAll<HTMLElement>('[data-window-tab]').forEach((item) => item.classList.remove('is-active'));
      tab.classList.add('is-active');
    });

    const closeTab = (event: Event) => {
      event.stopPropagation();
      tab.remove();
      this.close(el.dataset.windowId ?? '');
    };

    close.addEventListener('click', closeTab);
    close.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        closeTab(event);
      }
    });
  }

  private pickNextActive(excludedId: string) {
    const next = Array.from(this.windows.values())
      .filter(({ state }) => state.id !== excludedId && state.mode === 'normal')
      .sort((a, b) => b.state.zIndex - a.state.zIndex)[0];

    this.activeId = next?.state.id ?? null;
    if (next) this.focus(next.state.id);
  }

  private getFallbackRect(el: HTMLElement): WindowRect {
    return {
      x: Math.max(12, (window.innerWidth - Math.min(640, window.innerWidth - 24)) / 2),
      y: 76,
      width: Math.min(640, window.innerWidth - 24),
      height: Math.min(520, window.innerHeight - TASKBAR_HEIGHT - 90),
    };
  }

  private syncResponsiveLayout() {
    this.capabilities = getDeviceCapabilities();
    this.root.dataset.mobile = this.capabilities.isMobile ? 'true' : 'false';

    this.windows.forEach(({ el, state }) => {
      el.dataset.resizable = this.capabilities.isMobile ? 'false' : 'true';
      if (this.capabilities.isMobile) {
        if (state.mode === 'maximized') state.mode = 'normal';
        el.style.removeProperty('left');
        el.style.removeProperty('top');
        el.style.removeProperty('width');
        el.style.removeProperty('height');
      } else if (state.mode === 'maximized') {
        state.rect = updateMaximizedRect();
      }
    });

    if (!this.capabilities.isMobile) this.render();
  }

  private syncTaskbar() {
    this.taskButtons.forEach((button) => {
      const id = button.dataset.taskButton;
      const item = id ? this.windows.get(id) : undefined;
      if (!item) return;

      const hidden = item.state.mode === 'closed';
      button.hidden = hidden;
      button.dataset.active = this.activeId === id && item.state.mode !== 'minimized' ? 'true' : 'false';
      button.dataset.minimized = item.state.mode === 'minimized' ? 'true' : 'false';
      button.setAttribute('aria-pressed', String(this.activeId === id));
    });
  }

  private render() {
    this.windows.forEach(({ el, state }) => {
      el.dataset.state = state.mode;
      el.style.zIndex = String(state.zIndex);
      if (!this.capabilities.isMobile) {
        el.style.setProperty('--window-x', `${state.rect.x}px`);
        el.style.setProperty('--window-y', `${state.rect.y}px`);
        el.style.setProperty('--window-w', `${state.rect.width}px`);
        el.style.setProperty('--window-h', `${state.rect.height}px`);
      }
    });

    this.syncTaskbar();
    this.root.dispatchEvent(new CustomEvent('window-state-change'));
  }

  private scheduleRender() {
    if (this.renderQueued) return;
    this.renderQueued = true;
    requestAnimationFrame(() => {
      this.renderQueued = false;
      this.render();
    });
  }
}
