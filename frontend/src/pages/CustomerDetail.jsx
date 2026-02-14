import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTransactions, addTransaction, deleteTransaction, editTransaction, deleteCustomer, getCustomerPDF, getCustomerCSV, getShareToken, replyToNote } from '../api';
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
  HiOutlineCash,
  HiOutlineShare,
  HiOutlineClipboardCopy,
  HiOutlineChatAlt2,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineReply
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
  const [shareLink, setShareLink] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [editForm, setEditForm] = useState({ amount: '', description: '', type: '', date: '' });
  const [editLoading, setEditLoading] = useState(false);

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

  const startEditTransaction = (tx) => {
    setEditingTx(tx._id);
    setEditForm({
      amount: tx.amount.toString(),
      description: tx.description || '',
      type: tx.type,
      date: format(new Date(tx.date), 'yyyy-MM-dd')
    });
  };

  const handleEditTransaction = async (e) => {
    e.preventDefault();
    if (!editForm.amount || parseFloat(editForm.amount) <= 0) return toast.error('Enter a valid amount');
    setEditLoading(true);
    try {
      await editTransaction(editingTx, {
        amount: parseFloat(editForm.amount),
        description: editForm.description,
        type: editForm.type,
        date: editForm.date
      });
      toast.success('Transaction updated!');
      setEditingTx(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to update transaction');
    } finally {
      setEditLoading(false);
    }
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

  const handleShare = async () => {
    try {
      const { data } = await getShareToken(id);
      const link = `${window.location.origin}/khata/${data.shareToken}`;
      setShareLink(link);
      setShowShareModal(true);
    } catch (error) {
      toast.error('Failed to get share link');
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success('Link copied! WhatsApp pe bhej do 📱');
  };

  const handleReply = async (noteId) => {
    if (!replyText.trim()) return toast.error('Reply likhein');
    setReplyLoading(true);
    try {
      await replyToNote(noteId, { reply: replyText.trim() });
      toast.success('Reply sent!');
      setReplyingTo(null);
      setReplyText('');
      fetchData();
    } catch (error) {
      toast.error('Reply failed');
    } finally {
      setReplyLoading(false);
    }
  };

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
              <button onClick={handleShare} className="p-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-xl transition-all border border-blue-400/20" title="Share Khata Link"><HiOutlineShare className="w-5 h-5" /></button>
              <button onClick={handleDownloadPDF} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10" title="PDF"><HiOutlineDocumentDownload className="w-5 h-5" /></button>
              <button onClick={handleDownloadCSV} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10" title="CSV"><HiOutlineDownload className="w-5 h-5" /></button>
              <Link to={'/customers/' + id + '/edit'} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10" title="Edit"><HiOutlinePencil className="w-5 h-5" /></Link>
              <button onClick={handleDeleteCustomer} className="p-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-xl transition-all border border-red-400/20" title="Delete"><HiOutlineTrash className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Balance Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            <div className={`backdrop-blur rounded-2xl p-4 text-center border ${customer.balance > 0 ? 'bg-emerald-500/20 border-emerald-300/30' : 'bg-white/10 border-white/10'}`}>
              <p className="text-xs text-green-200 font-bold uppercase tracking-wider">Maine Lene Hain</p>
              <p className="text-2xl font-extrabold text-white mt-1">Rs. {(customer.balance > 0 ? customer.balance : 0).toLocaleString()}</p>
            </div>
            <div className={`backdrop-blur rounded-2xl p-4 text-center border ${customer.balance < 0 ? 'bg-rose-500/20 border-rose-300/30' : 'bg-white/10 border-white/10'}`}>
              <p className="text-xs text-red-200 font-bold uppercase tracking-wider">Maine Dene Hain</p>
              <p className="text-2xl font-extrabold text-white mt-1">Rs. {(customer.balance < 0 ? Math.abs(customer.balance) : 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Transaction Buttons */}
      <div className="flex gap-3 mb-6">

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔗</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Share Khata Link</h3>
              <p className="text-sm text-gray-500 mt-2">Ye link {customer.name} ko bhejo. Wo bina login ke apna khata dekh sakta hai.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <p className="text-xs text-gray-400 font-bold uppercase mb-2">Public Link</p>
              <p className="text-sm text-gray-700 break-all font-mono">{shareLink}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={copyShareLink}
                className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-2xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all">
                <HiOutlineClipboardCopy className="w-5 h-5" />
                <span>Copy Link</span>
              </button>
              <a href={`https://wa.me/?text=${encodeURIComponent(customer.name + ' ka Khata dekho: ' + shareLink)}`} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-2xl font-bold hover:from-green-600 hover:to-green-700 transition-all">
                <span>📱</span>
                <span>WhatsApp</span>
              </a>
            </div>
            <button onClick={() => setShowShareModal(false)} className="w-full mt-3 py-2.5 text-sm text-gray-400 hover:text-gray-600 font-medium transition-all">
              Close
            </button>
          </div>
        </div>
      )}
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
              <div key={tx._id}>
                <div
                  className={`flex items-center justify-between px-6 py-4 border-l-4 transition-all hover:bg-gray-50/50 ${
                    tx.type === 'GIVEN' ? 'border-l-emerald-500' : 'border-l-rose-500'
                  }`}>
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 ${
                      tx.type === 'GIVEN' ? 'bg-emerald-50' : 'bg-rose-50'
                    }`}>
                      {tx.type === 'GIVEN' ? '💸' : '💰'}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-bold text-sm ${tx.type === 'GIVEN' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {tx.type === 'GIVEN' ? 'I Gave' : 'I Got'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(tx.date), 'dd MMM yyyy')}
                        {tx.description && (' · ' + tx.description)}
                      </p>
                      {/* Viewer Notes Toggle */}
                      {tx.viewerNotes && tx.viewerNotes.length > 0 && (
                        <button
                          onClick={() => setExpandedNotes(prev => ({ ...prev, [tx._id]: !prev[tx._id] }))}
                          className="flex items-center space-x-1 mt-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {expandedNotes[tx._id] ? <HiOutlineEyeOff className="w-3.5 h-3.5" /> : <HiOutlineEye className="w-3.5 h-3.5" />}
                          <HiOutlineChatAlt2 className="w-3.5 h-3.5" />
                          <span>{expandedNotes[tx._id] ? 'Hide' : 'Show'} Notes ({tx.viewerNotes.length})</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 flex-shrink-0">
                    <div className="text-right">
                      <p className={`font-extrabold text-lg ${tx.type === 'GIVEN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'GIVEN' ? '-' : '+'} Rs. {tx.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 font-medium">Bal: Rs. {tx.balanceAfter.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button onClick={() => startEditTransaction(tx)}
                        className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Edit">
                        <HiOutlinePencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteTransaction(tx._id)}
                        className="p-2 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Delete">
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline Edit Form */}
                {editingTx === tx._id && (
                  <div className="px-6 pb-4 bg-amber-50/50 border-l-4 border-l-amber-400">
                    <form onSubmit={handleEditTransaction} className="pt-3 space-y-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-bold text-amber-700">✏️ Edit Transaction</span>
                        <button type="button" onClick={() => setEditingTx(null)} className="ml-auto text-gray-400 hover:text-gray-600">
                          <HiOutlineX className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Type</label>
                          <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none">
                            <option value="GIVEN">I Gave</option>
                            <option value="RECEIVED">I Got</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Amount (Rs.)</label>
                          <input type="number" min="0.01" step="0.01" value={editForm.amount}
                            onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Date</label>
                          <input type="date" value={editForm.date}
                            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
                          <input type="text" value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                            placeholder="Optional" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" disabled={editLoading}
                          className="px-5 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-all disabled:opacity-50">
                          {editLoading ? 'Saving...' : '✅ Save Changes'}
                        </button>
                        <button type="button" onClick={() => setEditingTx(null)}
                          className="px-4 py-2 bg-gray-100 text-gray-500 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all">
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                {/* Expanded Viewer Notes */}
                {expandedNotes[tx._id] && tx.viewerNotes && tx.viewerNotes.length > 0 && (
                  <div className="px-6 pb-4 bg-blue-50/30 border-l-4 border-l-blue-400">
                    <div className="space-y-2 pt-2">
                      {tx.viewerNotes.map((note, idx) => (
                        <div key={idx} className="bg-white rounded-xl p-3 border border-blue-100 shadow-sm">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                              {note.viewerName ? note.viewerName.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-sm text-gray-800">{note.viewerName || 'Anonymous'}</span>
                                <span className="text-xs text-gray-400">
                                  {format(new Date(note.createdAt), 'dd MMM yyyy, hh:mm a')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-0.5">{note.note}</p>

                              {/* Admin Reply Display */}
                              {note.adminReply && (
                                <div className="mt-2 ml-2 pl-3 border-l-2 border-emerald-400 bg-emerald-50 rounded-lg p-2">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="text-xs font-bold text-emerald-700">↩️ Admin Reply</span>
                                    {note.adminRepliedAt && (
                                      <span className="text-xs text-emerald-500">
                                        {format(new Date(note.adminRepliedAt), 'dd MMM, hh:mm a')}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-emerald-800 mt-0.5">{note.adminReply}</p>
                                </div>
                              )}

                              {/* Reply Button */}
                              {!note.adminReply && replyingTo !== note._id && (
                                <button
                                  onClick={() => { setReplyingTo(note._id); setReplyText(''); }}
                                  className="flex items-center space-x-1 mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
                                >
                                  <HiOutlineReply className="w-3.5 h-3.5" />
                                  <span>Reply</span>
                                </button>
                              )}

                              {/* Reply Input */}
                              {replyingTo === note._id && (
                                <div className="mt-2 flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Apna reply likhein..."
                                    maxLength={300}
                                    className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleReply(note._id); }}
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleReply(note._id)}
                                    disabled={replyLoading}
                                    className="px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50"
                                  >
                                    {replyLoading ? '...' : 'Send'}
                                  </button>
                                  <button
                                    onClick={() => setReplyingTo(null)}
                                    className="px-2 py-2 text-gray-400 hover:text-gray-600 text-xs rounded-xl transition-all"
                                  >
                                    ✕
                                  </button>
                                </div>
                              )}

                              {/* Edit Reply (if already replied) */}
                              {note.adminReply && replyingTo !== note._id && (
                                <button
                                  onClick={() => { setReplyingTo(note._id); setReplyText(note.adminReply); }}
                                  className="flex items-center space-x-1 mt-1 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <HiOutlinePencil className="w-3 h-3" />
                                  <span>Edit Reply</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetail;