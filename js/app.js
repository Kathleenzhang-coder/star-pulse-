/** StarPulse — 主入口 */

function initNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  const sections = document.querySelectorAll('main.section');

  function switchTab(target) {
    tabs.forEach(t => {
      const active = t.dataset.nav === target;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active);
    });
    sections.forEach(s => {
      s.classList.toggle('active', s.id === `section-${target}`);
    });
    if (target === 'map') onMapSectionShow();
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.nav));
  });

  document.querySelector('.logo')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('news');
  });

  window.switchTab = switchTab;
}

function initModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.close();
    });
  });
}

function boot() {
  initI18n();
  initInteractions();
  initAuthUI();
  initProfileForm();
  initNavigation();
  initModals();
  initNews();
  initCommunity();
  initMapSocial();
  updateHeaderUI();

  document.addEventListener('locale-change', () => {
    updateHeaderUI();
    renderPosts();
    renderSidebar();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
