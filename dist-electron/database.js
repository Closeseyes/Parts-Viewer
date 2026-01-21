"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.initDatabase = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const xlsx_1 = __importDefault(require("xlsx"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const uuid_1 = require("uuid");
const logger_js_1 = require("./logger.js");
let db;
const initDatabase = () => {
    const dbPath = path_1.default.join(electron_1.app.getPath('userData'), 'parts.db');
    exports.db = db = new sqlite3_1.default.Database(dbPath, (err) => {
        if (err) {
            console.error('데이터베이스 연결 오류:', err);
        }
        else {
            console.log('데이터베이스 연결 성공:', dbPath);
            (0, logger_js_1.log)(`데이터베이스 연결 성공: ${dbPath}`);
            createTables();
        }
    });
};
exports.initDatabase = initDatabase;
const createTables = () => {
    db.serialize(() => {
        // 카테고리 테이블
        db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        color TEXT DEFAULT '#3498db',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // 사용자 테이블
        db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT,
        role TEXT DEFAULT 'viewer',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // 부품 테이블 (category_id, price_usd, price_krw 추가)
        db.run(`
      CREATE TABLE IF NOT EXISTS parts (
        id TEXT PRIMARY KEY,
        partname TEXT NOT NULL,
        vendor TEXT NOT NULL,
        price REAL NOT NULL,
        price_usd REAL,
        price_krw REAL,
        sap_code TEXT,
        category_id TEXT,
        category_name_raw TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(category_id) REFERENCES categories(id)
      )
    `);
        // 마이그레이션: 기존 테이블에 category_name_raw 컬럼 추가 시도 (이미 있으면 무시)
        db.run('ALTER TABLE parts ADD COLUMN category_name_raw TEXT', (err) => {
            if (err) {
                // duplicate column name 등은 무시
                (0, logger_js_1.log)('[migration] category_name_raw 컬럼 확인됨 또는 추가 불필요');
            }
            else {
                (0, logger_js_1.log)('[migration] category_name_raw 컬럼 추가 완료');
            }
        });
        // 이력 테이블
        db.run(`
      CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY,
        part_id TEXT NOT NULL,
        action TEXT NOT NULL,
        price_before REAL,
        price_after REAL,
        changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(part_id) REFERENCES parts(id)
      )
    `);
        // 알림 테이블
        db.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        part_id TEXT NOT NULL,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        read_status INTEGER DEFAULT 0,
        price_before REAL,
        price_after REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(part_id) REFERENCES parts(id)
      )
    `);
    });
};
// IPC 핸들러 등록
electron_1.ipcMain.handle('get-parts', async () => {
    return new Promise((resolve, reject) => {
        db.all(`
      SELECT p.*, COALESCE(c.name, p.category_name_raw) as category_name 
      FROM parts p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.created_at DESC
    `, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
});
electron_1.ipcMain.handle('add-part', async (event, part) => {
    return new Promise((resolve, reject) => {
        const { id, partname, vendor, price, sap_code, category_id } = part;
        if (!id || !partname || !vendor || typeof price !== 'number' || Number.isNaN(price)) {
            console.error('[add-part] 유효하지 않은 입력', part);
            (0, logger_js_1.error)(`[add-part] 유효하지 않은 입력: ${JSON.stringify(part)}`);
            return reject(new Error('유효하지 않은 입력'));
        }
        console.log('[add-part]', id, partname, vendor, price, sap_code, category_id);
        (0, logger_js_1.log)(`[add-part] ${id} ${partname} ${vendor} ${price} ${sap_code ?? ''} ${category_id ?? ''}`);
        db.run('INSERT INTO parts (id, partname, vendor, price, sap_code, category_id) VALUES (?, ?, ?, ?, ?, ?)', [id, partname, vendor, price, sap_code, category_id || null], (err) => {
            if (err)
                reject(err);
            else
                resolve({ success: true });
        });
    });
});
electron_1.ipcMain.handle('update-part', async (event, part) => {
    return new Promise((resolve, reject) => {
        const { id, partname, vendor, price, sap_code } = part;
        if (!id || !partname || !vendor || typeof price !== 'number' || !Number.isFinite(price)) {
            console.error('[update-part] 유효하지 않은 입력', part);
            (0, logger_js_1.error)(`[update-part] 유효하지 않은 입력: ${JSON.stringify(part)}`);
            return reject(new Error('유효하지 않은 입력'));
        }
        console.log('[update-part] 요청', id, partname, vendor, price, sap_code);
        (0, logger_js_1.log)(`[update-part] ${id} -> price=${price}`);
        db.get('SELECT price FROM parts WHERE id = ?', [id], (selErr, row) => {
            if (selErr)
                return reject(selErr);
            const oldPrice = row ? Number(row.price) : undefined;
            db.run('UPDATE parts SET partname = ?, vendor = ?, price = ?, sap_code = ? WHERE id = ?', [partname, vendor, price, sap_code, id], (updErr) => {
                if (updErr)
                    return reject(updErr);
                if (typeof oldPrice === 'number' && oldPrice !== Number(price)) {
                    const hid = (0, uuid_1.v4)();
                    db.run('INSERT INTO history (id, part_id, action, price_before, price_after) VALUES (?, ?, ?, ?, ?)', [hid, id, 'update', oldPrice, Number(price)], (histErr) => {
                        if (histErr)
                            console.error('히스토리 기록 실패:', histErr);
                        console.log('[update-part] 가격 변경 기록', { id, oldPrice, newPrice: Number(price) });
                        (0, logger_js_1.log)(`[update-part] 가격 변경 기록 id=${id} ${oldPrice} => ${Number(price)}`);
                        resolve({ success: true, history: true });
                    });
                }
                else {
                    console.log('[update-part] 가격 변경 없음');
                    (0, logger_js_1.log)('[update-part] 가격 변경 없음');
                    resolve({ success: true, history: false });
                }
            });
        });
    });
});
electron_1.ipcMain.handle('delete-part', async (event, id) => {
    return new Promise((resolve, reject) => {
        console.log('[delete-part]', id);
        (0, logger_js_1.log)(`[delete-part] ${id}`);
        db.run('DELETE FROM parts WHERE id = ?', [id], (err) => {
            if (err)
                reject(err);
            else
                resolve({ success: true });
        });
    });
});
electron_1.ipcMain.handle('get-history', async (event, partId) => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM history WHERE part_id = ? ORDER BY changed_at DESC', [partId], (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
});
electron_1.ipcMain.handle('search-parts', async (event, keyword) => {
    return new Promise((resolve, reject) => {
        const searchTerm = `%${keyword}%`;
        db.all(`SELECT p.*, COALESCE(c.name, p.category_name_raw) as category_name 
       FROM parts p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.partname LIKE ? 
          OR p.vendor LIKE ? 
          OR p.sap_code LIKE ? 
       ORDER BY p.created_at DESC`, [searchTerm, searchTerm, searchTerm], (err, rows) => {
            if (err) {
                console.error('[search-parts] 검색 오류:', err);
                reject(err);
            }
            else {
                console.log('[search-parts] 검색 결과:', rows?.length || 0, '건');
                resolve(rows);
            }
        });
    });
});
electron_1.ipcMain.handle('export-excel', async (event) => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM parts ORDER BY created_at DESC', (err, rows) => {
            if (err) {
                console.error('[export-excel] 데이터 조회 오류:', err);
                reject(err);
                return;
            }
            try {
                const data = rows.map(row => ({
                    '부품명': row.partname || '',
                    '공급업체': row.vendor || '',
                    '단가 (₩)': row.price || 0,
                    'SAP 코드': row.sap_code || '-',
                    '등록일': row.created_at ? new Date(row.created_at).toLocaleDateString('ko-KR') : '',
                }));
                const ws = xlsx_1.default.utils.json_to_sheet(data);
                // 열 너비 설정
                ws['!cols'] = [
                    { wch: 20 }, // 부품명
                    { wch: 15 }, // 공급업체
                    { wch: 15 }, // 단가
                    { wch: 15 }, // SAP 코드
                    { wch: 12 }, // 등록일
                ];
                const wb = xlsx_1.default.utils.book_new();
                xlsx_1.default.utils.book_append_sheet(wb, ws, '부품 목록');
                // 파일 저장 위치 결정
                const fileName = `부품목록_${new Date().toISOString().split('T')[0]}.xlsx`;
                const filePath = path_1.default.join(electron_1.app.getPath('downloads'), fileName);
                xlsx_1.default.writeFile(wb, filePath);
                console.log('[export-excel] Excel 파일 저장 성공:', filePath);
                (0, logger_js_1.log)(`[export-excel] ${fileName} 저장 완료 (${data.length}건)`);
                resolve({ success: true, filePath, count: data.length });
            }
            catch (error) {
                console.error('[export-excel] Excel 생성 오류:', error);
                reject(error);
            }
        });
    });
});
// 대량 등록: CSV 등에서 파싱된 배열을 받아 일괄 삽입
electron_1.ipcMain.handle('bulk-add-parts', async (event, rows) => {
    return new Promise((resolve, reject) => {
        if (!Array.isArray(rows)) {
            return reject(new Error('rows 배열이 필요합니다.'));
        }
        const result = {
            inserted: 0,
            skipped: 0,
            updated: 0,
            errors: [],
        };
        try {
            db.serialize(() => {
                db.run('BEGIN IMMEDIATE TRANSACTION', (beginErr) => {
                    if (beginErr) {
                        return reject(beginErr);
                    }
                });
                const stmt = db.prepare('INSERT INTO parts (id, partname, vendor, price, price_usd, price_krw, sap_code, category_id, category_name_raw) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
                const dupCheck = db.prepare('SELECT id, price, category_id, category_name_raw FROM parts WHERE partname = ? AND ((sap_code IS NULL AND ? IS NULL) OR sap_code = ?) LIMIT 1');
                const updateStmt = db.prepare('UPDATE parts SET partname = ?, vendor = ?, price = ?, price_usd = ?, price_krw = ?, sap_code = ?, category_id = ?, category_name_raw = ? WHERE id = ?');
                const getCategoryId = db.prepare('SELECT id FROM categories WHERE name = ? LIMIT 1');
                const seen = new Set();
                let processed = 0;
                const total = rows.length;
                const finishIfDone = () => {
                    if (processed >= total) {
                        stmt.finalize();
                        dupCheck.finalize();
                        updateStmt.finalize();
                        getCategoryId.finalize();
                        db.run('COMMIT', (cErr) => {
                            if (cErr)
                                reject(cErr);
                            else
                                resolve(result);
                        });
                    }
                };
                if (total === 0) {
                    stmt.finalize();
                    dupCheck.finalize();
                    updateStmt.finalize();
                    getCategoryId.finalize();
                    db.run('COMMIT', (cErr) => {
                        if (cErr)
                            reject(cErr);
                        else
                            resolve(result);
                    });
                    return;
                }
                rows.forEach((row, index) => {
                    try {
                        const id = (0, uuid_1.v4)();
                        const partname = String(row.partname ?? row.Partname ?? '').trim();
                        const vendor = String(row.vendor ?? row.Vendor ?? '').trim();
                        const priceRaw = row.price ?? row.Price ?? 0;
                        const priceNum = Number(priceRaw) || 0;
                        const price_usd = row.price_usd ?? row.PriceUSD ?? null;
                        const price_krw = row.price_krw ?? row.PriceKRW ?? null;
                        const sapRaw = row.sap_code ?? row.SAP ?? row.sap ?? null;
                        const sapKey = sapRaw !== null && sapRaw !== undefined ? String(sapRaw).trim() : null;
                        const categoryName = (row.category ?? row.Category ?? row.category_name ?? row.categoryName ?? '').toString().trim();
                        if (!partname || !vendor || !Number.isFinite(priceNum)) {
                            result.skipped++;
                            result.errors.push({ index, message: '유효하지 않은 행 데이터' });
                            processed++;
                            finishIfDone();
                            return;
                        }
                        const key = `${partname}|${sapKey ?? ''}`;
                        if (seen.has(key)) {
                            result.skipped++;
                            result.errors.push({ index, message: '중복 (파일 내 동일 Partname/SAP Code)' });
                            processed++;
                            finishIfDone();
                            return;
                        }
                        seen.add(key);
                        dupCheck.get([partname, sapKey, sapKey], (checkErr, existing) => {
                            if (checkErr) {
                                result.skipped++;
                                result.errors.push({ index, message: '중복 확인 오류: ' + checkErr.message });
                                processed++;
                                finishIfDone();
                                return;
                            }
                            const afterCategoryLookup = (category_id) => {
                                if (existing) {
                                    const oldPrice = Number(existing.price);
                                    const existingId = existing.id;
                                    const nextCategoryId = categoryName ? category_id : existing.category_id ?? null;
                                    const nextCategoryRaw = categoryName ? categoryName : existing.category_name_raw ?? null;
                                    updateStmt.run([partname, vendor, priceNum, price_usd, price_krw, sapKey, nextCategoryId, nextCategoryRaw, existingId], (updateErr) => {
                                        if (updateErr) {
                                            result.skipped++;
                                            result.errors.push({ index, message: '업데이트 오류: ' + updateErr.message });
                                        }
                                        else {
                                            result.updated++;
                                            if (Number.isFinite(oldPrice) && oldPrice !== priceNum) {
                                                db.run('INSERT INTO history (id, part_id, action, price_before, price_after) VALUES (?, ?, ?, ?, ?)', [(0, uuid_1.v4)(), existingId, 'update', oldPrice, priceNum]);
                                            }
                                        }
                                        processed++;
                                        finishIfDone();
                                    });
                                }
                                else {
                                    stmt.run([id, partname, vendor, priceNum, price_usd, price_krw, sapKey, category_id, categoryName || null], (insErr) => {
                                        if (insErr) {
                                            result.skipped++;
                                            result.errors.push({ index, message: insErr.message });
                                        }
                                        else {
                                            result.inserted++;
                                        }
                                        processed++;
                                        finishIfDone();
                                    });
                                }
                            };
                            if (categoryName && categoryName.length > 0) {
                                getCategoryId.get([categoryName], (catErr, catRow) => {
                                    if (catErr) {
                                        result.skipped++;
                                        result.errors.push({ index, message: '카테고리 조회 오류: ' + catErr.message });
                                        processed++;
                                        finishIfDone();
                                        return;
                                    }
                                    afterCategoryLookup(catRow ? catRow.id : null);
                                });
                            }
                            else {
                                afterCategoryLookup(null);
                            }
                        });
                    }
                    catch (err) {
                        result.errors.push({ index, message: '처리 중 예외 발생: ' + err.message });
                        result.skipped++;
                        processed++;
                        finishIfDone();
                    }
                });
            });
        }
        catch (err) {
            reject(new Error('bulk-add-parts 처리 중 오류: ' + err.message));
        }
    });
});
// ====== 카테고리 관련 핸들러 ======
electron_1.ipcMain.handle('get-categories', async () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM categories ORDER BY created_at DESC', (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows || []);
        });
    });
});
electron_1.ipcMain.handle('add-category', async (event, category) => {
    return new Promise((resolve, reject) => {
        const id = (0, uuid_1.v4)();
        const { name, description = '', color = '#3498db' } = category;
        db.run('INSERT INTO categories (id, name, description, color) VALUES (?, ?, ?, ?)', [id, name, description, color], (err) => {
            if (err) {
                console.error('[add-category] 오류:', err);
                reject(err);
            }
            else {
                (0, logger_js_1.log)(`[add-category] ${name} 추가됨`);
                resolve({ success: true, id });
            }
        });
    });
});
electron_1.ipcMain.handle('delete-category', async (event, categoryId) => {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM categories WHERE id = ?', [categoryId], (err) => {
            if (err) {
                console.error('[delete-category] 오류:', err);
                reject(err);
            }
            else {
                (0, logger_js_1.log)(`[delete-category] ${categoryId} 삭제됨`);
                resolve({ success: true });
            }
        });
    });
});
electron_1.ipcMain.handle('update-part-category', async (event, { partId, categoryId }) => {
    return new Promise((resolve, reject) => {
        db.run('UPDATE parts SET category_id = ? WHERE id = ?', [categoryId, partId], (err) => {
            if (err)
                reject(err);
            else
                resolve({ success: true });
        });
    });
});
// ====== 사용자 관련 핸들러 ======
electron_1.ipcMain.handle('register-user', async (event, userData) => {
    return new Promise((resolve, reject) => {
        const id = (0, uuid_1.v4)();
        const { username, password, email = '' } = userData;
        db.run('INSERT INTO users (id, username, password, email, role) VALUES (?, ?, ?, ?, ?)', [id, username, password, email, 'viewer'], (err) => {
            if (err) {
                console.error('[register-user] 오류:', err);
                reject(err);
            }
            else {
                (0, logger_js_1.log)(`[register-user] ${username} 사용자 등록`);
                resolve({ success: true, id, username, role: 'viewer' });
            }
        });
    });
});
electron_1.ipcMain.handle('login-user', async (event, credentials) => {
    return new Promise((resolve, reject) => {
        const { username, password } = credentials;
        db.get('SELECT id, username, role FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
            if (err) {
                reject(err);
            }
            else if (row) {
                (0, logger_js_1.log)(`[login-user] ${username} 로그인 성공`);
                resolve({ success: true, user: row });
            }
            else {
                reject(new Error('사용자명 또는 비밀번호가 잘못되었습니다.'));
            }
        });
    });
});
// ====== 알림 관련 핸들러 ======
electron_1.ipcMain.handle('get-notifications', async (event, limit = 20) => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM notifications WHERE read_status = 0 ORDER BY created_at DESC LIMIT ?', [limit], (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows || []);
        });
    });
});
electron_1.ipcMain.handle('add-notification', async (event, notif) => {
    return new Promise((resolve, reject) => {
        const id = (0, uuid_1.v4)();
        const { partId, type, message, priceBefore, priceAfter } = notif;
        db.run('INSERT INTO notifications (id, part_id, type, message, price_before, price_after) VALUES (?, ?, ?, ?, ?, ?)', [id, partId, type, message, priceBefore || null, priceAfter || null], (err) => {
            if (err)
                reject(err);
            else
                resolve({ success: true, id });
        });
    });
});
electron_1.ipcMain.handle('mark-notification-read', async (event, notifId) => {
    return new Promise((resolve, reject) => {
        db.run('UPDATE notifications SET read_status = 1 WHERE id = ?', [notifId], (err) => {
            if (err)
                reject(err);
            else
                resolve({ success: true });
        });
    });
});
// ====== 통계 관련 핸들러 ======
electron_1.ipcMain.handle('get-statistics', async () => {
    return new Promise((resolve, reject) => {
        const stats = {};
        // 전체 부품 수
        db.get('SELECT COUNT(*) as count FROM parts', (err, result) => {
            if (err)
                return reject(err);
            stats.totalParts = result.count;
            // 가격 통계
            db.get('SELECT MIN(price) as min, MAX(price) as max, AVG(price) as avg FROM parts', (err, priceStats) => {
                if (err)
                    return reject(err);
                stats.priceStats = priceStats;
                // 공급업체별 부품 수
                db.all('SELECT vendor, COUNT(*) as count FROM parts GROUP BY vendor ORDER BY count DESC', (err, vendorStats) => {
                    if (err)
                        return reject(err);
                    stats.vendorStats = vendorStats;
                    // 카테고리별 부품 수
                    db.all(`SELECT c.id, c.name, c.color, COUNT(p.id) as count 
             FROM categories c LEFT JOIN parts p ON c.id = p.category_id 
             GROUP BY c.id ORDER BY count DESC`, (err, categoryStats) => {
                        if (err)
                            return reject(err);
                        stats.categoryStats = categoryStats;
                        // 최근 가격 변동
                        db.all(`SELECT p.partname, h.price_before, h.price_after, h.changed_at 
                 FROM history h JOIN parts p ON h.part_id = p.id 
                 WHERE h.action = 'update' 
                 ORDER BY h.changed_at DESC LIMIT 10`, (err, recentChanges) => {
                            if (err)
                                return reject(err);
                            stats.recentPriceChanges = recentChanges;
                            (0, logger_js_1.log)('[get-statistics] 통계 조회 완료');
                            resolve(stats);
                        });
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=database.js.map