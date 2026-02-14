import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { HiOutlineCash, HiOutlineArrowLeft } from 'react-icons/hi';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import translations from '../translations';
import shafiqImg from '../assets/shafiq.jpeg';
import waseemImg from '../assets/waseem.jpeg';
import faizanImg from '../assets/faizan.jpeg';
import KhataChatBot from '../components/KhataChatBot';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const API_URL = import.meta.env.VITE_API_URL || '/api';

const LANG_FLAGS = { en: '🇬🇧', ur: '🇵🇰', ps: '🏔️' };
const LANG_NAMES = { en: 'English', ur: 'اردو', ps: 'پښتو' };

// Map customer names (lowercase) to their profile images
const PROFILE_IMAGES = {
  shafiq: shafiqImg,
  waseem: waseemImg,
  faizan: faizanImg,
};

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

  // Language state
  const [lang, setLang] = useState(() => localStorage.getItem('khata-lang') || 'en');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const t = translations[lang] || translations.en;
  const isRtl = lang === 'ur' || lang === 'ps';

  const changeLang = (l) => {
    setLang(l);
    localStorage.setItem('khata-lang', l);
    setShowLangMenu(false);
  };

  // Viewer Note state
  const [noteModal, setNoteModal] = useState(null);
  const [noteForm, setNoteForm] = useState({ viewerName: localStorage.getItem('khata-viewer-name') || '', note: '' });
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState(false);
  const [noteError, setNoteError] = useState('');
  const [expandedNotes, setExpandedNotes] = useState({});

  const toggleNotes = (txId) => {
    setExpandedNotes(prev => ({ ...prev, [txId]: !prev[txId] }));
  };

  const submitNote = async () => {
    if (!noteForm.viewerName.trim()) {
      setNoteError(t.nameRequired);
      return;
    }
    if (!noteForm.note.trim()) {
      setNoteError(t.noteRequired);
      return;
    }
    if (!customerDetail) return;
    const shareToken = selectedCustomer;
    setNoteSubmitting(true);
    setNoteError('');
    try {
      const { data: noteData } = await axios.post(`${API_URL}/public/note`, {
        transactionId: noteModal,
        shareToken,
        viewerName: noteForm.viewerName.trim(),
        note: noteForm.note.trim()
      });
      localStorage.setItem('khata-viewer-name', noteForm.viewerName.trim());
      setCustomerDetail(prev => ({
        ...prev,
        transactions: prev.transactions.map(tx => {
          if (tx._id === noteModal) {
            return { ...tx, viewerNotes: [noteData, ...(tx.viewerNotes || [])] };
          }
          return tx;
        })
      }));
      setNoteSuccess(true);
      setNoteForm(prev => ({ ...prev, note: '' }));
      setTimeout(() => {
        setNoteSuccess(false);
        setNoteModal(null);
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || t.noteFailed;
      setNoteError(msg);
    } finally {
      setNoteSubmitting(false);
    }
  };

  const LanguageSelector = () => (
    <div className="relative">
      <button
        onClick={() => setShowLangMenu(!showLangMenu)}
        className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 text-sm font-medium"
      >
        <span>{LANG_FLAGS[lang]}</span>
        <span className="hidden sm:inline">{LANG_NAMES[lang]}</span>
        <span className="text-xs">▼</span>
      </button>
      {showLangMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)}></div>
          <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} top-12 z-50 rounded-2xl shadow-2xl border overflow-hidden min-w-[140px] ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            {Object.keys(LANG_NAMES).map(l => (
              <button
                key={l}
                onClick={() => changeLang(l)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-all ${
                  lang === l
                    ? 'bg-emerald-600 text-white'
                    : dark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{LANG_FLAGS[l]}</span>
                <span>{LANG_NAMES[l]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

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
        <p className={`mt-4 font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{t.loadingKhata}</p>
      </div>
    </div>
  );

  if (error) return (
    <div className={`flex items-center justify-center min-h-screen ${dark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="text-center px-6">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${dark ? 'bg-red-900/30' : 'bg-red-50'}`}>
          <span className="text-5xl">❌</span>
        </div>
        <h1 className={`text-2xl font-bold mb-2 ${dark ? 'text-gray-100' : 'text-gray-800'}`}>{t.khataNotFound}</h1>
        <p className={dark ? 'text-gray-400' : 'text-gray-500'}>{t.linkInvalid}</p>
      </div>
    </div>
  );

  // CUSTOMER DETAIL VIEW
  if (selectedCustomer && customerDetail) return (
    <div className={`min-h-screen transition-colors duration-300 ${dark ? 'bg-gray-900' : 'bg-gray-50'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📒</span>
            <h1 className="text-xl font-bold text-white">{t.smartKhata}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <LanguageSelector />
            <button onClick={toggleDark} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 flex items-center justify-center text-lg" title={t.toggleDark}>
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <button onClick={() => { setSelectedCustomer(null); setCustomerDetail(null); setExpandedNotes({}); }}
          className={`flex items-center space-x-2 mb-6 transition-colors font-medium text-sm group ${dark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'}`}>
          <HiOutlineArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          <span>{t.backToAll}</span>
        </button>

        {/* Customer Info */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl shadow-emerald-900/20">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-20 translate-x-20"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-4">
              {PROFILE_IMAGES[customerDetail.customer.name.toLowerCase()] ? (
                <img
                  src={PROFILE_IMAGES[customerDetail.customer.name.toLowerCase()]}
                  alt={customerDetail.customer.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-white font-extrabold text-2xl border border-white/20">
                  {customerDetail.customer.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{customerDetail.customer.name}</h1>
                <p className="text-sm text-emerald-100/70 mt-1">📒 {t.khataDetail}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              <div className={`backdrop-blur rounded-2xl p-4 text-center border ${customerDetail.customer.balance < 0 ? 'bg-emerald-500/20 border-emerald-300/30' : 'bg-white/10 border-white/10'}`}>
                <p className="text-xs text-green-200 font-bold uppercase tracking-wider">{t.iNeedToGet}</p>
                <p className="text-2xl font-extrabold text-white mt-1">Rs. {(customerDetail.customer.balance < 0 ? Math.abs(customerDetail.customer.balance) : 0).toLocaleString()}</p>
              </div>
              <div className={`backdrop-blur rounded-2xl p-4 text-center border ${customerDetail.customer.balance > 0 ? 'bg-rose-500/20 border-rose-300/30' : 'bg-white/10 border-white/10'}`}>
                <p className="text-xs text-red-200 font-bold uppercase tracking-wider">{t.iNeedToPay}</p>
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
                    <p className={`text-xs font-bold uppercase tracking-wider ${dark ? 'text-gray-400' : 'text-gray-400'}`}>{t.totalExpense}</p>
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
              <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${dark ? 'text-gray-400' : 'text-gray-400'}`}>{t.from}</label>
              <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${dark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200'}`} />
            </div>
            <div className="flex-1 w-full">
              <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${dark ? 'text-gray-400' : 'text-gray-400'}`}>{t.to}</label>
              <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${dark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200'}`} />
            </div>
            <div className="flex-1 w-full">
              <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${dark ? 'text-gray-400' : 'text-gray-400'}`}>{t.type}</label>
              <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all cursor-pointer ${dark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200'}`}>
                <option value="">{t.all}</option>
                <option value="GIVEN">{t.iGot}</option>
                <option value="RECEIVED">{t.iGave}</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={applyFilters} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm">{t.filter}</button>
              <button onClick={clearFilters} className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${dark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{t.clear}</button>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className={`rounded-3xl shadow-sm border overflow-hidden transition-colors duration-300 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className={`px-6 py-5 border-b ${dark ? 'border-gray-700' : 'border-gray-100'}`}>
            <h2 className={`text-lg font-bold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>{t.transactionHistory}</h2>
            <p className={`text-xs mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{customerDetail.transactions.length} {t.transactions}</p>
          </div>

          {customerDetail.transactions.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <HiOutlineCash className={`w-10 h-10 ${dark ? 'text-gray-500' : 'text-gray-300'}`} />
              </div>
              <p className={`font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{t.noTransactions}</p>
            </div>
          ) : (
            <div className={`divide-y ${dark ? 'divide-gray-700' : 'divide-gray-50'}`}>
              {customerDetail.transactions.map((tx) => (
                <div key={tx._id}>
                  <div
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
                          {tx.type === 'GIVEN' ? t.iGot : t.iGave}
                        </p>
                        <p className={`text-xs mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {format(new Date(tx.date), 'dd MMM yyyy')}
                          {tx.description && (' · ' + tx.description)}
                        </p>
                        {/* Note buttons */}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <button
                            onClick={() => { setNoteModal(tx._id); setNoteError(''); setNoteSuccess(false); }}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                              dark ? 'bg-amber-900/30 text-amber-400 hover:bg-amber-900/50' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                            }`}
                          >
                            📝 {t.addNote}
                          </button>
                          {tx.viewerNotes && tx.viewerNotes.length > 0 && (
                            <button
                              onClick={() => toggleNotes(tx._id)}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                                dark ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                              }`}
                            >
                              💬 {expandedNotes[tx._id] ? t.hideNotes : t.viewNotes} ({tx.viewerNotes.length})
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-extrabold text-lg ${tx.type === 'GIVEN' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {tx.type === 'GIVEN' ? '-' : '+'} Rs. {tx.amount.toLocaleString()}
                      </p>
                      <p className={`text-xs font-medium ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{t.balance}: Rs. {tx.balanceAfter.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Expanded Notes */}
                  {expandedNotes[tx._id] && tx.viewerNotes && tx.viewerNotes.length > 0 && (
                    <div className="px-6 pb-4">
                      <div className={`rounded-2xl border p-3 space-y-2 ${dark ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        {tx.viewerNotes.map((note, idx) => (
                          <div key={note._id || idx} className={`flex items-start gap-3 p-3 rounded-xl ${dark ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${dark ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                              {note.viewerName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-bold ${dark ? 'text-gray-200' : 'text-gray-800'}`}>{note.viewerName}</span>
                                <span className={`text-xs ${dark ? 'text-gray-600' : 'text-gray-400'}`}>{format(new Date(note.createdAt), 'dd MMM yyyy, hh:mm a')}</span>
                              </div>
                              <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{note.note}</p>
                              {/* Admin Reply */}
                              {note.adminReply && (
                                <div className={`mt-2 ml-2 pl-3 border-l-2 rounded-lg p-2 ${dark ? 'border-emerald-600 bg-emerald-900/30' : 'border-emerald-400 bg-emerald-50'}`}>
                                  <span className={`text-xs font-bold ${dark ? 'text-emerald-400' : 'text-emerald-700'}`}>↩️ Admin Reply</span>
                                  <p className={`text-sm mt-0.5 ${dark ? 'text-emerald-300' : 'text-emerald-800'}`}>{note.adminReply}</p>
                                </div>
                              )}
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

        {/* Monthly Bar Chart */}
        {customerDetail.transactions.length > 0 && (() => {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthlyData = {};
          customerDetail.transactions.forEach(tx => {
            const d = new Date(tx.date);
            const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            if (!monthlyData[key]) monthlyData[key] = { gave: 0, got: 0 };
            if (tx.type === 'RECEIVED') monthlyData[key].gave += tx.amount;
            else monthlyData[key].got += tx.amount;
          });
          const labels = Object.keys(monthlyData);
          const chartData = {
            labels,
            datasets: [
              { label: t.iGave, data: labels.map(l => monthlyData[l].gave), backgroundColor: 'rgba(16, 185, 129, 0.7)', borderRadius: 8 },
              { label: t.iGot, data: labels.map(l => monthlyData[l].got), backgroundColor: 'rgba(244, 63, 94, 0.7)', borderRadius: 8 },
            ],
          };
          const options = {
            responsive: true,
            plugins: {
              legend: { position: 'top', labels: { color: dark ? '#d1d5db' : '#374151', font: { weight: 'bold', size: 12 } } },
              title: { display: true, text: t.monthlyComparison, color: dark ? '#f3f4f6' : '#1f2937', font: { size: 16, weight: 'bold' } },
            },
            scales: {
              x: { ticks: { color: dark ? '#9ca3af' : '#6b7280' }, grid: { color: dark ? '#374151' : '#f3f4f6' } },
              y: { ticks: { color: dark ? '#9ca3af' : '#6b7280' }, grid: { color: dark ? '#374151' : '#f3f4f6' } },
            },
          };
          return (
            <div className={`rounded-3xl shadow-sm border p-5 sm:p-6 mb-6 transition-colors duration-300 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <Bar data={chartData} options={options} />
            </div>
          );
        })()}

        <div className="text-center mt-8 pb-6">
          <p className={`text-xs ${dark ? 'text-gray-600' : 'text-gray-400'}`}>📒 {t.poweredBy}</p>
        </div>
      </div>

      {/* Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setNoteModal(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div
            className={`relative w-full max-w-md rounded-3xl shadow-2xl p-6 transform transition-all ${dark ? 'bg-gray-800' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {noteSuccess ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">✅</span>
                </div>
                <h3 className={`text-lg font-bold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>{t.noteAdded}</h3>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${dark ? 'text-gray-100' : 'text-gray-800'}`}>
                    📝 {t.addNote}
                  </h3>
                  <button onClick={() => setNoteModal(null)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>✕</button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{t.yourName}</label>
                    <input
                      type="text"
                      value={noteForm.viewerName}
                      onChange={(e) => setNoteForm({ ...noteForm, viewerName: e.target.value })}
                      placeholder={t.yourName}
                      maxLength={50}
                      className={`w-full px-4 py-3 border rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${dark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{t.notes}</label>
                    <textarea
                      value={noteForm.note}
                      onChange={(e) => setNoteForm({ ...noteForm, note: e.target.value })}
                      placeholder={t.writeNote}
                      maxLength={300}
                      rows={3}
                      className={`w-full px-4 py-3 border rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none ${dark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`}
                    />
                    <p className={`text-xs mt-1 ${isRtl ? 'text-left' : 'text-right'} ${dark ? 'text-gray-600' : 'text-gray-400'}`}>{noteForm.note.length}/300</p>
                  </div>

                  {noteError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                      {noteError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setNoteModal(null)}
                      className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${dark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {t.cancel}
                    </button>
                    <button
                      onClick={submitNote}
                      disabled={noteSubmitting}
                      className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {noteSubmitting ? '...' : t.submit}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // MAIN GROUP VIEW - ALL CUSTOMERS
  return (
    <div className={`min-h-screen transition-colors duration-300 ${dark ? 'bg-gray-900' : 'bg-gray-50'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📒</span>
            <h1 className="text-xl font-bold text-white">{t.smartKhata}</h1>
            <span className="text-sm text-emerald-100/70 ml-2">- {data.khataName || (data.ownerName + "'s Khata")}</span>
          </div>
          <div className="flex items-center space-x-2">
            <LanguageSelector />
            <button onClick={toggleDark} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 flex items-center justify-center text-lg" title={t.toggleDark}>
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Greeting */}
        {(() => {
          const hour = new Date().getHours();
          let greeting, emoji, gradientClass;
          if (hour >= 5 && hour < 12) { greeting = t.greeting_morning; emoji = '🌅'; gradientClass = 'from-amber-400 via-orange-400 to-yellow-300'; }
          else if (hour >= 12 && hour < 17) { greeting = t.greeting_afternoon; emoji = '☀️'; gradientClass = 'from-sky-400 via-cyan-400 to-blue-400'; }
          else if (hour >= 17 && hour < 21) { greeting = t.greeting_evening; emoji = '🌇'; gradientClass = 'from-orange-500 via-rose-400 to-purple-500'; }
          else { greeting = t.greeting_night; emoji = '🌙'; gradientClass = 'from-indigo-500 via-purple-500 to-blue-600'; }
          return (
            <div className="text-center mb-6">
              <span className="text-4xl">{emoji}</span>
              <h2 className={`text-2xl sm:text-3xl font-extrabold mt-2 bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent`}>
                {greeting}, {t.friends}!
              </h2>
            </div>
          );
        })()}

        {/* Summary Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl shadow-emerald-900/20">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-20 translate-x-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
          <div className="relative z-10 text-center">
            <h2 className="text-xl font-bold text-white mb-1">📊 {t.overallSummary}</h2>
            <p className="text-sm text-emerald-100/70 mb-5">{data.summary.totalCustomers} {t.members}</p>

            <div className="backdrop-blur rounded-2xl p-5 text-center border bg-emerald-500/20 border-emerald-300/30">
              <p className="text-xs text-green-200 font-bold uppercase tracking-wider">{t.totalExpense}</p>
              <p className="text-sm text-emerald-100/60 mt-1">{data.summary.currentMonth}</p>
              <p className="text-3xl font-extrabold text-white mt-2">Rs. {data.summary.monthlyTotalExpense.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Pie Chart - Who Owes Most */}
        {(() => {
          const owingCustomers = data.customers.filter(c => c.balance > 0);
          if (owingCustomers.length === 0) return null;
          const colors = ['#f43f5e', '#fb923c', '#facc15', '#a78bfa', '#38bdf8', '#34d399', '#f472b6', '#818cf8'];
          const pieData = {
            labels: owingCustomers.map(c => c.name),
            datasets: [{
              data: owingCustomers.map(c => c.balance),
              backgroundColor: owingCustomers.map((_, i) => colors[i % colors.length]),
              borderWidth: 2,
              borderColor: dark ? '#1f2937' : '#ffffff',
            }],
          };
          const pieOptions = {
            responsive: true,
            plugins: {
              legend: { position: 'bottom', labels: { color: dark ? '#d1d5db' : '#374151', font: { weight: 'bold', size: 12 }, padding: 16 } },
              title: { display: true, text: t.whoOwes, color: dark ? '#f3f4f6' : '#1f2937', font: { size: 16, weight: 'bold' }, padding: { bottom: 16 } },
            },
          };
          return (
            <div className={`rounded-3xl shadow-sm border p-5 sm:p-6 mb-6 transition-colors duration-300 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="max-w-sm mx-auto">
                <Pie data={pieData} options={pieOptions} />
              </div>
            </div>
          );
        })()}

        {/* Customer List */}
        <div className={`rounded-3xl shadow-sm border overflow-hidden transition-colors duration-300 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className={`px-6 py-5 border-b ${dark ? 'border-gray-700' : 'border-gray-100'}`}>
            <h2 className={`text-lg font-bold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>👥 {t.allMembers}</h2>
            <p className={`text-xs mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{t.clickMember}</p>
          </div>

          <div className={`divide-y ${dark ? 'divide-gray-700' : 'divide-gray-50'}`}>
            {data.customers.map((c) => (
              <button key={c.shareToken} onClick={() => openCustomerDetail(c.shareToken)}
                className={`w-full flex items-center justify-between px-6 py-4 transition-all text-left group ${dark ? 'hover:bg-gray-700/80' : 'hover:bg-gray-50/80'}`}>
                <div className="flex items-center space-x-4 min-w-0">
                  {PROFILE_IMAGES[c.name.toLowerCase()] ? (
                    <img
                      src={PROFILE_IMAGES[c.name.toLowerCase()]}
                      alt={c.name}
                      className="w-12 h-12 rounded-2xl object-cover flex-shrink-0 shadow-sm border-2 border-emerald-500"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0 shadow-sm">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                  )}
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
                      <span className="text-rose-500">{t.iNeedToPay} ↙</span>
                    ) : c.balance < 0 ? (
                      <span className="text-emerald-500">{t.iNeedToGet} ↗</span>
                    ) : (
                      <span className={dark ? 'text-gray-500' : 'text-gray-400'}>{t.settled} ✓</span>
                    )}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mt-8 pb-6">
          <p className={`text-xs ${dark ? 'text-gray-600' : 'text-gray-400'}`}>📒 {t.poweredBy}</p>
        </div>
      </div>

      {/* AI ChatBot */}
      <KhataChatBot data={data} lang={lang} dark={dark} />
    </div>
  );
};

export default PublicAllKhata;
