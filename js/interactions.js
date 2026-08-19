/** 评论弹窗 — 动态帖 & 树洞共用，支持表情与图片 */

let commentTarget = null;
let pendingCommentImage = null;

const COMMENT_EMOJIS = [
  '😀', '😂', '🤣', '😭', '🥹', '😍', '🥰', '😘', '🤔', '👀',
  '🍉', '✨', '🔥', '💜', '💖', '👏', '🙏', '💪', '😱', '🥳',
  '🎉', '❤️', '🤍', '💔', '😤', '🫠', '🤡', '👑', '🌟', '📣',
  '‼️', '❓', '💯', '🫶', '🥺', '😎', '🤝', '🫡', '🐶', '🐱',
  '😏', '🙄', '😮', '🤯', '🥲', '😇', '🤗', '😈', '💀', '🫣',
];

function initInteractions() {
  document.getElementById('comment-form').addEventListener('submit', handleCommentSubmit);
  document.getElementById('comment-emoji-btn').addEventListener('click', toggleEmojiPanel);
  document.getElementById('comment-image-input').addEventListener('change', handleCommentImagePick);
  initEmojiPanel();

  document.getElementById('comment-modal').addEventListener('click', (e) => {
    const panel = document.getElementById('comment-emoji-panel');
    if (!panel.classList.contains('hidden')
      && !e.target.closest('#comment-emoji-panel')
      && !e.target.closest('#comment-emoji-btn')) {
      panel.classList.add('hidden');
    }
  });
}

function initEmojiPanel() {
  const panel = document.getElementById('comment-emoji-panel');
  panel.innerHTML = COMMENT_EMOJIS.map(emoji =>
    `<button type="button" class="emoji-btn" data-emoji="${emoji}">${emoji}</button>`,
  ).join('');

  panel.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => insertCommentEmoji(btn.dataset.emoji));
  });
}

function toggleEmojiPanel() {
  document.getElementById('comment-emoji-panel').classList.toggle('hidden');
}

function insertCommentEmoji(emoji) {
  const input = document.getElementById('comment-input');
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  const before = input.value.slice(0, start);
  const after = input.value.slice(end);
  input.value = `${before}${emoji}${after}`;
  const pos = start + emoji.length;
  input.setSelectionRange(pos, pos);
  input.focus();
}

async function handleCommentImagePick(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    showToast(t('err_comment_img_size'), 'error');
    return;
  }
  pendingCommentImage = await readFileAsDataURL(file);
  renderCommentImagePreview();
}

function renderCommentImagePreview() {
  const preview = document.getElementById('comment-image-preview');
  if (!pendingCommentImage) {
    preview.classList.add('hidden');
    preview.innerHTML = '';
    return;
  }
  preview.classList.remove('hidden');
  preview.innerHTML = `
    <img src="${pendingCommentImage}" alt="" />
    <button type="button" class="comment-preview-remove" id="comment-image-remove">&times;</button>`;
  document.getElementById('comment-image-remove').addEventListener('click', () => {
    pendingCommentImage = null;
    renderCommentImagePreview();
  });
}

function resetCommentCompose() {
  document.getElementById('comment-input').value = '';
  pendingCommentImage = null;
  renderCommentImagePreview();
  document.getElementById('comment-emoji-panel').classList.add('hidden');
}

function openCommentModal(kind, id) {
  commentTarget = { kind, id };
  const item = kind === 'news' ? getNewsItem(id) : getCommunityPost(id);
  if (!item) return;
  resetCommentCompose();
  renderCommentList(item.comments || []);
  document.getElementById('comment-modal').showModal();
}

function renderCommentBody(c) {
  const parts = [];
  if (c.text) {
    parts.push(`<div class="comment-text">${escapeHtml(c.text)}</div>`);
  }
  if (c.image) {
    parts.push(`<img class="comment-image" src="${c.image}" alt="" loading="lazy" />`);
  }
  return parts.join('');
}

function renderCommentList(comments) {
  const list = document.getElementById('comment-list');
  if (!comments.length) {
    list.innerHTML = `<p class="comment-empty">${t('comment_empty')}</p>`;
    return;
  }
  list.innerHTML = comments.map(c => `
    <div class="comment-item">
      <div class="comment-author">${escapeHtml(c.authorName)}</div>
      ${renderCommentBody(c)}
      <div class="comment-time">${formatTime(c.createdAt)}</div>
    </div>
  `).join('');
}

async function handleCommentSubmit(e) {
  e.preventDefault();
  if (!getUser()) {
    document.getElementById('login-modal').showModal();
    return;
  }
  const input = document.getElementById('comment-input');
  const text = input.value.trim();
  if ((!text && !pendingCommentImage) || !commentTarget) return;

  const user = getUser();
  const comment = {
    id: `comment-${Date.now()}`,
    authorId: user.id,
    authorName: user.nickname,
    text,
    image: pendingCommentImage,
    createdAt: Date.now(),
  };

  const sendBtn = e.target.querySelector('[type="submit"]');
  if (sendBtn) sendBtn.disabled = true;

  try {
    if (commentTarget.kind === 'news') {
      addNewsComment(commentTarget.id, comment);
      renderNews();
    } else {
      await addPostComment(commentTarget.id, comment);
      renderPosts();
      renderSidebar();
    }

    const item = commentTarget.kind === 'news'
      ? getNewsItem(commentTarget.id)
      : getCommunityPost(commentTarget.id);
    renderCommentList(item?.comments || []);
    resetCommentCompose();
    showToast(t('comment_toast'), 'success');
  } catch {
    showToast(t('post_toast_fail'), 'error');
  } finally {
    if (sendBtn) sendBtn.disabled = false;
  }
}

function requireLogin() {
  if (!getUser()) {
    document.getElementById('login-modal').showModal();
    return false;
  }
  return true;
}

async function shareText(text, hashTag) {
  const url = `${window.location.origin}${window.location.pathname}#${hashTag}`;
  const payload = `${text.slice(0, 120)}\n${url}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: 'StarPulse', text: text.slice(0, 120), url });
    } catch { /* cancelled */ }
  } else {
    await navigator.clipboard.writeText(payload);
    showToast(t('share_toast'), 'success');
  }
}
