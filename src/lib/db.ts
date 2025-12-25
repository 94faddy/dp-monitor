import mysql from 'mysql2/promise';
import { query } from './mysql';
import { UserDatabase, Transaction, TransactionSummary } from '@/types';

// Fixed values
const FIXED_DB_NAME = 'joker555';
const FIXED_TABLE_NAME = 'transactions';

// Get user databases
export async function getUserDatabases(userId: number): Promise<UserDatabase[]> {
  const databases = await query<UserDatabase[]>(
    `SELECT id, user_id, name, note, host, port, db_user, db_password, db_name, table_name, 
     is_active, last_connected, created_at 
     FROM user_databases WHERE user_id = ? AND is_active = 1 ORDER BY name`,
    [userId]
  );
  return databases;
}

// Get single database by ID (with user check)
export async function getDatabaseById(id: number, userId: number): Promise<UserDatabase | null> {
  const databases = await query<UserDatabase[]>(
    `SELECT id, user_id, name, note, host, port, db_user, db_password, db_name, table_name, 
     is_active, last_connected, created_at 
     FROM user_databases WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  return databases[0] || null;
}

// Add new database for user
export async function addUserDatabase(userId: number, data: {
  name: string;
  note?: string;
  host: string;
  port: number;
  db_user: string;
  db_password: string;
  db_name?: string;
  table_name?: string;
}): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    const result = await query<{ insertId: number }>(
      `INSERT INTO user_databases (user_id, name, note, host, port, db_user, db_password, db_name, table_name) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, 
        data.name, 
        data.note || null, 
        data.host, 
        data.port, 
        data.db_user, 
        data.db_password, 
        data.db_name || FIXED_DB_NAME,  // Use fixed value
        data.table_name || FIXED_TABLE_NAME  // Use fixed value
      ]
    );
    return { success: true, id: (result as unknown as { insertId: number }).insertId };
  } catch (error) {
    console.error('Add database error:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการเพิ่ม database' };
  }
}

