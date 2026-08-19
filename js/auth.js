/** 用户认证与资料管理 */

let currentUser = get('user');

function getUser() {
  return currentUser;
}

function isLoggedIn() {
  return !!currentUser;
}

function login(nickname, email = '') {
  currentUser = {
    id: `user-${Date.now()}`,
    nickname: nickname.trim(),
    email: email.trim(),
    avatar: avatarUrl(nickname),
    city: '',
    tags: [],
    bio: '',
    lat: null,
    lng: null,
    online: true,
    createdAt: Date.now(),
  };
  set('user', currentUser);
  return currentUser;
}

function logout() {
  currentUser = null;
  set('user', null);
}

function updateProfile(updates) {
  if (!currentUser) return null;
  currentUser = { ...currentUser, ...updates, online: true };
  set('user', currentUser);
  syncToFans();
  return currentUser;
}

function updateLocation(lat, lng, city) {
  if (!currentUser) return null;
  currentUser = { ...currentUser, lat, lng, city: city || currentUser.city, online: true };
  set('user', currentUser);
  syncToFans();
  return currentUser;
}

/** 将当前用户同步到同好列表 */
function syncToFans() {
  if (!currentUser || currentUser.lat == null) return;
  const fans = get('fans', []);
  const idx = fans.findIndex(f => f.id === currentUser.id);
  const fanEntry = {
    id: currentUser.id,
    nickname: currentUser.nickname,
    avatar: currentUser.avatar,
    city: currentUser.city,
    lat: currentUser.lat,
    lng: currentUser.lng,
    tags: currentUser.tags,
    bio: currentUser.bio,
    online: true,
  };
  if (idx >= 0) fans[idx] = fanEntry;
  else fans.push(fanEntry);
  set('fans', fans);
}

function initAuthUI() {
  const profileBtn = document.getElementById('profile-btn');
  const loginModal = document.getElementById('login-modal');
  const loginForm = document.getElementById('login-form');

  updateHeaderUI();

  profileBtn.addEventListener('click', () => {
    if (currentUser) {
      showProfileEditor();
    } else {
      loginModal.showModal();
    }
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nickname = document.getElementById('login-nickname').value.trim();
    const email = document.getElementById('login-email').value.trim();
    if (!nickname) return;
    login(nickname, email);
    loginModal.close();
    updateHeaderUI();
    showToast(t('login_welcome', { name: nickname }), 'success');
    document.dispatchEvent(new CustomEvent('user-login'));
  });

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.close)?.close();
    });
  });
}

function updateHeaderUI() {
  const avatar = document.getElementById('header-avatar');
  const username = document.getElementById('header-username');
  if (currentUser) {
    avatar.src = currentUser.avatar;
    avatar.alt = currentUser.nickname;
    username.textContent = currentUser.nickname;
  } else {
    avatar.src = avatarUrl('guest');
    avatar.alt = t('guest_alt');
    username.textContent = t('login');
  }
}

function showProfileEditor() {
  const form = document.getElementById('profile-form');
  if (currentUser) {
    document.getElementById('profile-nickname').value = currentUser.nickname || '';
    document.getElementById('profile-city').value = currentUser.city || '';
    document.getElementById('profile-tags').value = (currentUser.tags || []).join(', ');
    document.getElementById('profile-bio').value = currentUser.bio || '';
  }
  document.querySelector('[data-nav="map"]').click();
}

function initProfileForm() {
  const form = document.getElementById('profile-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentUser) {
      document.getElementById('login-modal').showModal();
      return;
    }
    const nickname = document.getElementById('profile-nickname').value.trim();
    const city = document.getElementById('profile-city').value.trim();
    const tagsStr = document.getElementById('profile-tags').value;
    const bio = document.getElementById('profile-bio').value.trim();
    const tags = tagsStr.split(/[,，]+/).map(t => t.trim()).filter(Boolean);

    updateProfile({ nickname: nickname || currentUser.nickname, city, tags, bio });
    updateHeaderUI();
    showToast(t('profile_saved'), 'success');
    document.dispatchEvent(new CustomEvent('profile-updated'));
  });
}
