import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// อ่าน allowed origins จาก environment variable
function getAllowedOrigins(): string[] {
  const origins = process.env.ALLOWED_ORIGINS || 'http://localhost';
  return origins.split(',').map(o => o.trim());
}

// ดึง hostname จาก origin URL (http://localhost:7117 → localhost)
function extractHostFromOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    return url.hostname.toLowerCase();
  } catch {
    return origin.toLowerCase();
  }
}

// ตรวจสอบว่า host อยู่ใน whitelist หรือไม่
function isAllowedHost(host: string | null): boolean {
  if (!host) return false;
  
  const allowedOrigins = getAllowedOrigins();
  const hostLower = host.toLowerCase().split(':')[0]; // ตัด port ออก
  
  for (const origin of allowedOrigins) {
    const allowedHost = extractHostFromOrigin(origin);
    
    if (hostLower === allowedHost) {
      return true;
    }
  }
  
  return false;
}

// ตรวจสอบว่า origin อยู่ใน whitelist หรือไม่ (สำหรับ CORS)
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  
  const allowedOrigins = getAllowedOrigins();
  
  // Exact match
  if (allowedOrigins.includes(origin)) return true;
  
  // ถ้ามี http://localhost ให้อนุญาต localhost ทุก port
  const originHost = extractHostFromOrigin(origin);
  for (const allowed of allowedOrigins) {
    if (extractHostFromOrigin(allowed) === 'localhost' && originHost === 'localhost') {
      return true;
    }
  }
  
  return false;
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host');
  const origin = request.headers.get('origin');
  const pathname = request.nextUrl.pathname;
  
  // ===== ตรวจสอบ Host (Block domain ที่ไม่อนุญาต) =====
  if (!isAllowedHost(host)) {
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        error: 'Access denied: Unauthorized domain'
      }),
      { 
        status: 403, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
  
  // ===== CORS สำหรับ API routes =====
  const isApiRoute = pathname.startsWith('/api');
  
  if (isApiRoute) {
    // Handle preflight requests (OPTIONS)
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 });
      
      if (origin && isAllowedOrigin(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      }
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
      response.headers.set('Access-Control-Max-Age', '86400');
      
      return response;
    }

    // Handle actual API requests
    const response = NextResponse.next();
    
    if (origin && isAllowedOrigin(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};