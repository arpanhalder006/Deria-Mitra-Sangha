/* ==========================================================================
   DERIA MITRA SANGHA (ESTD - 1991)
   PROFESSIONAL ADMIN ENGINE (Password: m7@1991)
========================================================================== */

const ADMIN_PASSWORD_HASH = "m7@1991";
let currentCompressedImageData = null;

function isAdminAuthenticated() {
  return localStorage.getItem('dms_admin_session') === 'true' || 
         sessionStorage.getItem('dms_admin_session') === 'true';
}

function setAdminSession(status) {
  if (status) {
    localStorage.setItem('dms_admin_session', 'true');
    sessionStorage.setItem('dms_admin_session', 'true');
  } else {
    localStorage.removeItem('dms_admin_session');
    sessionStorage.removeItem('dms_admin_session');
  }
}

function initAdminAuthUI() {
  const loginSection = document.getElementById('admin-login-wrapper');
  const dashboardSection = document.getElementById('admin-dashboard-wrapper');
  const loginForm = document.getElementById('admin-login-form');

  if (isAdminAuthenticated()) {
    if (loginSection) loginSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'block';
    refreshAllAdminTables();
  } else {
    if (loginSection) loginSection.style.display = 'block';
    if (dashboardSection) dashboardSection.style.display = 'none';
  }

  if (loginForm) {
    loginForm.onsubmit = function(e) {
      e.preventDefault();
      const passField = document.getElementById('admin-password-input');
      const errorMsg = document.getElementById('login-error-alert');
      const pass = passField.value.trim();

      if (pass === ADMIN_PASSWORD_HASH) {
        setAdminSession(true);
        showToast('Authentication Successful! Welcome Admin.', 'success');
        passField.value = '';
        if (errorMsg) errorMsg.style.display = 'none';
        initAdminAuthUI();
      } else {
        if (errorMsg) {
          errorMsg.textContent = 'Invalid Password! Please enter the correct admin key.';
          errorMsg.style.display = 'block';
        }
        showToast('Incorrect password entered.', 'error');
      }
    };
  }
}

function handleAdminLogout() {
  setAdminSession(false);
  showToast('Logged out successfully.', 'info');
  initAdminAuthUI();
}

function switchAdminTab(tabKey) {
  document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.admin-view-panel').forEach(p => p.classList.remove('active'));

  const activeBtn = document.getElementById(`tab-btn-${tabKey}`);
  const activePanel = document.getElementById(`panel-${tabKey}`);

  if (activeBtn) activeBtn.classList.add('active');
  if (activePanel) activePanel.classList.add('active');

  if (tabKey === 'manage') {
    refreshAllAdminTables();
  }
}

function initPhotoManager() {
  const photoForm = document.getElementById('form-add-photo');
  const fileInput = document.getElementById('photo-file-input');
  const urlInput = document.getElementById('photo-url-input');
  const previewBox = document.getElementById('photo-live-preview');
  const previewImg = document.getElementById('photo-preview-img');
  const previewInfo = document.getElementById('photo-preview-info');

  if (!photoForm) return;

  if (fileInput) {
    fileInput.addEventListener('change', async function() {
      const file = this.files[0];
      if (!file) return;

      previewInfo.textContent = 'Compressing image for fast loading...';
      previewBox.style.display = 'block';

      try {
        currentCompressedImageData = await compressImageFile(file, 1200, 900, 0.78);
        previewImg.src = currentCompressedImageData;
        const sizeInKb = Math.round((currentCompressedImageData.length * 3 / 4) / 1024);
        previewInfo.innerHTML = `✅ <strong>Ready:</strong> Compressed to ~${sizeInKb} KB (Original: ${(file.size / (1024*1024)).toFixed(2)} MB)`;
      } catch (err) {
        previewInfo.textContent = 'Failed to process image. You may enter an image URL instead.';
      }
    });
  }

  if (urlInput) {
    urlInput.addEventListener('input', function() {
      if (this.value.trim() && (!fileInput.files || fileInput.files.length === 0)) {
        previewImg.src = this.value.trim();
        previewBox.style.display = 'block';
        previewInfo.textContent = 'External image link loaded.';
      }
    });
  }

  photoForm.onsubmit = async function(e) {
    e.preventDefault();
    const title = document.getElementById('photo-title').value.trim();
    const category = document.getElementById('photo-category').value;
    const caption = document.getElementById('photo-caption').value.trim();
    const date = document.getElementById('photo-date').value || new Date().toISOString().split('T')[0];
    const directUrl = urlInput.value.trim();

    const finalImage = currentCompressedImageData || directUrl;
    if (!finalImage) {
      alert('Please select an image file from your device or provide a direct image link.');
      return;
    }

    const newPhoto = {
      id: 'photo_' + Date.now(),
      title,
      category,
      caption,
      imageUrl: finalImage,
      date,
      timestamp: Date.now()
    };

    await ClubDB.addPhoto(newPhoto);
    showToast('Photo uploaded and published successfully!', 'success');
    photoForm.reset();
    currentCompressedImageData = null;
    previewBox.style.display = 'none';
    refreshAllAdminTables();
  };
}

