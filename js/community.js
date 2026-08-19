/** 树洞 — 服务端发帖、图片视频、点赞评论 */

let posts = [];
let pendingImageFiles = [];
let pendingVideoFile = null;
let pendingPreviewUrls = [];
let postsRefreshTimer = null;

const API_BASE = window.location.protocol.startsWith('http')
  ? ''
  : 'http://127.0.0.1:5174';

function normalizePost(post) {
  if (!post || typeof post !== 'object') return null;
  return {
    ...post,
    title: post.title || '',
    content: post.content || '',
    tags: Array.isArray(post.tags) ? post.tags : [],
    images: Array.isArray(post.images) ? post.images : [],
    likes: Array.isArray(post.likes) ? post.likes : [],
    comments: Array.isArray(post.comments) ? post.comments : [],
    shares: post.shares || 0,
    createdAt: post.createdAt || Date.now(),
  };
}

function getCommunityPost(id) {
  return posts.find(p => p.id === id) || null;
}

async function addPostComment(id, comment) {
  const resp = await fetch(`${API_BASE}/api/posts/${id}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(comment),
  });
  if (!resp.ok) throw new Error('comment failed');
  const data = await resp.json();
  const normalized = normalizePost(data.post);
  const idx = posts.findIndex(p => p.id === id);
  if (idx >= 0 && normalized) posts[idx] = normalized;
  return normalized;
}

function initCommunity() {
  bindEvents();
  refreshCommunity();
  if (postsRefreshTimer) clearInterval(postsRefreshTimer);
  postsRefreshTimer = setInterval(refreshCommunity, 45000);
}

async function loadPosts() {
  try {
    const resp = await fetch(`${API_BASE}/api/posts`, { cache: 'no-store' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    posts = (data.items || []).map(normalizePost).filter(Boolean);
  } catch (err) {
    console.warn('[树洞] 加载失败:', err.message);
  }
}

function bindEvents() {
  document.getElementById('create-post-btn').addEventListener('click', () => {
    if (!getUser()) {
      document.getElementById('login-modal').showModal();
      return;
    }
    openPostModal();
  });

  document.getElementById('post-form').addEventListener('submit', handlePostSubmit);

  document.getElementById('post-images').addEventListener('change', (e) => {
    for (const file of e.target.files) {
      if (pendingImageFiles.length >= 4) break;
      if (file.size > 4 * 1024 * 1024) {
        showToast(t('err_img_size'), 'error');
        continue;
      }
      pendingImageFiles.push(file);
    }
    renderMediaPreview();
    e.target.value = '';
  });

  document.getElementById('post-video').addEventListener('change', (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      showToast(t('err_video_size'), 'error');
      return;
    }
    pendingVideoFile = file;
    renderMediaPreview();
  });

  document.getElementById('topic-list').addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    document.getElementById('post-tags').value = li.dataset.topic;
    if (!getUser()) {
      document.getElementById('login-modal').showModal();
      return;
    }
    openPostModal();
  });
}

function clearMediaPreview() {
  pendingPreviewUrls.forEach(u => URL.revokeObjectURL(u));
  pendingPreviewUrls = [];
}

function openPostModal() {
  pendingImageFiles = [];
  pendingVideoFile = null;
  clearMediaPreview();
  document.getElementById('post-form').reset();
  document.getElementById('media-preview').innerHTML = '';
  document.getElementById('post-modal').showModal();
}

function renderMediaPreview() {
  clearMediaPreview();
  const preview = document.getElementById('media-preview');

  let html = pendingImageFiles.map((file, i) => {
    const url = URL.createObjectURL(file);
    pendingPreviewUrls.push(url);
    return `
      <div class="media-preview-item">
        <img src="${url}" alt="" />
        <button type="button" data-remove-img="${i}">&times;</button>
      </div>`;
  }).join('');

  if (pendingVideoFile) {
    const url = URL.createObjectURL(pendingVideoFile);
    pendingPreviewUrls.push(url);
    html += `
      <div class="media-preview-item">
        <video src="${url}"></video>
        <button type="button" data-remove-video>&times;</button>
      </div>`;
  }

  preview.innerHTML = html;

  preview.querySelectorAll('[data-remove-img]').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingImageFiles.splice(Number(btn.dataset.removeImg), 1);
      renderMediaPreview();
    });
  });

  preview.querySelector('[data-remove-video]')?.addEventListener('click', () => {
    pendingVideoFile = null;
    renderMediaPreview();
  });
}

async function createPostOnServer(payload) {
  const hasMedia = pendingImageFiles.length > 0 || pendingVideoFile;

  let resp;
  if (hasMedia) {
    const fd = new FormData();
    Object.entries(payload).forEach(([key, val]) => {
      if (key === 'tags') fd.append(key, JSON.stringify(val));
      else fd.append(key, val);
    });
    pendingImageFiles.forEach(file => fd.append('images', file));
    if (pendingVideoFile) fd.append('video', pendingVideoFile);
    resp = await fetch(`${API_BASE}/api/posts`, { method: 'POST', body: fd });
  } else {
    resp = await fetch(`${API_BASE}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  const text = await resp.text();
  let data = {};
  try { data = JSON.parse(text); } catch { /* HTML error page */ }

  if (!resp.ok) {
    throw new Error(data.error || t('post_toast_fail'));
  }
  return normalizePost(data.post);
}

async function handlePostSubmit(e) {
  e.preventDefault();
  const user = getUser();
  if (!user) {
    document.getElementById('login-modal').showModal();
    return;
  }

  const form = e.currentTarget;
  const title = document.getElementById('post-title').value.trim();
  const content = document.getElementById('post-content').value.trim();
  const tags = parseTags(document.getElementById('post-tags').value);
  const hasMedia = pendingImageFiles.length > 0 || pendingVideoFile;

  if (!content && !hasMedia) {
    showToast(t('post_empty_hint'), 'error');
    return;
  }

  const submitBtn = form.querySelector('[type="submit"]');
  submitBtn.disabled = true;

  try {
    const post = await createPostOnServer({
      title,
      content,
      tags,
      authorId: user.id,
      authorName: user.nickname,
      authorAvatar: user.avatar,
    });

    if (post) {
      const idx = posts.findIndex(p => p.id === post.id);
      if (idx >= 0) posts[idx] = post;
      else posts.unshift(post);
    } else {
      await loadPosts();
    }

    renderPosts();
    renderSidebar();
    document.getElementById('post-modal').close();
    pendingImageFiles = [];
    pendingVideoFile = null;
    clearMediaPreview();
    showToast(t('post_toast'), 'success');
  } catch (err) {
    showToast(err.message || t('post_toast_fail'), 'error');
  } finally {
    submitBtn.disabled = false;
  }
}

function renderPosts() {
  const feed = document.getElementById('post-feed');
  const empty = document.getElementById('posts-empty');
  const user = getUser();

  if (!feed || !empty) return;

  if (posts.length === 0) {
    feed.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  try {
    feed.innerHTML = posts.map(post => renderPostCard(post, user)).join('');
    bindPostActions();
    empty.classList.add('hidden');
  } catch (err) {
    console.error('[树洞] 渲染失败:', err);
    feed.innerHTML = '';
    empty.classList.remove('hidden');
  }
}

function mediaUrl(src) {
  if (!src) return '';
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  return `${API_BASE}${src}`;
}

function renderPostCard(post, user) {
  const p = normalizePost(post);
  if (!p) return '';

  const liked = user && p.likes.includes(user.id);
  const mediaHtml = renderPostMedia(p);
  const body = (p.content || '').trim();
  const tagsHtml = p.tags.length
    ? `<div class="post-tags">${p.tags.map(tag => `<span class="post-tag">#${escapeHtml(String(tag))}</span>`).join('')}</div>`
    : '';

  return `
    <article class="post-card" data-id="${p.id}">
      <div class="post-header">
        <img class="post-avatar" src="${p.authorAvatar || avatarUrl(p.authorName)}" alt="" />
        <div>
          <div class="post-author">${escapeHtml(p.authorName)}</div>
          <div class="post-time">${formatTime(p.createdAt)}</div>
        </div>
      </div>
      ${p.title ? `<h3 class="post-title">${escapeHtml(p.title)}</h3>` : ''}
      ${body ? `<div class="post-content">${escapeHtml(body)}</div>` : ''}
      ${tagsHtml}
      ${mediaHtml}
      <div class="post-actions">
        <button class="action-btn ${liked ? 'liked' : ''}" data-action="like" data-id="${p.id}">
          ${liked ? '❤️' : '🤍'} ${p.likes.length || t('action_like')}
        </button>
        <button class="action-btn" data-action="comment" data-id="${p.id}">
          💬 ${p.comments.length || t('action_comment')}
        </button>
        <button class="action-btn" data-action="share" data-id="${p.id}">
          ↗ ${p.shares || t('action_share')}
        </button>
      </div>
    </article>
  `;
}

function renderPostMedia(post) {
  if (!post.images?.length && !post.video) return '';

  let html = '<div class="post-media';
  if (post.images?.length === 2) html += ' grid-2';
  html += '">';

  if (post.images?.length) {
    html += post.images.map(src => `<img src="${mediaUrl(src)}" alt="" loading="lazy" />`).join('');
  }
  if (post.video) {
    html += `<video src="${mediaUrl(post.video)}" controls preload="metadata"></video>`;
  }
  html += '</div>';
  return html;
}

function bindPostActions() {
  document.querySelectorAll('.post-actions .action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      const post = posts.find(p => p.id === id);
      if (!post) return;

      if (action === 'like') handleLike(post);
      else if (action === 'comment') openCommentModal('post', id);
      else if (action === 'share') handleShare(post);
    });
  });
}

