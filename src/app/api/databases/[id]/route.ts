import { NextResponse } from 'next/server';
import { getDatabaseById, updateUserDatabase, deleteUserDatabase, testConnection } from '@/lib/db';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';

// Get user from token
async function getAuthUser(request: Request) {
  const token = getTokenFromHeaders(request.headers);
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const database = await getDatabaseById(parseInt(id), user.id);
    
    if (!database) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบ Database' },
        { status: 404 }
      );
    }

    // Hide sensitive data
    return NextResponse.json({ 
      success: true,
      database: { 
        ...database, 
        host: '********',
        db_user: '********',
        db_password: '********' 
      } 
    });
  } catch (error) {
    console.error('Get database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch database' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    
    const existing = await getDatabaseById(parseInt(id), user.id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบ Database' },
        { status: 404 }
      );
    }

    // Build updates object - only include fields that have values
    const updates: Record<string, string | number> = {};
    
    // Always update name and note
    if (body.name) updates.name = body.name;
    if (body.note !== undefined) updates.note = body.note;
    if (body.port) updates.port = body.port;
    
    // Only update sensitive fields if new values are provided (not empty)
    if (body.host && body.host !== '********') updates.host = body.host;
    if (body.db_user && body.db_user !== '********') updates.db_user = body.db_user;
    if (body.db_password && body.db_password !== '********') updates.db_password = body.db_password;

    // If connection details are being updated, test connection first
    if (updates.host || updates.db_user || updates.db_password) {
      const testDb = {
        ...existing,
        host: updates.host as string || existing.host,
        db_user: updates.db_user as string || existing.db_user,
        db_password: updates.db_password as string || existing.db_password,
        port: updates.port as number || existing.port,
      };
      
      const testResult = await testConnection(testDb);
      if (!testResult.success) {
        return NextResponse.json(
          { success: false, error: `เชื่อมต่อไม่ได้: ${testResult.error}` },
          { status: 400 }
        );
      }
    }

    const result = await updateUserDatabase(parseInt(id), user.id, updates);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'อัพเดท Database สำเร็จ' 
    });
  } catch (error) {
    console.error('Update database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update database' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const result = await deleteUserDatabase(parseInt(id), user.id);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'ลบ Database สำเร็จ' 
    });
  } catch (error) {
    console.error('Delete database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete database' },
      { status: 500 }
    );
  }
}