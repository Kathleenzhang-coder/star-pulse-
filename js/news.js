/** 吃瓜动态 — 微博帖形式，可赞评转，多语言 */

let allNews = [];
let currentRegion = 'all';
let currentType = 'all';
let refreshTimer = null;
let isLoading = false;
let lastFetchedAt = 0;
let feedTotal = 0;
let displayCount = 50;
const PAGE_SIZE = 50;
const REFRESH_INTERVAL = 5 * 60 * 1000;
const MAX_NEWS_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const MIN_NEWS_TS = new Date('2026-01-01T00:00:00+08:00').getTime();
const API_BASE = window.location.protocol.startsWith('http')
  ? ''
  : 'http://127.0.0.1:5174';

const FEED_AVATAR_SEED = 'xingxun-gossip';

function initNews() {
  bindFilters();
  bindLoadMore();
  fetchRealNews(false);
  startAutoRefresh();
  document.getElementById('refresh-btn').addEventListener('click', () => fetchRealNews(true));
  document.addEventListener('locale-change', () => {
    displayCount = PAGE_SIZE;
    fetchRealNews(true);
    updateFilterLabels();
  });
  updateFilterLabels();
}

function bindLoadMore() {
  document.getElementById('news-feed').addEventListener('click', (e) => {
    if (e.target.closest('#news-load-more')) {
      displayCount += PAGE_SIZE;
      renderNews();
    }
  });
}

function mergeNewsLists(existing, incoming) {
  const map = new Map();
  for (const item of [...incoming, ...existing]) {
    if (isFreshNewsItem(item) && !map.has(item.id)) map.set(item.id, item);
  }
  return [...map.values()].sort((a, b) => b.timestamp - a.timestamp);
}

function updateFilterLabels() {
  document.querySelectorAll('#region-filters .filter-chip').forEach(chip => {
    const r = chip.dataset.region;
    if (r === 'all') chip.textContent = t('filter_all_region');
    else chip.textContent = regionLabel(r);
  });
  document.querySelectorAll('#type-filters .filter-chip').forEach(chip => {
    const ty = chip.dataset.type;
    if (ty === 'all') chip.textContent = t('filter_all_type');
    else chip.textContent = typeLabel(ty);
  });
}

function getNewsInteractions() {
  return get('newsInteractions', {});
}

function saveNewsInteractions(all) {
  set('newsInteractions', all);
}

function mergeNewsWithInteractions(items) {
  const interactions = getNewsInteractions();
  return items.map(item => {
    const ix = interactions[item.id] || {};
    return {
      ...item,
      likes: ix.likes || [],
      comments: ix.comments || [],
      shares: ix.shares || 0,
    };
  });
}

function persistNewsItemInteraction(id, data) {
  const all = getNewsInteractions();
  all[id] = { ...(all[id] || { likes: [], comments: [], shares: 0 }), ...data };
  saveNewsInteractions(all);
}

function getNewsItem(id) {
  return allNews.find(n => n.id === id) || null;
}

function addNewsComment(id, comment) {
  const item = getNewsItem(id);
  if (!item) return;
  item.comments.push(comment);
  persistNewsItemInteraction(id, { likes: item.likes, comments: item.comments, shares: item.shares });
}

function bindFilters() {
  document.getElementById('region-filters').addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    document.querySelectorAll('#region-filters .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentRegion = chip.dataset.region;
    displayCount = PAGE_SIZE;
    renderNews();
  });
  document.getElementById('type-filters').addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    document.querySelectorAll('#type-filters .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentType = chip.dataset.type;
    displayCount = PAGE_SIZE;
    renderNews();
  });
}

function isFreshNewsItem(item) {
  const ts = item?.timestamp;
  if (!ts) return false;
  if (ts < MIN_NEWS_TS) return false;
  return Date.now() - ts <= MAX_NEWS_AGE_MS;
}

function filterFreshItems(items) {
  return (items || []).filter(isFreshNewsItem);
}

