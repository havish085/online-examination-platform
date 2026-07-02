import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ShieldCheck, UserCheck, Search, ShieldAlert, Edit, Trash2, Ban, CheckCircle2 } from 'lucide-react';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

export const UserManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(list);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      alert("User role updated successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to update user role.");
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { status: nextStatus });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
    } catch (err) {
      console.error(err);
      alert("Failed to update user status.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user from Firestore? This does not delete their Firebase Auth credential, but deletes their profile details.")) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(u => u.id !== userId));
      alert("User profile deleted.");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[75vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Filter
  const filteredUsers = users.filter(user => {
    const term = searchQuery.toLowerCase();
    return (
      (user.displayName || '').toLowerCase().includes(term) ||
      (user.email || '').toLowerCase().includes(term) ||
      (user.role || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            User Accounts Manager
          </h1>
          <p className="text-sm text-slate-450 dark:text-slate-400">
            Audit candidate profiles, adjust security access levels, or suspend active logins.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Search by name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-205 bg-white py-2.5 pl-9 pr-4 text-xs outline-none transition-all dark:border-slate-800 dark:bg-slate-900"
          />
        </div>
      </div>

      {/* Users table */}
      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs font-semibold uppercase text-slate-450 dark:text-slate-400">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredUsers.map((u) => {
                const isBlocked = u.status === 'blocked';
                const createdDate = u.createdAt?.seconds 
                  ? new Date(u.createdAt.seconds * 1000).toLocaleDateString()
                  : 'N/A';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{u.displayName || 'Unnamed User'}</p>
                        <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role || 'student'}
                        onChange={(e) => handleChangeRole(u.id, e.target.value)}
                        className="rounded-xl border border-slate-205 bg-slate-50 p-1.5 text-xs outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold"
                      >
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{createdDate}</td>
                    <td className="px-6 py-4">
                      {isBlocked ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
                          <UserCheck className="h-3.5 w-3.5" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className={`inline-flex items-center gap-1 p-1.5 rounded-lg border text-xs font-semibold transition-colors
                          ${isBlocked 
                            ? 'border-emerald-205 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/20' 
                            : 'border-amber-205 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950/20'
                          }
                        `}
                        title={isBlocked ? "Activate User" : "Suspend User"}
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="inline-flex items-center gap-1 p-1.5 rounded-lg border border-red-200 text-red-650 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/20"
                        title="Delete Profile"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
