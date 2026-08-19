/** 同好地图 — 基于定位发现周边追星同好 */

let map = null;
let markers = [];
let userMarker = null;

function initMapSocial() {
  initFansData();
  initMap();
  bindEvents();
  renderNearbyList();

  document.addEventListener('locale-change', () => {
    renderAllMarkers();
    renderNearbyList();
  });
}

function initFansData() {
  const stored = get('fans');
  if (!stored || stored.length === 0) {
    const fans = DEMO_FANS.map(f => ({
      ...f,
      avatar: avatarUrl(f.nickname),
    }));
    set('fans', fans);
  }
}

function getAllFans() {
  return get('fans', []);
}

const MAP_MIN_ZOOM = 2;
const MAP_MAX_ZOOM = 18;
const MAP_DISTRICT_ZOOM = 13;
const MAP_CITY_ZOOM = 11;

function getMapStartView() {
  const user = getUser();
  if (user?.lat != null) {
    const fuzzed = fuzzLocation(user.lat, user.lng, user.id);
    return { center: toMapLatLng(fuzzed.lat, fuzzed.lng), zoom: MAP_CITY_ZOOM };
  }
  return { center: toMapLatLng(35.0, 105.0), zoom: 4 };
}

function initMap() {
  if (map) return;

  const start = getMapStartView();

  map = L.map('fan-map', {
    center: start.center,
    zoom: start.zoom,
    minZoom: MAP_MIN_ZOOM,
    maxZoom: MAP_MAX_ZOOM,
    zoomControl: false,
    worldCopyJump: true,
    dragging: true,
    scrollWheelZoom: false,
    touchZoom: false,
    doubleClickZoom: true,
    boxZoom: true,
    keyboard: true,
    inertia: true,
    inertiaDeceleration: 2800,
  });

  L.control.zoom({ position: 'topright' }).addTo(map);

  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}', {
    subdomains: ['1', '2', '3', '4'],
    attribution: '&copy; 高德地图',
    maxZoom: 18,
  }).addTo(map);

  enableTwoFingerPan(map);
  renderAllMarkers();

  setTimeout(() => map.invalidateSize(), 300);
}

/** 双指/触控板平移：左右上下拖地图；捏合或 Ctrl+滚轮缩放 */
function enableTwoFingerPan(mapInstance) {
  const container = mapInstance.getContainer();
  let touchState = null;

  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.ctrlKey) {
      const step = e.deltaY > 0 ? -0.6 : 0.6;
      mapInstance.setZoom(mapInstance.getZoom() + step);
      return;
    }
    mapInstance.panBy([e.deltaX, e.deltaY], { animate: false });
  }, { passive: false });

  container.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 2) {
      touchState = null;
      return;
    }
    mapInstance.dragging.disable();
    const [a, b] = [e.touches[0], e.touches[1]];
    touchState = {
      midX: (a.clientX + b.clientX) / 2,
      midY: (a.clientY + b.clientY) / 2,
      dist: Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY),
      mode: 'pan',
      startZoom: mapInstance.getZoom(),
    };
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (!touchState || e.touches.length !== 2) return;

    const [a, b] = [e.touches[0], e.touches[1]];
    const midX = (a.clientX + b.clientX) / 2;
    const midY = (a.clientY + b.clientY) / 2;
    const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
    const move = Math.hypot(midX - touchState.midX, midY - touchState.midY);
    const spread = Math.abs(dist - touchState.dist);

    if (touchState.mode === 'pan' && spread > 14 && spread > move * 0.45) {
      touchState.mode = 'pinch';
      touchState.dist = dist;
      touchState.startZoom = mapInstance.getZoom();
    }

    if (touchState.mode === 'pinch') {
      e.preventDefault();
      const scale = dist / touchState.dist;
      if (Math.abs(scale - 1) > 0.01) {
        mapInstance.setZoom(touchState.startZoom + Math.log2(scale));
      }
      return;
    }

    e.preventDefault();
    mapInstance.panBy([midX - touchState.midX, midY - touchState.midY], { animate: false });
    touchState.midX = midX;
    touchState.midY = midY;
    touchState.dist = dist;
  }, { passive: false });

  const resetTouch = () => {
    touchState = null;
    mapInstance.dragging.enable();
  };
  container.addEventListener('touchend', resetTouch);
  container.addEventListener('touchcancel', resetTouch);
}

