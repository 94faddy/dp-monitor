import { NextResponse } from 'next/server';
import { getDatabaseById, testConnection } from '@/lib/db';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';

// Get user from token
async function getAuthUser(request: Request) {
  const token = getTokenFromHeaders(request.headers);
  if (!token) return null;
  return verifyToken(token);
}

export async function POST(
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

    const result = await testConnection(database);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test connection' },
      { status: 500 }
    );
  }
}
