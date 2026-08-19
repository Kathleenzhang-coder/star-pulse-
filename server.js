/**
 * StarPulse 本地服务 — 静态页面 + 真实娱乐 RSS 聚合（累积式实时流）
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const Parser = require('rss-parser');
const { FEEDS } = require('./feeds');
const { casualize, isWeakContent } = require('./casualize');
const { localizeForChinese } = require('./translate');
const multer = require('multer');
const {
  UPLOADS_DIR,
  ensureUploadsDir,
  getPosts,
  getPost,
  createPost,
  updatePost,
} = require('./posts-api');

ensureUploadsDir();

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '') || '';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 12 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    cb(null, /^(image\/|video\/)/.test(file.mimetype));
  },
});

const app = express();
const PORT = process.env.PORT || 5174;
const STORE_PATH = path.join(__dirname, '.news-store.json');
const parser = new Parser({
  customFields: {
    item: [['media:content', 'mediaContent'], ['thumbnail', 'thumbnail']],
  },
  timeout: 25000,
  headers: {
    'User-Agent': 'StarPulse/1.0 (local entertainment aggregator)',
    Accept: 'application/rss+xml, application/xml, text/xml, */*',
  },
});

const BLOCKLIST = /电子游戏|彩票|赌博|slot|casino|报考指南|下载app|seo|keyword/i;
const TH_BL_GL_KW = /\bBL\b|\bGL\b|boys love|girl.?s love|girls love|\bCP\b|couple|Yuri|yuri|y series|GMMTV|泰腐|百合|Billkin|PP Krit|Bright|Win|Mile|Apo/i;
const GOSSIP_KW = /八卦|绯闻|恋爱|分手|出轨|爆料|rumor|dating|breakup|scandal|affair|split|controversy|lawsuit|feud|回应|澄清|否认/i;
const RELEASE_KW = /新专|回归|comeback|album|single|mv|预告|premiere|trailer|debut|tour|concert|发行|ost|brand|ambassador|代言/i;
const DRAMA_KW = /电影|电视剧|剧集|泰剧|韩剧|日剧|美剧|英剧|国产剧|网剧|短剧|上映|票房|开播|定档|season|series|film|movie|drama|episode|Netflix|Disney|HBO|Marvel|流媒体|院线|杀青|官宣|续集|大结局|番外|BL剧|GL剧/i;
const NON_ENT_BLOCK = /运动健身|she economy|NikeSKIMS|消费崛起|报考指南|理财产品|股票基金|加密货币/i;

const CACHE_TTL = 5 * 60 * 1000;
const MAX_ITEM_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const MIN_ITEM_TIMESTAMP = new Date('2026-01-01T00:00:00+08:00').getTime();
const MAX_STORED_ITEMS = 800;
const ITEMS_PER_FEED = 20;
const FETCH_CONCURRENCY = 6;

let cache = {
  zh: { items: [], fetchedAt: 0 },
  en: { items: [], fetchedAt: 0 },
};

function loadStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) return;
    const saved = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    if (saved?.zh?.items) cache.zh = saved.zh;
    if (saved?.en?.items) cache.en = saved.en;
    console.log(`[Store] 已加载 zh:${cache.zh.items.length} en:${cache.en.items.length}`);
  } catch (err) {
    console.warn('[Store] 读取失败:', err.message);
  }
}

function persistStore() {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(cache));
  } catch (err) {
    console.warn('[Store] 写入失败:', err.message);
  }
}

function withRecentWindow(url) {
  if (!url.includes('news.google.com')) return url;
  return url.replace(/([?&]q=)([^&]+)/, (_, prefix, q) => {
    const decoded = decodeURIComponent(q.replace(/\+/g, ' '));
    if (/when:\d+d/i.test(decoded)) return `${prefix}${q}`;
    return `${prefix}${encodeURIComponent(`${decoded} when:7d`).replace(/%20/g, '+')}`;
  });
}

function feedUrl(feedMeta, lang) {
  const raw = lang === 'zh' && feedMeta.urlZh ? feedMeta.urlZh : feedMeta.url;
  return withRecentWindow(raw);
}

