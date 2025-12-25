import { NextResponse } from 'next/server';
import { getDatabaseById, queryTransactions, getTransactionSummary, getUniqueUsers } from '@/lib/db';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';

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

    const { searchParams } = new URL(request.url);
    const databaseId = searchParams.get('databaseId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const typeTran = searchParams.get('typeTran') as 'deposit' | 'withdraw' | null;
    const paymentType = searchParams.get('paymentType') as 'all' | 'bank' | 'truemoney' | 'manual' | null;
    const autoType = searchParams.get('autoType') as 'all' | 'auto' | 'manual' | null;
    const username = searchParams.get('username');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const action = searchParams.get('action');

    if (!databaseId) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเลือก Database' },
        { status: 400 }
      );
    }

    const database = await getDatabaseById(parseInt(databaseId), user.id);
    if (!database) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบ Database' },
        { status: 404 }
      );
    }

    // Get unique users
    if (action === 'getUsers') {
      const users = await getUniqueUsers(database, username || undefined);
      return NextResponse.json({ success: true, users });
    }

    const options = {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      typeTran: typeTran || undefined,
      paymentType: paymentType || 'all',
      autoType: autoType || 'all',
      username: username || undefined,
      status: status || undefined,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    };

    const [transactionsResult, summary] = await Promise.all([
      queryTransactions(database, options),
      getTransactionSummary(database, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        typeTran: typeTran || undefined,
        username: username || undefined,
      }),
    ]);

    return NextResponse.json({
      success: true,
      transactions: transactionsResult.transactions,
      total: transactionsResult.total,
      summary,
      database: {
        id: database.id,
        name: database.name,
        note: database.note,
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
