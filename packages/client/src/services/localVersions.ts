/**
 * 本地版本服务（IndexedDB）
 *
 * 数据模型：
 *   store `latest`   —— key = filePath / DRAFT_KEY, value = LatestRecord
 *   store `versions` —— keyPath = id, 索引 by_file (filePath, createdAt)
 *
 * 版本分级：
 *   - minute : 当天每 5 分钟一个 bucket
 *   - hour   : 昨天起 3 天内每小时一个 bucket
 *   - day    : 3 天之前每天一个 bucket
 *
 * 写入策略：
 *   1. 每次 saveLatest 时，同步写 latest 记录
 *   2. 计算当前应属于哪个粒度的 bucket，若该 bucket 已存在则覆盖（滚动更新为最后一次内容），否则插入
 *   3. 触发一次 compact：把已过期粒度的多条记录折叠为目标粒度（同 bucket 只保留 createdAt 最大的一条）
 */

export const LOCAL_VERSIONS_DB = 'cherry-markdown-versions';
export const LOCAL_VERSIONS_DB_VERSION = 1;
export const LATEST_STORE = 'latest';
export const VERSIONS_STORE = 'versions';
export const DRAFT_KEY = '__draft__untitled';

export type VersionKind = 'minute' | 'hour' | 'day';

export interface LatestRecord {
  filePath: string;
  content: string;
  size: number;
  updatedAt: number;
}

