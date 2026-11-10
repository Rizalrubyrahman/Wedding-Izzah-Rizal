/*
 * Code.gs  -  tempel di Extensions > Apps Script pada Google Sheet.
 *
 * - POST biasa            : simpan ucapan sebagai baris baru
 * - POST action=download  : kirim spreadsheet sebagai file .xlsx (butuh kunci)
 * - GET                   : 50 ucapan terakhir (untuk bagian Wishes)
 */
const SHEET_NAME   = 'Ucapan';
const DOWNLOAD_KEY = 'GANTI-DENGAN-KUNCI-RAHASIA';   // ganti!
const HEADERS      = ['Waktu', 'Nama', 'Kehadiran', 'Jumlah', 'Ucapan'];
const FILE_NAME    = 'Ucapan-Izzah-Rizal.xlsx';

function getSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

function clean_(v, max) {
  v = String(v || '').trim().slice(0, max);
  return /^[=+\-@]/.test(v) ? "'" + v : v;   // cegah formula injection
}

function doPost(e) {
  const p = e.parameter || {};
  if (p.action === 'download') return download_(p.key);
  return save_(p);
}

function save_(p) {
  const nama  = clean_(p.nama, 40);
  const pesan = clean_(p.pesan, 300);
  const kehadiran = ['Hadir', 'Tidak Hadir'].indexOf(p.kehadiran) >= 0 ? p.kehadiran : '';

  if (!nama || !pesan || !kehadiran) {
    return out_({ ok: false, error: 'Data belum lengkap' });
  }

  const waktu = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    getSheet_().appendRow([waktu, nama, kehadiran, clean_(p.jumlah || '-', 20), pesan]);
  } finally {
    lock.releaseLock();
  }

  return out_({ ok: true });
}

function download_(key) {
  if (key !== DOWNLOAD_KEY) return out_({ ok: false, error: 'Kunci salah' });

  const file = DriveApp.getFileById(SpreadsheetApp.getActive().getId());
  const blob = file.getAs(MimeType.MICROSOFT_EXCEL);   // .xlsx

  return out_({
    ok: true,
    name: FILE_NAME,
    data: Utilities.base64Encode(blob.getBytes())
  });
}

function doGet() {
  const sh = getSheet_();
  const n = Math.max(0, sh.getLastRow() - 1);
  const rows = n ? sh.getRange(2, 1, n, 5).getValues().reverse().slice(0, 50) : [];

  return out_({
    ok: true,
    data: rows.map(r => ({
      nama: r[1], kehadiran: r[2], jumlah: r[3], pesan: r[4]
    }))
  });
}