function initVideoManager() {
  const videoForm = document.getElementById('form-add-video');
  const urlInput = document.getElementById('video-url-input');
  const previewBox = document.getElementById('video-live-preview');
  const previewImg = document.getElementById('video-preview-thumb');
  const previewStatus = document.getElementById('video-preview-status');

  if (!videoForm) return;

  if (urlInput) {
    urlInput.addEventListener('input', function() {
      const url = this.value.trim();
      const ytId = parseYouTubeId(url);
      if (ytId) {
        previewImg.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        previewBox.style.display = 'block';
        previewStatus.innerHTML = `✅ <strong>YouTube Video Verified:</strong> ID: <code>${ytId}</code>`;
      } else {
        previewBox.style.display = 'none';
      }
    });
  }

  videoForm.onsubmit = async function(e) {
    e.preventDefault();
    const title = document.getElementById('video-title').value.trim();
    const category = document.getElementById('video-category').value;
    const url = urlInput.value.trim();
    const description = document.getElementById('video-desc').value.trim();
    const date = document.getElementById('video-date').value || new Date().toISOString().split('T')[0];

    const ytId = parseYouTubeId(url);
    if (!ytId) {
      alert('Please enter a valid YouTube video link (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)');
      return;
    }

    const newVideo = {
      id: 'video_' + Date.now(),
      title,
      category,
      videoType: 'youtube',
      videoUrl: url,
      youtubeId: ytId,
      description,
      date,
      timestamp: Date.now()
    };

    await ClubDB.addVideo(newVideo);
    showToast('Video added to Club Gallery successfully!', 'success');
    videoForm.reset();
    previewBox.style.display = 'none';
    refreshAllAdminTables();
  };
}

function initNoticeManager() {
  const noticeForm = document.getElementById('form-add-notice');
  if (!noticeForm) return;

  noticeForm.onsubmit = async function(e) {
    e.preventDefault();
    const title = document.getElementById('notice-title').value.trim();
    const category = document.getElementById('notice-category').value;
    const content = document.getElementById('notice-content').value.trim();
    const date = document.getElementById('notice-date').value || new Date().toISOString().split('T')[0];
    const isUrgent = document.getElementById('notice-urgent-check').checked;

    const newNotice = {
      id: 'not_' + Date.now(),
      title,
      category,
      content,
      isUrgent,
      date,
      timestamp: Date.now()
    };

    await ClubDB.addNotice(newNotice);
    showToast('Official notice published to website!', 'success');
    noticeForm.reset();
    refreshAllAdminTables();
  };
}

function initEventManager() {
  const eventForm = document.getElementById('form-add-event');
  if (!eventForm) return;

  eventForm.onsubmit = async function(e) {
    e.preventDefault();
    const title = document.getElementById('event-title').value.trim();
    const category = document.getElementById('event-category').value;
    const dateDisplay = document.getElementById('event-date-display').value.trim();
    const time = document.getElementById('event-time').value.trim();
    const venue = document.getElementById('event-venue').value.trim();
    const description = document.getElementById('event-desc').value.trim();

    const newEvent = {
      id: 'eve_' + Date.now(),
      title,
      category,
      dateDisplay,
      time,
      venue,
      description
    };

    await ClubDB.addEvent(newEvent);
    showToast('New club event added successfully!', 'success');
    eventForm.reset();
    refreshAllAdminTables();
  };
}

