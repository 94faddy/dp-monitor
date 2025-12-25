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

    return NextResponse.json({ 
      success: true,
      database: { ...database, db_password: '********' } 
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

    // If password is masked, don't update it
    const updates = { ...body };
    if (updates.db_password === '********') {
      delete updates.db_password;
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
