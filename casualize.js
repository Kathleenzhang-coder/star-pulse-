/**
 * 把 RSS 转写成追星党聊天语气（中/英）
 * 正文不出现平台名、@账号、媒体出处
 */

const OPENERS = {
  zh: {
    gossip: ['姐妹们这瓜有点东西 🍉', '吃瓜预警 👀', '谁懂啊', '报——八卦来了'],
    release: ['有新活了 ✨', '追更预警 📣', '来了来了', '今日份惊喜'],
    celebrity: ['刚刷到的 ↓', '简单说就是', '今日动态', '家人们注意了'],
    drama: ['追剧预警 📺', '片单更新了', '这部可以追', '影视速报'],
  },
  en: {
    gossip: ['Tea alert 🍉', 'OK so apparently', 'No way—', 'Gossip time 👀'],
    release: ['New drop ✨', 'Heads up 📣', 'It\'s happening', 'Fresh update'],
    celebrity: ['Just saw this ↓', 'Quick recap:', 'Today\'s update', 'FYI fam'],
    drama: ['Watchlist alert 📺', 'New on screen', 'This one\'s coming', 'Film & TV scoop'],
  },
};

const OPENER_RATE = 0.38;

const SOURCE_NOISE = [
  /\(@[A-Za-z0-9_]+\)\s*\/?\s*(Posts?|帖子|Tweets?|X|Twitter)?/gi,
  /\s*\/?\s*(Posts?|帖子|Tweets?)\s*\/?\s*(X|Twitter|微博|Instagram|ins)?\s*$/gi,
  /^@[A-Za-z0-9_\u4e00-\u9fff]{2,}\s*(\/|:|：)?\s*/i,
  /\b(site:)?(weibo|douyin|xiaohongshu|instagram|twitter|x)\.com\b/gi,
  /小红书\s*[-–—]?\s*Xiaohongshu/gi,
  /\bxhs\s+update\b/gi,
  /\b(weibo|douyin|instagram|twitter)\s+update\b/gi,
  /^(微博|抖音|小红书|Instagram|X|Twitter|Ins)\s*[-–—|:：]\s*/i,
  /\s+(via|来自|source:)\s*(微博|抖音|小红书|Instagram|X|Twitter)/gi,
  /【[^】]{0,10}(微博|抖音|小红书|女人|GOODY25)[^】]{0,10}】/g,
  /\s*[-–—|]\s*(GOODY25|联合早报|Harper'?s Bazaar|allkpop|Spotify)[^.]{0,30}$/gi,
  /\(\s*📷[^)]*\)/g,
  /\[\d{6,8}\]\s*#/g,
];

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function stripSources(text) {
  if (!text) return '';
  let s = text;
  for (const re of SOURCE_NOISE) s = s.replace(re, ' ');
  s = s
    .replace(/\s*[-–—|]\s*[^-–—|]{3,40}$/g, '')
    .replace(/\s*-\s*[A-Za-z0-9.]+\.[a-z]{2,}\s*$/i, '')
    .replace(/【[^】]{1,14}】/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return s;
}

function cleanHeadline(raw) {
  return stripSources(raw);
}

function isWeakContent(text) {
  if (!text || text.length < 10) return true;
  if (/^[@#/\\|\s]+$/.test(text)) return true;
  if (/^(Posts?|帖子|Tweets?|X|Twitter|微博|抖音|小红书)$/i.test(text.trim())) return true;
  if (/^@[A-Za-z0-9_]+\s*\/?\s*$/i.test(text.trim())) return true;
  return false;
}

function firstChunk(text, max = 85) {
  if (!text) return '';
  const s = text.replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const stops = ['。', '！', '？', '.', '!', '?', '…', '，', ','];
  let best = -1;
  for (const p of stops) {
    const i = cut.lastIndexOf(p);
    if (i > best) best = i;
  }
  return best > 20 ? cut.slice(0, best + 1) : cut.trim() + '…';
}

function pickOpener(type, core, lang) {
  if (hash(`${core}:op`) % 100 >= OPENER_RATE * 100) return '';
  const pool = OPENERS[lang][type] || OPENERS[lang].celebrity;
  return pool[hash(`${core}:pick`) % pool.length];
}

function buildBlurb(core, detail, lang) {
  const coreShort = firstChunk(core, 58);
  const detailShort = detail && detail !== core ? firstChunk(detail, 72) : '';

  if (detailShort && !core.includes(detailShort.slice(0, 10))) {
    const joiner = lang === 'zh' ? '，' : '. ';
    return `${coreShort}${joiner}${detailShort}`.slice(0, 132);
  }
  return coreShort.slice(0, 132);
}

function casualize(rawTitle, rawSummary, type, region, lang = 'zh') {
  const L = lang === 'en' ? 'en' : 'zh';
  const core = cleanHeadline(rawTitle);
  const detail = rawSummary && rawSummary.length > 15 ? stripSources(rawSummary) : '';

  if (isWeakContent(core) && isWeakContent(detail)) {
    return { content: '' };
  }

  const blurb = buildBlurb(core, detail, L);
  if (isWeakContent(blurb)) return { content: '' };

  const opener = pickOpener(type, core, L);
  const content = stripSources(
    (opener ? `${opener} ${blurb}` : blurb)
      .replace(/\s+/g, ' ')
      .replace(/^[。，,\s]+/, ''),
  ).slice(0, 160);

  return { content: isWeakContent(content) ? '' : content };
}

module.exports = { casualize, cleanHeadline, stripSources, isWeakContent };
