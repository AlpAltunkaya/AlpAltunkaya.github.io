/**
 * Answer store for the defense date poll page (../index.html).
 *
 * Runs as a Google Apps Script web app under Alp's own Google account.
 * Answers go to a Google Sheet "Defense date poll answers" in his Drive,
 * created on the first run of setup(). Each saved answer also sends Alp a
 * short mail, so answers reach him at once.
 *
 * Deploy: Deploy > New deployment > Web app, Execute as: Me,
 * Who has access: Anyone. Paste the /exec URL into API_URL in index.html.
 */

var DAYS = ['2026-12-17', '2026-12-18', '2027-01-05', '2027-01-07', '2027-01-08',
            '2027-01-11', '2027-01-12', '2027-01-13', '2027-01-14', '2027-01-15'];
var DAY_LABELS = ['Thu 17 Dec', 'Fri 18 Dec', 'Tue 5 Jan', 'Thu 7 Jan', 'Fri 8 Jan',
                  'Mon 11 Jan', 'Tue 12 Jan', 'Wed 13 Jan', 'Thu 14 Jan', 'Fri 15 Jan'];
// Sheet layout: Name, Key, Updated, Note, the first FIRST_DAYS days, Raw, then the later days.
// Raw stays in column 10, so rows saved before the January days were added read the same.
var FIRST_DAYS = 5;
var RAW_COL = 4 + FIRST_DAYS + 1;
var N = 40;                 // 8:00 to 18:00 in 15 minute steps
var MAX_ENTRIES = 40;       // guard against junk
var NOTIFY = true;          // mail Alp on every save
var SHEET_NAME = 'Answers';

/** Run once by hand: creates the sheet and asks for the permissions. */
function setup() {
  var sh = sheet_();
  if (NOTIFY) MailApp.getRemainingDailyQuota();
  Logger.log('Answer sheet: ' + sh.getParent().getUrl());
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'list';
  if (action !== 'list') return json_({ok: false, error: 'unknown action'});
  return json_({ok: true, entries: readAll_()});
}

function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ok: false, error: 'bad json'}); }
  if (!body || body.action !== 'save') return json_({ok: false, error: 'unknown action'});

  var name = String(body.name || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (!name) return json_({ok: false, error: 'name missing'});
  var days = {};
  for (var i = 0; i < DAYS.length; i++) {
    var s = String((body.days || {})[DAYS[i]] || '');
    if (!/^[01]*$/.test(s)) return json_({ok: false, error: 'bad slots'});
    days[DAYS[i]] = (s + new Array(N + 1).join('0')).slice(0, N);
  }
  var note = String(body.note || '').slice(0, 500);
  var key = name.toLowerCase();

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_();
    var last = sh.getLastRow();
    var keys = last > 1 ? sh.getRange(2, 2, last - 1, 1).getValues().map(function (r) { return unsafe_(r[0]); }) : [];
    var row = keys.indexOf(key);
    if (row < 0 && keys.length >= MAX_ENTRIES) return json_({ok: false, error: 'full'});
    var now = Utilities.formatDate(new Date(), 'Europe/Berlin', 'yyyy-MM-dd HH:mm');
    var shown = DAYS.map(function (d) { return readable_(days[d]); });
    var values = [safe_(name), safe_(key), now, safe_(note)]
      .concat(shown.slice(0, FIRST_DAYS))
      .concat([JSON.stringify(days)])
      .concat(shown.slice(FIRST_DAYS));
    if (row < 0) sh.appendRow(values);
    else sh.getRange(row + 2, 1, 1, values.length).setValues([values]);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  if (NOTIFY) {
    try {
      var lines = DAYS.map(function (d, i) { return DAY_LABELS[i] + ': ' + (readable_(days[d]) || 'not free'); });
      MailApp.sendEmail(Session.getEffectiveUser().getEmail(),
        'Defense poll: ' + name + ' answered',
        name + ' saved their times.\n\n' + lines.join('\n') + (note ? '\n\nNote: ' + note : '') +
        '\n\nAll answers: ' + sheet_().getParent().getUrl());
    } catch (err) { /* the answer is saved, the mail is a bonus */ }
  }
  return json_({ok: true, entries: readAll_()});
}

function readAll_() {
  var sh = sheet_();
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, RAW_COL).getValues().map(function (r) {
    var days = {};   // a day missing here was not on the page when this answer was saved
    try { days = JSON.parse(r[RAW_COL - 1]); } catch (err) {}
    return {name: unsafe_(r[0]), updated: String(r[2]), note: unsafe_(r[3]), days: days};
  }).filter(function (x) { return x.name; });
}

function sheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  var ss = null;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (err) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create('Defense date poll answers');
    props.setProperty('SHEET_ID', ss.getId());
    var first = ss.getSheets()[0];
    first.setName(SHEET_NAME);
    first.getRange(1, 1, 1, RAW_COL).setNumberFormat('@')
      .setValues([['Name', 'Key', 'Updated (Munich)', 'Note'].concat(DAY_LABELS.slice(0, FIRST_DAYS)).concat(['Raw'])]);
    first.setFrozenRows(1);
    first.getRange(1, 1, 1, RAW_COL).setFontWeight('bold');
  }
  var sh = ss.getSheetByName(SHEET_NAME);
  laterHeads_(sh);
  return sh;
}

/** Writes the labels of the later days after Raw, once. Writing the same labels twice is harmless. */
function laterHeads_(sh) {
  var later = DAY_LABELS.slice(FIRST_DAYS);
  if (!later.length) return;
  var head = sh.getRange(1, RAW_COL + 1, 1, later.length);
  if (head.getDisplayValues()[0].join('|') === later.join('|')) return;
  head.setNumberFormat('@').setValues([later]).setFontWeight('bold');
}

function readable_(bits) {
  var out = [], start = -1;
  for (var i = 0; i <= N; i++) {
    var on = i < N && bits.charAt(i) === '1';
    if (on && start < 0) start = i;
    if (!on && start >= 0) { out.push(t_(start) + ' to ' + t_(i)); start = -1; }
  }
  if (out.length === 1 && out[0] === '8:00 to 18:00') return 'whole day';
  return out.join(', ');
}

function t_(i) {
  var m = 8 * 60 + i * 15;
  var mm = m % 60;
  return Math.floor(m / 60) + ':' + (mm < 10 ? '0' : '') + mm;
}

// Typed text is stored as plain text, so Sheets never turns it into a date, number or formula.
function safe_(s) { return s ? "'" + s : s; }

function unsafe_(s) { s = String(s); return /^'[=+\-@]/.test(s) ? s.slice(1) : s; }

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
