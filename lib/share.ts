interface SharedData {
  manga: { id: string; title: string; coverUrl: string; status: string; year: number | null }[];
  anime: { id: number; title: string; coverUrl: string; status: string | null; episodes: number | null; score: number | null }[];
}

export function encodeFavorites(): string {
  const manga = JSON.parse(localStorage.getItem("manga-favorites") || "[]");
  const anime = JSON.parse(localStorage.getItem("anime-favorites") || "[]");
  const data: SharedData = { manga, anime };
  return btoa(encodeURIComponent(JSON.stringify(data)));
}

export function decodeFavorites(encoded: string): SharedData {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)));
  } catch {
    return { manga: [], anime: [] };
  }
}

export function getShareUrl(): string {
  const encoded = encodeFavorites();
  return `${window.location.origin}/shared?data=${encoded}`;
}
