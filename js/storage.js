/** localStorage 持久化层 */

const KEYS = {
  user: 'starpulse_user',
  newsFeed: 'starpulse_news_feed',
  newsInteractions: 'starpulse_news_ix',
  posts: 'starpulse_posts',
  fans: 'starpulse_fans',
  lastNewsUpdate: 'starpulse_last_news_update',
  locale: 'starpulse_locale',
};

function get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(KEYS[key] ?? key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set(key, value) {
  localStorage.setItem(KEYS[key] ?? key, JSON.stringify(value));
}

function remove(key) {
  localStorage.removeItem(KEYS[key] ?? key);
}
