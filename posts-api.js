/** 树洞帖子 — 服务端存储 */

const fs = require('fs');
const path = require('path');

const POSTS_PATH = path.join(__dirname, '.posts-store.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const MAX_POSTS = 500;

function ensureUploadsDir() {
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
  fs.writeFileSync(POSTS_PATH, JSON.stringify(posts, null, 2));
}

function getPosts() {
  return loadPostsRaw().sort((a, b) => b.createdAt - a.createdAt);
}

function getPost(id) {
  return loadPostsRaw().find(p => p.id === id) || null;
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
  return posts[idx];
}

module.exports = {
  UPLOADS_DIR,
  ensureUploadsDir,
  getPosts,
  getPost,
  createPost,
  updatePost,
};
