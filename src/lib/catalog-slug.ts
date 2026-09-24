/** Reserve space for the suffix so long duplicate names always make progress. */
export function uniqueCatalogSlug(base: string, seen: Set<string>): string {
  const slug = base.slice(0, 60);
  let candidate = slug;
  for (let counter = 2; seen.has(candidate); counter++) {
    const suffix = `-${counter}`;
    candidate = `${slug.slice(0, 60 - suffix.length)}${suffix}`;
  }
  seen.add(candidate);
  return candidate;
}
