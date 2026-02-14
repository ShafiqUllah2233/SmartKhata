import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { HiOutlineCash, HiOutlineArrowLeft } from 'react-icons/hi';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const PublicAllKhata = () => {
  const { groupToken } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Customer detail state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', type: '' });

  // Dark mode state
  const [dark, setDark] = useState(() => localStorage.getItem('khata-dark') === 'true');
  const toggleDark = () => {
    const v = !dark;
    setDark(v);
    localStorage.setItem('khata-dark', String(v));
  };

  useEffect(() => { fetchGroup(); }, [groupToken]);

  const fetchGroup = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/public/group/${groupToken}`);
      setData(data);
      setError(null);
    } catch (err) {
      setError('Khata not found or link is invalid');
    } finally {
      setLoading(false);
    }
  };

  const openCustomerDetail = async (shareToken) => {
    setSelectedCustomer(shareToken);
    setDetailLoading(true);
    setFilters({ startDate: '', endDate: '', type: '' });
    try {
      const { data } = await axios.get(`${API_URL}/public/group/${groupToken}/customer/${shareToken}`);
      setCustomerDetail(data);
    } catch (err) {
      setCustomerDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchCustomerFiltered = async (filterParams = {}) => {
    if (!selectedCustomer) return;
    setDetailLoading(true);
    try {
      const params = new URLSearchParams(filterParams).toString();
      const url = `${API_URL}/public/group/${groupToken}/customer/${selectedCustomer}${params ? '?' + params : ''}`;
      const { data } = await axios.get(url);
      setCustomerDetail(data);
    } catch (err) {
      // ignore
    } finally {
      setDetailLoading(false);
    }
  };

  const applyFilters = () => {
    const params = {};
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.type) params.type = filters.type;
    fetchCustomerFiltered(params);
  };

  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', type: '' });
    fetchCustomerFiltered();
  };

  if (loading) return (
    <div className={`flex items-center justify-center min-h-screen ${dark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
        <p className={`mt-4 font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Loading Khata...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className={`flex items-center justify-center min-h-screen ${dark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="text-center px-6">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${dark ? 'bg-red-900/30' : 'bg-red-50'}`}>
          <span className="text-5xl">❌</span>
        </div>
        <h1 className={`text-2xl font-bold mb-2 ${dark ? 'text-gray-100' : 'text-gray-800'}`}>Khata Not Found</h1>
        <p className={dark ? 'text-gray-400' : 'text-gray-500'}>This link is invalid.</p>
      </div>
    </div>
  );

  // CUSTOMER DETAIL VIEW
  if (selectedCustomer && customerDetail) return (
    <div className={`min-h-screen transition-colors duration-300 ${dark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📒</span>
            <h1 className="text-xl font-bold text-white">Smart Khata</h1>
          </div>
          <button onClick={toggleDark} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 flex items-center justify-center text-lg" title="Toggle Dark Mode">
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <button onClick={() => { setSelectedCustomer(null); setCustomerDetail(null); }}
          className={`flex items-center space-x-2 mb-6 transition-colors font-medium text-sm group ${dark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'}`}>
          <HiOutlineArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to All Members</span>
        </button>

        {/* Customer Info */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl shadow-emerald-900/20">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-20 translate-x-20"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-white font-extrabold text-2xl border border-white/20">
                {customerDetail.customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{customerDetail.customer.name}</h1>
                <p className="text-sm text-emerald-100/70 mt-1">📒 Khata Detail</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              <div className={`backdrop-blur rounded-2xl p-4 text-center border ${customerDetail.customer.balance < 0 ? 'bg-emerald-500/20 border-emerald-300/30' : 'bg-white/10 border-white/10'}`}>
                <p className="text-xs text-green-200 font-bold uppercase tracking-wider">Maine Lene Hain</p>
                <p className="text-2xl font-extrabold text-white mt-1">Rs. {(customerDetail.customer.balance < 0 ? Math.abs(customerDetail.customer.balance) : 0).toLocaleString()}</p>
              </div>
              <div className={`backdrop-blur rounded-2xl p-4 text-center border ${customerDetail.customer.balance > 0 ? 'bg-rose-500/20 border-rose-300/30' : 'bg-white/10 border-white/10'}`}>
                <p className="text-xs text-red-200 font-bold uppercase tracking-wider">Maine Dene Hain</p>
                <p className="text-2xl font-extrabold text-white mt-1">Rs. {(customerDetail.customer.balance > 0 ? customerDetail.customer.balance : 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Total Khata - Monthly I Gave */}
        {(() => {
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          const monthlyTotal = customerDetail.transactions
            .filter(tx => {
              if (tx.type !== 'RECEIVED') return false;
              const txDate = new Date(tx.date);
              return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
            })
            .reduce((sum, tx) => sum + tx.amount, 0);
          return (
            <div className={`rounded-3xl shadow-sm border p-5 mb-6 transition-colors duration-300 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${dark ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}>💵</div>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider ${dark ? 'text-gray-400' : 'text-gray-400'}`}>Total Khata</p>
                    <p className={`text-xs mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{monthNames[currentMonth]} {currentYear}</p>
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-emerald-600">Rs. {monthlyTotal.toLocaleString()}</p>
              </div>
            </div>
          );
        })()}

        {/* Filters */}
        <div className={`rounded-3xl shadow-sm border p-4 sm:p-5 mb-6 transition-colors duration-300 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="flex-1 w-full">
              <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${dark ? 'text-gray-400' : 'text-gray-400'}`}>From</label>
              <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${dark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200'}`} />
            </div>
            <div className="flex-1 w-full">
              <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${dark ? 'text-gray-400' : 'text-gray-400'}`}>To</label>
              <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${dark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200'}`} />
            </div>
            <div className="flex-1 w-full">
              <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${dark ? 'text-gray-400' : 'text-gray-400'}`}>Type</label>
              <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all cursor-pointer ${dark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200'}`}>
                <option value="">All</option>
                <option value="GIVEN">I Got</option>
                <option value="RECEIVED">I Gave</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={applyFilters} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm">Filter</button>
              <button onClick={clearFilters} className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${dark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Clear</button>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className={`rounded-3xl shadow-sm border overflow-hidden transition-colors duration-300 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className={`px-6 py-5 border-b ${dark ? 'border-gray-700' : 'border-gray-100'}`}>
            <h2 className={`text-lg font-bold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>Transaction History</h2>
            <p className={`text-xs mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{customerDetail.transactions.length} transactions</p>
          </div>

          {customerDetail.transactions.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <HiOutlineCash className={`w-10 h-10 ${dark ? 'text-gray-500' : 'text-gray-300'}`} />
              </div>
              <p className={`font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>No transactions yet</p>
            </div>
          ) : (
            <div className={`divide-y ${dark ? 'divide-gray-700' : 'divide-gray-50'}`}>
              {customerDetail.transactions.map((tx) => (
                <div key={tx._id}
                  className={`flex items-center justify-between px-6 py-4 border-l-4 transition-all ${
                    tx.type === 'GIVEN' ? 'border-l-rose-500' : 'border-l-emerald-500'
                  } ${dark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50/50'}`}>
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 ${
                      tx.type === 'GIVEN'
                        ? (dark ? 'bg-rose-900/30' : 'bg-rose-50')
                        : (dark ? 'bg-emerald-900/30' : 'bg-emerald-50')
                    }`}>
                      {tx.type === 'GIVEN' ? '💸' : '💰'}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-bold text-sm ${tx.type === 'GIVEN' ? (dark ? 'text-rose-400' : 'text-rose-700') : (dark ? 'text-emerald-400' : 'text-emerald-700')}`}>
                        {tx.type === 'GIVEN' ? 'I Got' : 'I Gave'}
                      </p>
                      <p className={`text-xs mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {format(new Date(tx.date), 'dd MMM yyyy')}
                        {tx.description && (' · ' + tx.description)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-extrabold text-lg ${tx.type === 'GIVEN' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {tx.type === 'GIVEN' ? '-' : '+'} Rs. {tx.amount.toLocaleString()}
                    </p>
                    <p className={`text-xs font-medium ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Bal: Rs. {tx.balanceAfter.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-8 pb-6">
          <p className={`text-xs ${dark ? 'text-gray-600' : 'text-gray-400'}`}>📒 Powered By Shafiq Ullah Khan</p>
        </div>
      </div>
    </div>
  );

  // MAIN GROUP VIEW - ALL CUSTOMERS
  return (
    <div className={`min-h-screen transition-colors duration-300 ${dark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📒</span>
            <h1 className="text-xl font-bold text-white">Smart Khata</h1>
            <span className="text-sm text-emerald-100/70 ml-2">- {data.ownerName}'s Khata</span>
          </div>
          <button onClick={toggleDark} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 flex items-center justify-center text-lg" title="Toggle Dark Mode">
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Summary Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl shadow-emerald-900/20">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-20 translate-x-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-white mb-1">📊 Overall Summary</h2>
            <p className="text-sm text-emerald-100/70 mb-5">{data.summary.totalCustomers} Members</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={`backdrop-blur rounded-2xl p-4 text-center border ${data.summary.totalOwed > 0 ? 'bg-emerald-500/20 border-emerald-300/30' : 'bg-white/10 border-white/10'}`}>
                <p className="text-xs text-green-200 font-bold uppercase tracking-wider">Maine Lene Hain</p>
                <p className="text-2xl font-extrabold text-white mt-1">Rs. {data.summary.totalOwed.toLocaleString()}</p>
              </div>
              <div className={`backdrop-blur rounded-2xl p-4 text-center border ${data.summary.totalOwing > 0 ? 'bg-rose-500/20 border-rose-300/30' : 'bg-white/10 border-white/10'}`}>
                <p className="text-xs text-red-200 font-bold uppercase tracking-wider">Maine Dene Hain</p>
                <p className="text-2xl font-extrabold text-white mt-1">Rs. {data.summary.totalOwing.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer List */}
        <div className={`rounded-3xl shadow-sm border overflow-hidden transition-colors duration-300 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className={`px-6 py-5 border-b ${dark ? 'border-gray-700' : 'border-gray-100'}`}>
            <h2 className={`text-lg font-bold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>👥 All Members</h2>
            <p className={`text-xs mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Click on any member to view their detailed khata</p>
          </div>

          <div className={`divide-y ${dark ? 'divide-gray-700' : 'divide-gray-50'}`}>
            {data.customers.map((c) => (
              <button key={c.shareToken} onClick={() => openCustomerDetail(c.shareToken)}
                className={`w-full flex items-center justify-between px-6 py-4 transition-all text-left group ${dark ? 'hover:bg-gray-700/80' : 'hover:bg-gray-50/80'}`}>
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0 shadow-sm">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-bold group-hover:text-emerald-700 transition-colors ${dark ? 'text-gray-100' : 'text-gray-800'}`}>{c.name}</p>
                    {c.phone && <p className={`text-xs mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>📱 {c.phone}</p>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-extrabold text-lg ${c.balance > 0 ? 'text-rose-600' : c.balance < 0 ? 'text-emerald-600' : (dark ? 'text-gray-500' : 'text-gray-400')}`}>
                    Rs. {Math.abs(c.balance).toLocaleString()}
                  </p>
                  <p className="text-xs font-medium mt-0.5">
                    {c.balance > 0 ? (
                      <span className="text-rose-500">Maine Dene Hain ↙</span>
                    ) : c.balance < 0 ? (
                      <span className="text-emerald-500">Maine Lene Hain ↗</span>
                    ) : (
                      <span className={dark ? 'text-gray-500' : 'text-gray-400'}>Settled ✓</span>
                    )}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mt-8 pb-6">
          <p className={`text-xs ${dark ? 'text-gray-600' : 'text-gray-400'}`}>📒 Powered By Shafiq Ullah Khan</p>
        </div>
      </div>
    </div>
  );
};

export default PublicAllKhata;
