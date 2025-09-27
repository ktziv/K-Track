/** 基本設定 **/
const YEAR = 2025;               // 年份
const MONTH = 11;                // 11 = 十一月
const START_TIME = '10:00';      // 時段開始時間（24小時制）
const DURATION_MIN = 60;         // 時段長度（分鐘）
const CAPACITY_PER_SLOT = 5;     // 每時段上限人數
const TZ = 'Asia/Taipei';        // 時區
const SHEET_NAME = 'Registrations'; // 試算表工作表名稱

/** 產生或取得資料表 **/
function getSheet_() {
  const ss = SpreadsheetApp.getActive() || SpreadsheetApp.create('November Registration');
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['timestamp', 'name', 'contact', 'slot_iso', 'slot_label']);
  }
  return sh;
}

/** 取得 11 月的每個星期一（一個時段） **/
function getMondaySlots_() {
  const slots = [];
  const first = new Date(YEAR, MONTH - 1, 1);
  const monthIdx = first.getMonth();
  for (let d = new Date(first); d.getMonth() === monthIdx; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 1) { // 0=日,1=一
      const dateStr = Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
      const startLabel = `${Utilities.formatDate(d, TZ, 'MM/dd')}（一） ${START_TIME}`;
      const [hh, mm] = START_TIME.split(':').map(Number);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm);
      const end = new Date(start.getTime() + DURATION_MIN * 60 * 1000);
      const endLabel = Utilities.formatDate(end, TZ, 'HH:mm');
      const label = `${Utilities.formatDate(d, TZ, 'MM/dd')}（一） ${Utilities.formatDate(start, TZ, 'HH:mm')}–${endLabel}`;
      slots.push({ iso: dateStr, label });
    }
  }
  return slots;
}

/** 統計各時段現有報名數 **/
function getCountsBySlot_() {
  const sh = getSheet_();
  const values = sh.getDataRange().getValues();
  const header = values.shift() || [];
  const idx = {
    slot_iso: header.indexOf('slot_iso'),
  };
  const map = {};
  values.forEach(r => {
    const iso = r[idx.slot_iso];
    if (!iso) return;
    map[iso] = (map[iso] || 0) + 1;
  });
  return map;
}

/** 提供前端初始資料（時段 + 剩餘名額） **/
function getInitData() {
  const slots = getMondaySlots_();
  const counts = getCountsBySlot_();
  const withRemaining = slots.map(s => ({
    iso: s.iso,
    label: s.label,
    count: counts[s.iso] || 0,
    remaining: Math.max(0, CAPACITY_PER_SLOT - (counts[s.iso] || 0)),
  }));
  return {
    year: YEAR,
    month: MONTH,
    capacity: CAPACITY_PER_SLOT,
    durationMin: DURATION_MIN,
    startTime: START_TIME,
    tz: TZ,
    slots: withRemaining,
  };
}

/** 報名提交（含防超收鎖） **/
function bookSlot(payload) {
  if (!payload) throw new Error('空的提交資料');
  const name = (payload.name || '').trim();
  const contact = (payload.contact || '').trim();
  const slotIso = (payload.slotIso || '').trim();

  if (!name) throw new Error('請輸入姓名');
  if (!contact) throw new Error('請輸入聯絡方式');
  if (!slotIso) throw new Error('請選擇時段');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // 最多等 10 秒避免同時寫入

  try {
    // 檢查名額
    const counts = getCountsBySlot_();
    const current = counts[slotIso] || 0;
    if (current >= CAPACITY_PER_SLOT) {
      return { ok: false, message: '此時段已額滿，請改選其他時段。' };
    }

    // （選配）避免同人重複報名同一時段：以姓名+聯絡方式+時段判斷
    const sh = getSheet_();
    const all = sh.getDataRange().getValues();
    const header = all.shift() || [];
    const idx = {
      name: header.indexOf('name'),
      contact: header.indexOf('contact'),
      slot_iso: header.indexOf('slot_iso'),
    };
    const dup = all.some(r => String(r[idx.name]).trim() === name &&
                               String(r[idx.contact]).trim() === contact &&
                               String(r[idx.slot_iso]).trim() === slotIso);
    if (dup) {
      return { ok: false, message: '您已報名過這個時段。' };
    }

    // 寫入
    const nowStr = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss');
    const label = getMondaySlots_().find(s => s.iso === slotIso)?.label || slotIso;
    sh.appendRow([nowStr, name, contact, slotIso, label]);

    const remaining = Math.max(0, CAPACITY_PER_SLOT - (current + 1));
    return { ok: true, message: '報名成功！', slotLabel: label, remaining };
  } finally {
    lock.releaseLock();
  }
}

/** 前端頁面 **/
function doGet() {
  const tpl = HtmlService.createTemplateFromFile('Index');
  // 初始資料由前端載入時呼叫 getInitData() 取得，保持最新統計
  return tpl.evaluate()
            .setTitle('11月星期一登記表')
            .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL) // 可內嵌
            .setFaviconUrl('https://www.gstatic.com/images/branding/product/2x/apps_script_64dp.png');
}
