import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromHeaders, getUserById } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const token = getTokenFromHeaders(request.headers);
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบ Token' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Token ไม่ถูกต้องหรือหมดอายุ' },
        { status: 401 }
      );
    }

    // Get fresh user data
    const user = await getUserById(decoded.id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้ใช้งาน' },
        { status: 404 }
      );
    }

    if (user.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'บัญชีถูกระงับการใช้งาน' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Me API error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}