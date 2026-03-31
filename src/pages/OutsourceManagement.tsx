import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  Car, 
  Edit2, 
  Trash2, 
  X, 
  Save,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Outsource {
  id: string;
  name: string;
  phone: string;
  vehicle_details: string;
  created_at: string;
}

const OutsourceManagement: React.FC = () => {
  const [outsources, setOutsources] = useState<Outsource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutsource, setEditingOutsource] = useState<Outsource | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicle_details: ''
  });

  useEffect(() => {
    fetchOutsources();
  }, []);

  const fetchOutsources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('outsources')
        .select('*')
        .order('name');
      
      if (error) throw error;
      if (data) setOutsources(data);
    } catch (error: any) {
      console.error('Error fetching outsources:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingOutsource) {
        const { error } = await supabase
          .from('outsources')
          .update(formData)
          .eq('id', editingOutsource.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('outsources')
          .insert([formData]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingOutsource(null);
      setFormData({ name: '', phone: '', vehicle_details: '' });
      fetchOutsources();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (outsource: Outsource) => {
    setEditingOutsource(outsource);
    setFormData({
      name: outsource.name,
      phone: outsource.phone,
      vehicle_details: outsource.vehicle_details || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this outsource partner? This may affect existing orders.')) return;
    
    try {
      const { error } = await supabase
        .from('outsources')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchOutsources();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const filteredOutsources = outsources.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outsource Management</h1>
          <p className="text-gray-500 text-sm">Manage your outsource delivery partners and vehicles.</p>
        </div>
        <button
          onClick={() => {
            setEditingOutsource(null);
            setFormData({ name: '', phone: '', vehicle_details: '' });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5" />
          Add New Outsource
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
      </div>

      {/* Outsource Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOutsources.map((outsource) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={outsource.id}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                  <Truck className="w-6 h-6" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(outsource)}
                    className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(outsource.id)}
                    className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-4">{outsource.name}</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-500">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium">{outsource.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                  <Car className="w-4 h-4" />
                  <span className="text-sm font-medium">{outsource.vehicle_details || 'No vehicle details'}</span>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredOutsources.length === 0 && (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No outsource partners found.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingOutsource ? 'Edit Outsource' : 'Add New Outsource'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl text-gray-400">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Ahmed Khan"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="+971 50 123 4567"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Vehicle Details</label>
                  <input
                    type="text"
                    value={formData.vehicle_details}
                    onChange={(e) => setFormData({ ...formData, vehicle_details: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. White Chiller Van (DXB 12345)"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 mt-4 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editingOutsource ? 'Update Partner' : 'Save Partner'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OutsourceManagement;
