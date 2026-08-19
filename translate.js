/**
 * 轻量翻译 — 中文模式下把英/日原文转成中文摘要
 */

const cache = new Map();
const MAX_CACHE = 400;

function isJapanese(text) {
  if (!text) return false;
  const kana = (text.match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
  return kana / text.length > 0.06;
}

function isMostlyLatin(text) {
  if (!text) return false;
  const latin = (text.match(/[a-zA-Z]/g) || []).length;
  return latin / text.length > 0.35;
}

function isMostlyChinese(text) {
  if (!text) return false;
  const han = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  return han / text.length > 0.28;
}

function needsChineseLocalization(text, lang) {
  if (lang !== 'zh' || !text?.trim()) return false;
  if (isJapanese(text)) return true;
  if (isMostlyLatin(text)) return true;
  return !isMostlyChinese(text);
}

async function translateText(text, target = 'zh-CN') {
  const input = text?.trim();
  if (!input) return text;

  const key = `${target}:${input.slice(0, 220)}`;
  if (cache.has(key)) return cache.get(key);

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(input.slice(0, 480))}`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 StarPulse/1.0' },
      signal: AbortSignal.timeout(9000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const out = (data[0] || []).map(part => part[0]).join('').trim() || input;
    if (cache.size >= MAX_CACHE) cache.clear();
    cache.set(key, out);
    return out;
  } catch {
    return input;
  }
}

async function localizeForChinese(title, summary, lang) {
  if (lang !== 'zh') return { title, summary };

  let outTitle = title;
  let outSummary = summary;

  if (needsChineseLocalization(title, lang)) {
    outTitle = await translateText(title);
  }
  if (summary && needsChineseLocalization(summary, lang)) {
    outSummary = await translateText(summary);
  }

  return { title: outTitle, summary: outSummary };
}

module.exports = {
  translateText,
  localizeForChinese,
  needsChineseLocalization,
  isJapanese,
  isMostlyLatin,
  isMostlyChinese,
};