async function refreshAllAdminTables() {
  const [photos, videos, notices, events] = await Promise.all([
    ClubDB.getPhotos(),
    ClubDB.getVideos(),
    ClubDB.getNotices(),
    ClubDB.getEvents()
  ]);

  const photoTbody = document.getElementById('admin-photo-table-body');
  if (photoTbody) {
    photoTbody.innerHTML = photos.length === 0 
      ? `<tr><td colspan="5" style="text-align:center; color:#94A3B8;">No photos uploaded yet.</td></tr>`
      : photos.map(p => `
        <tr>
          <td><img src="${p.imageUrl}" class="admin-thumb" alt="${escapeHtml(p.title)}"></td>
          <td><strong>${escapeHtml(p.title)}</strong><br><small style="color:#64748B;">${escapeHtml(p.caption || '').substring(0, 45)}...</small></td>
          <td><span class="media-cat-badge">${escapeHtml(p.category)}</span></td>
          <td>${p.date || '-'}</td>
          <td>
            <div class="action-btn-row">
              <button class="btn-action-edit" onclick="openEditModal('photo', '${p.id}')">Edit</button>
              <button class="btn-action-delete" onclick="deleteItemHandler('photo', '${p.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `).join('');
  }

  const videoTbody = document.getElementById('admin-video-table-body');
  if (videoTbody) {
    videoTbody.innerHTML = videos.length === 0
      ? `<tr><td colspan="5" style="text-align:center; color:#94A3B8;">No videos added yet.</td></tr>`
      : videos.map(v => `
        <tr>
          <td><img src="https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg" class="admin-thumb" alt="${escapeHtml(v.title)}"></td>
          <td><strong>${escapeHtml(v.title)}</strong><br><small style="color:#64748B;">${escapeHtml(v.videoUrl)}</small></td>
          <td><span class="media-cat-badge">${escapeHtml(v.category)}</span></td>
          <td>${v.date || '-'}</td>
          <td>
            <div class="action-btn-row">
              <button class="btn-action-edit" onclick="openEditModal('video', '${v.id}')">Edit</button>
              <button class="btn-action-delete" onclick="deleteItemHandler('video', '${v.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `).join('');
  }

  const noticeTbody = document.getElementById('admin-notice-table-body');
  if (noticeTbody) {
    noticeTbody.innerHTML = notices.length === 0
      ? `<tr><td colspan="5" style="text-align:center; color:#94A3B8;">No notices found.</td></tr>`
      : notices.map(n => `
        <tr>
          <td><strong>${escapeHtml(n.title)}</strong></td>
          <td>${escapeHtml(n.content.substring(0, 50))}...</td>
          <td>${n.isUrgent ? '<span style="color:red; font-weight:bold;">🚨 URGENT</span>' : 'Regular'}</td>
          <td>${n.date || '-'}</td>
          <td>
            <div class="action-btn-row">
              <button class="btn-action-edit" onclick="openEditModal('notice', '${n.id}')">Edit</button>
              <button class="btn-action-delete" onclick="deleteItemHandler('notice', '${n.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `).join('');
  }

  const eventTbody = document.getElementById('admin-event-table-body');
  if (eventTbody) {
    eventTbody.innerHTML = events.length === 0
      ? `<tr><td colspan="5" style="text-align:center; color:#94A3B8;">No events found.</td></tr>`
      : events.map(e => `
        <tr>
          <td><strong>${escapeHtml(e.title)}</strong></td>
          <td>${escapeHtml(e.dateDisplay)}</td>
          <td>${escapeHtml(e.venue || '-')}</td>
          <td><span class="media-cat-badge">${escapeHtml(e.category)}</span></td>
          <td>
            <div class="action-btn-row">
              <button class="btn-action-edit" onclick="openEditModal('event', '${e.id}')">Edit</button>
              <button class="btn-action-delete" onclick="deleteItemHandler('event', '${e.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `).join('');
  }
}

