import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { HiOutlineCash, HiOutlineFilter } from 'react-icons/hi';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const PublicKhata = () => {
  const { shareToken } = useParams();
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', type: '' });

  useEffect(() => { fetchData(); }, [shareToken]);

  const fetchData = async (filterParams = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filterParams).toString();
      const url = `${API_URL}/public/khata/${shareToken}${params ? '?' + params : ''}`;
      const { data } = await axios.get(url);
      setCustomer(data.customer);
      setTransactions(data.transactions);
      setSummary(data.summary);
      setError(null);
    } catch (err) {
      setError('Khata not found or link is invalid');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const params = {};
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.type) params.type = filters.type;
    fetchData(params);
  };

  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', type: '' });
    fetchData();
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
        <p className="text-gray-500">This link is invalid or has expired.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center space-x-3">
          <span className="text-2xl">📒</span>
          <h1 className="text-xl font-bold text-white">Smart Khata</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Customer Info Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl shadow-emerald-900/20">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-20 translate-x-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-white font-extrabold text-2xl border border-white/20">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{customer.name}</h1>
                <p className="text-sm text-emerald-100/70 mt-1">📒 Your Khata</p>
              </div>
            </div>

            {/* Balance Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              <div className={`backdrop-blur rounded-2xl p-4 text-center border ${customer.balance < 0 ? 'bg-emerald-500/20 border-emerald-300/30' : 'bg-white/10 border-white/10'}`}>
                <p className="text-xs text-green-200 font-bold uppercase tracking-wider">Maine Lene Hain</p>
                <p className="text-2xl font-extrabold text-white mt-1">Rs. {(customer.balance < 0 ? Math.abs(customer.balance) : 0).toLocaleString()}</p>
              </div>
              <div className={`backdrop-blur rounded-2xl p-4 text-center border ${customer.balance > 0 ? 'bg-rose-500/20 border-rose-300/30' : 'bg-white/10 border-white/10'}`}>
                <p className="text-xs text-red-200 font-bold uppercase tracking-wider">Maine Dene Hain</p>
                <p className="text-2xl font-extrabold text-white mt-1">Rs. {(customer.balance > 0 ? customer.balance : 0).toLocaleString()}</p>
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
                <option value="GIVEN">Given</option>
                <option value="RECEIVED">Received</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={applyFilters} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm">Filter</button>
              <button onClick={clearFilters} className="px-4 py-2.5 bg-gray-100 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-200 transition-all">Clear</button>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">Transaction History</h2>
            <p className="text-xs text-gray-400 mt-0.5">{transactions.length} transactions</p>
          </div>

          {transactions.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiOutlineCash className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No transactions yet</p>
              <p className="text-gray-400 text-sm mt-1">Transactions will appear here once added</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.map((tx) => (
                <div key={tx._id}
                  className={`flex items-center justify-between px-6 py-4 border-l-4 transition-all ${
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
                        {tx.type === 'GIVEN' ? 'Given' : 'Received'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(tx.date), 'dd MMM yyyy')}
                        {tx.description && (' · ' + tx.description)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-extrabold text-lg ${tx.type === 'GIVEN' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {tx.type === 'GIVEN' ? '-' : '+'} Rs. {tx.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 font-medium">Bal: Rs. {tx.balanceAfter.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pb-6">
          <p className="text-xs text-gray-400">📒 Powered By Shafiq Ullah Khan</p>
        </div>
      </div>
    </div>
  );
};

export default PublicKhata;