function parseItemDate(item) {
  const raw = item.isoDate || item.pubDate;
  if (!raw) return null;
  const ts = new Date(raw).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function isFreshEnough(timestamp) {
  if (!timestamp) return false;
  const now = Date.now();
  if (timestamp < MIN_ITEM_TIMESTAMP) return false;
  if (timestamp > now + 2 * 60 * 60 * 1000) return false;
  return now - timestamp <= MAX_ITEM_AGE_MS;
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractImage(item) {
  if (item.enclosure?.url && /\.(jpg|jpeg|png|webp|gif)/i.test(item.enclosure.url)) {
    return item.enclosure.url;
  }
  if (item.mediaContent?.$?.url) return item.mediaContent.$.url;
  if (item.thumbnail) return stripHtml(item.thumbnail);
  const fromContent = (item.content || item['content:encoded'] || item.contentSnippet || '')
    .match(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)/i);
  if (fromContent) return fromContent[0];
  return null;
}

function classifyType(title, summary) {
  const text = `${title} ${summary}`;
  if (DRAMA_KW.test(text)) return 'drama';
  if (RELEASE_KW.test(text)) return 'release';
  if (GOSSIP_KW.test(text)) return 'gossip';
  return 'celebrity';
}

function makeItemId(feedMeta, rawTitle) {
  const platform = feedMeta.platform || 'news';
  return Buffer.from(`${feedMeta.region}:${platform}:${rawTitle}`).toString('base64url').slice(0, 32);
}

async function normalizeItem(item, feedMeta, lang, knownIds) {
  let rawTitle = stripHtml(item.title || '').slice(0, 200);
  if (!rawTitle || BLOCKLIST.test(rawTitle) || NON_ENT_BLOCK.test(rawTitle)) return null;

  const id = makeItemId(feedMeta, rawTitle);
  if (knownIds.has(id)) return null;

  let rawSummary = stripHtml(item.contentSnippet || item.content || item.description || '')
    .slice(0, 320);

  if (feedMeta.region === 'th') {
    const blob = `${rawTitle} ${rawSummary}`;
    if (!TH_BL_GL_KW.test(blob)) return null;
  }

  const timestamp = parseItemDate(item);
  if (!isFreshEnough(timestamp)) return null;

  if (lang === 'zh') {
    const localized = await localizeForChinese(rawTitle, rawSummary, lang);
    rawTitle = localized.title;
    rawSummary = localized.summary;
  }

  const type = classifyType(rawTitle, rawSummary);
  const { content } = casualize(rawTitle, rawSummary, type, feedMeta.region, lang);
  if (!content || isWeakContent(content)) return null;

  return {
    id,
    content,
    region: feedMeta.region,
    platform: feedMeta.platform || 'news',
    type,
    image: extractImage(item),
    timestamp,
    isNew: Date.now() - timestamp < 6 * 60 * 60 * 1000,
  };
}

async function fetchFeed(feedMeta, lang, knownIds) {
  try {
    const feed = await parser.parseURL(feedUrl(feedMeta, lang));
    const items = await Promise.all(
      (feed.items || [])
        .slice(0, ITEMS_PER_FEED)
        .map(item => normalizeItem(item, feedMeta, lang, knownIds)),
    );
    return items.filter(Boolean);
  } catch (err) {
    console.warn(`[RSS] ${feedMeta.source} 拉取失败:`, err.message);
    return [];
  }
}

async function fetchAllFeeds(lang, knownIds) {
  const results = [];
  for (let i = 0; i < FEEDS.length; i += FETCH_CONCURRENCY) {
    const chunk = FEEDS.slice(i, i + FETCH_CONCURRENCY);
    const batches = await Promise.all(chunk.map(f => fetchFeed(f, lang, knownIds)));
    results.push(...batches.flat());
  }
  return results;
}

function dedupeAndSort(items) {
  const seenId = new Set();
  const seenContent = new Set();
  const unique = [];
  for (const item of items.sort((a, b) => b.timestamp - a.timestamp)) {
    if (seenId.has(item.id)) continue;
    const contentKey = item.content.toLowerCase().slice(0, 80);
    if (seenContent.has(contentKey)) continue;
    seenId.add(item.id);
    seenContent.add(contentKey);
    if (isFreshEnough(item.timestamp)) unique.push(item);
  }
  return unique;
}

async function aggregateNews(force = false, lang = 'zh') {
  const bucket = cache[lang] || cache.zh;
  if (!force && bucket.items.length && Date.now() - bucket.fetchedAt < CACHE_TTL) {
    return { items: bucket.items, added: 0, total: bucket.items.length };
  }

  const existing = bucket.items || [];
  const existingIds = new Set(existing.map(i => i.id));
  const knownIds = new Set(existingIds);

  const incoming = await fetchAllFeeds(lang, knownIds);
  const merged = dedupeAndSort([...incoming, ...existing]);
  const trimmed = merged.slice(0, MAX_STORED_ITEMS);
  const actuallyAdded = incoming.filter(i => !existingIds.has(i.id)).length;

  cache[lang] = { items: trimmed, fetchedAt: Date.now() };
  persistStore();

  console.log(`[RSS][${lang}] 库内 ${trimmed.length} 条 · 本次新增 ${actuallyAdded} 条 · 拉取 ${incoming.length} 条`);
  return { items: trimmed, added: actuallyAdded, total: trimmed.length };
}

app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/api/posts', (_req, res) => {
  res.json({ items: getPosts() });
});