async function deleteItemHandler(type, id) {
  if (!confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) {
    return;
  }
  if (type === 'photo') await ClubDB.deletePhoto(id);
  else if (type === 'video') await ClubDB.deleteVideo(id);
  else if (type === 'notice') await ClubDB.deleteNotice(id);
  else if (type === 'event') await ClubDB.deleteEvent(id);

  showToast(`Item deleted successfully.`, 'info');
  refreshAllAdminTables();
}

let activeEditItem = null;
let activeEditType = null;

async function openEditModal(type, id) {
  activeEditType = type;
  let item = null;

  if (type === 'photo') {
    const photos = await ClubDB.getPhotos();
    item = photos.find(p => p.id === id);
  } else if (type === 'video') {
    const videos = await ClubDB.getVideos();
    item = videos.find(v => v.id === id);
  } else if (type === 'notice') {
    const notices = await ClubDB.getNotices();
    item = notices.find(n => n.id === id);
  } else if (type === 'event') {
    const events = await ClubDB.getEvents();
    item = events.find(e => e.id === id);
  }

  if (!item) return;
  activeEditItem = item;

  let modal = document.getElementById('admin-edit-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'admin-edit-modal';
    modal.className = 'custom-modal';
    modal.innerHTML = `
      <div class="modal-dialog" style="max-width: 600px;">
        <button class="modal-close-btn" onclick="closeEditModal()">&times;</button>
        <div style="padding: 30px;">
          <h3 id="edit-modal-heading" style="color:var(--dark-bg); font-size:1.3rem; margin-bottom:20px;">Edit Item</h3>
          <form id="admin-edit-form">
            <div class="form-group">
              <label class="form-label">Title</label>
              <input type="text" id="edit-field-title" class="form-control" required>
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <input type="text" id="edit-field-category" class="form-control">
            </div>
            <div class="form-group">
              <label class="form-label">Description / Content</label>
              <textarea id="edit-field-text" class="form-control"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Date / Schedule</label>
              <input type="text" id="edit-field-date" class="form-control">
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;">💾 Save & Update Changes</button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeEditModal();
    });

    document.getElementById('admin-edit-form').onsubmit = handleEditFormSubmit;
  }

  document.getElementById('edit-modal-heading').textContent = `Edit ${type.toUpperCase()}: ${item.title}`;
  document.getElementById('edit-field-title').value = item.title || '';
  document.getElementById('edit-field-category').value = item.category || '';
  document.getElementById('edit-field-text').value = item.caption || item.description || item.content || '';
  document.getElementById('edit-field-date').value = item.date || item.dateDisplay || '';

  modal.classList.add('active');
}

function closeEditModal() {
  const modal = document.getElementById('admin-edit-modal');
  if (modal) modal.classList.remove('active');
}

async function handleEditFormSubmit(e) {
  e.preventDefault();
  if (!activeEditItem || !activeEditType) return;

  const newTitle = document.getElementById('edit-field-title').value.trim();
  const newCat = document.getElementById('edit-field-category').value.trim();
  const newText = document.getElementById('edit-field-text').value.trim();
  const newDate = document.getElementById('edit-field-date').value.trim();

  activeEditItem.title = newTitle;
  activeEditItem.category = newCat;

  if (activeEditType === 'photo') {
    activeEditItem.caption = newText;
    activeEditItem.date = newDate;
    await ClubDB.updatePhoto(activeEditItem);
  } else if (activeEditType === 'video') {
    activeEditItem.description = newText;
    activeEditItem.date = newDate;
    await ClubDB.updateVideo(activeEditItem);
  } else if (activeEditType === 'notice') {
    activeEditItem.content = newText;
    activeEditItem.date = newDate;
    await ClubDB.updateNotice(activeEditItem);
  } else if (activeEditType === 'event') {
    activeEditItem.description = newText;
    activeEditItem.dateDisplay = newDate;
    await ClubDB.updateEvent(activeEditItem);
  }

  showToast('Information updated successfully!', 'success');
  closeEditModal();
  refreshAllAdminTables();
}

async function resetClubData() {
  if (confirm('WARNING: This will reset all photos, videos, notices, and events back to the default demo data. Are you sure?')) {
    await ClubDB.resetAll();
    showToast('Factory data restored successfully!', 'success');
    refreshAllAdminTables();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initAdminAuthUI();
  initPhotoManager();
  initVideoManager();
  initNoticeManager();
  initEventManager();
});