export interface VersionRecord {
  id: string;
  filePath: string;
  kind: VersionKind;
  /** 归属桶（毫秒时间戳，桶起始时刻） */
  bucket: number;
  content: string;
  size: number;
  createdAt: number;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
export const MINUTE_BUCKET_MS = 5 * MINUTE;

let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(LOCAL_VERSIONS_DB, LOCAL_VERSIONS_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(LATEST_STORE)) {
        db.createObjectStore(LATEST_STORE, { keyPath: 'filePath' });
      }
      if (!db.objectStoreNames.contains(VERSIONS_STORE)) {
        const store = db.createObjectStore(VERSIONS_STORE, { keyPath: 'id' });
        store.createIndex('by_file', ['filePath', 'createdAt']);
        store.createIndex('by_file_bucket', ['filePath', 'kind', 'bucket'], { unique: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
};

const promisifyRequest = <T>(req: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const promisifyTransaction = (tx: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

const startOfDay = (ts: number): number => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const bucketStart = (ts: number, kind: VersionKind): number => {
  if (kind === 'minute') return Math.floor(ts / MINUTE_BUCKET_MS) * MINUTE_BUCKET_MS;
  if (kind === 'hour') return Math.floor(ts / HOUR) * HOUR;
  return startOfDay(ts);
};

/**
 * 计算某个时间点在给定“当前时刻”下应属于哪个粒度：
 *  - 与今天同一天 → minute
 *  - 3 天内（昨天/前天/大前天，非今天）→ hour
 *  - 3 天之前 → day
 */
export const classifyKind = (ts: number, now: number = Date.now()): VersionKind => {
  const todayStart = startOfDay(now);
  if (ts >= todayStart) return 'minute';
  const threeDaysAgoStart = todayStart - 3 * DAY;
  if (ts >= threeDaysAgoStart) return 'hour';
  return 'day';
};

const genId = (filePath: string, kind: VersionKind, bucket: number): string => `${filePath}::${kind}::${bucket}`;

/**
 * 保存最新内容 + 触发版本快照 + 触发一次懒 compact。
 * 返回本次写入完成时间戳，供上层显示“已自动保存 xx”。
 */
export async function saveLatest(filePath: string, content: string): Promise<number> {
  const db = await openDB();
  const now = Date.now();
  const size = content.length;

  const tx = db.transaction([LATEST_STORE, VERSIONS_STORE], 'readwrite');
  const latestStore = tx.objectStore(LATEST_STORE);
  const versionsStore = tx.objectStore(VERSIONS_STORE);

  // 1. 写 latest
  const latest: LatestRecord = { filePath, content, size, updatedAt: now };
  latestStore.put(latest);

  // 2. 写当前 minute bucket（若已存在同 bucket 记录则覆盖）
  const kind: VersionKind = 'minute';
  const bucket = bucketStart(now, kind);
  const version: VersionRecord = {
    id: genId(filePath, kind, bucket),
    filePath,
    kind,
    bucket,
    content,
    size,
    createdAt: now,
  };
  versionsStore.put(version);

  await promisifyTransaction(tx);

  // 3. 异步执行 compact（不阻塞主写入，也避免同事务里做长跨度操作）
  void compactVersions(filePath, now).catch((err) => {
    console.warn('[localVersions] compact failed:', err);
  });

  return now;
}

/** 读取指定文件的最新记录 */
export async function getLatest(filePath: string): Promise<LatestRecord | null> {
  const db = await openDB();
  const tx = db.transaction(LATEST_STORE, 'readonly');
  const store = tx.objectStore(LATEST_STORE);
  const rec = await promisifyRequest(store.get(filePath));
  return (rec as LatestRecord | undefined) ?? null;
}

/** 列出指定文件的所有版本（按 createdAt desc） */
export async function listVersions(filePath: string): Promise<VersionRecord[]> {
  const db = await openDB();
  const tx = db.transaction(VERSIONS_STORE, 'readonly');
  const idx = tx.objectStore(VERSIONS_STORE).index('by_file');
  const range = IDBKeyRange.bound([filePath, -Infinity], [filePath, Infinity]);
  const results: VersionRecord[] = [];
  return new Promise((resolve, reject) => {
    const req = idx.openCursor(range, 'prev');
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        results.push(cursor.value as VersionRecord);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

/** 判断某文件是否有任何版本记录（用于状态栏“查看历史版本”按钮的显隐） */
export async function hasAnyVersion(filePath: string): Promise<boolean> {
  const db = await openDB();
  const tx = db.transaction(VERSIONS_STORE, 'readonly');
  const idx = tx.objectStore(VERSIONS_STORE).index('by_file');
  const range = IDBKeyRange.bound([filePath, -Infinity], [filePath, Infinity]);
  return new Promise((resolve, reject) => {
    const req = idx.openCursor(range);
    req.onsuccess = () => resolve(!!req.result);
    req.onerror = () => reject(req.error);
  });
}

/** 删除单条版本记录（历史版本对话框内的行内删除按钮使用） */
export async function deleteVersion(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(VERSIONS_STORE, 'readwrite');
  tx.objectStore(VERSIONS_STORE).delete(id);
  await promisifyTransaction(tx);
}

/**
 * 清空指定文件的所有历史版本（保留 latest 记录，避免破坏“已自动保存”提示）。
 * 历史版本对话框左下角的“清空所有版本”按钮使用。
 */
export async function clearAllVersions(filePath: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(VERSIONS_STORE, 'readwrite');
  const idx = tx.objectStore(VERSIONS_STORE).index('by_file');
  const range = IDBKeyRange.bound([filePath, -Infinity], [filePath, Infinity]);
  const req = idx.openCursor(range);
  req.onsuccess = () => {
    const cursor = req.result;
    if (cursor) {
      cursor.delete();
      cursor.continue();
    }
  };
  await promisifyTransaction(tx);
}

/** 删除某文件的所有本地版本与 latest 记录（不常用，仅在“清空本地版本”入口使用） */
export async function clearFile(filePath: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction([LATEST_STORE, VERSIONS_STORE], 'readwrite');
  tx.objectStore(LATEST_STORE).delete(filePath);
  const idx = tx.objectStore(VERSIONS_STORE).index('by_file');
  const range = IDBKeyRange.bound([filePath, -Infinity], [filePath, Infinity]);
  const req = idx.openCursor(range);
  req.onsuccess = () => {
    const cursor = req.result;
    if (cursor) {
      cursor.delete();
      cursor.continue();
    }
  };
  await promisifyTransaction(tx);
}

/**
 * 懒 compact：把已过期粒度的版本折叠到当前应属于的粒度。
 * 规则：把每个 (kind, bucket) 组内的所有条目合并为一条（保留 createdAt 最大的内容）。
 */
export async function compactVersions(filePath: string, now: number = Date.now()): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(VERSIONS_STORE, 'readwrite');
  const store = tx.objectStore(VERSIONS_STORE);
  const idx = store.index('by_file');
  const range = IDBKeyRange.bound([filePath, -Infinity], [filePath, Infinity]);

  const all: VersionRecord[] = await new Promise((resolve, reject) => {
    const acc: VersionRecord[] = [];
    const req = idx.openCursor(range);
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        acc.push(cursor.value as VersionRecord);
        cursor.continue();
      } else {
        resolve(acc);
      }
    };
    req.onerror = () => reject(req.error);
  });

  // 分组：按目标 kind + bucket 归并
  const groups = new Map<string, VersionRecord[]>();
  for (const v of all) {
    const targetKind = classifyKind(v.createdAt, now);
    const targetBucket = bucketStart(v.createdAt, targetKind);
    const key = `${targetKind}::${targetBucket}`;
    const arr = groups.get(key);
    if (arr) arr.push(v);
    else groups.set(key, [v]);
  }

  // 对每组：保留 createdAt 最大者，其余删除；若 kind 变了，重新写一条并删除原记录
  for (const [key, arr] of groups) {
    const [targetKind, bucketStr] = key.split('::') as [VersionKind, string];
    const targetBucket = Number(bucketStr);
    arr.sort((a, b) => b.createdAt - a.createdAt);
    const survivor = arr[0];
    const survivorId = genId(filePath, targetKind, targetBucket);

    // 删除组内其他条目
    for (let i = 1; i < arr.length; i++) {
      store.delete(arr[i].id);
    }
    // 若 survivor 已在目标位置则不必改写
    if (survivor.id === survivorId && survivor.kind === targetKind && survivor.bucket === targetBucket) {
      continue;
    }
    // 迁移：先删旧，再写新
    store.delete(survivor.id);
    store.put({
      ...survivor,
      id: survivorId,
      kind: targetKind,
      bucket: targetBucket,
    });
  }

  await promisifyTransaction(tx);
}

/** 版本标签格式化：不同粒度显示不同精度 */
export function formatVersionLabel(v: VersionRecord): string {
  const d = new Date(v.bucket);
  const pad = (n: number): string => String(n).padStart(2, '0');
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  if (v.kind === 'day') return `${mm}/${dd}`;
  const hh = pad(d.getHours());
  if (v.kind === 'hour') return `${mm}/${dd} ${hh}:00`;
  const mi = pad(d.getMinutes());
  const ss = pad(new Date(v.createdAt).getSeconds());
  return `${mm}/${dd} ${hh}:${mi}:${ss}`;
}
