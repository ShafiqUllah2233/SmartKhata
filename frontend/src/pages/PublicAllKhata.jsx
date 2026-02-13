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
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-500 font-medium">Loading Khata...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center px-6">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">❌</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Khata Not Found</h1>
        <p className="text-gray-500">This link is invalid.</p>
      </div>
    </div>
  );

  // CUSTOMER DETAIL VIEW
  if (selectedCustomer && customerDetail) return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center space-x-3">
          <span className="text-2xl">📒</span>
          <h1 className="text-xl font-bold text-white">Smart Khata</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <button onClick={() => { setSelectedCustomer(null); setCustomerDetail(null); }}
          className="flex items-center space-x-2 text-gray-400 hover:text-gray-700 mb-6 transition-colors font-medium text-sm group">
          <HiOutlineArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Wapas Sab Members</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
                <p className="text-xs text-red-200 font-bold uppercase tracking-wider">Udhar Liya</p>
                <p className="text-2xl font-extrabold text-white mt-1">Rs. {(customerDetail.summary?.totalGiven || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
                <p className="text-xs text-green-200 font-bold uppercase tracking-wider">Wapas Diya</p>
                <p className="text-2xl font-extrabold text-white mt-1">Rs. {(customerDetail.summary?.totalReceived || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-2xl p-4 text-center border border-white/20">
                <p className="text-xs text-yellow-200 font-bold uppercase tracking-wider">
                  {customerDetail.customer.balance > 0 ? 'Aap Par Baki Hai' : customerDetail.customer.balance < 0 ? 'Wapas Milna Hai' : 'Barabar Hai'}
                </p>
                <p className="text-2xl font-extrabold text-white mt-1">Rs. {Math.abs(customerDetail.customer.balance).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">From</label>
              <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">To</label>
              <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Type</label>
              <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all cursor-pointer">
                <option value="">All</option>
                <option value="GIVEN">Udhar Liya</option>
                <option value="RECEIVED">Wapas Diya</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={applyFilters} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm">Filter</button>
              <button onClick={clearFilters} className="px-4 py-2.5 bg-gray-100 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-200 transition-all">Clear</button>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">Transaction History</h2>
            <p className="text-xs text-gray-400 mt-0.5">{customerDetail.transactions.length} transactions</p>
          </div>

          {customerDetail.transactions.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiOutlineCash className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Koi transaction nahi hai</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {customerDetail.transactions.map((tx) => (
                <div key={tx._id}
                  className={`flex items-center justify-between px-6 py-4 border-l-4 ${
                    tx.type === 'GIVEN' ? 'border-l-rose-500' : 'border-l-emerald-500'
                  }`}>
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 ${
                      tx.type === 'GIVEN' ? 'bg-rose-50' : 'bg-emerald-50'
                    }`}>
                      {tx.type === 'GIVEN' ? '💸' : '💰'}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-bold text-sm ${tx.type === 'GIVEN' ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {tx.type === 'GIVEN' ? 'Udhar Liya' : 'Wapas Diya'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(tx.date), 'dd MMM yyyy')}
                        {tx.description && (' · ' + tx.description)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-extrabold text-lg ${tx.type === 'GIVEN' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {tx.type === 'GIVEN' ? '+' : '-'} Rs. {tx.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 font-medium">Bal: Rs. {tx.balanceAfter.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-8 pb-6">
          <p className="text-xs text-gray-400">📒 Powered by Smart Khata</p>
        </div>
      </div>
    </div>
  );

  // MAIN GROUP VIEW - ALL CUSTOMERS
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center space-x-3">
          <span className="text-2xl">📒</span>
          <h1 className="text-xl font-bold text-white">Smart Khata</h1>
          <span className="text-sm text-emerald-100/70 ml-2">- {data.ownerName} ka Khata</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
                <p className="text-xs text-red-200 font-bold uppercase tracking-wider">Total Udhar</p>
                <p className="text-2xl font-extrabold text-white mt-1">Rs. {data.summary.totalOwed.toLocaleString()}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
                <p className="text-xs text-green-200 font-bold uppercase tracking-wider">Total Wapas</p>
                <p className="text-2xl font-extrabold text-white mt-1">Rs. {data.summary.totalOwing.toLocaleString()}</p>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-2xl p-4 text-center border border-white/20">
                <p className="text-xs text-yellow-200 font-bold uppercase tracking-wider">Net Balance</p>
                <p className="text-2xl font-extrabold text-white mt-1">Rs. {data.summary.netBalance.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer List */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">👥 Sab Members</h2>
            <p className="text-xs text-gray-400 mt-0.5">Kisi bhi member pe click karo, uska detail khata dikhega</p>
          </div>

          <div className="divide-y divide-gray-50">
            {data.customers.map((c) => (
              <button key={c.shareToken} onClick={() => openCustomerDetail(c.shareToken)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/80 transition-all text-left group">
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0 shadow-sm">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 group-hover:text-emerald-700 transition-colors">{c.name}</p>
                    {c.phone && <p className="text-xs text-gray-400 mt-0.5">📱 {c.phone}</p>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-extrabold text-lg ${c.balance > 0 ? 'text-rose-600' : c.balance < 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                    Rs. {Math.abs(c.balance).toLocaleString()}
                  </p>
                  <p className="text-xs font-medium mt-0.5">
                    {c.balance > 0 ? (
                      <span className="text-rose-500">Udhar Baki ↗</span>
                    ) : c.balance < 0 ? (
                      <span className="text-emerald-500">Wapas Milna ↙</span>
                    ) : (
                      <span className="text-gray-400">Barabar ✓</span>
                    )}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mt-8 pb-6">
          <p className="text-xs text-gray-400">📒 Powered by Smart Khata</p>
        </div>
      </div>
    </div>
  );
};

export default PublicAllKhata;
