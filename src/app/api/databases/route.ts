import { NextResponse } from 'next/server';
import { getUserDatabases, addUserDatabase, testConnection } from '@/lib/db';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';
import { UserDatabase } from '@/types';

// Get user from token
async function getAuthUser(request: Request) {
  const token = getTokenFromHeaders(request.headers);
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const databases = await getUserDatabases(user.id);
    
    // Hide password in response
    const safeData = databases.map(db => ({
      ...db,
      db_password: '********',
    }));
    
    return NextResponse.json({ success: true, databases: safeData });
  } catch (error) {
    console.error('Get databases error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch databases' },
      { status: 500 }
    );
  }
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
    const { name, note, host, port, db_user, db_password, db_name, table_name } = body;

    if (!name || !host || !db_user || !db_password || !db_name) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลให้ครบ' },
        { status: 400 }
      );
    }

    // Test connection first
    const testDb: UserDatabase = {
      id: 0,
      user_id: user.id,
      name,
      note: note || null,
      host,
      port: port || 3306,
      db_user,
      db_password,
      db_name,
      table_name: table_name || 'transactions',
      is_active: true,
      last_connected: null,
      created_at: '',
    };

    const testResult = await testConnection(testDb);
    if (!testResult.success) {
      return NextResponse.json(
        { success: false, error: `เชื่อมต่อไม่ได้: ${testResult.error}` },
        { status: 400 }
      );
    }

    const result = await addUserDatabase(user.id, {
      name,
      note,
      host,
      port: port || 3306,
      db_user,
      db_password,
      db_name,
      table_name: table_name || 'transactions',
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'เพิ่ม Database สำเร็จ',
      id: result.id,
    });
  } catch (error) {
    console.error('Add database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add database' },
      { status: 500 }
    );
  }
}
