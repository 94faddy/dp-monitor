'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, 
  CheckCircle, 
  DollarSign,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  User,
  Banknote,
  Smartphone,
  Bot,
  UserCheck,
  Search,
  X,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface Database {
  id: number;
  name: string;
  note: string | null;
  host: string;
  db_name: string;
}

interface Transaction {
  id: number;
  username: string;
  timestamp: string;
  amount: number;
  bonus: number | null;
  amount_after: number | null;
  type_tran: 'deposit' | 'withdraw';
  uniq_tran: string | null;
  tmw: number;
  isAuto: number;
  status: number;
  hidden: number;
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

interface TransactionListProps {
  type: 'deposit' | 'withdraw';
  title: string;
  subtitle: string;
}

export default function TransactionList({ type, title, subtitle }: TransactionListProps) {
  const { token } = useAuth();
  const [databases, setDatabases] = useState<Database[]>([]);
  const [selectedDb, setSelectedDb] = useState<string>('');
  const [selectedDbInfo, setSelectedDbInfo] = useState<{ name: string; note: string | null } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('00:00');
  const [endDate, setEndDate] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('23:59');
  const [paymentType, setPaymentType] = useState<string>('all');
  const [autoType, setAutoType] = useState<string>('all');
  const [username, setUsername] = useState<string>('');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // User suggestions
  const [userSuggestions, setUserSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

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
          if (data.databases?.length > 0) {
            setSelectedDb(data.databases[0].id.toString());
          }
        }
      })
      .catch(err => console.error('Error fetching databases:', err));
  }, [token]);

  // Fetch transactions when filters change
  useEffect(() => {
    if (selectedDb && token) {
      fetchTransactions();
    }
  }, [selectedDb, startDate, startTime, endDate, endTime, paymentType, autoType, username, statusFilter, currentPage, token]);

  // Fetch user suggestions
  const fetchUserSuggestions = useCallback(async (search: string) => {
    if (!selectedDb || search.length < 2 || !token) {
      setUserSuggestions([]);
      return;
    }

    try {
      const params = new URLSearchParams({
        databaseId: selectedDb,
        action: 'getUsers',
        username: search,
      });
      const res = await fetch(`/api/deposits?${params}`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        setUserSuggestions(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, [selectedDb, token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUserSuggestions(usernameInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [usernameInput, fetchUserSuggestions]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        databaseId: selectedDb,
        typeTran: type,
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString(),
      });
      
      // ส่งวันที่พร้อมเวลา
      if (startDate) {
        const startDateTime = `${startDate} ${startTime}:00`;
        params.append('startDate', startDateTime);
      }
      if (endDate) {
        const endDateTime = `${endDate} ${endTime}:59`;
        params.append('endDate', endDateTime);
      }
      if (paymentType !== 'all') params.append('paymentType', paymentType);
      if (autoType !== 'all') params.append('autoType', autoType);
      if (username) params.append('username', username);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/deposits?${params}`, { headers: authHeaders });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch transactions');
      }
      
      setTransactions(data.transactions || []);
      setSummary(data.summary || null);
      setTotalItems(data.total || 0);
      setSelectedDbInfo(data.database || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setTransactions([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy HH:mm:ss');
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: number) => {
    if (status === 1) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          สำเร็จ
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium border bg-amber-500/20 text-amber-400 border-amber-500/30">
        รอดำเนินการ
      </span>
    );
  };

  const getPaymentTypeBadge = (tmw: number) => {
    // tmw = 1 → TrueMoney
    if (tmw === 1) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium border bg-blue-500/20 text-blue-400 border-blue-500/30 flex items-center gap-1">
          <Smartphone className="w-3 h-3" />
          TrueMoney
        </span>
      );
    }
    
    // tmw = 0 หรืออื่นๆ → ธนาคาร
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium border bg-purple-500/20 text-purple-400 border-purple-500/30 flex items-center gap-1">
        <Banknote className="w-3 h-3" />
        ธนาคาร
      </span>
    );
  };

  const getAutoTypeBadge = (isAuto: number) => {
    if (isAuto === 1) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium border bg-cyan-500/20 text-cyan-400 border-cyan-500/30 flex items-center gap-1">
          <Bot className="w-3 h-3" />
          Auto
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium border bg-orange-500/20 text-orange-400 border-orange-500/30 flex items-center gap-1">
        <UserCheck className="w-3 h-3" />
        Manual
      </span>
    );
  };

  const setQuickDate = (dateType: 'today' | 'week' | 'month') => {
    const today = new Date();
    const start = new Date();
    
    switch (dateType) {
      case 'today':
        setStartDate(format(today, 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        setStartTime('00:00');
        setEndTime('23:59');
        break;
      case 'week':
        start.setDate(today.getDate() - 7);
        setStartDate(format(start, 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        setStartTime('00:00');
        setEndTime('23:59');
        break;
      case 'month':
        start.setMonth(today.getMonth() - 1);
        setStartDate(format(start, 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        setStartTime('00:00');
        setEndTime('23:59');
        break;
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setStartDate('');
    setStartTime('00:00');
    setEndDate('');
    setEndTime('23:59');
    setPaymentType('all');
    setAutoType('all');
    setUsername('');
    setUsernameInput('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  const handleUsernameSelect = (user: string) => {
    setUsername(user);
    setUsernameInput(user);
    setShowSuggestions(false);
    setCurrentPage(1);
  };

  const clearUsername = () => {
    setUsername('');
    setUsernameInput('');
    setCurrentPage(1);
  };

  const isDeposit = type === 'deposit';

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Database Selector */}
            <select
              value={selectedDb}
              onChange={(e) => {
                setSelectedDb(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">เลือก Database</option>
              {databases.map((db) => (
                <option key={db.id} value={db.id}>
                  {db.name} {db.note ? `(${db.note})` : ''}
                </option>
              ))}
            </select>
            
            <button
              onClick={fetchTransactions}
              disabled={loading || !selectedDb}
              className={`flex items-center gap-2 px-4 py-2 ${isDeposit ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'} disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Selected Database Info */}
        {selectedDbInfo && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
            <FileText className="w-5 h-5 text-zinc-400" />
            <div>
              <span className="text-white font-medium">{selectedDbInfo.name}</span>
              {selectedDbInfo.note && (
                <span className="text-zinc-400 ml-2">• {selectedDbInfo.note}</span>
              )}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className={`bg-gradient-to-br ${isDeposit ? 'from-emerald-500/10 to-cyan-500/10 border-emerald-500/20' : 'from-rose-500/10 to-pink-500/10 border-rose-500/20'} border rounded-2xl p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">ยอด{isDeposit ? 'ฝาก' : 'ถอน'}สำเร็จ</p>
                  <p className="text-2xl font-bold text-white mt-2">{formatCurrency(summary.totalAmount)}</p>
                </div>
                <div className={`w-12 h-12 ${isDeposit ? 'bg-emerald-500/20' : 'bg-rose-500/20'} rounded-xl flex items-center justify-center`}>
                  <DollarSign className={`w-6 h-6 ${isDeposit ? 'text-emerald-400' : 'text-rose-400'}`} />
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">รายการสำเร็จ</p>
                  <p className="text-2xl font-bold text-white mt-2">{summary.successCount}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">ธนาคาร</p>
                  <p className="text-2xl font-bold text-white mt-2">{formatCurrency(summary.bankAmount)}</p>
                  <p className="text-xs text-zinc-500">{summary.bankCount} รายการ</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">TrueMoney</p>
                  <p className="text-2xl font-bold text-white mt-2">{formatCurrency(summary.truemoneyAmount)}</p>
                  <p className="text-xs text-zinc-500">{summary.truemoneyCount} รายการ</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Auto / Manual</p>
                  <p className="text-2xl font-bold text-white mt-2">{summary.autoCount} / {summary.manualCount}</p>
                </div>
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-zinc-400" />
            <h3 className="text-lg font-semibold text-white">ตัวกรอง</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Username Search */}
            <div className="relative">
              <label className="block text-sm text-zinc-400 mb-2">ค้นหา User</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="พิมพ์เบอร์โทรหรือ username"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {username && (
                  <button
                    onClick={clearUsername}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Suggestions Dropdown */}
              {showSuggestions && userSuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {userSuggestions.map((user) => (
                    <button
                      key={user}
                      onClick={() => handleUsernameSelect(user)}
                      className="w-full px-4 py-2 text-left text-white hover:bg-zinc-700 flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-zinc-400" />
                      {user}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Type */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">ประเภทการชำระ</label>
              <select
                value={paymentType}
                onChange={(e) => {
                  setPaymentType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">ทั้งหมด</option>
                <option value="bank">ธนาคาร</option>
                <option value="truemoney">TrueMoney</option>
              </select>
            </div>

            {/* Auto Type */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Auto / Manual</label>
              <select
                value={autoType}
                onChange={(e) => {
                  setAutoType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">ทั้งหมด</option>
                <option value="auto">Auto</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">สถานะ</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">ทั้งหมด</option>
                <option value="1">สำเร็จ</option>
                <option value="0">รอดำเนินการ</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-wrap items-end gap-4">
            {/* Quick Date Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setQuickDate('today')}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
              >
                วันนี้
              </button>
              <button
                onClick={() => setQuickDate('week')}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
              >
                7 วัน
              </button>
              <button
                onClick={() => setQuickDate('month')}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
              >
                30 วัน
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-24"
                />
              </div>
              <span className="text-zinc-500">ถึง</span>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-24"
                />
              </div>
            </div>

            <button
              onClick={clearFilters}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              ล้างตัวกรอง
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <h3 className="text-lg font-semibold text-white">รายการ{isDeposit ? 'ฝาก' : 'ถอน'}เงิน</h3>
            <p className="text-sm text-zinc-400 mt-1">
              ทั้งหมด {totalItems} รายการ
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">ยอดเงิน</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">โบนัส</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">ประเภท</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Auto/Manual</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">สถานะ</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">วันที่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <RefreshCw className="w-8 h-8 text-zinc-500 animate-spin mx-auto" />
                      <p className="text-zinc-500 mt-2">กำลังโหลด...</p>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-zinc-500">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-zinc-300">{tx.id}</td>
                      <td className="px-6 py-4 text-sm text-white font-medium">{tx.username}</td>
                      <td className={`px-6 py-4 text-sm font-medium ${isDeposit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-cyan-400">
                        {tx.bonus ? formatCurrency(tx.bonus) : '-'}
                      </td>
                      <td className="px-6 py-4">{getPaymentTypeBadge(tx.tmw)}</td>
                      <td className="px-6 py-4">{getAutoTypeBadge(tx.isAuto)}</td>
                      <td className="px-6 py-4">{getStatusBadge(tx.status)}</td>
                      <td className="px-6 py-4 text-sm text-zinc-400">{formatDate(tx.timestamp)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
              <p className="text-sm text-zinc-400">
                หน้า {currentPage} จาก {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-zinc-400" />
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}