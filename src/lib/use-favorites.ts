import { useState, useEffect } from "react";

function readFavorites(): string[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem("indexes_favorites") ?? "[]");
    return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  // The server cannot read browser storage. Hydrate its empty snapshot first.
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => {
      const isFav = prev.includes(productId);
      const next = isFav ? prev.filter((id) => id !== productId) : [...prev, productId];
      try {
        localStorage.setItem("indexes_favorites", JSON.stringify(next));
        window.dispatchEvent(new Event("favorites_updated"));
      } catch {
        /* Favorites remain usable when browser storage is unavailable. */
      }
      return next;
    });
  };

  useEffect(() => {
    const handleSync = () => setFavorites(readFavorites());
    handleSync();
    window.addEventListener("favorites_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("favorites_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  return {
    favorites,
    isFavorite: (id: string) => favorites.includes(id),
    toggleFavorite,
  };
}
