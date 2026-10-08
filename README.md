# Frutiger Aero type Portfolio

A modular Astro portfolio styled like a glossy early-Windows desktop with a Frutiger Aero-inspired visual language.

## What was added in v1.1

- Pointer-event based desktop dragging.
- Eight-direction resize handles: N, NE, E, SE, S, SW, W, NW.
- Minimum window dimensions and viewport clamping.
- Snap-to-viewport and snap-to-other-window/UI-element behavior.
- Snap preview regions near screen edges.
- Maximize/restore with preserved geometry.
- Mobile detection using viewport + pointer/hover capabilities.
- Desktop resizing/dragging disabled on mobile/touch pointers.
- Internal window-body scrolling with scroll chaining prevented.
- Closable window tabs; closing the last tab closes the app and removes it from the taskbar.
- Minimized windows remain on the taskbar and can be restored.
- Escape closes the active window.
- ResizeObserver-ready geometry design using DOM rect collection at gesture start.
- Centralized `WindowManager` so individual apps remain content-only.

## Structure

- `src/lib/apps.ts` — app registry.
- `src/lib/windowing.ts` — geometry, device detection, resizing, snapping constants/helpers.
- `src/lib/WindowManager.ts` — interaction/state manager.
- `src/components/Window.astro` — reusable chrome, tabs, and eight resize handles.
- `src/components/Desktop.astro` — desktop shell and application mounting.
- `src/components/Taskbar.astro` — taskbar and Start menu.
- `src/components/apps/*.astro` — independent application content.
- `src/styles/global.css` — Frutiger Aero / early-Windows visual system and responsive rules.

## Add another app

1. Create a new `src/components/apps/MyApp.astro` component.
2. Add it to `apps` in `src/lib/apps.ts`.
3. Add it to `appComponents` in `src/components/Desktop.astro`.
4. The window manager, taskbar, dragging, resizing, snapping, maximize/restore, and mobile behavior work automatically.

## Run

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```
