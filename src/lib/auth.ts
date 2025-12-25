import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserSession } from '@/types';
import { query } from './mysql';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
const TOKEN_EXPIRY = '7d'; // Token หมดอายุใน 7 วัน

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Compare password
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(user: UserSession): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

// Verify JWT token
export function verifyToken(token: string): UserSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserSession;
    return decoded;
  } catch {
    return null;
  }
}

// Get user by username
export async function getUserByUsername(username: string): Promise<User | null> {
  const users = await query<User[]>(
    'SELECT id, username, email, password, role, status, last_login, created_at FROM users WHERE username = ?',
    [username]
  );
  return users[0] || null;
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await query<User[]>(
    'SELECT id, username, email, password, role, status, last_login, created_at FROM users WHERE email = ?',
    [email]
  );
  return users[0] || null;
}

// Get user by ID
export async function getUserById(id: number): Promise<User | null> {
  const users = await query<User[]>(
    'SELECT id, username, email, role, status, last_login, created_at FROM users WHERE id = ?',
    [id]
  );
  return users[0] || null;
}

// Create new user
export async function createUser(data: {
  username: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; userId?: number; error?: string }> {
  try {
    // Check if username exists
    const existingUsername = await getUserByUsername(data.username);
    if (existingUsername) {
      return { success: false, error: 'Username นี้ถูกใช้งานแล้ว' };
    }

    // Check if email exists
    const existingEmail = await getUserByEmail(data.email);
    if (existingEmail) {
      return { success: false, error: 'Email นี้ถูกใช้งานแล้ว' };
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Insert user (ไม่มี full_name แล้ว)
    const result = await query<{ insertId: number }>(
      'INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [data.username, data.email, hashedPassword, 'user', 'active']
    );

    return { success: true, userId: (result as unknown as { insertId: number }).insertId };
  } catch (error) {
    console.error('Create user error:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการสร้างบัญชี' };
  }
}

// Login user
export async function loginUser(
  username: string,
  password: string
): Promise<{ success: boolean; token?: string; user?: UserSession; error?: string }> {
  try {
    // Get user with password
    const users = await query<(User & { password: string })[]>(
      'SELECT id, username, email, password, role, status FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    const user = users[0];
    if (!user) {
      return { success: false, error: 'ไม่พบผู้ใช้งาน' };
    }

    // Check status
    if (user.status !== 'active') {
      return { success: false, error: 'บัญชีถูกระงับการใช้งาน' };
    }

    // Check password
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return { success: false, error: 'รหัสผ่านไม่ถูกต้อง' };
    }

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    // Generate token
    const userSession: UserSession = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const token = generateToken(userSession);

    return { success: true, token, user: userSession };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' };
  }
}

// Verify request token from headers
export function getTokenFromHeaders(headers: Headers): string | null {
  const authHeader = headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}