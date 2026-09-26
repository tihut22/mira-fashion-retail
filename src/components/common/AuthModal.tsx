import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { UserAccount } from '../../types';
import {
  X,
  User,
  Shield,
  LogOut,
  LogIn,
  CheckCircle2,
  Sparkles,
  Phone,
  Mail,
  MessageSquare,
  UserCheck,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    currentUser,
    isLoggedIn,
    login,
    logout,
    isAuthModalOpen,
    setIsAuthModalOpen,
    currentBusiness,
  } = useRetail();

  const [mode, setMode] = useState<'profile' | 'login'>(isLoggedIn ? 'profile' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [role, setRole] = useState<'admin' | 'staff' | 'customer'>('admin');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    login({
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      phone: phone.trim() || '+251 91 100 2233',
      telegram: telegram.trim() || `@${name.toLowerCase().replace(/\s+/g, '_')}`,
      role,
    });

    setToastMessage(`Logged in as ${name.trim()} (${role.toUpperCase()})`);
    setTimeout(() => {
      setToastMessage(null);
      setIsAuthModalOpen(false);
    }, 1500);
  };

  const handleQuickLogin = (preset: {
    name: string;
    email: string;
    phone: string;
    telegram: string;
    role: 'admin' | 'staff' | 'customer';
  }) => {
    login(preset);
    setToastMessage(`Switched session to ${preset.name} (${preset.role.toUpperCase()})`);
    setTimeout(() => {
      setToastMessage(null);
      setIsAuthModalOpen(false);
    }, 1200);
  };

  const handleLogoutAction = () => {
    logout();
    setMode('login');
    setToastMessage('Logged out successfully');
    setTimeout(() => setToastMessage(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center font-bold text-xs">
              {currentUser ? currentUser.name.slice(0, 2).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight text-white">
                {isLoggedIn ? 'User Account & Session' : 'Sign In to Boutique Platform'}
              </h3>
              <p className="text-[11px] text-stone-400">
                {currentBusiness.name} Identity Management
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1 text-stone-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="mx-4 mt-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-5 space-y-4 text-xs">
          {isLoggedIn && mode === 'profile' && currentUser ? (
            /* Logged In Active Account Card */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-sm shadow-xs border border-stone-800">
                      {currentUser.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-stone-900 leading-snug">
                        {currentUser.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            currentUser.role === 'admin'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : currentUser.role === 'staff'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {currentUser.role === 'admin'
                            ? 'Boutique Owner / Admin'
                            : currentUser.role === 'staff'
                            ? 'Boutique Staff'
                            : 'Customer Client'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <UserCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>

                <div className="space-y-1.5 pt-1 text-stone-600 text-[11px]">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span>{currentUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{currentUser.phone}</span>
                  </div>
                  {currentUser.telegram && (
                    <div className="flex items-center gap-2 text-[#24A1DE] font-mono">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{currentUser.telegram}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="py-2.5 px-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 font-bold text-stone-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-stone-500" />
                  <span>Switch Account</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogoutAction}
                  className="py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 font-bold text-rose-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Login & Account Switch Form */
            <div className="space-y-4">
              {/* Quick Login Presets */}
              <div className="space-y-2">
                <span className="font-semibold text-stone-700 block text-[11px] uppercase tracking-wider">
                  Quick 1-Click Login Options:
                </span>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickLogin({
                        name: 'Selamawit Haile',
                        email: 'selamawit@mirafashion.com',
                        phone: '+251 91 199 8877',
                        telegram: '@selamawit_h',
                        role: 'admin',
                      })
                    }
                    className="p-2.5 rounded-xl border border-amber-300 bg-amber-50/70 hover:bg-amber-100/70 text-left transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-stone-900 text-xs">Selamawit Haile</div>
                      <div className="text-[10px] text-stone-500">Boutique Manager & Admin</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">
                      Admin
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickLogin({
                        name: 'Dawit Bekele',
                        email: 'dawit.sales@mirafashion.com',
                        phone: '+251 92 333 4455',
                        telegram: '@dawit_sales',
                        role: 'staff',
                      })
                    }
                    className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-left transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-stone-900 text-xs">Dawit Bekele</div>
                      <div className="text-[10px] text-stone-500">Sales & Inventory Staff</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-200 text-blue-900 text-[10px] font-bold">
                      Staff
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickLogin({
                        name: 'Aster Bekele',
                        email: 'aster.b@gmail.com',
                        phone: '+251 91 234 5678',
                        telegram: '@aster_b',
                        role: 'customer',
                      })
                    }
                    className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-left transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-stone-900 text-xs">Aster Bekele</div>
                      <div className="text-[10px] text-stone-500">VIP Customer Client</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-800 text-[10px] font-bold">
                      Customer
                    </span>
                  </button>
                </div>
              </div>

              {/* Custom Login Form */}
              <form onSubmit={handleCustomLogin} className="pt-3 border-t border-stone-200 space-y-3">
                <span className="font-semibold text-stone-700 block text-[11px] uppercase tracking-wider">
                  Or Sign In with Custom Details:
                </span>

                <div>
                  <label className="block text-stone-700 font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Liya Kebede"
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-stone-700 font-medium mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+251 90 000 0000"
                      className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-medium mb-1">Role / Account Type</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 bg-white font-semibold cursor-pointer"
                    >
                      <option value="admin">Admin / Owner</option>
                      <option value="staff">Store Staff</option>
                      <option value="customer">Customer</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In to Account</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
