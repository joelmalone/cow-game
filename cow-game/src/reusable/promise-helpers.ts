export function delay(msec: number) {
  return new Promise((resolve) => setTimeout(resolve, msec));
}