async function handleLike(post) {
  if (!requireLogin()) return;
  const uid = getUser().id;
  try {
    const resp = await fetch(`${API_BASE}/api/posts/${post.id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: uid }),
    });
    if (!resp.ok) throw new Error('like failed');
    const data = await resp.json();
    const normalized = normalizePost(data.post);
    const idx = posts.findIndex(p => p.id === post.id);
    if (idx >= 0 && normalized) posts[idx] = normalized;
    renderPosts();
    renderSidebar();
  } catch {
    showToast(t('post_toast_fail'), 'error');
  }
}

async function handleShare(post) {
  await shareText(post.content || post.title || '', `post-${post.id}`);
  try {
    const resp = await fetch(`${API_BASE}/api/posts/${post.id}/share`, { method: 'POST' });
    if (resp.ok) {
      const data = await resp.json();
      const normalized = normalizePost(data.post);
      const idx = posts.findIndex(p => p.id === post.id);
      if (idx >= 0 && normalized) posts[idx] = normalized;
    }
  } catch { /* ignore */ }
  renderPosts();
}

function renderSidebar() {
  const topicList = document.getElementById('topic-list');
  const stats = document.getElementById('community-stats');
  if (!topicList || !stats) return;

  topicList.innerHTML = getHotTopics().map(
    topic => `<li data-topic="${topic}">${topic}</li>`,
  ).join('');

  const totalLikes = posts.reduce((s, p) => s + (p.likes?.length || 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.comments?.length || 0), 0);

  stats.innerHTML = `
    <div class="stat-item"><div class="stat-value">${posts.length}</div><div class="stat-label">${t('stat_posts')}</div></div>
    <div class="stat-item"><div class="stat-value">${totalLikes}</div><div class="stat-label">${t('stat_likes')}</div></div>
    <div class="stat-item"><div class="stat-value">${totalComments}</div><div class="stat-label">${t('stat_comments')}</div></div>
    <div class="stat-item"><div class="stat-value">${new Set(posts.map(p => p.authorId)).size || 0}</div><div class="stat-label">${t('stat_authors')}</div></div>`;
}

function refreshCommunity() {
  return loadPosts().then(() => {
    renderPosts();
    renderSidebar();
  });
}
