'use client';

import { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertCircle,
  Banknote,
  Smartphone,
  Database,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface DatabaseConfig {
  id: number;
  name: string;
  note: string | null;
  host: string;
  db_name: string;
}

interface Summary {
  totalAmount: number;
  totalCount: number;
  successCount: number;
  pendingCount: number;
  averageAmount: number;
  autoCount: number;
  manualCount: number;
  bankCount: number;
  truemoneyCount: number;
  bankAmount: number;
  truemoneyAmount: number;
}

interface DatabaseSummary {
  database: DatabaseConfig;
  deposits: Summary | null;
  withdrawals: Summary | null;
  error?: string;
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [databases, setDatabases] = useState<DatabaseConfig[]>([]);
  const [summaries, setSummaries] = useState<DatabaseSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Fetch databases
  useEffect(() => {
    if (!token) return;
    
    fetch('/api/databases', { headers: authHeaders })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDatabases(data.databases || []);
        }
      })
      .catch(err => console.error('Error fetching databases:', err));
  }, [token]);

  // Fetch summaries for all databases
  useEffect(() => {
    if (databases.length > 0 && token) {
      fetchAllSummaries();
    }
  }, [databases, token]);

  const fetchAllSummaries = async () => {
    setLoading(true);
    setError(null);

    try {
      const results: DatabaseSummary[] = await Promise.all(
        databases.map(async (db) => {
          try {
            // Fetch deposits summary
            const depositsRes = await fetch(`/api/deposits?databaseId=${db.id}&typeTran=deposit&limit=1`, { 
              headers: authHeaders 
            });
            const depositsData = await depositsRes.json();

            // Fetch withdrawals summary
            const withdrawalsRes = await fetch(`/api/deposits?databaseId=${db.id}&typeTran=withdraw&limit=1`, { 
              headers: authHeaders 
            });
            const withdrawalsData = await withdrawalsRes.json();

            return {
              database: db,
              deposits: depositsData.success ? depositsData.summary : null,
              withdrawals: withdrawalsData.success ? withdrawalsData.summary : null,
            };
          } catch (err) {
            return {
              database: db,
              deposits: null,
              withdrawals: null,
              error: err instanceof Error ? err.message : 'Error',
            };
          }
        })
      );

      setSummaries(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);
  };

  const getTotalDeposits = () => {
    return summaries.reduce((sum, s) => sum + (s.deposits?.totalAmount || 0), 0);
  };

  const getTotalWithdrawals = () => {
    return summaries.reduce((sum, s) => sum + (s.withdrawals?.totalAmount || 0), 0);
  };

  const getProfit = () => {
    return getTotalDeposits() - getTotalWithdrawals();
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-zinc-400 mt-1">
              สวัสดี, {user?.username} • ภาพรวมยอดฝาก-ถอน
            </p>
          </div>
          
          <button
            onClick={fetchAllSummaries}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </button>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Overall Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">ยอดฝากรวม (ทุกเว็บ)</p>
                <p className="text-3xl font-bold text-emerald-400 mt-2">{formatCurrency(getTotalDeposits())}</p>
              </div>
              <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <ArrowDownCircle className="w-7 h-7 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">ยอดถอนรวม (ทุกเว็บ)</p>
                <p className="text-3xl font-bold text-rose-400 mt-2">{formatCurrency(getTotalWithdrawals())}</p>
              </div>
              <div className="w-14 h-14 bg-rose-500/20 rounded-xl flex items-center justify-center">
                <ArrowUpCircle className="w-7 h-7 text-rose-400" />
              </div>
            </div>
          </div>

          <div className={`bg-gradient-to-br ${getProfit() >= 0 ? 'from-cyan-500/10 to-blue-500/10 border-cyan-500/20' : 'from-orange-500/10 to-red-500/10 border-orange-500/20'} border rounded-2xl p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">กำไร/ขาดทุน (ทุกเว็บ)</p>
                <p className={`text-3xl font-bold mt-2 ${getProfit() >= 0 ? 'text-cyan-400' : 'text-orange-400'}`}>
                  {formatCurrency(getProfit())}
                </p>
              </div>
              <div className={`w-14 h-14 ${getProfit() >= 0 ? 'bg-cyan-500/20' : 'bg-orange-500/20'} rounded-xl flex items-center justify-center`}>
                {getProfit() >= 0 ? (
                  <TrendingUp className="w-7 h-7 text-cyan-400" />
                ) : (
                  <TrendingDown className="w-7 h-7 text-orange-400" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/deposits" className="block">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowDownCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">ดูรายการฝากทั้งหมด</h3>
                  <p className="text-sm text-zinc-400">กรองตาม User, ประเภท, วันที่</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/withdrawals" className="block">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-rose-500/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowUpCircle className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">ดูรายการถอนทั้งหมด</h3>
                  <p className="text-sm text-zinc-400">กรองตาม User, ประเภท, วันที่</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Per Database Summary */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-zinc-400" />
            สรุปแยกตาม Database ({summaries.length} เว็บ)
          </h2>

          {loading ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
              <RefreshCw className="w-8 h-8 text-zinc-500 animate-spin mx-auto" />
              <p className="text-zinc-500 mt-2">กำลังโหลด...</p>
            </div>
          ) : summaries.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
              <Database className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">ยังไม่มี Database</h3>
              <p className="text-zinc-400 mb-6">เริ่มต้นเพิ่ม Database เพื่อดูข้อมูล</p>
              <Link
                href="/databases"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                ไปหน้าจัดการ Database
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {summaries.map((item) => (
                <div key={item.database.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  {/* Database Header */}
                  <div className="p-4 border-b border-zinc-800 bg-zinc-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
                        <Database className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{item.database.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                        </div>
                      </div>
                    </div>
                    {item.database.note && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
                        <FileText className="w-4 h-4" />
                        <span>{item.database.note}</span>
                      </div>
                    )}
                  </div>

                  {item.error ? (
                    <div className="p-6 text-center text-red-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      <p>เชื่อมต่อไม่ได้: {item.error}</p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-4">
                      {/* Deposits Summary */}
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-emerald-400 font-medium flex items-center gap-2">
                            <ArrowDownCircle className="w-4 h-4" />
                            ยอดฝาก
                          </span>
                          <span className="text-emerald-400 font-bold text-lg">
                            {formatCurrency(item.deposits?.totalAmount || 0)}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-center">
                            <p className="text-zinc-500">สำเร็จ</p>
                            <p className="text-white font-medium">{item.deposits?.successCount || 0}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-zinc-500">ธนาคาร</p>
                            <p className="text-purple-400 font-medium">{item.deposits?.bankCount || 0}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-zinc-500">TrueMoney</p>
                            <p className="text-blue-400 font-medium">{item.deposits?.truemoneyCount || 0}</p>
                          </div>
                        </div>
                      </div>

                      {/* Withdrawals Summary */}
                      <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-rose-400 font-medium flex items-center gap-2">
                            <ArrowUpCircle className="w-4 h-4" />
                            ยอดถอน
                          </span>
                          <span className="text-rose-400 font-bold text-lg">
                            {formatCurrency(item.withdrawals?.totalAmount || 0)}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-center">
                            <p className="text-zinc-500">สำเร็จ</p>
                            <p className="text-white font-medium">{item.withdrawals?.successCount || 0}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-zinc-500">Auto</p>
                            <p className="text-cyan-400 font-medium">{item.withdrawals?.autoCount || 0}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-zinc-500">Manual</p>
                            <p className="text-orange-400 font-medium">{item.withdrawals?.manualCount || 0}</p>
                          </div>
                        </div>
                      </div>

                      {/* Profit/Loss */}
                      <div className={`rounded-xl p-4 ${
                        ((item.deposits?.totalAmount || 0) - (item.withdrawals?.totalAmount || 0)) >= 0 
                          ? 'bg-cyan-500/5 border border-cyan-500/20' 
                          : 'bg-orange-500/5 border border-orange-500/20'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400 font-medium">กำไร/ขาดทุน</span>
                          <span className={`font-bold text-lg ${
                            ((item.deposits?.totalAmount || 0) - (item.withdrawals?.totalAmount || 0)) >= 0 
                              ? 'text-cyan-400' 
                              : 'text-orange-400'
                          }`}>
                            {formatCurrency((item.deposits?.totalAmount || 0) - (item.withdrawals?.totalAmount || 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}