import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTransactions, addTransaction, deleteTransaction, deleteCustomer, getCustomerPDF, getCustomerCSV } from '../api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  HiOutlineArrowLeft,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineDocumentDownload,
  HiOutlineDownload,
  HiOutlineX,
  HiOutlineFilter,
  HiOutlineCash
} from 'react-icons/hi';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [txType, setTxType] = useState('GIVEN');
  const [txForm, setTxForm] = useState({ amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
  const [txLoading, setTxLoading] = useState(false);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', type: '' });

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async (filterParams = {}) => {
    try {
      const { data } = await getTransactions(id, filterParams);
      setCustomer(data.customer);
      setTransactions(data.transactions);
      setSummary(data.summary);
    } catch (error) {
      toast.error('Customer not found');
      navigate('/customers');
    } finally { setLoading(false); }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!txForm.amount || parseFloat(txForm.amount) <= 0) return toast.error('Enter a valid amount');
    setTxLoading(true);
    try {
      await addTransaction(id, { type: txType, amount: parseFloat(txForm.amount), description: txForm.description, date: txForm.date });
      toast.success(txType === 'GIVEN' ? 'Money Given recorded' : 'Money Received recorded');
      setShowAddForm(false);
      setTxForm({ amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
      fetchData();
    } catch (error) { toast.error('Failed to add transaction'); }
    finally { setTxLoading(false); }
  };

  const handleDeleteTransaction = async (txId) => {
    if (!window.confirm('Delete this transaction?')) return;
    try { await deleteTransaction(txId); toast.success('Transaction deleted'); fetchData(); }
    catch (error) { toast.error('Failed to delete transaction'); }
  };

  const handleDeleteCustomer = async () => {
    if (!window.confirm('Delete this customer and all transactions? This cannot be undone.')) return;
    try { await deleteCustomer(id); toast.success('Customer deleted'); navigate('/customers'); }
    catch (error) { toast.error('Failed to delete customer'); }
  };

  const handleDownloadPDF = async () => {
    try {
      const { data } = await getCustomerPDF(id);
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = customer.name + '-report.pdf'; a.click();
      window.URL.revokeObjectURL(url); toast.success('PDF downloaded');
    } catch (error) { toast.error('Failed to download PDF'); }
  };

  const handleDownloadCSV = async () => {
    try {
      const { data } = await getCustomerCSV(id);
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = customer.name + '-transactions.csv'; a.click();
      window.URL.revokeObjectURL(url); toast.success('CSV downloaded');
    } catch (error) { toast.error('Failed to download CSV'); }
  };

  const applyFilters = () => {
    const params = {};
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.type) params.type = filters.type;
    fetchData(params);
  };

  const clearFilters = () => { setFilters({ startDate: '', endDate: '', type: '' }); fetchData(); };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-500 font-medium">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Back */}
      <button onClick={() => navigate('/customers')} className="flex items-center space-x-2 text-gray-400 hover:text-gray-700 mb-6 transition-colors font-medium text-sm group">
        <HiOutlineArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Customers</span>
      </button>

      {/* Customer Info Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl shadow-emerald-900/20">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-20 translate-x-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-white font-extrabold text-2xl border border-white/20">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{customer.name}</h1>
                <div className="text-sm text-emerald-100/80 space-x-3 mt-1">
                  {customer.phone && <span>📱 {customer.phone}</span>}
                  {customer.address && <span>📍 {customer.address}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <button onClick={handleDownloadPDF} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10" title="PDF"><HiOutlineDocumentDownload className="w-5 h-5" /></button>
              <button onClick={handleDownloadCSV} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10" title="CSV"><HiOutlineDownload className="w-5 h-5" /></button>
              <Link to={'/customers/' + id + '/edit'} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10" title="Edit"><HiOutlinePencil className="w-5 h-5" /></Link>
              <button onClick={handleDeleteCustomer} className="p-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-xl transition-all border border-red-400/20" title="Delete"><HiOutlineTrash className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Balance Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
              <p className="text-xs text-red-200 font-bold uppercase tracking-wider">Money Given</p>
              <p className="text-2xl font-extrabold text-white mt-1">Rs. {(summary?.totalGiven || 0).toLocaleString()}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
              <p className="text-xs text-green-200 font-bold uppercase tracking-wider">Money Received</p>
              <p className="text-2xl font-extrabold text-white mt-1">Rs. {(summary?.totalReceived || 0).toLocaleString()}</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-2xl p-4 text-center border border-white/20">
              <p className="text-xs text-yellow-200 font-bold uppercase tracking-wider">
                {customer.balance > 0 ? 'Customer Owes You' : customer.balance < 0 ? 'You Owe Customer' : 'Balance'}
              </p>
              <p className="text-2xl font-extrabold text-white mt-1">Rs. {Math.abs(customer.balance).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Transaction Buttons */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => { setTxType('GIVEN'); setShowAddForm(true); }}
          className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white py-3.5 rounded-2xl font-bold hover:from-rose-600 hover:to-rose-700 transition-all shadow-lg shadow-rose-500/20 active:scale-[0.98]">
          <span className="text-lg">💸</span>
          <span>Money Given</span>
        </button>
        <button onClick={() => { setTxType('RECEIVED'); setShowAddForm(true); }}
          className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3.5 rounded-2xl font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]">
          <span className="text-lg">💰</span>
          <span>Money Received</span>
        </button>
      </div>

      {/* Add Transaction Form */}
      {showAddForm && (
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${txType === 'GIVEN' ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                {txType === 'GIVEN' ? '💸' : '💰'}
              </div>
              <h3 className={`text-lg font-bold ${txType === 'GIVEN' ? 'text-rose-700' : 'text-emerald-700'}`}>
                {txType === 'GIVEN' ? 'Record Money Given' : 'Record Money Received'}
              </h3>
            </div>
            <button onClick={() => setShowAddForm(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Amount (Rs.) *</label>
                <input type="number" required min="1" step="0.01" value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none transition-all text-lg font-bold"
                  placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Date</label>
                <input type="date" value={txForm.date}
                  onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Description (Optional)</label>
              <input type="text" value={txForm.description}
                onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                placeholder="e.g., Monthly payment, Grocery bill" />
            </div>
            <button type="submit" disabled={txLoading}
              className={`w-full py-3.5 rounded-2xl font-bold text-white transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 ${
                txType === 'GIVEN'
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-rose-500/20'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/20'
              }`}>
              {txLoading ? 'Saving...' : txType === 'GIVEN' ? 'Record Money Given' : 'Record Money Received'}
            </button>
          </form>
        </div>
      )}

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
              <option value="GIVEN">Money Given</option>
              <option value="RECEIVED">Money Received</option>
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
            <p className="text-gray-400 text-sm mt-1">Use the buttons above to record transactions</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 stagger-children">
            {transactions.map((tx) => (
              <div key={tx._id}
                className={`flex items-center justify-between px-6 py-4 border-l-4 transition-all hover:bg-gray-50/50 ${
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
                      {tx.type === 'GIVEN' ? 'Money Given' : 'Money Received'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(tx.date), 'dd MMM yyyy')}
                      {tx.description && (' · ' + tx.description)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 flex-shrink-0">
                  <div className="text-right">
                    <p className={`font-extrabold text-lg ${tx.type === 'GIVEN' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {tx.type === 'GIVEN' ? '+' : '-'} Rs. {tx.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 font-medium">Bal: Rs. {tx.balanceAfter.toLocaleString()}</p>
                  </div>
                  <button onClick={() => handleDeleteTransaction(tx._id)}
                    className="p-2 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetail;