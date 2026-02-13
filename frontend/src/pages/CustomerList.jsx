import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCustomers, deleteCustomer, getAllCustomersCSV } from '../api';
import toast from 'react-hot-toast';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineDownload,
  HiOutlineUsers,
  HiOutlineArrowRight,
  HiOutlineSortDescending
} from 'react-icons/hi';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('recent');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, [filter, sort]);

  const fetchCustomers = async () => {
    try {
      const params = { sort };
      if (filter) params.filter = filter;
      if (search) params.search = search;
      const { data } = await getCustomers(params);
      setCustomers(data);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" and all their transactions?`)) return;
    try {
      await deleteCustomer(id);
      setCustomers(customers.filter(c => c._id !== id));
      toast.success('Customer deleted');
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };

  const handleExportCSV = async () => {
    try {
      const { data } = await getAllCustomersCSV();
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'all-customers-report.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500 font-medium">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">Customers</h1>
          <p className="text-gray-400 mt-1 font-medium">{customers.length} total customers</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <HiOutlineDownload className="w-4 h-4" />
            <span>Export</span>
          </button>
          <Link
            to="/customers/new"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-600/20 hover:shadow-xl active:scale-[0.98]"
          >
            <HiOutlinePlus className="w-5 h-5" />
            <span>Add Customer</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none transition-all text-sm"
            />
          </form>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none text-sm font-medium text-gray-600 cursor-pointer"
          >
            <option value="">All Balances</option>
            <option value="positive">Maine Lene Hain</option>
            <option value="negative">Maine Dene Hain</option>
            <option value="settled">Settled</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none text-sm font-medium text-gray-600 cursor-pointer"
          >
            <option value="recent">Most Recent</option>
            <option value="name">Name A-Z</option>
            <option value="balance-high">Highest Balance</option>
            <option value="balance-low">Lowest Balance</option>
          </select>
        </div>
      </div>

      {/* Customer List */}
      {customers.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 py-20 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <HiOutlineUsers className="w-12 h-12 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-600 mb-2">No customers found</h3>
          <p className="text-gray-400 mb-8 max-w-sm mx-auto">Add your first customer to start tracking accounts digitally</p>
          <Link
            to="/customers/new"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-7 py-3.5 rounded-2xl font-bold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-600/20"
          >
            <HiOutlinePlus className="w-5 h-5" />
            <span>Add Your First Customer</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50 stagger-children">
            {customers.map((customer) => (
              <div
                key={customer._id}
                className="flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-transparent transition-all duration-200 cursor-pointer group"
                onClick={() => navigate(`/customers/${customer._id}`)}
              >
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-emerald-500/20 group-hover:shadow-md group-hover:shadow-emerald-500/25 transition-all flex-shrink-0">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 truncate group-hover:text-emerald-700 transition-colors">{customer.name}</p>
                    <p className="text-sm text-gray-400">
                      {customer.phone || 'No phone'}
                      {customer.address ? ` · ${customer.address}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 flex-shrink-0">
                  <div className="text-right">
                    <p className={`font-extrabold text-lg ${
                      customer.balance > 0
                        ? 'text-rose-600'
                        : customer.balance < 0
                        ? 'text-emerald-600'
                        : 'text-gray-400'
                    }`}>
                      Rs. {Math.abs(customer.balance).toLocaleString()}
                    </p>
                    <div className="flex items-center justify-end space-x-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        customer.balance > 0
                          ? 'bg-rose-500 animate-pulse-dot'
                          : customer.balance < 0
                          ? 'bg-emerald-500 animate-pulse-dot'
                          : 'bg-gray-300'
                      }`}></span>
                      <p className={`text-xs font-semibold ${
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
                          : 'Settled'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/customers/${customer._id}/edit`)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="Edit"
                    >
                      <HiOutlinePencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(customer._id, customer.name)}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Delete"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>

                  <HiOutlineArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;