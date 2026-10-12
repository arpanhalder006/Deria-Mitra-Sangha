/* ===================================================
   DERIA MITRA SANGHA (ESTD - 1991)
   ROBUST DATABASE & MEDIA STORAGE ENGINE (IndexedDB + LocalStorage)
   Features:
   - High-capacity storage for Photos & Videos (IndexedDB)
   - Client-side Canvas Image Compression (Converts 10MB photos to ~150KB)
   - YouTube Video Embed & Parsing
   - Full CRUD (Create, Read, Update, Delete)
=================================================== */

const DB_NAME = 'DMS_Club_Database';
const DB_VERSION = 2;

// Default initial data for a professional look
const DEFAULT_PHOTOS = [
  {
    id: 'photo_1',
    title: 'Annual Grand Durga Puja Festival',
    category: 'Festivals',
    caption: 'Celebrating tradition, devotion, and community harmony with radiant celebrations and cultural evenings.',
    imageUrl: 'https://images.unsplash.com/photo-1601655781320-225574577f88?auto=format&fit=crop&w=1200&q=80',
    date: '2025-10-12',
    timestamp: Date.now() - 40000000
  },
  {
    id: 'photo_2',
    title: 'Voluntary Blood Donation & Medical Camp',
    category: 'Social Service',
    caption: 'Over 120 units of blood collected in collaboration with state blood bank along with free eye screenings.',
    imageUrl: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1200&q=80',
    date: '2025-08-15',
    timestamp: Date.now() - 30000000
  },
  {
    id: 'photo_3',
    title: 'Inter-Club Championship Football Tournament',
    category: 'Sports',
    caption: 'Thrilling final match with local clubs competing for the prestigious Deria Mitra Sangha Gold Trophy.',
    imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80',
    date: '2026-01-26',
    timestamp: Date.now() - 20000000
  },
  {
    id: 'photo_4',
    title: 'Winter Blanket & Educational Aid Distribution',
    category: 'Charity',
    caption: 'Supporting underprivileged students with school stationery and providing warm blankets to elder citizens.',
    imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
    date: '2025-12-25',
    timestamp: Date.now() - 10000000
  }
];

const DEFAULT_VIDEOS = [
  {
    id: 'video_1',
    title: 'Deria Mitra Sangha Cultural Evening & Highlights',
    category: 'Festivals',
    videoType: 'youtube',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    youtubeId: 'ScMzIvxBSi4',
    description: 'Highlights of cultural dance, musical performances, and award distributions by youth members.',
    date: '2025-10-15',
    timestamp: Date.now() - 35000000
  },
  {
    id: 'video_2',
    title: 'Annual Sports Day Final Match Recap',
    category: 'Sports',
    videoType: 'youtube',
    videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    youtubeId: 'aqz-KE-bpKQ',
    description: 'Relive the electric energy and celebrations of the annual football tournament finals.',
    date: '2026-01-27',
    timestamp: Date.now() - 15000000
  }
];

const DEFAULT_NOTICES = [
  {
    id: 'not_1',
    title: 'Notice for Annual General Body Meeting (AGM 2026)',
    content: 'All registered club members, patrons, and well-wishers are cordially requested to attend the AGM at the Club Auditorium on Sunday at 6:30 PM. Agenda includes review of accounts and committee election.',
    category: 'Meeting',
    isUrgent: true,
    date: '2026-10-18',
    timestamp: Date.now() - 5000000
  },
  {
    id: 'not_2',
    title: 'Registration Open for Free Health & Eye Examination Camp',
    content: 'Free diagnostic checks, cataract screening, and blood group profiling in partnership with renowned medical specialists. Prior token registration available at the club desk.',
    category: 'Social Service',
    isUrgent: false,
    date: '2026-10-25',
    timestamp: Date.now() - 3000000
  },
  {
    id: 'not_3',
    title: 'Call for Volunteers: Upcoming Sports & Community Gala',
    content: 'Youth members willing to participate in organizing committee duties for the winter tournament are requested to submit their names to the sports secretary.',
    category: 'Sports',
    isUrgent: false,
    date: '2026-11-02',
    timestamp: Date.now() - 1000000
  }
];

const DEFAULT_EVENTS = [
  {
    id: 'eve_1',
    title: 'Sharodotsav Grand Durga Puja Festival 2026',
    dateDisplay: 'OCT 19 - 24, 2026',
    time: '07:00 AM - Midnight',
    venue: 'Deria Mitra Sangha Grounds',
    description: 'Traditional deity worship, dhunuchi dance competition, evening cultural programmes, and community bhog distribution.',
    category: 'Religious'
  },
  {
    id: 'eve_2',
    title: 'Deria Premier League (DPL) Cricket & Football Trophy',
    dateDisplay: 'NOV 12 - 15, 2026',
    time: '09:00 AM - 05:00 PM',
    venue: 'Mitra Sangha Memorial Sports Arena',
    description: '16 invited neighborhood teams competing in knockout matches. Cash prizes and trophies for winners.',
    category: 'Sports'
  },
  {
    id: 'eve_3',
    title: 'Winter Warmth & Book Distribution Campaign',
    dateDisplay: 'DEC 20, 2026',
    time: '11:00 AM - 03:00 PM',
    venue: 'Club Main Hall & Community Pavilion',
    description: 'Annual charitable drive distributing educational kits and blankets to marginalized families.',
    category: 'Charity'
  }
];

