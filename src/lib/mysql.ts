import mysql from 'mysql2/promise';

// System database connection pool (สำหรับ users, user_databases tables)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tx_monitor',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000, // Keep alive ทุก 10 วินาที
  connectTimeout: 30000, // Timeout 30 วินาที
  idleTimeout: 60000, // Idle timeout 60 วินาที
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 วินาที

// Helper function สำหรับ delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Query function พร้อม retry logic
export async function query<T>(sql: string, params?: (string | number | null)[]): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows as T;
    } catch (error) {
      lastError = error as Error;
      const errorCode = (error as { code?: string }).code;
      
      // ถ้าเป็น connection error ให้ลอง retry
      if (
        errorCode === 'ECONNRESET' || 
        errorCode === 'PROTOCOL_CONNECTION_LOST' ||
        errorCode === 'ECONNREFUSED' ||
        errorCode === 'ETIMEDOUT' ||
        errorCode === 'ER_CON_COUNT_ERROR'
      ) {
        console.warn(`Database connection error (attempt ${attempt}/${MAX_RETRIES}):`, errorCode);
        
        if (attempt < MAX_RETRIES) {
          await delay(RETRY_DELAY * attempt); // Exponential backoff
          continue;
        }
      }
      
      // ถ้าเป็น error อื่นๆ หรือ retry หมดแล้ว ให้ throw
      throw error;
    }
  }
  
  throw lastError;
}

// Get connection สำหรับ transaction
export async function getConnection() {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await pool.getConnection();
    } catch (error) {
      lastError = error as Error;
      const errorCode = (error as { code?: string }).code;
      
      if (
        errorCode === 'ECONNRESET' || 
        errorCode === 'PROTOCOL_CONNECTION_LOST' ||
        errorCode === 'ECONNREFUSED' ||
        errorCode === 'ETIMEDOUT' ||
        errorCode === 'ER_CON_COUNT_ERROR'
      ) {
        console.warn(`Get connection error (attempt ${attempt}/${MAX_RETRIES}):`, errorCode);
        
        if (attempt < MAX_RETRIES) {
          await delay(RETRY_DELAY * attempt);
          continue;
        }
      }
      
      throw error;
    }
  }
  
  throw lastError;
}

// Health check function
export async function checkConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

export default pool;