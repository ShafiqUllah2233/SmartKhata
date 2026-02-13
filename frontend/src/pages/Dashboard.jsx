import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard, getCustomers, getMe, addSharedExpense } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineCash,
  HiOutlineUsers,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlinePlus,
  HiOutlineArrowRight,
  HiOutlineChartBar,
  HiOutlineShare
} from 'react-icons/hi';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupToken, setGroupToken] = useState(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashRes, custRes] = await Promise.all([
        getDashboard(),
        getCustomers({ sort: 'recent' })
      ]);
      setStats(dashRes.data);
      setRecentCustomers(custRes.data.slice(0, 5));
      setTotalCustomers(custRes.data.length);
      // Fetch group share token
      try {
        const meRes = await getMe();
        if (meRes.data?.groupShareToken) {
          setGroupToken(meRes.data.groupShareToken);
        }
      } catch (e) { /* ignore */ }
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSharedExpense = async () => {
    const amt = parseFloat(expenseAmount);
    if (!amt || amt <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setExpenseLoading(true);
    try {
      const res = await addSharedExpense({ amount: amt, description: expenseDesc });
      toast.success(res.data.message);
      setShowExpenseModal(false);
      setExpenseAmount('');
      setExpenseDesc('');
      fetchData(); // refresh dashboard
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add shared expense');
    } finally {
      setExpenseLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl shadow-emerald-900/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-emerald-200 text-sm font-medium mb-1">{greeting()} ✨</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">{user?.name || 'User'}</h1>
            <p className="text-emerald-100/80 text-sm sm:text-base">Here is your account overview for today</p>
          </div>
          <div className="mt-5 sm:mt-0 flex flex-wrap gap-3">
            <Link
              to="/customers/new"
              className="inline-flex items-center space-x-2 bg-white text-emerald-700 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-emerald-50 transition-all duration-200 shadow-lg shadow-black/10 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <HiOutlinePlus className="w-5 h-5" />
              <span>Add Customer</span>
            </Link>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="inline-flex items-center space-x-2 bg-amber-400 text-amber-900 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-amber-300 transition-all duration-200 shadow-lg shadow-black/10 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <HiOutlineCash className="w-5 h-5" />
              <span>Shared Expense</span>
            </button>
          </div>
        </div>
        {/* Share Group Khata Link */}
        {groupToken && (
          <div className="relative z-10 mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => {
                const link = `${window.location.origin}/group/${groupToken}`;
                navigator.clipboard.writeText(link);
                toast.success('Group Khata link copied!');
              }}
              className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-2xl font-semibold text-sm hover:bg-white/30 transition-all duration-200 border border-white/20"
            >
              <HiOutlineShare className="w-5 h-5" />
              <span>Copy Group Khata Link</span>
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent('Khata dekho: ' + window.location.origin + '/group/' + groupToken)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-green-500/80 backdrop-blur-sm text-white px-5 py-2.5 rounded-2xl font-semibold text-sm hover:bg-green-500 transition-all duration-200"
            >
              <span>📱</span>
              <span>Share on WhatsApp</span>
            </a>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8 stagger-children">
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          icon={<HiOutlineUsers className="w-6 h-6" />}
          gradient="from-blue-500 to-blue-600"
          bgLight="bg-blue-50"
          textColor="text-blue-600"
        />
        <StatCard
          title="Maine Lene Hain"
          value={`Rs. ${(stats?.totalToReceive || 0).toLocaleString()}`}
          icon={<HiOutlineTrendingUp className="w-6 h-6" />}
          gradient="from-emerald-500 to-emerald-600"
          bgLight="bg-emerald-50"
          textColor="text-emerald-600"
        />
        <StatCard
          title="Maine Dene Hain"
          value={`Rs. ${(stats?.totalToPay || 0).toLocaleString()}`}
          icon={<HiOutlineTrendingDown className="w-6 h-6" />}
          gradient="from-rose-500 to-rose-600"
          bgLight="bg-rose-50"
          textColor="text-rose-600"
        />
        <StatCard
          title="Total Khata"
          value={`Rs. ${(stats?.netBalance || 0).toLocaleString()}`}
          icon={<HiOutlineCash className="w-6 h-6" />}
          gradient="from-violet-500 to-violet-600"
          bgLight="bg-violet-50"
          textColor="text-violet-600"
        />
      </div>

      {/* Recent Customers */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <HiOutlineChartBar className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Recent Customers</h2>
              <p className="text-xs text-gray-400">Latest activity</p>
            </div>
          </div>
          <Link to="/customers" className="flex items-center space-x-1 text-sm text-emerald-600 font-semibold hover:text-emerald-700 transition-colors group">
            <span>View All</span>
            <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {recentCustomers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineUsers className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No customers yet</h3>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">Start by adding your first customer to begin tracking your accounts</p>
            <Link
              to="/customers/new"
              className="inline-flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
            >
              <HiOutlinePlus className="w-5 h-5" />
              <span>Add Your First Customer</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 stagger-children">
            {recentCustomers.map((customer) => (
              <Link
                key={customer._id}
                to={`/customers/${customer._id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-transparent transition-all duration-200 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-shadow">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">{customer.name}</p>
                    {customer.phone && (
                      <p className="text-sm text-gray-400">{customer.phone}</p>
                    )}
                  </div>
                </div>
                <div className="text-right flex items-center space-x-3">
                  <div>
                    <p className={`font-bold text-lg ${
                      customer.balance > 0
                        ? 'text-rose-600'
                        : customer.balance < 0
                        ? 'text-emerald-600'
                        : 'text-gray-400'
                    }`}>
                      Rs. {Math.abs(customer.balance).toLocaleString()}
                    </p>
                    <p className={`text-xs font-medium ${
                      customer.balance > 0
                        ? 'text-rose-400'
                        : customer.balance < 0
                        ? 'text-emerald-400'
                        : 'text-gray-400'
                    }`}>
                      {customer.balance > 0
                        ? 'Maine Lene Hain'
                        : customer.balance < 0
                        ? 'Maine Dene Hain'
                        : 'Settled ✓'}
                    </p>
                  </div>
                  <HiOutlineArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Shared Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowExpenseModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                <HiOutlineCash className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Shared Expense</h3>
                <p className="text-sm text-gray-400">Split equally among all members</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
              <p className="text-sm text-amber-800 font-medium">
                Total members: <span className="font-bold text-amber-900">{totalCustomers + 1}</span> ({totalCustomers} customers + you)
              </p>
              {expenseAmount && parseFloat(expenseAmount) > 0 && (
                <p className="text-sm text-amber-800 mt-1">
                  Per person: <span className="font-bold text-amber-900">Rs. {(Math.round((parseFloat(expenseAmount) / (totalCustomers + 1)) * 100) / 100).toLocaleString()}</span>
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Total Amount (Rs.)</label>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-lg font-bold"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description (optional)</label>
                <input
                  type="text"
                  value={expenseDesc}
                  onChange={e => setExpenseDesc(e.target.value)}
                  placeholder="e.g. Grocery, Dinner, etc."
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowExpenseModal(false)}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-2xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSharedExpense}
                disabled={expenseLoading || !expenseAmount}
                className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {expenseLoading ? 'Splitting...' : 'Split & Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, gradient, bgLight, textColor, subtitle }) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 card-hover group">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg shadow-black/10 group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
      <p className="text-sm text-gray-400 font-semibold uppercase tracking-wide">{title}</p>
      <p className={`text-2xl sm:text-3xl font-extrabold ${textColor} mt-1`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1.5">{subtitle}</p>}
    </div>
  );
};

export default Dashboard;