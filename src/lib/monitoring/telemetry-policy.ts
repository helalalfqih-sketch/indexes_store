/** Only server failures belong in the persistent error stream. */
export function shouldPersistHttpFailure(status: number): boolean {
  return Number.isInteger(status) && status >= 500 && status <= 599;
}