// Update database
export async function updateUserDatabase(id: number, userId: number, data: Partial<{
  name: string;
  note: string;
  host: string;
  port: number;
  db_user: string;
  db_password: string;
  is_active: boolean;
}>): Promise<{ success: boolean; error?: string }> {
  try {
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.note !== undefined) { fields.push('note = ?'); values.push(data.note); }
    if (data.host !== undefined) { fields.push('host = ?'); values.push(data.host); }
    if (data.port !== undefined) { fields.push('port = ?'); values.push(data.port); }
    if (data.db_user !== undefined) { fields.push('db_user = ?'); values.push(data.db_user); }
    if (data.db_password !== undefined) { fields.push('db_password = ?'); values.push(data.db_password); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }

    // Do not allow updating db_name and table_name - they are fixed

    if (fields.length === 0) {
      return { success: false, error: 'ไม่มีข้อมูลที่จะอัพเดท' };
    }

    values.push(id, userId);

    await query(
      `UPDATE user_databases SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values as (string | number | null)[]
    );

    return { success: true };
  } catch (error) {
    console.error('Update database error:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการอัพเดท database' };
  }
}

// Delete database
export async function deleteUserDatabase(id: number, userId: number): Promise<{ success: boolean; error?: string }> {
  try {
    await query('DELETE FROM user_databases WHERE id = ? AND user_id = ?', [id, userId]);
    return { success: true };
  } catch (error) {
    console.error('Delete database error:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการลบ database' };
  }
}

// Test database connection
export async function testConnection(db: UserDatabase): Promise<{ success: boolean; error?: string }> {
  try {
    const connection = await mysql.createConnection({
      host: db.host,
      port: db.port,
      user: db.db_user,
      password: db.db_password,
      database: db.db_name || FIXED_DB_NAME,
      connectTimeout: 10000,
    });
    await connection.ping();
    await connection.end();

    // Update last connected (only if id > 0, i.e., not a test connection)
    if (db.id > 0) {
      await query('UPDATE user_databases SET last_connected = NOW() WHERE id = ?', [db.id]);
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Create connection to user's database
async function createUserDbConnection(db: UserDatabase) {
  return mysql.createConnection({
    host: db.host,
    port: db.port,
    user: db.db_user,
    password: db.db_password,
    database: db.db_name || FIXED_DB_NAME,
    connectTimeout: 10000,
  });
}

// Helper: สร้าง condition สำหรับแยกประเภทจาก tmw
// tmw = 1 → TrueMoney, อื่นๆ (รวม 0) → ธนาคาร
function getPaymentTypeCondition(paymentType: string): string {
  if (paymentType === 'bank') {
    // tmw != 1 ทั้งหมดเป็นธนาคาร (รวม 0 ด้วย)
    return "(tmw != 1)";
  } else if (paymentType === 'truemoney') {
    // tmw = 1 เป็น TrueMoney
    return "(tmw = 1)";
  }
  return '1=1';
}

// Query transactions
export async function queryTransactions(
  db: UserDatabase,
  options: {
    startDate?: string;
    endDate?: string;
    typeTran?: 'deposit' | 'withdraw';
    paymentType?: 'all' | 'bank' | 'truemoney' | 'manual';
    autoType?: 'all' | 'auto' | 'manual';
    username?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ transactions: Transaction[]; total: number }> {
  const connection = await createUserDbConnection(db);
  const tableName = db.table_name || FIXED_TABLE_NAME;

  try {
    const conditions: string[] = ['hidden = 0']; // ไม่แสดงรายการที่ถูกยกเลิก (hidden = 1)
    const params: (string | number)[] = [];

    // Type filter (deposit/withdraw)
    if (options.typeTran) {
      conditions.push('type_tran = ?');
      params.push(options.typeTran);
    }

    // Date filters (รองรับเวลาด้วย)
    if (options.startDate) {
      conditions.push('timestamp >= ?');
      // ถ้ามีเวลามาด้วยใช้เลย ถ้าไม่มีใช้ 00:00:00
      const startDateTime = options.startDate.includes(' ') 
        ? options.startDate 
        : options.startDate + ' 00:00:00';
      params.push(startDateTime);
    }

    if (options.endDate) {
      conditions.push('timestamp <= ?');
      // ถ้ามีเวลามาด้วยใช้เลย ถ้าไม่มีใช้ 23:59:59
      const endDateTime = options.endDate.includes(' ') 
        ? options.endDate 
        : options.endDate + ' 23:59:59';
      params.push(endDateTime);
    }

    // Payment type filter (ใช้ uniq_tran แทน tmw)
    if (options.paymentType && options.paymentType !== 'all') {
      conditions.push(getPaymentTypeCondition(options.paymentType));
    }

    // Auto type filter
    if (options.autoType && options.autoType !== 'all') {
      if (options.autoType === 'auto') {
        conditions.push('isAuto = 1');
      } else if (options.autoType === 'manual') {
        conditions.push('isAuto = 0');
      }
    }

    // Username filter
    if (options.username) {
      conditions.push('username LIKE ?');
      params.push(`%${options.username}%`);
    }

    // Status filter
    if (options.status !== undefined && options.status !== '') {
      conditions.push('status = ?');
      params.push(parseInt(options.status));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const [countResult] = await connection.query(
      `SELECT COUNT(*) as total FROM ${tableName} ${whereClause}`,
      params
    );
    const total = (countResult as { total: number }[])[0].total;

    // Get transactions with pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    
    const [rows] = await connection.query(
      `SELECT * FROM ${tableName} ${whereClause} ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    await connection.end();

    return {
      transactions: rows as Transaction[],
      total,
    };
  } catch (error) {
    await connection.end();
    throw error;
  }
}

