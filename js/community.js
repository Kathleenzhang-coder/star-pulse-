/** 树洞 — 服务端发帖、图片视频、点赞评论 */

let posts = [];
let pendingImageFiles = [];
let pendingVideoFile = null;
let pendingPreviewUrls = [];
let postsRefreshTimer = null;
let wantComposeAfterLogin = false;
let previewTargetId = 'compose-media-preview';

function safeShowModal(id) {
  const el = document.getElementById(id);
  if (!el) return false;
  try {
    if (typeof el.showModal === 'function') {
      el.showModal();
      return true;
    }
  } catch { /* fallback below */ }
  el.setAttribute('open', '');
  return true;
}

function requireLoginForCompose() {
  if (getUser()) return true;
  wantComposeAfterLogin = true;
  safeShowModal('login-modal');
  showToast(t('login_for_post'), 'info');
  return false;
}

function focusComposeBox() {
  const box = document.getElementById('compose-form');
  const input = document.getElementById('compose-content');
  if (!box || !input) return;
  box.classList.add('highlight');
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => {
    input.focus();
    box.classList.remove('highlight');
  }, 600);
}

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
  const resp = await fetch(`${getApiBase()}/api/posts/${id}/comments`, {
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
  updateComposeHint();
  if (postsRefreshTimer) clearInterval(postsRefreshTimer);
  postsRefreshTimer = setInterval(refreshCommunity, 45000);

  document.addEventListener('user-login', () => {
    updateComposeHint();
    if (wantComposeAfterLogin) {
      wantComposeAfterLogin = false;
      focusComposeBox();
    }
  });

  document.addEventListener('locale-change', updateComposeHint);
}

function updateComposeHint() {
  const hint = document.getElementById('compose-hint');
  if (!hint) return;
  hint.textContent = getUser() ? t('compose_hint') : t('compose_hint_login');
}

function setComposeStatus(message, type = 'info') {
  const el = document.getElementById('compose-status');
  if (!el) return;
  if (!message) {
    el.textContent = '';
    el.className = 'compose-status hidden';
    return;
  }
  el.textContent = message;
  el.className = `compose-status ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}`;
}

let communityEventsBound = false;

function bindEvents() {
  if (communityEventsBound) return;
  communityEventsBound = true;

  document.addEventListener('submit', (e) => {
    if (e.target.id === 'compose-form') {
      e.preventDefault();
      submitComposePost();
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('#create-post-btn')) {
      e.preventDefault();
      if (!requireLoginForCompose()) return;
      focusComposeBox();
    }
  });

  document.addEventListener('change', (e) => {
    const id = e.target.id;
    if (id === 'compose-images') handleImagePick(e, 'compose-images');
    else if (id === 'compose-video') handleVideoPick(e, 'compose-video');
    else if (id === 'post-images') handleImagePick(e, 'post-images');
    else if (id === 'post-video') handleVideoPick(e, 'post-video');
  });

  document.getElementById('post-form')?.addEventListener('submit', handlePostSubmit);

  document.getElementById('topic-list')?.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    if (!requireLoginForCompose()) return;
    const tags = document.getElementById('compose-tags');
    if (tags) tags.value = li.dataset.topic;
    focusComposeBox();
  });
}

async function prepareImageFile(file) {
  const name = file.name || 'photo.jpg';
  const type = (file.type || '').toLowerCase();
  const canCompress = typeof createImageBitmap === 'function'
    && (type.startsWith('image/') || /\.(heic|heif|jpg|jpeg|png|webp)$/i.test(name));

  if (!canCompress) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const max = 1920;
    let { width, height } = bitmap;
    if (width > max || height > max) {
      const scale = Math.min(max / width, max / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('compress failed'))), 'image/jpeg', 0.82);
    });
    const outName = name.replace(/\.(heic|heif|png|webp|jpeg|jpg)$/i, '') + '.jpg';
    return new File([blob], outName, { type: 'image/jpeg' });
  } catch (err) {
    console.warn('[树洞] 图片压缩跳过:', err.message);
    return file;
  }
}

async function handleImagePick(e, inputId) {
  previewTargetId = inputId.startsWith('compose') ? 'compose-media-preview' : 'media-preview';
  const files = [...(e.target.files || [])];
  e.target.value = '';
  if (!files.length) return;

  setComposeStatus(t('media_processing'), 'info');
  let added = 0;

  for (const raw of files) {
    if (pendingImageFiles.length >= 4) break;
    const file = await prepareImageFile(raw);
    if (file.size > 10 * 1024 * 1024) {
      showToast(t('err_img_size'), 'error');
      continue;
    }
    pendingImageFiles.push(file);
    added++;
  }

  if (added > 0) {
    setComposeStatus(t('media_added', { n: pendingImageFiles.length }), 'success');
  } else {
    setComposeStatus(t('media_pick_fail'), 'error');
  }
  renderMediaPreview();
}

function handleVideoPick(e, inputId) {
  previewTargetId = inputId.startsWith('compose') ? 'compose-media-preview' : 'media-preview';
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  if (file.size > 25 * 1024 * 1024) {
    setComposeStatus(t('err_video_size'), 'error');
    showToast(t('err_video_size'), 'error');
    return;
  }
  pendingVideoFile = file;
  pendingImageFiles = [];
  setComposeStatus(t('video_added'), 'success');
  renderMediaPreview();
}

