// ============================================
// Graceful Shutdown State
// Shared module to avoid circular dependencies
// ============================================
let isShuttingDown = false;

export function getIsShuttingDown(): boolean {
  return isShuttingDown;
}

export function setShuttingDown(value: boolean): void {
  isShuttingDown = value;
}
