/** 树洞帖子 — 服务端存储（Render 等云平台用可写目录） */

const fs = require('fs');
const path = require('path');

const DATA_ROOT = process.env.DATA_DIR
  || (process.env.RENDER ? '/tmp/starpulse-data' : __dirname);

const POSTS_PATH = path.join(DATA_ROOT, '.posts-store.json');
const UPLOADS_DIR = path.join(DATA_ROOT, 'uploads');
const MAX_POSTS = 500;

function ensureUploadsDir() {
  if (!fs.existsSync(DATA_ROOT)) {
    fs.mkdirSync(DATA_ROOT, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function loadPostsRaw() {
  try {
    if (!fs.existsSync(POSTS_PATH)) return [];
    const data = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function savePostsRaw(posts) {
  ensureUploadsDir();
  fs.writeFileSync(POSTS_PATH, JSON.stringify(posts, null, 2));
}

function normalizePost(p) {
  if (!p || typeof p !== 'object') return null;
  return {
    ...p,
    title: p.title || '',
    content: p.content || '',
    tags: Array.isArray(p.tags) ? p.tags : [],
    images: Array.isArray(p.images) ? p.images : [],
    likes: Array.isArray(p.likes) ? p.likes : [],
    comments: Array.isArray(p.comments) ? p.comments : [],
    shares: p.shares || 0,
    createdAt: p.createdAt || Date.now(),
  };
}

function getPosts() {
  return loadPostsRaw()
    .map(normalizePost)
    .filter(Boolean)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function getPost(id) {
  return normalizePost(loadPostsRaw().find(p => p.id === id) || null);
}

function createPost(post) {
  const posts = loadPostsRaw();
  posts.unshift(post);
  savePostsRaw(posts.slice(0, MAX_POSTS));
  return post;
}

function updatePost(id, mutator) {
  const posts = loadPostsRaw();
  const idx = posts.findIndex(p => p.id === id);
  if (idx < 0) return null;
  posts[idx] = mutator(posts[idx]);
  savePostsRaw(posts);
  return normalizePost(posts[idx]);
}

module.exports = {
  DATA_ROOT,
  UPLOADS_DIR,
  ensureUploadsDir,
  getPosts,
  getPost,
  createPost,
  updatePost,
};
