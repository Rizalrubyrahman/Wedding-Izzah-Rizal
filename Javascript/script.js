/* ====== PENGATURAN (GANTI DI SINI) ====== */
const CONFIG = {
  // Video intro
  videoUrl: 'https://the.invisimple.id/wp-content/uploads/2025/05/Midnight-04-Motion-FIX.mp4',

  // Musik latar
  musicUrl: 'https://the.invisimple.id/wp-content/uploads/2024/10/Howls-Moving-Castle.mp3',

  textDelay: 120,

  eventDate: '2026-11-28T11:00:00+07:00',
  eventEnd: '2026-11-28T13:00:00+07:00',
  eventTitle: 'The Wedding of Izzah & Rizal',
  eventPlace: 'Aula Masjid At-Taqwa Universitas Pancasila, Jakarta',

  // URL Web App Google Apps Script (berakhiran /exec)
  api: 'https://script.google.com/macros/s/AKfycby8lJeyYej25w2xH7COxyhaL-lX2L4cICgqiK2t0PYGXeC6gZeJvccRbIz526RXrpMzEQ/exec',
  downloadName: 'Ucapan-Izzah-Rizal.xlsx'
};
/* ======================================== */

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// Nama tamu dari URL ?to=Nama+Tamu
const to = new URLSearchParams(location.search).get('to');

if (to) {
  $('#guest').textContent = to;
  $('#nama').value = to;
}

// Siapkan video dan musik
const vid = $('#vid');
const audio = $('#audio');
const music = $('#music');

vid.src = CONFIG.videoUrl;
audio.src = CONFIG.musicUrl;

// Buka undangan
$('#openBtn').onclick = () => {
  window.scrollTo(0, 0);

  $('#cover').classList.add('open');

  vid.currentTime = 0;
  vid.play().catch(showText);

  // audio.play()
  //   .then(() => music.classList.add('spin'))
  //   .catch(() => {});

  music.style.display = 'block';

  setTimeout(showText, CONFIG.textDelay);
};

vid.addEventListener('error', () => {
  setTimeout(showText, 1500);
});

let shown = false;

function showText() {
  if (shown) return;

  shown = true;

  $('#heroText').classList.add('in');

  setTimeout(() => {
    document.body.classList.remove('lock');
  }, 1200);
}

// Tombol musik
music.onclick = () => {
  if (audio.paused) {
    audio.play();
    music.classList.add('spin');
  } else {
    audio.pause();
    music.classList.remove('spin');
  }
};

// Hitung mundur
const target = new Date(CONFIG.eventDate).getTime();

(function tick() {
  let t = Math.max(0, target - Date.now());

  [86400000, 3600000, 60000, 1000].forEach((u, i) => {
    const n = Math.floor(t / u);
    t -= n * u;

    $('#' + 'dhms'[i]).textContent = n;
  });

  setTimeout(tick, 1000);
})();

// Simpan tanggal ke Google Calendar
$('#cal').onclick = e => {
  e.preventDefault();

  const f = d =>
    new Date(d).toISOString().replace(/[-:]|\.\d{3}/g, '');

  const u =
    'https://www.google.com/calendar/render?action=TEMPLATE&text=' +
    encodeURIComponent(CONFIG.eventTitle) +
    '&location=' +
    encodeURIComponent(CONFIG.eventPlace) +
    '&dates=' +
    f(CONFIG.eventDate) +
    '/' +
    f(CONFIG.eventEnd);

  window.open(u, '_blank', 'noopener');
};
const ICON_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check2-all" viewBox="0 0 16 16">
  <path d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 10.293 1.854 7.146a.5.5 0 1 0-.708.708l3.5 3.5a.5.5 0 0 0 .708 0zm-4.208 7-.896-.897.707-.707.543.543 6.646-6.647a.5.5 0 0 1 .708.708l-7 7a.5.5 0 0 1-.708 0"/>
  <path d="m5.354 7.146.896.897-.707.707-.897-.896a.5.5 0 1 1 .708-.708"/>
