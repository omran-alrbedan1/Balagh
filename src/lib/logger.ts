export function logError(error: unknown) {
  if (__DEV__) {
    console.error(error);
  }
}
