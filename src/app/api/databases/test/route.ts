import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';

// Fixed values
const FIXED_DB_NAME = 'joker555';

// Get user from token
async function getAuthUser(request: Request) {
  const token = getTokenFromHeaders(request.headers);
  if (!token) return null;
  return verifyToken(token);
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { host, port, db_user, db_password } = body;

    if (!host || !db_user || !db_password) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูล Host, DB User และ Password' },
        { status: 400 }
      );
    }

    // Test connection
    try {
      const connection = await mysql.createConnection({
        host: host,
        port: port || 3306,
        user: db_user,
        password: db_password,
        database: FIXED_DB_NAME,
        connectTimeout: 10000,
      });
      
      await connection.ping();
      await connection.end();

      return NextResponse.json({ 
        success: true, 
        message: 'เชื่อมต่อสำเร็จ' 
      });
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'ไม่สามารถเชื่อมต่อได้' 
      });
    }
  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}