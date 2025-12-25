'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Database, 
  Trash2, 
  Edit2, 
  CheckCircle, 
  RefreshCw,
  X,
  Server,
  Eye,
  EyeOff,
  FileText,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Swal from 'sweetalert2';

interface DatabaseConfig {
  id: number;
  name: string;
  note: string | null;
  host: string;
  port: number;
  db_user: string;
  db_password: string;
  db_name: string;
  table_name: string;
  is_active: boolean;
  last_connected: string | null;
  created_at: string;
}

export default function DatabasesPage() {
  const { token } = useAuth();
  const [databases, setDatabases] = useState<DatabaseConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDb, setEditingDb] = useState<DatabaseConfig | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    note: '',
    host: '',
    port: 3306,
    db_user: '',
    db_password: '',
    db_name: '',
    table_name: 'transactions',
  });

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const fetchDatabases = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/databases', { headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        setDatabases(data.databases || []);
      }
    } catch (error) {
      console.error('Error fetching databases:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabases();
  }, [token]);

  const openModal = (db?: DatabaseConfig) => {
    if (db) {
      setEditingDb(db);
      setFormData({
        name: db.name,
        note: db.note || '',
        host: db.host,
        port: db.port,
        db_user: db.db_user,
        db_password: db.db_password,
        db_name: db.db_name,
        table_name: db.table_name,
      });
    } else {
      setEditingDb(null);
      setFormData({ name: '', note: '', host: '', port: 3306, db_user: '', db_password: '', db_name: '', table_name: 'transactions' });
    }
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.host || !formData.db_user || !formData.db_name) {
      Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูล', text: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ', confirmButtonColor: '#10b981' });
      return;
    }
    setSaving(true);
    try {
      const url = editingDb ? `/api/databases/${editingDb.id}` : '/api/databases';
      const method = editingDb ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: authHeaders, body: JSON.stringify(formData) });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: 'success', title: editingDb ? 'อัพเดทสำเร็จ' : 'เพิ่มสำเร็จ', confirmButtonColor: '#10b981', timer: 1500, showConfirmButton: false });
        setShowModal(false);
        fetchDatabases();
      } else {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: data.error, confirmButtonColor: '#10b981' });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถบันทึกข้อมูลได้', confirmButtonColor: '#10b981' });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (id: number) => {
    setTestingId(id);
    try {
      const res = await fetch(`/api/databases/${id}/test`, { method: 'POST', headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'เชื่อมต่อสำเร็จ', confirmButtonColor: '#10b981', timer: 1500, showConfirmButton: false });
      } else {
        Swal.fire({ icon: 'error', title: 'เชื่อมต่อไม่ได้', text: data.error, confirmButtonColor: '#10b981' });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', confirmButtonColor: '#10b981' });
    } finally {
      setTestingId(null);
    }
  };

  const deleteDatabase = async (id: number, name: string) => {
    const result = await Swal.fire({ title: 'ยืนยันการลบ?', text: `ลบ "${name}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#71717a', confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก' });
    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/databases/${id}`, { method: 'DELETE', headers: authHeaders });
        const data = await res.json();
        if (data.success) {
          Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', confirmButtonColor: '#10b981', timer: 1500, showConfirmButton: false });
          fetchDatabases();
        } else {
          Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: data.error, confirmButtonColor: '#10b981' });
        }
      } catch {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', confirmButtonColor: '#10b981' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-10 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">จัดการ Database</h1>
            <p className="text-sm text-zinc-400 mt-1">เพิ่ม แก้ไข หรือลบการเชื่อมต่อ Database</p>
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
            <Plus className="w-5 h-5" /> เพิ่ม Database
          </button>
        </div>
      </header>

      <main className="p-6">
        {loading ? (
          <div className="text-center py-12"><RefreshCw className="w-8 h-8 text-zinc-500 animate-spin mx-auto" /><p className="text-zinc-500 mt-2">กำลังโหลด...</p></div>
        ) : databases.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
            <Database className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">ยังไม่มี Database</h3>
            <p className="text-zinc-400 mb-6">เริ่มต้นเพิ่ม Database เพื่อดูยอดฝาก-ถอน</p>
            <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
              <Plus className="w-5 h-5" /> เพิ่ม Database แรก
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {databases.map((db) => (
              <div key={db.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
                        <Server className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{db.name}</h3>
                        {db.note && <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1"><FileText className="w-3 h-3" />{db.note}</p>}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs ${db.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
                      {db.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between"><span className="text-zinc-500">Host</span><span className="text-zinc-300">{db.host}:{db.port}</span></div>
                    <div className="flex items-center justify-between"><span className="text-zinc-500">Database</span><span className="text-zinc-300">{db.db_name}</span></div>
                    <div className="flex items-center justify-between"><span className="text-zinc-500">Table</span><span className="text-zinc-300">{db.table_name}</span></div>
                    <div className="flex items-center justify-between"><span className="text-zinc-500">User</span><span className="text-zinc-300">{db.db_user}</span></div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-zinc-800/50 border-t border-zinc-800 flex items-center justify-between">
                  <button onClick={() => testConnection(db.id)} disabled={testingId === db.id} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-emerald-400 disabled:opacity-50 transition-colors">
                    {testingId === db.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} ทดสอบ
                  </button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openModal(db)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteDatabase(db.id, db.name)} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">{editingDb ? 'แก้ไข Database' : 'เพิ่ม Database'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">ชื่อเว็บ <span className="text-red-400">*</span></label>
                <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="เช่น Joker555" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">หมายเหตุ / Note</label>
                <input type="text" value={formData.note} onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="เช่น เว็บหลัก" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Host <span className="text-red-400">*</span></label>
                  <input type="text" value={formData.host} onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="IP" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Port</label>
                  <input type="number" value={formData.port} onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) || 3306 }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">DB User <span className="text-red-400">*</span></label>
                <input type="text" value={formData.db_user} onChange={(e) => setFormData(prev => ({ ...prev, db_user: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="root" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={formData.db_password} onChange={(e) => setFormData(prev => ({ ...prev, db_password: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder={editingDb ? 'ไม่เปลี่ยนให้เว้นว่าง' : 'รหัสผ่าน'} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Database Name <span className="text-red-400">*</span></label>
                <input type="text" value={formData.db_name} onChange={(e) => setFormData(prev => ({ ...prev, db_name: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="ชื่อ database" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Table Name</label>
                <input type="text" value={formData.table_name} onChange={(e) => setFormData(prev => ({ ...prev, table_name: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="transactions" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors">ยกเลิก</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-600 text-white rounded-xl flex items-center justify-center gap-2 transition-colors">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" />{editingDb ? 'บันทึก' : 'เพิ่ม'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
