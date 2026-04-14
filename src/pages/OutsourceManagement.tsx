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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Outsource Management</h1>
          <p className="text-gray-500 text-sm">Manage your outsource delivery partners and vehicles.</p>
        </div>
        <button
          onClick={() => {
            setEditingOutsource(null);
            setFormData({ name: '', phone: '', vehicle_details: '' });
            setIsModalOpen(true);
          }}
          className="bg-[#442DD8] hover:bg-[#3925b8] text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm shadow-indigo-500/30 transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Add New Outsource
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
      </div>

      {/* Outsource Table */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="flex bg-gray-50/80 p-1 rounded-xl border border-gray-100 overflow-x-auto">
            <div className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white text-indigo-600 shadow-sm whitespace-nowrap">
              All Outsources
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-4 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Outsource Name</th>
                <th className="px-6 py-4 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</th>
                <th className="px-6 py-4 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest sticky right-0 bg-white shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.02)]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
                      <span>Loading outsources...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOutsources.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <span className="text-gray-500">No outsource partners found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOutsources.map((outsource, index) => (
                  <tr key={outsource.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900 block">{outsource.name}</span>
                          {outsource.vehicle_details && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <Car className="w-3 h-3" />
                              <span>{outsource.vehicle_details}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{outsource.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(outsource)}
                          className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(outsource.id)}
                          className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                  className="w-full bg-[#442DD8] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#3925b8] transition-all shadow-lg shadow-indigo-200 mt-4 flex items-center justify-center gap-2"
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
