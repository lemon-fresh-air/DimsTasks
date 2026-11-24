const searchWordPattern = /[\p{L}\p{N}][\p{L}\p{N}\p{M}]*(?:['’ʼ‘][\p{L}\p{N}\p{M}]+)*/gu;

function searchWords(text) {
  return Array.from(text.matchAll(searchWordPattern), match => ({
    value: match[0].normalize("NFC").toLocaleLowerCase("uk-UA").replace(/[’ʼ‘]/gu, "'"),
    start: match.index,
    end: match.index + match[0].length
  }));
}

function prepareSearchEntries(entries) {
  return entries.map(entry => ({ ...entry, titleWords: searchWords(entry.title),
    descriptionWords: searchWords(entry.description) }));
}

function searchWordMatch(query, word) {
  if (query === word) return 4;
  if (query.length < 2) return 0;
  if (word.startsWith(query)) return 3;
  if (query.length >= 3 && word.includes(query)) return 2;
  if (query.length < 5 || word.length !== query.length) return 0;
  let first = 0;
  while (query[first] === word[first]) first++;
  return word[first] === query[first + 1] && word[first + 1] === query[first]
    && word.slice(first + 2) === query.slice(first + 2) ? 1 : 0;
}

function bestSearchWord(term, words) {
  let best = null;
  for (const word of words) {
    const score = searchWordMatch(term, word.value);
    if (score && (!best || score > best.score)) best = { ...word, score };
    if (score === 4) break;
  }
  if (best?.score === 2 || best?.score === 3) {
    if (best.end - best.start === best.value.length) {
      best.start += best.value.indexOf(term);
      best.end = best.start + term.length;
    }
  }
  return best;
}

function searchEntries(entries, query, { type = "all", includeCompleted = false } = {}) {
  const queryWords = searchWords(query).map(word => word.value);
  if (!queryWords.some(word => word.length >= 2)) return [];
  const terms = [...new Set(queryWords)];
  const phrase = queryWords.join(" ");
  const results = [];
  for (const entry of entries) {
    if (type !== "all" && type !== entry.type) continue;
    if (entry.completed && !includeCompleted) continue;
    const titleMatches = [];
    const descriptionMatches = [];
    let score = 0;
    let approximate = false;
    for (const term of terms) {
      const title = bestSearchWord(term, entry.titleWords);
      const description = title?.score === 4 ? null : bestSearchWord(term, entry.descriptionWords);
      const useTitle = title && (!description || title.score >= description.score);
      const best = useTitle ? title : description;
      if (!best) break;
      (useTitle ? titleMatches : descriptionMatches).push(best);
      score += best.score * 2 + Number(Boolean(useTitle));
      approximate ||= best.score === 1;
    }
    if (titleMatches.length + descriptionMatches.length !== terms.length) continue;
    const fullTitle = entry.titleWords.map(word => word.value).join(" ") === phrase;
    results.push({ entry, titleMatches, descriptionMatches, score, approximate, fullTitle });
  }
  return results.sort((a, b) => Number(b.fullTitle) - Number(a.fullTitle)
    || Number(a.approximate) - Number(b.approximate)
    || Number(!b.descriptionMatches.length) - Number(!a.descriptionMatches.length)
    || b.score - a.score || a.entry.title.localeCompare(b.entry.title, "uk-UA"));
}