function clearMediaPreview() {
  pendingPreviewUrls.forEach(u => URL.revokeObjectURL(u));
  pendingPreviewUrls = [];
}

function openPostModal() {
  previewTargetId = 'media-preview';
  pendingImageFiles = [];
  pendingVideoFile = null;
  clearMediaPreview();
  document.getElementById('post-form')?.reset();
  safeShowModal('post-modal');
}

function renderMediaPreview() {
  clearMediaPreview();
  const preview = document.getElementById(previewTargetId) || document.getElementById('compose-media-preview');
  if (!preview) return;

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

async function loadPosts() {
  try {
    const resp = await fetch(`${getApiBase()}/api/posts`, { cache: 'no-store' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    posts = (data.items || []).map(normalizePost).filter(Boolean);
  } catch (err) {
    console.warn('[树洞] 加载失败:', err.message);
  }
}

async function createPostOnServer(payload) {
  const hasFiles = pendingImageFiles.length > 0 || pendingVideoFile;

  if (!hasFiles) {
    const resp = await fetch(`${getApiBase()}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: payload.title || '',
        content: payload.content || '',
        tags: payload.tags || [],
        authorId: payload.authorId,
        authorName: payload.authorName,
        authorAvatar: payload.authorAvatar || '',
      }),
    });
    const text = await resp.text();
    let data = {};
    try { data = JSON.parse(text); } catch { /* HTML error page */ }
    if (!resp.ok) {
      const msg = data.error
        || (text.includes('Cannot POST') ? t('post_toast_server') : t('post_toast_fail'));
      throw new Error(msg);
    }
    return normalizePost(data.post);
  }

  const fd = new FormData();
  fd.append('title', payload.title || '');
  fd.append('content', payload.content || '');
  fd.append('tags', JSON.stringify(payload.tags || []));
  fd.append('authorId', payload.authorId);
  fd.append('authorName', payload.authorName);
  fd.append('authorAvatar', payload.authorAvatar || '');
  pendingImageFiles.forEach(file => fd.append('images', file));
  if (pendingVideoFile) fd.append('video', pendingVideoFile);

  const resp = await fetch(`${getApiBase()}/api/posts`, { method: 'POST', body: fd });
  const text = await resp.text();
  let data = {};
  try { data = JSON.parse(text); } catch { /* HTML error page */ }

  if (!resp.ok) {
    const msg = data.error
      || (text.includes('Cannot POST') ? t('post_toast_server') : t('post_toast_fail'));
    throw new Error(msg);
  }
  return normalizePost(data.post);
}

async function submitComposePost() {
  if (!requireLoginForCompose()) return;

  const user = getUser();
  const content = document.getElementById('compose-content')?.value.trim() || '';
  const tags = parseTags(document.getElementById('compose-tags')?.value || '');
  const hasMedia = pendingImageFiles.length > 0 || pendingVideoFile;

  if (!content && !hasMedia) {
    setComposeStatus(t('post_empty_hint'), 'error');
    showToast(t('post_empty_hint'), 'error');
    return;
  }

  const submitBtn = document.getElementById('compose-submit');
  const submitLabel = submitBtn?.textContent || t('post_submit');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = t('post_posting');
  }
  setComposeStatus(t('post_posting'), 'info');

  try {
    const post = await createPostOnServer({
      title: '',
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
    document.getElementById('compose-content').value = '';
    document.getElementById('compose-tags').value = '';
    pendingImageFiles = [];
    pendingVideoFile = null;
    clearMediaPreview();
    renderMediaPreview();
    setComposeStatus(t('post_toast_scroll'), 'success');
    showToast(t('post_toast'), 'success');
    document.getElementById('post-feed')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    setComposeStatus(err.message || t('post_toast_fail'), 'error');
    showToast(err.message || t('post_toast_fail'), 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitLabel;
    }
  }
}

async function handlePostSubmit(e) {
  e.preventDefault();
  previewTargetId = 'media-preview';
  if (!requireLoginForCompose()) return;

  const form = e.currentTarget;
  const user = getUser();
  const title = document.getElementById('post-title').value.trim();
  const content = document.getElementById('post-content').value.trim();
  const tags = parseTags(document.getElementById('post-tags').value);
  const hasMedia = pendingImageFiles.length > 0 || pendingVideoFile;

  if (!content && !hasMedia) {
    showToast(t('post_empty_hint'), 'error');
    return;
  }

  const submitBtn = form.querySelector('[type="submit"]');
  const submitLabel = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = t('post_posting');

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
    document.getElementById('post-modal')?.close();
    pendingImageFiles = [];
    pendingVideoFile = null;
    clearMediaPreview();
    showToast(t('post_toast'), 'success');
  } catch (err) {
    showToast(err.message || t('post_toast_fail'), 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = submitLabel;
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
  return `${getApiBase()}${src}`;
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
    const resp = await fetch(`${getApiBase()}/api/posts/${post.id}/like`, {
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
    const resp = await fetch(`${getApiBase()}/api/posts/${post.id}/share`, { method: 'POST' });
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

window.submitComposePost = submitComposePost;
window.__pickComposeImages = (e) => handleImagePick(e, 'compose-images');
window.__pickComposeVideo = (e) => handleVideoPick(e, 'compose-video');
