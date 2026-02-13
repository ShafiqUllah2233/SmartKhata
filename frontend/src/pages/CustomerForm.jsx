import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCustomer, getCustomer, updateCustomer } from '../api';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineUser, HiOutlinePhone, HiOutlineLocationMarker } from 'react-icons/hi';

const CustomerForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });

  useEffect(() => {
    if (isEdit) fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const { data } = await getCustomer(id);
      setFormData({ name: data.name, phone: data.phone || '', address: data.address || '' });
    } catch (error) {
      toast.error('Customer not found');
      navigate('/customers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await updateCustomer(id, formData);
        toast.success('Customer updated');
        navigate('/customers/' + id);
      } else {
        const { data } = await createCustomer(formData);
        toast.success('Customer added');
        navigate('/customers/' + data._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save customer');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <button onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-400 hover:text-gray-700 mb-6 transition-colors font-medium text-sm group">
        <HiOutlineArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back</span>
      </button>

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6">
          <h1 className="text-2xl font-extrabold text-white">
            {isEdit ? 'Edit Customer' : 'Add New Customer'}
          </h1>
          <p className="text-emerald-100/80 text-sm mt-1">
            {isEdit ? 'Update customer information' : 'Fill in the details to add a new customer'}
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input type="text" required value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none transition-all text-gray-800"
                  placeholder="Enter customer name" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">
                Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input type="tel" value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none transition-all text-gray-800"
                  placeholder="03XX-XXXXXXX" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">
                Address <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <HiOutlineLocationMarker className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                <textarea value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none transition-all resize-none text-gray-800"
                  placeholder="Enter address" />
              </div>
            </div>

            <div className="flex space-x-3 pt-3">
              <button type="submit" disabled={loading}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 rounded-2xl font-bold hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20 active:scale-[0.98]">
                {loading ? 'Saving...' : isEdit ? 'Update Customer' : 'Add Customer'}
              </button>
              <button type="button" onClick={() => navigate(-1)}
                className="px-6 py-3.5 bg-gray-100 rounded-2xl font-bold text-gray-500 hover:bg-gray-200 transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;