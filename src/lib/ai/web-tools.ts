export interface WebSearchResult {
  title: string;
  snippet: string;
  link: string;
}

export async function fetchLiveWebInfo(query: string): Promise<{
  webContext: string;
  results: WebSearchResult[];
  verified: boolean;
}> {
  const results: WebSearchResult[] = [];

  try {
    // 1. DuckDuckGo Instant Answer API
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const ddgRes = await fetch(ddgUrl, { signal: AbortSignal.timeout(4000) });

    if (ddgRes.ok) {
      const data = await ddgRes.json();
      if (data.AbstractText) {
        results.push({
          title: data.Heading || query,
          snippet: data.AbstractText,
          link: data.AbstractURL || "https://duckduckgo.com",
        });
      }
      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        data.RelatedTopics.slice(0, 3).forEach((t: any) => {
          if (t.Text) {
            results.push({
              title: t.FirstURL ? t.FirstURL.split("/").pop()?.replace(/_/g, " ") || "Info" : "Reference",
              snippet: t.Text,
              link: t.FirstURL || "https://duckduckgo.com",
            });
          }
        });
      }
    }
  } catch (e) {
    // Fallthrough to Wikipedia
  }

  // 2. Wikipedia Search fallback if DDG returned limited results
  if (results.length < 2) {
    try {
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        query
      )}&format=json&origin=*`;
      const wikiRes = await fetch(wikiUrl, { signal: AbortSignal.timeout(4000) });
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        const searchResults = wikiData.query?.search || [];
        searchResults.slice(0, 3).forEach((item: any) => {
          results.push({
            title: item.title,
            snippet: item.snippet.replace(/<[^>]+>/g, ""),
            link: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
          });
        });
      }
    } catch (e) {
      // Ignore
    }
  }

  const verified = results.length > 0;
  const webContext = verified
    ? `[LIVE WEB / CURRENT INFORMATION KNOWLEDGE]:\n` +
      results.map((r, i) => `[Source ${i + 1}]: ${r.title} — ${r.snippet} (${r.link})`).join("\n")
    : "";

  return {
    webContext,
    results,
    verified,
  };
}