// Get transaction summary
export async function getTransactionSummary(
  db: UserDatabase,
  options: {
    startDate?: string;
    endDate?: string;
    typeTran?: 'deposit' | 'withdraw';
    username?: string;
  } = {}
): Promise<TransactionSummary> {
  const connection = await createUserDbConnection(db);
  const tableName = db.table_name || FIXED_TABLE_NAME;

  try {
    // Only successful transactions (status = 1) and not hidden (hidden = 0)
    const conditions: string[] = ['status = 1', 'hidden = 0'];
    const params: string[] = [];

    if (options.typeTran) {
      conditions.push('type_tran = ?');
      params.push(options.typeTran);
    }

    if (options.startDate) {
      conditions.push('timestamp >= ?');
      const startDateTime = options.startDate.includes(' ') 
        ? options.startDate 
        : options.startDate + ' 00:00:00';
      params.push(startDateTime);
    }

    if (options.endDate) {
      conditions.push('timestamp <= ?');
      const endDateTime = options.endDate.includes(' ') 
        ? options.endDate 
        : options.endDate + ' 23:59:59';
      params.push(endDateTime);
    }

    if (options.username) {
      conditions.push('username LIKE ?');
      params.push(`%${options.username}%`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get main summary (ใช้ uniq_tran ในการนับประเภท)
    const [summaryResult] = await connection.query(
      `SELECT 
        COUNT(*) as totalCount,
        COALESCE(SUM(amount), 0) as totalAmount,
        COALESCE(AVG(amount), 0) as averageAmount,
        SUM(CASE WHEN isAuto = 1 THEN 1 ELSE 0 END) as autoCount,
        SUM(CASE WHEN isAuto = 0 THEN 1 ELSE 0 END) as manualCount,
        SUM(CASE WHEN tmw != 1 THEN 1 ELSE 0 END) as bankCount,
        SUM(CASE WHEN tmw = 1 THEN 1 ELSE 0 END) as truemoneyCount,
        SUM(CASE WHEN tmw != 1 THEN amount ELSE 0 END) as bankAmount,
        SUM(CASE WHEN tmw = 1 THEN amount ELSE 0 END) as truemoneyAmount
       FROM ${tableName} ${whereClause}`,
      params
    );

    const summary = (summaryResult as {
      totalCount: number;
      totalAmount: number;
      averageAmount: number;
      autoCount: number;
      manualCount: number;
      bankCount: number;
      truemoneyCount: number;
      bankAmount: number;
      truemoneyAmount: number;
    }[])[0];

    // Get pending count (status = 0, hidden = 0)
    const pendingConditions = conditions.map(c => 
      c === 'status = 1' ? 'status = 0' : c
    );
    const [pendingResult] = await connection.query(
      `SELECT COUNT(*) as count FROM ${tableName} WHERE ${pendingConditions.join(' AND ')}`,
      params
    );
    const pendingCount = (pendingResult as { count: number }[])[0].count;

    await connection.end();

    return {
      totalAmount: Number(summary.totalAmount),
      totalCount: Number(summary.totalCount) + Number(pendingCount),
      successCount: Number(summary.totalCount),
      pendingCount: Number(pendingCount),
      averageAmount: Number(summary.averageAmount),
      autoCount: Number(summary.autoCount),
      manualCount: Number(summary.manualCount),
      bankCount: Number(summary.bankCount),
      truemoneyCount: Number(summary.truemoneyCount),
      bankAmount: Number(summary.bankAmount),
      truemoneyAmount: Number(summary.truemoneyAmount),
    };
  } catch (error) {
    await connection.end();
    throw error;
  }
}

// Get unique users from transactions (exclude hidden)
export async function getUniqueUsers(
  db: UserDatabase,
  search?: string
): Promise<string[]> {
  const connection = await createUserDbConnection(db);
  const tableName = db.table_name || FIXED_TABLE_NAME;

  try {
    let sql = `SELECT DISTINCT username FROM ${tableName} WHERE hidden = 0`;
    const params: string[] = [];

    if (search) {
      sql += ' AND username LIKE ?';
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY username LIMIT 100';

    const [rows] = await connection.query(sql, params);
    await connection.end();

    return (rows as { username: string }[]).map(r => r.username);
  } catch (error) {
    await connection.end();
    throw error;
  }
}