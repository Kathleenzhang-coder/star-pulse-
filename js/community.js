/** 树洞 — 服务端发帖、图片视频、点赞评论 */

let posts = [];
let pendingImageFiles = [];
let pendingVideoFile = null;
let pendingPreviewUrls = [];
let postsRefreshTimer = null;

const API_BASE = window.location.protocol.startsWith('http')
  ? ''
  : 'http://127.0.0.1:5174';

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
  const idx = posts.findIndex(p => p.id === id);
  if (idx >= 0) posts[idx] = data.post;
  return data.post;
}

function initCommunity() {
  bindEvents();
  loadPosts().then(() => {
    renderPosts();
    renderSidebar();
  });
  if (postsRefreshTimer) clearInterval(postsRefreshTimer);
  postsRefreshTimer = setInterval(() => {
    loadPosts().then(() => {
      renderPosts();
      renderSidebar();
    });
  }, 45000);
}

async function loadPosts() {
  try {
    const resp = await fetch(`${API_BASE}/api/posts`);
    if (!resp.ok) throw new Error('fetch failed');
    const data = await resp.json();
    posts = data.items || [];
  } catch {
    posts = posts.length ? posts : [];
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

async function handlePostSubmit(e) {
  e.preventDefault();
  const user = getUser();
  if (!user) return;

  const title = document.getElementById('post-title').value.trim();
  const content = document.getElementById('post-content').value.trim();
  const tags = parseTags(document.getElementById('post-tags').value);

  if (!content && !pendingImageFiles.length && !pendingVideoFile) return;

  const fd = new FormData();
  fd.append('title', title);
  fd.append('content', content || ' ');
  fd.append('tags', JSON.stringify(tags));
  fd.append('authorId', user.id);
  fd.append('authorName', user.nickname);
  fd.append('authorAvatar', user.avatar);
  pendingImageFiles.forEach(file => fd.append('images', file));
  if (pendingVideoFile) fd.append('video', pendingVideoFile);

  const submitBtn = e.target.querySelector('[type="submit"]');
  submitBtn.disabled = true;

  try {
    const resp = await fetch(`${API_BASE}/api/posts`, { method: 'POST', body: fd });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || '发布失败');
    }
    const data = await resp.json();
    if (data.post) {
      posts.unshift(data.post);
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

  if (posts.length === 0) {
    feed.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  feed.innerHTML = posts.map(post => renderPostCard(post, user)).join('');
  bindPostActions();
}

function mediaUrl(src) {
  if (!src) return '';
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  return `${API_BASE}${src}`;
}

function renderPostCard(post, user) {
  const liked = user && post.likes.includes(user.id);
  const mediaHtml = renderPostMedia(post);
  const tagsHtml = post.tags?.length
    ? `<div class="post-tags">${post.tags.map(tag => `<span class="post-tag">#${escapeHtml(tag)}</span>`).join('')}</div>`
    : '';

  return `
    <article class="post-card" data-id="${post.id}">
      <div class="post-header">
        <img class="post-avatar" src="${post.authorAvatar || avatarUrl(post.authorName)}" alt="" />
        <div>
          <div class="post-author">${escapeHtml(post.authorName)}</div>
          <div class="post-time">${formatTime(post.createdAt)}</div>
        </div>
      </div>
      ${post.title ? `<h3 class="post-title">${escapeHtml(post.title)}</h3>` : ''}
      <div class="post-content">${escapeHtml(post.content.trim())}</div>
      ${tagsHtml}
      ${mediaHtml}
      <div class="post-actions">
        <button class="action-btn ${liked ? 'liked' : ''}" data-action="like" data-id="${post.id}">
          ${liked ? '❤️' : '🤍'} ${post.likes.length || t('action_like')}
        </button>
        <button class="action-btn" data-action="comment" data-id="${post.id}">
          💬 ${post.comments.length || t('action_comment')}
        </button>
        <button class="action-btn" data-action="share" data-id="${post.id}">
          ↗ ${post.shares || t('action_share')}
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
    const idx = posts.findIndex(p => p.id === post.id);
    if (idx >= 0) posts[idx] = data.post;
    renderPosts();
    renderSidebar();
  } catch {
    showToast(t('post_toast_fail'), 'error');
  }
}

async function handleShare(post) {
  await shareText(post.content, `post-${post.id}`);
  try {
    const resp = await fetch(`${API_BASE}/api/posts/${post.id}/share`, { method: 'POST' });
    if (resp.ok) {
      const data = await resp.json();
      const idx = posts.findIndex(p => p.id === post.id);
      if (idx >= 0) posts[idx] = data.post;
    }
  } catch { /* ignore */ }
  renderPosts();
}

function renderSidebar() {
  document.getElementById('topic-list').innerHTML = getHotTopics().map(
    topic => `<li data-topic="${topic}">${topic}</li>`,
  ).join('');

  const totalLikes = posts.reduce((s, p) => s + (p.likes?.length || 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.comments?.length || 0), 0);

  document.getElementById('community-stats').innerHTML = `
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
