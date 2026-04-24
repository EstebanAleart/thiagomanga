/**
 * Anime News Network Encyclopedia API
 * Docs: https://www.animenewsnetwork.com/encyclopedia/api.php
 * Terms: Must credit ANN and link to encyclopedia entries
 */

const ANN_BASE = "https://cdn.animenewsnetwork.com/encyclopedia";
const ANN_REPORTS = "https://www.animenewsnetwork.com/encyclopedia";

export interface ANNTitle {
  id: number;
  gid: number;
  type: "anime" | "manga";
  name: string;
  precision: string;
  vintage: string | null;
}

export interface ANNDetail {
  id: number;
  type: "anime" | "manga";
  name: string;
  url: string;
  // Info entries (plot, genres, themes, etc.)
  plot: string | null;
  genres: string[];
  themes: string[];
  // Cast / Staff
  staff: { task: string; person: string }[];
  cast: { role: string; person: string; language?: string }[];
  // Ratings
  bayesian_score: string | null;
  nb_votes: string | null;
  // Episodes / Volumes
  episodes: number | null;
  volumes: number | null;
  // Dates
  startDate: string | null;
  endDate: string | null;
  // Images
  coverUrl: string | null;
  // Related titles
  related: { id: number; type: string; name: string; rel: string }[];
  // Raw info items
  info: { type: string; value: string; href?: string }[];
}

function parseDate(vintage: string | null): string | null {
  if (!vintage) return null;
  return vintage;
}

/**
 * Parse ANN reports XML into a list of titles
 */
export function parseReportsXML(xml: string): ANNTitle[] {
  const titles: ANNTitle[] = [];
  const itemRegex = /<item\s+([^>]+)\/>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const attrs = match[1];
    const get = (key: string) => {
      const m = attrs.match(new RegExp(`${key}="([^"]*)"`));
      return m ? m[1] : null;
    };
    const id = parseInt(get("id") || "0");
    const type = (get("type") || "anime") as "anime" | "manga";
    const name = get("name") || "";
    const precision = get("precision") || "";
    const vintage = get("vintage") || null;
    const gid = parseInt(get("gid") || "0");
    if (id && name) {
      titles.push({ id, gid, type, name, precision, vintage });
    }
  }
  return titles;
}

/**
 * Parse ANN details XML for a single title
 */