// Open IndexedDB instance
function openClubDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      console.warn('IndexedDB not supported, falling back to LocalStorage');
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = (e) => {
      console.error('IndexedDB error:', e);
      resolve(null);
    };
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('photos')) {
        db.createObjectStore('photos', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('videos')) {
        db.createObjectStore('videos', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('notices')) {
        db.createObjectStore('notices', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('events')) {
        db.createObjectStore('events', { keyPath: 'id' });
      }
    };
  });
}

// Client-Side Canvas Image Compression (Converts huge mobile phone images to fast ~150KB Base64)
function compressImageFile(file, maxWidth = 1200, maxHeight = 900, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// Extract YouTube Video ID from any standard link
function parseYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Generic Storage Getter with Fallback
async function getStoreItems(storeName, defaultItems) {
  const db = await openClubDB();
  if (db) {
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = req.result;
        if (!items || items.length === 0) {
          // Initialize with default
          setStoreItems(storeName, defaultItems).then(() => resolve(defaultItems));
        } else {
          resolve(items);
        }
      };
      req.onerror = () => {
        resolve(getFromLocalStorage(storeName, defaultItems));
      };
    });
  } else {
    return getFromLocalStorage(storeName, defaultItems);
  }
}

// Generic Storage Setter
async function setStoreItems(storeName, items) {
  saveToLocalStorage(storeName, items);
  const db = await openClubDB();
  if (db) {
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      items.forEach(item => store.put(item));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  }
  return true;
}

// LocalStorage Helpers
function getFromLocalStorage(key, defaultData) {
  try {
    const raw = localStorage.getItem('dms_' + key);
    if (!raw) {
      localStorage.setItem('dms_' + key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw);
  } catch (e) {
    return defaultData;
  }
}

function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem('dms_' + key, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage limit reached for ' + key, e);
  }
}

// Unified High-level API
const ClubDB = {
  // Photos
  async getPhotos() {
    const items = await getStoreItems('photos', DEFAULT_PHOTOS);
    return items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  },
  async addPhoto(photoObj) {
    const photos = await this.getPhotos();
    photos.unshift(photoObj);
    await setStoreItems('photos', photos);
    return photoObj;
  },
  async updatePhoto(photoObj) {
    let photos = await this.getPhotos();
    photos = photos.map(p => p.id === photoObj.id ? { ...p, ...photoObj } : p);
    await setStoreItems('photos', photos);
    return photoObj;
  },
  async deletePhoto(id) {
    let photos = await this.getPhotos();
    photos = photos.filter(p => p.id !== id);
    await setStoreItems('photos', photos);
    return true;
  },

  // Videos
  async getVideos() {
    const items = await getStoreItems('videos', DEFAULT_VIDEOS);
    return items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  },
  async addVideo(videoObj) {
    const videos = await this.getVideos();
    videos.unshift(videoObj);
    await setStoreItems('videos', videos);
    return videoObj;
  },
  async updateVideo(videoObj) {
    let videos = await this.getVideos();
    videos = videos.map(v => v.id === videoObj.id ? { ...v, ...videoObj } : v);
    await setStoreItems('videos', videos);
    return videoObj;
  },
  async deleteVideo(id) {
    let videos = await this.getVideos();
    videos = videos.filter(v => v.id !== id);
    await setStoreItems('videos', videos);
    return true;
  },

  // Notices
  async getNotices() {
    const items = await getStoreItems('notices', DEFAULT_NOTICES);
    return items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  },
  async addNotice(noticeObj) {
    const notices = await this.getNotices();
    notices.unshift(noticeObj);
    await setStoreItems('notices', notices);
    return noticeObj;
  },
  async updateNotice(noticeObj) {
    let notices = await this.getNotices();
    notices = notices.map(n => n.id === noticeObj.id ? { ...n, ...noticeObj } : n);
    await setStoreItems('notices', notices);
    return noticeObj;
  },
  async deleteNotice(id) {
    let notices = await this.getNotices();
    notices = notices.filter(n => n.id !== id);
    await setStoreItems('notices', notices);
    return true;
  },

  // Events
  async getEvents() {
    return await getStoreItems('events', DEFAULT_EVENTS);
  },
  async addEvent(eventObj) {
    const events = await this.getEvents();
    events.unshift(eventObj);
    await setStoreItems('events', events);
    return eventObj;
  },
  async updateEvent(eventObj) {
    let events = await this.getEvents();
    events = events.map(e => e.id === eventObj.id ? { ...e, ...eventObj } : e);
    await setStoreItems('events', events);
    return eventObj;
  },
  async deleteEvent(id) {
    let events = await this.getEvents();
    events = events.filter(e => e.id !== id);
    await setStoreItems('events', events);
    return true;
  },

  // Reset to Factory Defaults
  async resetAll() {
    await setStoreItems('photos', DEFAULT_PHOTOS);
    await setStoreItems('videos', DEFAULT_VIDEOS);
    await setStoreItems('notices', DEFAULT_NOTICES);
    await setStoreItems('events', DEFAULT_EVENTS);
    return true;
  }
};

window.ClubDB = ClubDB;
window.compressImageFile = compressImageFile;
window.parseYouTubeId = parseYouTubeId;
