import { useState, useEffect } from "react";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("indexes_favorites");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => {
      const isFav = prev.includes(productId);
      const next = isFav ? prev.filter((id) => id !== productId) : [...prev, productId];
      try {
        localStorage.setItem("indexes_favorites", JSON.stringify(next));
        window.dispatchEvent(new Event("favorites_updated"));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const handleSync = () => {
      try {
        const stored = localStorage.getItem("indexes_favorites");
        if (stored) setFavorites(JSON.parse(stored));
      } catch {}
    };
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
