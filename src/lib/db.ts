import mysql from 'mysql2/promise';
import { query } from './mysql';
import { UserDatabase, Transaction, TransactionSummary } from '@/types';

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
  db_name: string;
  table_name: string;
}): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    const result = await query<{ insertId: number }>(
      `INSERT INTO user_databases (user_id, name, note, host, port, db_user, db_password, db_name, table_name) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, data.name, data.note || null, data.host, data.port, data.db_user, data.db_password, data.db_name, data.table_name]
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
  db_name: string;
  table_name: string;
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
    if (data.db_name !== undefined) { fields.push('db_name = ?'); values.push(data.db_name); }
    if (data.table_name !== undefined) { fields.push('table_name = ?'); values.push(data.table_name); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }

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
      database: db.db_name,
      connectTimeout: 10000,
    });
    await connection.ping();
    await connection.end();

    // Update last connected
    await query('UPDATE user_databases SET last_connected = NOW() WHERE id = ?', [db.id]);

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
    database: db.db_name,
    connectTimeout: 10000,
  });
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

  try {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    // Type filter (deposit/withdraw)
    if (options.typeTran) {
      conditions.push('type_tran = ?');
      params.push(options.typeTran);
    }

    // Date filters
    if (options.startDate) {
      conditions.push('timestamp >= ?');
      params.push(options.startDate + ' 00:00:00');
    }

    if (options.endDate) {
      conditions.push('timestamp <= ?');
      params.push(options.endDate + ' 23:59:59');
    }

    // Payment type filter
    if (options.paymentType && options.paymentType !== 'all') {
      if (options.paymentType === 'bank') {
        conditions.push('tmw = -6');
      } else if (options.paymentType === 'truemoney') {
        conditions.push('tmw = 1');
      } else if (options.paymentType === 'manual') {
        conditions.push('tmw = 0');
      }
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
      `SELECT COUNT(*) as total FROM ${db.table_name} ${whereClause}`,
      params
    );
    const total = (countResult as { total: number }[])[0].total;

    // Get transactions with pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    
    const [rows] = await connection.query(
      `SELECT * FROM ${db.table_name} ${whereClause} ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
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

  try {
    const conditions: string[] = ['status = 1']; // Only successful transactions
    const params: string[] = [];

    if (options.typeTran) {
      conditions.push('type_tran = ?');
      params.push(options.typeTran);
    }

    if (options.startDate) {
      conditions.push('timestamp >= ?');
      params.push(options.startDate + ' 00:00:00');
    }

    if (options.endDate) {
      conditions.push('timestamp <= ?');
      params.push(options.endDate + ' 23:59:59');
    }

    if (options.username) {
      conditions.push('username LIKE ?');
      params.push(`%${options.username}%`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get main summary
    const [summaryResult] = await connection.query(
      `SELECT 
        COUNT(*) as totalCount,
        COALESCE(SUM(amount), 0) as totalAmount,
        COALESCE(AVG(amount), 0) as averageAmount,
        SUM(CASE WHEN isAuto = 1 THEN 1 ELSE 0 END) as autoCount,
        SUM(CASE WHEN isAuto = 0 THEN 1 ELSE 0 END) as manualCount,
        SUM(CASE WHEN tmw = -6 THEN 1 ELSE 0 END) as bankCount,
        SUM(CASE WHEN tmw = 1 THEN 1 ELSE 0 END) as truemoneyCount,
        SUM(CASE WHEN tmw = -6 THEN amount ELSE 0 END) as bankAmount,
        SUM(CASE WHEN tmw = 1 THEN amount ELSE 0 END) as truemoneyAmount
       FROM ${db.table_name} ${whereClause}`,
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

    // Get pending count
    const pendingConditions = conditions.map(c => 
      c === 'status = 1' ? 'status = 0' : c
    );
    const [pendingResult] = await connection.query(
      `SELECT COUNT(*) as count FROM ${db.table_name} WHERE ${pendingConditions.join(' AND ')}`,
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

// Get unique users from transactions
export async function getUniqueUsers(
  db: UserDatabase,
  search?: string
): Promise<string[]> {
  const connection = await createUserDbConnection(db);

  try {
    let sql = `SELECT DISTINCT username FROM ${db.table_name}`;
    const params: string[] = [];

    if (search) {
      sql += ' WHERE username LIKE ?';
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