async function fetchRealNews(manual = false) {
  if (isLoading) return;
  isLoading = true;
  setNewsStatus(manual ? t('news_refreshing') : t('news_loading'));

  const lang = getLang();
  const cacheKey = `newsFeed_${lang}`;

  try {
    const url = `${API_BASE}/api/news?lang=${lang}${manual ? '&refresh=1' : ''}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (!data.items?.length) throw new Error('empty');

    const freshItems = filterFreshItems(data.items);
    if (!freshItems.length) throw new Error('empty');

    const merged = mergeNewsLists(allNews, freshItems);
    allNews = mergeNewsWithInteractions(merged);
    feedTotal = data.total || allNews.length;
    lastFetchedAt = data.fetchedAt || Date.now();
    set(cacheKey, allNews.map(({ likes, comments, shares, ...rest }) => rest));
    set('lastNewsUpdate', lastFetchedAt);
    renderNews();
    updateLastRefreshTime();
    if (manual) {
      const added = data.added ?? 0;
      showToast(
        added > 0 ? t('news_toast_ok', { added, total: feedTotal }) : t('news_toast_refresh', { total: feedTotal }),
        'success',
      );
    }
  } catch (err) {
    const cached = filterFreshItems(get(cacheKey, []));
    if (cached.length) {
      allNews = mergeNewsWithInteractions(cached);
      feedTotal = allNews.length;
      renderNews();
      updateLastRefreshTime();
      showToast(t('news_toast_cache'), 'error');
    } else {
      renderError(err.message);
      showToast(t('news_toast_server'), 'error');
    }
  } finally {
    isLoading = false;
  }
}

function setNewsStatus(text) {
  const feed = document.getElementById('news-feed');
  document.getElementById('news-empty').classList.add('hidden');
  feed.innerHTML = `
    <div class="news-loading">
      <div class="pulse-ring"></div>
      <p>${escapeHtml(text)}</p>
      <span class="hint">${escapeHtml(t('news_loading_hint'))}</span>
    </div>`;
  document.getElementById('last-update').textContent = text;
}

function renderError() {
  document.getElementById('news-feed').innerHTML = `
    <div class="news-error"><p>${t('news_error')}</p><code>cd star-pulse && npm start</code></div>`;
}

function getFilteredNews() {
  return allNews.filter(item => {
    if (!isFreshNewsItem(item)) return false;
    if (currentRegion !== 'all' && item.region !== currentRegion) return false;
    if (currentType !== 'all' && item.type !== currentType) return false;
    return true;
  });
}

function renderNews() {
  const feed = document.getElementById('news-feed');
  const empty = document.getElementById('news-empty');
  const filtered = getFilteredNews();
  const user = getUser();
  const visible = filtered.slice(0, displayCount);

  if (!filtered.length) {
    feed.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  let html = visible.map(item => renderWeiboPost(item, user)).join('');
  if (filtered.length > displayCount) {
    html += `<button type="button" id="news-load-more" class="btn-ghost news-load-more">${t('load_more')} · ${t('load_more_count', { n: filtered.length - displayCount })}</button>`;
  }
  feed.innerHTML = html;
  bindNewsActions();
}

function renderWeiboPost(item, user) {
  const liked = user && item.likes.includes(user.id);
  const shareLabel = item.shares > 0 ? item.shares : t('action_share');
  const commentLabel = item.comments.length > 0 ? item.comments.length : t('action_comment');
  const likeLabel = item.likes.length > 0 ? item.likes.length : t('action_like');

  return `
    <article class="weibo-post ${item.isNew ? 'is-new' : ''}" data-id="${item.id}">
      <div class="post-header">
        <img class="post-avatar" src="${avatarUrl(FEED_AVATAR_SEED)}" alt="" />
        <div class="post-header-meta">
          <div class="post-author-row">
            <span class="post-author">${escapeHtml(feedOfficialName())}</span>
            <span class="verified-badge">${t('feed_badge')}</span>
          </div>
          <div class="post-subline">
            <span class="news-badge badge-${item.region}">${regionLabel(item.region)}</span>
            <span class="post-tag inline">#${typeLabel(item.type)}</span>
            <span class="post-time">${formatTime(item.timestamp)}</span>
          </div>
        </div>
      </div>
      <div class="weibo-content">${escapeHtml(item.content)}</div>
      <div class="weibo-actions">
        <button class="weibo-action" data-action="share" data-id="${item.id}">
          <span class="weibo-action-icon">↗</span><span>${shareLabel}</span>
        </button>
        <button class="weibo-action" data-action="comment" data-id="${item.id}">
          <span class="weibo-action-icon">💬</span><span>${commentLabel}</span>
        </button>
        <button class="weibo-action ${liked ? 'liked' : ''}" data-action="like" data-id="${item.id}">
          <span class="weibo-action-icon">${liked ? '❤️' : '🤍'}</span><span>${likeLabel}</span>
        </button>
      </div>
    </article>`;
}

function bindNewsActions() {
  document.querySelectorAll('#news-feed .weibo-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = getNewsItem(btn.dataset.id);
      if (!item) return;
      if (btn.dataset.action === 'like') handleNewsLike(item);
      else if (btn.dataset.action === 'comment') openCommentModal('news', item.id);
      else if (btn.dataset.action === 'share') handleNewsShare(item);
    });
  });
}

function handleNewsLike(item) {
  if (!requireLogin()) return;
  const uid = getUser().id;
  const idx = item.likes.indexOf(uid);
  if (idx >= 0) item.likes.splice(idx, 1);
  else item.likes.push(uid);
  persistNewsItemInteraction(item.id, { likes: item.likes, comments: item.comments, shares: item.shares });
  renderNews();
}

async function handleNewsShare(item) {
  await shareText(item.content, `feed-${item.id}`);
  item.shares = (item.shares || 0) + 1;
  persistNewsItemInteraction(item.id, { likes: item.likes, comments: item.comments, shares: item.shares });
  renderNews();
}

function updateLastRefreshTime() {
  document.getElementById('last-update').textContent = t('news_sync', {
    time: formatTime(lastFetchedAt || get('lastNewsUpdate') || Date.now()),
    total: feedTotal || allNews.length,
  });
}

function startAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => fetchRealNews(false), REFRESH_INTERVAL);
}

function destroyNews() {
  if (refreshTimer) clearInterval(refreshTimer);
}