</svg>`;

// Salin rekening dan alamat
function copy(btn, text) {
  navigator.clipboard.writeText(text).then(() => {
 const original = btn.innerHTML;

    btn.innerHTML = `${ICON_CHECK} Tersalin`;


    setTimeout(() => {
      btn.innerHTML = original;
    }, 1600);
  });
}

$$('[data-copy]').forEach(b => {
  b.onclick = () => copy(b, b.dataset.copy);
});

$('#copyAlamat').onclick = e => {
  copy(e.target, $('#alamat').textContent);
};

// Konfirmasi kehadiran
let hadir = '';

$$('.att button').forEach(b => {
  b.onclick = () => {
    hadir = b.dataset.v;

    $$('.att button').forEach(x => {
      x.classList.toggle('on', x === b);
    });

    $('#guestWrap').style.display =
      hadir === 'Hadir' ? 'block' : 'none';
  };
});

/* ====== UCAPAN: simpan ke Google Sheet lewat Apps Script ====== */
let wishList = [];

// Escape HTML agar input tidak dianggap sebagai HTML
const esc = s => String(s).replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

const label = w =>
  w.kehadiran === 'Hadir'
    ? 'Hadir · ' + w.jumlah
    : (w.kehadiran || '');

function render() {
  $('#wishes').innerHTML = wishList.map(w =>
    `<div class="wish">
      <b>${esc(w.nama)}</b>
      <small>${esc(label(w))}</small>
      <p>${esc(w.pesan)}</p>
    </div>`
  ).join('');
}

async function loadWishes() {
  try {
    const r = await fetch(CONFIG.api + '?t=' + Date.now());
    const d = await r.json();

    if (d.ok) {
      wishList = d.data;
      render();
    }
  } catch {}
}

// Submit ucapan
$('#form').onsubmit = async e => {
  e.preventDefault();

  if (!hadir) {
    alert('Pilih konfirmasi kehadiran');
    return;
  }

  const btn = e.submitter;
  const old = btn.textContent;

  const data = {
    nama: $('#nama').value.trim(),
    kehadiran: hadir,
    jumlah: hadir === 'Hadir' ? $('#jml').value : '-',
    pesan: $('#pesan').value.trim()
  };

  btn.disabled = true;
  btn.textContent = 'Mengirim...';

  try {
    const r = await fetch(CONFIG.api, {
      method: 'POST',
      body: new URLSearchParams(data)
    });

    const d = await r.json();

    if (!d.ok) throw new Error(d.error || 'Gagal');

    wishList.unshift(data);
    render();

    $('#pesan').value = '';
  } catch (err) {
    alert('Gagal mengirim ucapan: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = old;
  }
};

loadWishes();

/* ====== DOWNLOAD EXCEL ====== */
 
/* ====== ANIMASI SCROLL ====== */
const io = new IntersectionObserver(
  es => es.forEach(x => {
    if (x.isIntersecting) {
      x.target.classList.add('in');
    }
  }),
  { threshold: 0.15 }
);

$$('.rv').forEach(el => io.observe(el));

/* ====== EFEK TIRAI ======
   Scroll sedikit saja -> section berikutnya naik menutup hero penuh. */
const hero = $('#hero');
let gateBusy = false;
let lastY = 0;

const ease = t =>
  t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const reduceMotion =
  matchMedia('(prefers-reduced-motion: reduce)').matches;

function curtainTo(targetY, dur = 1500) {
  gateBusy = true;
  document.body.classList.add('lock');

  const start = scrollY;
  const dist = targetY - start;
  const t0 = performance.now();
  const d = reduceMotion ? 1 : dur;

  (function step(now) {
    const p = Math.min(1, (now - t0) / d);

    scrollTo(0, start + dist * ease(p));

    if (p < 1) {
      requestAnimationFrame(step);
    } else {
      document.body.classList.remove('lock');
      lastY = scrollY;
      gateBusy = false;
    }
  })(t0);
}

addEventListener('scroll', () => {
  if (gateBusy) return;

  const y = scrollY;
  const h = hero.offsetHeight;

  if (y > 0 && y < h - 2) {
    // turun = tutup penuh, naik = buka lagi
    curtainTo(y > lastY ? h : 0);
  }

  lastY = y;
}, { passive: true });