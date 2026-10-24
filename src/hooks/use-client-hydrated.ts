import { useEffect, useState } from "react";

/**
 * Server rendering and the browser's first hydration render must agree.
 * Client-only catalog queries start after the React tree has hydrated.
 */
export function useClientHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
