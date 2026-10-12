/* ==========================================================================
   DERIA MITRA SANGHA (ESTD - 1991)
   MAIN FRONTEND SCRIPT (English Primary, High-Performance)
========================================================================== */

// Toast notification helper
function showToast(message, type = 'info') {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast-msg';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast-msg show ${type}`;
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// Mobile Navbar Toggle
function initNavigation() {
  const toggleBtn = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }
}

// Media Lightbox / Video Modal
function openMediaViewer(item) {
  let modal = document.getElementById('media-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'media-modal';
    modal.className = 'custom-modal';
    modal.innerHTML = `
      <div class="modal-dialog">
        <button class="modal-close-btn" onclick="closeMediaViewer()">&times;</button>
        <div id="modal-media-container" class="modal-media-holder"></div>
        <div class="modal-caption-area">
          <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span id="modal-cat-badge" class="media-cat-badge"></span>
            <span id="modal-date-text" class="media-date"></span>
          </div>
          <h3 id="modal-title-text" style="color:var(--dark-bg); font-size:1.3rem; margin-bottom:8px;"></h3>
          <p id="modal-desc-text" style="color:var(--text-muted); font-size:0.95rem;"></p>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeMediaViewer();
    });
  }

  const holder = document.getElementById('modal-media-container');
  holder.innerHTML = '';

  if (item.videoType === 'youtube' && item.youtubeId) {
    holder.innerHTML = `<iframe src="https://www.youtube.com/embed/${item.youtubeId}?autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  } else if (item.imageUrl) {
    holder.innerHTML = `<img src="${item.imageUrl}" alt="${escapeHtml(item.title)}">`;
  }

  document.getElementById('modal-cat-badge').textContent = item.category || 'General';
  document.getElementById('modal-date-text').textContent = item.date || '';
  document.getElementById('modal-title-text').textContent = item.title;
  document.getElementById('modal-desc-text').textContent = item.caption || item.description || '';

  modal.classList.add('active');
}

function closeMediaViewer() {
  const modal = document.getElementById('media-modal');
  if (modal) {
    modal.classList.remove('active');
    const holder = document.getElementById('modal-media-container');
    if (holder) holder.innerHTML = '';
  }
}

// Live News Ticker
async function initTicker() {
  const tickerTrack = document.getElementById('ticker-track');
  if (!tickerTrack) return;
  try {
    const notices = await ClubDB.getNotices();
    if (notices.length > 0) {
      tickerTrack.innerHTML = notices.map(n => `
        <span style="margin-right: 35px;">
          ${n.isUrgent ? '🔴 [URGENT]' : '📢'} <strong>${escapeHtml(n.title)}</strong> &mdash; ${escapeHtml(n.content.substring(0, 75))}...
        </span>
      `).join(' • ');
    }
  } catch (err) {
    console.error('Ticker error:', err);
  }
}

// Render Gallery with Filter Tabs (Photos & Videos)
let currentFilter = 'all';

async function renderGalleryPage() {
  const container = document.getElementById('gallery-media-grid');
  if (!container) return;

  const [photos, videos] = await Promise.all([
    ClubDB.getPhotos(),
    ClubDB.getVideos()
  ]);

  // Combine media
  const allMedia = [
    ...photos.map(p => ({ ...p, isVideo: false })),
    ...videos.map(v => ({ ...v, isVideo: true }))
  ].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  let filtered = allMedia;
  if (currentFilter === 'photos') {
    filtered = allMedia.filter(m => !m.isVideo);
  } else if (currentFilter === 'videos') {
    filtered = allMedia.filter(m => m.isVideo);
  } else if (currentFilter !== 'all') {
    filtered = allMedia.filter(m => m.category && m.category.toLowerCase() === currentFilter.toLowerCase());
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding:50px; background:#fff; border-radius:12px; border:1px solid var(--light-border);">
        <h4 style="color:var(--dark-bg); margin-bottom:8px;">No media available in this category</h4>
        <p style="color:var(--text-muted); font-size:0.95rem;">You can upload new photos or link YouTube videos from the Admin Panel.</p>
        <a href="admin.html" class="btn btn-primary btn-sm" style="margin-top:15px;">Go to Admin Panel</a>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const thumbUrl = item.isVideo 
      ? `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`
      : item.imageUrl;

    return `
      <div class="media-card">
        <div class="media-thumb-wrap" onclick='openMediaViewer(${JSON.stringify(item).replace(/'/g, "&#39;")})'>
          <img src="${thumbUrl}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80'">
          ${item.isVideo ? '<div class="media-play-icon">▶</div>' : ''}
        </div>
        <div class="media-content">
          <div class="media-badge-row">
            <span class="media-cat-badge">${escapeHtml(item.category || 'General')}</span>
            <span class="media-date">${item.date || ''}</span>
          </div>
          <h4 class="media-title">${escapeHtml(item.title)}</h4>
          <p class="media-caption">${escapeHtml(item.caption || item.description || '')}</p>
        </div>
      </div>
    `;
  }).join('');
}

