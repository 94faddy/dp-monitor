import { NextResponse } from 'next/server';
import { createUser, loginUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password, full_name } = body;

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลให้ครบ' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Username ต้องมีอย่างน้อย 3 ตัวอักษร' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'รูปแบบ Email ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Create user
    const result = await createUser({
      username,
      email,
      password,
      full_name,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Auto login after register
    const loginResult = await loginUser(username, password);

    return NextResponse.json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ',
      token: loginResult.token,
      user: loginResult.user,
    });
  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}
