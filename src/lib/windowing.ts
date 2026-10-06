export type WindowMode = 'normal' | 'maximized' | 'minimized' | 'closed';

export type WindowRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DeviceCapabilities = {
  isTouch: boolean;
  isMobile: boolean;
  isDesktop: boolean;
};

export type SnapTarget = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export const TASKBAR_HEIGHT = 48;
export const MOBILE_BREAKPOINT = 760;
export const SNAP_DISTANCE = 14;
export const MIN_WINDOW_WIDTH = 320;
export const MIN_WINDOW_HEIGHT = 240;

export function getDeviceCapabilities(): DeviceCapabilities {
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const noHover = window.matchMedia('(hover: none)').matches;
  const narrowViewport = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;

  return {
    isTouch: coarsePointer,
    isMobile: narrowViewport || (coarsePointer && noHover),
    isDesktop: !narrowViewport && !coarsePointer,
  };
}

export function cloneRect(rect: WindowRect): WindowRect {
  return { ...rect };
}

export function clampRect(rect: WindowRect): WindowRect {
  const availableHeight = Math.max(window.innerHeight - TASKBAR_HEIGHT, MIN_WINDOW_HEIGHT);
  const maxX = Math.max(0, window.innerWidth - rect.width);
  const maxY = Math.max(0, availableHeight - rect.height);

  return {
    ...rect,
    x: Math.min(Math.max(rect.x, 0), maxX),
    y: Math.min(Math.max(rect.y, 0), maxY),
  };
}

export function updateMaximizedRect(): WindowRect {
  return {
    x: 12,
    y: 12,
    width: Math.max(MIN_WINDOW_WIDTH, window.innerWidth - 24),
    height: Math.max(MIN_WINDOW_HEIGHT, window.innerHeight - TASKBAR_HEIGHT - 24),
  };
}

export function calculateResize(
  start: WindowRect,
  direction: string,
  dx: number,
  dy: number,
): WindowRect {
  let x = start.x;
  let y = start.y;
  let width = start.width;
  let height = start.height;

  if (direction.includes('e')) width = start.width + dx;
  if (direction.includes('s')) height = start.height + dy;
  if (direction.includes('w')) {
    x = start.x + dx;
    width = start.width - dx;
  }
  if (direction.includes('n')) {
    y = start.y + dy;
    height = start.height - dy;
  }

  if (width < MIN_WINDOW_WIDTH) {
    if (direction.includes('w')) x = start.x + start.width - MIN_WINDOW_WIDTH;
    width = MIN_WINDOW_WIDTH;
  }

  if (height < MIN_WINDOW_HEIGHT) {
    if (direction.includes('n')) y = start.y + start.height - MIN_WINDOW_HEIGHT;
    height = MIN_WINDOW_HEIGHT;
  }

  return clampRect({ x, y, width, height });
}

export function snapToViewport(rect: WindowRect): WindowRect {
  const bottomEdge = window.innerHeight - TASKBAR_HEIGHT;
  const next = { ...rect };

  if (Math.abs(next.x) <= SNAP_DISTANCE) next.x = 0;
  if (Math.abs(window.innerWidth - (next.x + next.width)) <= SNAP_DISTANCE) {
    next.x = window.innerWidth - next.width;
  }
  if (Math.abs(next.y) <= SNAP_DISTANCE) next.y = 0;
  if (Math.abs(bottomEdge - (next.y + next.height)) <= SNAP_DISTANCE) {
    next.y = bottomEdge - next.height;
  }

  return clampRect(next);
}

export function snapToTargets(rect: WindowRect, targets: SnapTarget[]): WindowRect {
  const next = { ...rect };

  for (const target of targets) {
    const overlapsVertically = next.y < target.bottom && next.y + next.height > target.top;
    const overlapsHorizontally = next.x < target.right && next.x + next.width > target.left;

    if (overlapsVertically) {
      if (Math.abs(next.x + next.width - target.left) <= SNAP_DISTANCE) next.x = target.left - next.width;
      if (Math.abs(next.x - target.right) <= SNAP_DISTANCE) next.x = target.right;
    }

    if (overlapsHorizontally) {
      if (Math.abs(next.y + next.height - target.top) <= SNAP_DISTANCE) next.y = target.top - next.height;
      if (Math.abs(next.y - target.bottom) <= SNAP_DISTANCE) next.y = target.bottom;
    }
  }

  return clampRect(next);
}