// Setup Gallery Filter Tabs
function initGalleryFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter || 'all';
      renderGalleryPage();
    });
  });
}

// Render Notices Page
async function renderNoticesPage() {
  const container = document.getElementById('notices-container');
  if (!container) return;

  const notices = await ClubDB.getNotices();
  if (notices.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted);">No active notices at this time.</div>`;
    return;
  }

  container.innerHTML = notices.map(n => `
    <div class="notice-card ${n.isUrgent ? 'urgent' : ''}">
      <div class="notice-body">
        ${n.isUrgent ? '<span class="notice-tag-urgent">🚨 URGENT NOTICE</span>' : ''}
        <h3>${escapeHtml(n.title)}</h3>
        <p>${escapeHtml(n.content)}</p>
      </div>
      <div class="notice-meta-side">
        <div class="notice-date-text">📅 ${n.date || 'Today'}</div>
        <span class="media-cat-badge" style="margin-top:8px; display:inline-block;">${escapeHtml(n.category || 'General')}</span>
      </div>
    </div>
  `).join('');
}

// Render Events Page
async function renderEventsPage() {
  const container = document.getElementById('events-container');
  if (!container) return;

  const events = await ClubDB.getEvents();
  if (events.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted);">No scheduled events found.</div>`;
    return;
  }

  container.innerHTML = events.map(e => `
    <div class="event-row-card">
      <div class="event-date-sidebar">
        <span class="event-date-main">${escapeHtml(e.dateDisplay || 'TBA')}</span>
        <span style="font-size:0.8rem; color:#94A3B8; margin-top:4px;">${escapeHtml(e.time || '')}</span>
      </div>
      <div class="event-content-body">
        <span class="media-cat-badge" style="margin-bottom:8px; display:inline-block;">${escapeHtml(e.category || 'Community')}</span>
        <h3>${escapeHtml(e.title)}</h3>
        <div class="event-location-row">📍 Venue: ${escapeHtml(e.venue || 'Club Grounds')}</div>
        <p>${escapeHtml(e.description || '')}</p>
      </div>
    </div>
  `).join('');
}

// Render Homepage Recent Media Highlights
async function renderHomeHighlights() {
  const homeMediaGrid = document.getElementById('home-media-grid');
  if (!homeMediaGrid) return;

  const [photos, videos] = await Promise.all([
    ClubDB.getPhotos(),
    ClubDB.getVideos()
  ]);

  const combined = [
    ...photos.slice(0, 2).map(p => ({ ...p, isVideo: false })),
    ...videos.slice(0, 1).map(v => ({ ...v, isVideo: true }))
  ];

  homeMediaGrid.innerHTML = combined.map(item => {
    const thumbUrl = item.isVideo 
      ? `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`
      : item.imageUrl;

    return `
      <div class="media-card">
        <div class="media-thumb-wrap" onclick='openMediaViewer(${JSON.stringify(item).replace(/'/g, "&#39;")})'>
          <img src="${thumbUrl}" alt="${escapeHtml(item.title)}" loading="lazy">
          ${item.isVideo ? '<div class="media-play-icon">▶</div>' : ''}
        </div>
        <div class="media-content">
          <div class="media-badge-row">
            <span class="media-cat-badge">${escapeHtml(item.category || 'Highlights')}</span>
            <span class="media-date">${item.date || ''}</span>
          </div>
          <h4 class="media-title">${escapeHtml(item.title)}</h4>
          <p class="media-caption">${escapeHtml(item.caption || item.description || '')}</p>
        </div>
      </div>
    `;
  }).join('');
}

// Utility: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initTicker();
  renderHomeHighlights();
  renderGalleryPage();
  initGalleryFilters();
  renderNoticesPage();
  renderEventsPage();
});