export function parseDetailsXML(xml: string): ANNDetail | null {
  // Get the ann element (anime or manga)
  const annMatch = xml.match(/<ann>([\s\S]*)<\/ann>/);
  if (!annMatch) return null;
  const content = annMatch[1];

  // Get main element (anime or manga)
  const mainMatch = content.match(/<(anime|manga)\s+([^>]+)>([\s\S]*?)<\/\1>/);
  if (!mainMatch) return null;

  const type = mainMatch[1] as "anime" | "manga";
  const mainAttrs = mainMatch[2];
  const mainContent = mainMatch[3];

  const getAttr = (attrs: string, key: string) => {
    const m = attrs.match(new RegExp(`${key}="([^"]*)"`));
    return m ? m[1] : null;
  };

  const id = parseInt(getAttr(mainAttrs, "id") || "0");
  const name = getAttr(mainAttrs, "name") || "";
  const url = `https://www.animenewsnetwork.com/encyclopedia/${type}.php?id=${id}`;

  // Parse info elements
  const info: { type: string; value: string; href?: string }[] = [];
  const infoRegex = /<info\s+[^>]*type="([^"]*)"[^>]*>([\s\S]*?)<\/info>/g;
  let infoMatch;
  while ((infoMatch = infoRegex.exec(mainContent)) !== null) {
    const infoType = infoMatch[1];
    const inner = infoMatch[2];
    // Extract all text+href combos from this info block
    const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g;
    let linkMatch;
    let hasLinks = false;
    while ((linkMatch = linkRegex.exec(inner)) !== null) {
      hasLinks = true;
      info.push({ type: infoType, value: linkMatch[2].trim(), href: linkMatch[1] });
    }
    if (!hasLinks) {
      // Plain text value
      const text = inner.replace(/<[^>]+>/g, "").trim();
      if (text) info.push({ type: infoType, value: text });
    }
  }

  // Also parse self-closing info tags
  const infoSelfRegex = /<info\s+[^/]*type="([^"]*)"[^/]*\/>/g;
  while ((infoMatch = infoSelfRegex.exec(mainContent)) !== null) {
    // usually empty, skip
  }

  // Extract specific fields
  const getInfo = (type: string) => info.filter(i => i.type === type).map(i => i.value);
  const getFirstInfo = (type: string) => info.find(i => i.type === type)?.value || null;

  // Plot summary
  const plotMatch = mainContent.match(/<info[^>]*type="Plot Summary"[^>]*>([\s\S]*?)<\/info>/);
  const plot = plotMatch ? plotMatch[1].replace(/<[^>]+>/g, "").trim() : null;

  // Episodes/Volumes
  const episodesStr = getFirstInfo("Number of episodes") || getFirstInfo("Episodes");
  const volumesStr = getFirstInfo("Number of tankoubon") || getFirstInfo("Volumes");

  // Bayesian score
  const bayesianMatch = mainContent.match(/<ratings\s+[^>]*bayesian_score="([^"]*)"[^>]*nb_votes="([^"]*)"/);

  // Cover image
  const imgMatch = mainContent.match(/<img\s+[^>]*src="([^"]*)"[^>]*>/);
  let coverUrl = imgMatch ? imgMatch[1] : null;
  if (coverUrl && !coverUrl.startsWith("http")) {
    coverUrl = `https://www.animenewsnetwork.com${coverUrl}`;
  }

  // Dates
  const vintage = getAttr(mainAttrs, "vintage") || null;
  const startDate = getFirstInfo("Vintage") || vintage;
  const endDate = null;

  // Staff
  const staff: { task: string; person: string }[] = [];
  const staffRegex = /<staff>([\s\S]*?)<\/staff>/;
  const staffMatch = mainContent.match(staffRegex);
  if (staffMatch) {
    const taskRegex = /<task>([^<]*)<\/task>[\s\S]*?<person[^>]*>([^<]*)<\/person>/g;
    let taskMatch;
    while ((taskMatch = taskRegex.exec(staffMatch[1])) !== null) {
      staff.push({ task: taskMatch[1].trim(), person: taskMatch[2].trim() });
    }
  }

  // Cast
  const cast: { role: string; person: string; language?: string }[] = [];
  const castRegex = /<cast>([\s\S]*?)<\/cast>/;
  const castMatch = mainContent.match(castRegex);
  if (castMatch) {
    const roleRegex = /<role>([^<]*)<\/role>[\s\S]*?<person[^>]*>([^<]*)<\/person>(?:[\s\S]*?lang="([^"]*)")?/g;
    let roleMatch;
    while ((roleMatch = roleRegex.exec(castMatch[1])) !== null) {
      cast.push({ role: roleMatch[1].trim(), person: roleMatch[2].trim(), language: roleMatch[3] });
    }
  }

  // Related titles
  const related: { id: number; type: string; name: string; rel: string }[] = [];
  const relRegex = /<related-prev\s+([^>]*)\/>/g;
  let relMatch;
  while ((relMatch = relRegex.exec(mainContent)) !== null) {
    const attrs = relMatch[1];
    const relId = parseInt(getAttr(attrs, "id") || "0");
    const relType = getAttr(attrs, "type") || "";
    const relName = getAttr(attrs, "name") || "";
    const rel = getAttr(attrs, "rel") || "";
    if (relId) related.push({ id: relId, type: relType, name: relName, rel });
  }

  return {
    id,
    type,
    name,
    url,
    plot,
    genres: getInfo("Genres"),
    themes: getInfo("Themes"),
    staff: staff.slice(0, 20),
    cast: cast.slice(0, 20),
    bayesian_score: bayesianMatch ? bayesianMatch[1] : null,
    nb_votes: bayesianMatch ? bayesianMatch[2] : null,
    episodes: episodesStr ? parseInt(episodesStr) : null,
    volumes: volumesStr ? parseInt(volumesStr) : null,
    startDate,
    endDate,
    coverUrl,
    related,
    info,
  };
}

/**
 * Fetch list of anime/manga from ANN reports
 * id=155 is the "all titles" report
 */
export async function fetchANNReports(
  type: "anime" | "manga" = "anime",
  nlist = 50,
  nskip = 0,
  name?: string
): Promise<ANNTitle[]> {
  const params = new URLSearchParams({
    id: "155",
    type,
    nlist: nlist.toString(),
    nskip: nskip.toString(),
  });
  if (name) params.set("name", name);

  const url = `${ANN_REPORTS}/reports.xml?${params}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "MangaThiago/1.0 (educational project)" },
    next: { revalidate: 3600 }, // cache 1h
  });
  if (!res.ok) throw new Error(`ANN reports error: ${res.status}`);
  const xml = await res.text();
  return parseReportsXML(xml);
}

/**
 * Fetch details for one or more titles from ANN
 */
export async function fetchANNDetails(
  ids: number[],
  type: "anime" | "manga" | "title" = "title"
): Promise<ANNDetail[]> {
  if (ids.length === 0) return [];
  // Max 50 per batch
  const batch = ids.slice(0, 50);
  const idStr = batch.join("/");
  const url = `${ANN_BASE}/api.xml?${type}=${idStr}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "MangaThiago/1.0 (educational project)" },
    next: { revalidate: 86400 }, // cache 24h
  });
  if (!res.ok) throw new Error(`ANN details error: ${res.status}`);
  const xml = await res.text();

  // Parse multiple details from one XML response
  const details: ANNDetail[] = [];
  const detail = parseDetailsXML(xml);
  if (detail) details.push(detail);
  return details;
}

/**
 * Search ANN by name prefix
 */
export async function searchANN(
  query: string,
  type: "anime" | "manga" = "anime"
): Promise<ANNTitle[]> {
  // ANN supports name= parameter for first-letter filtering
  // For full search we filter client-side from the report
  const firstChar = query.charAt(0).toUpperCase();
  const titles = await fetchANNReports(type, 200, 0, firstChar);
  const q = query.toLowerCase();
  return titles.filter(t => t.name.toLowerCase().includes(q)).slice(0, 20);
}