function renderAllMarkers() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  if (userMarker) {
    map.removeLayer(userMarker);
    userMarker = null;
  }

  const fans = getAllFans();
  const currentUser = getUser();

  fans.forEach(fan => {
    if (currentUser && fan.id === currentUser.id) return;

    const fuzzed = fuzzLocation(fan.lat, fan.lng, fan.id);
    const [lat, lng] = toMapLatLng(fuzzed.lat, fuzzed.lng);
    const color = fan.online ? '#00b894' : '#686878';

    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width:32px;height:32px;border-radius:50%;
        border:3px solid ${color};
        overflow:hidden;background:#1a1a26;
        box-shadow:0 2px 8px rgba(0,0,0,0.5);
      "><img src="${fan.avatar || avatarUrl(fan.nickname)}" style="width:100%;height:100%;object-fit:cover" /></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup(createPopupContent(fan));

    marker.on('click', () => showUserProfile(fan));
    markers.push(marker);
  });

  if (currentUser?.lat != null) {
    const fuzzed = fuzzLocation(currentUser.lat, currentUser.lng, currentUser.id);
    const [lat, lng] = toMapLatLng(fuzzed.lat, fuzzed.lng);
    const myIcon = L.divIcon({
      className: 'custom-marker-me',
      html: `<div style="
        width:36px;height:36px;border-radius:50%;
        border:3px solid #e84393;
        overflow:hidden;background:#1a1a26;
        box-shadow:0 0 12px rgba(232,67,147,0.5);
      "><img src="${currentUser.avatar}" style="width:100%;height:100%;object-fit:cover" /></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    userMarker = L.marker([lat, lng], { icon: myIcon })
      .addTo(map)
      .bindPopup(`<strong>${t('map_you_here')}</strong><br>${escapeHtml(currentUser.city || t('map_unknown'))}`);
  }
}

function createPopupContent(fan) {
  const status = fan.online ? `🟢 ${t('map_online')}` : `⚪ ${t('map_offline')}`;
  const tags = (fan.tags || []).map(tag => `#${tag}`).join(' ');
  return `
    <div style="min-width:160px">
      <strong>${escapeHtml(fan.nickname)}</strong><br>
      <span style="font-size:12px;color:#9898a8">${escapeHtml(fan.city)} · ${status}</span><br>
      <span style="font-size:11px">${tags}</span>
    </div>
  `;
}

function showUserProfile(fan) {
  const modal = document.getElementById('user-modal');
  const content = document.getElementById('user-profile-content');
  const tags = (fan.tags || []).map(tag => `<span class="post-tag">#${escapeHtml(tag)}</span>`).join('');

  content.innerHTML = `
    <img class="user-profile-avatar" src="${fan.avatar || avatarUrl(fan.nickname)}" alt="" />
    <div class="user-profile-name">${escapeHtml(fan.nickname)}</div>
    <div class="user-profile-city">📍 ${escapeHtml(fan.city || t('map_unknown'))}</div>
    <div class="user-profile-tags">${tags}</div>
    <div class="user-profile-bio">${escapeHtml(fan.bio || t('map_bio_empty'))}</div>
    <button class="btn-primary full-width" style="margin-top:16px" id="say-hi-btn">
      ${t('map_say_hi')}
    </button>
  `;

  document.getElementById('say-hi-btn').addEventListener('click', () => {
    showToast(`${t('map_say_hi_toast', { name: fan.nickname })} ${t('map_say_hi_demo')}`, 'success');
    modal.close();
  });

  modal.showModal();
}

function renderNearbyList() {
  const list = document.getElementById('nearby-list');
  const fans = getAllFans();
  const currentUser = getUser();

  let sorted = [...fans];
  if (currentUser?.lat != null) {
    sorted = sorted
      .filter(f => f.id !== currentUser.id)
      .map(f => ({
        ...f,
        distance: haversineDistance(currentUser.lat, currentUser.lng, f.lat, f.lng),
      }))
      .sort((a, b) => a.distance - b.distance);
  }

  const display = sorted.slice(0, 8);

  if (display.length === 0) {
    list.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem">${t('map_no_fans')}</p>`;
    return;
  }

  list.innerHTML = display.map(fan => `
    <div class="nearby-item" data-id="${fan.id}">
      <img class="nearby-avatar" src="${fan.avatar || avatarUrl(fan.nickname)}" alt="" />
      <div class="nearby-info">
        <div class="nearby-name">${escapeHtml(fan.nickname)}</div>
        <div class="nearby-meta">${escapeHtml(fan.city)} · ${(fan.tags || []).slice(0, 2).join(', ')}</div>
      </div>
      ${fan.distance != null ? `<span class="nearby-distance">${formatDistance(fan.distance)}</span>` : ''}
    </div>
  `).join('');

  list.querySelectorAll('.nearby-item').forEach(item => {
    item.addEventListener('click', () => {
      const fan = fans.find(f => f.id === item.dataset.id);
      if (fan) {
        const fuzzed = fuzzLocation(fan.lat, fan.lng, fan.id);
        map.setView(toMapLatLng(fuzzed.lat, fuzzed.lng), MAP_DISTRICT_ZOOM, { animate: true });
        showUserProfile(fan);
      }
    });
  });
}

function bindEvents() {
  document.getElementById('locate-btn').addEventListener('click', requestLocation);

  document.addEventListener('profile-updated', () => {
    renderAllMarkers();
    renderNearbyList();
  });

  document.addEventListener('user-login', () => {
    renderAllMarkers();
    renderNearbyList();
  });
}

function requestLocation() {
  const user = getUser();
  if (!user) {
    document.getElementById('login-modal').showModal();
    return;
  }

  if (!navigator.geolocation) {
    showToast(t('map_no_geo'), 'error');
    return;
  }

  showToast(t('map_locating'), 'info');

  const langParam = getLang() === 'zh' ? 'zh' : 'en';

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      let city = user.city;

      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${langParam}`,
        );
        const data = await resp.json();
        city = data.address?.city || data.address?.town || data.address?.county || city;
      } catch { /* keep existing city */ }

      updateLocation(lat, lng, city);
      document.getElementById('profile-city').value = city;
      renderAllMarkers();
      renderNearbyList();

      const fuzzed = fuzzLocation(lat, lng, user.id);
      map.setView(toMapLatLng(fuzzed.lat, fuzzed.lng), MAP_DISTRICT_ZOOM, { animate: true });
      showToast(t('map_locate_ok', { city: city || t('map_unknown') }), 'success');
    },
    () => {
      showToast(t('map_locate_fail'), 'error');
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
  );
}

function onMapSectionShow() {
  if (map) {
    setTimeout(() => {
      map.invalidateSize();
      renderAllMarkers();
      renderNearbyList();
    }, 100);
  }
}