app.post('/api/posts', upload.fields([
  { name: 'images', maxCount: 4 },
  { name: 'video', maxCount: 1 },
]), (req, res) => {
  try {
    const { title, content, tags, authorId, authorName, authorAvatar } = req.body;
    const hasText = Boolean(content?.trim());
    const hasMedia = Boolean(req.files?.images?.length || req.files?.video?.length);
    if ((!hasText && !hasMedia) || !authorId || !authorName) {
      return res.status(400).json({ error: '缺少内容或作者信息' });
    }

    let parsedTags = [];
    if (tags) {
      try { parsedTags = JSON.parse(tags); } catch { parsedTags = []; }
    }

    const images = (req.files?.images || []).map(f => `/uploads/${f.filename}`);
    const videoFile = req.files?.video?.[0];
    const video = videoFile ? `/uploads/${videoFile.filename}` : null;

    const post = createPost({
      id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      authorId,
      authorName,
      authorAvatar: authorAvatar || '',
      title: (title || '').trim(),
      content: (content || '').trim() || ' ',
      tags: parsedTags,
      images,
      video,
      likes: [],
      comments: [],
      shares: 0,
      createdAt: Date.now(),
    });

    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/:id/like', (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: '缺少 userId' });

  const post = updatePost(req.params.id, (p) => {
    const likes = [...(p.likes || [])];
    const idx = likes.indexOf(userId);
    if (idx >= 0) likes.splice(idx, 1);
    else likes.push(userId);
    return { ...p, likes };
  });

  if (!post) return res.status(404).json({ error: '帖子不存在' });
  res.json({ post });
});

app.post('/api/posts/:id/comments', (req, res) => {
  const comment = req.body;
  if (!comment?.text?.trim() && !comment?.image) {
    return res.status(400).json({ error: '评论不能为空' });
  }

  const post = updatePost(req.params.id, (p) => ({
    ...p,
    comments: [...(p.comments || []), comment],
  }));

  if (!post) return res.status(404).json({ error: '帖子不存在' });
  res.json({ post });
});

app.post('/api/posts/:id/share', (req, res) => {
  const post = updatePost(req.params.id, (p) => ({
    ...p,
    shares: (p.shares || 0) + 1,
  }));

  if (!post) return res.status(404).json({ error: '帖子不存在' });
  res.json({ post });
});

app.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? '文件过大' : err.message;
    return res.status(400).json({ error: msg });
  }
  if (err) return res.status(400).json({ error: err.message || '上传失败' });
  next();
});

app.use(express.static(path.join(__dirname)));

app.get('/manifest.webmanifest', (_req, res) => {
  res.type('application/manifest+json');
  res.sendFile(path.join(__dirname, 'manifest.webmanifest'));
});

app.get('/api/news', async (req, res) => {
  try {
    const force = req.query.refresh === '1';
    const lang = req.query.lang === 'en' ? 'en' : 'zh';
    const { items, added, total } = await aggregateNews(force, lang);
    res.json({
      items,
      lang,
      added,
      total,
      fetchedAt: cache[lang].fetchedAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, items: [] });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    cached: { zh: cache.zh.items.length, en: cache.en.items.length },
  });
});

loadStore();

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`StarPulse 运行中 → http://127.0.0.1:${PORT}（局域网/公网请用实际 IP 或域名）`);
  aggregateNews(true, 'zh').catch(err => console.warn('首次拉取失败:', err.message));
  aggregateNews(true, 'en').catch(() => {});
});
