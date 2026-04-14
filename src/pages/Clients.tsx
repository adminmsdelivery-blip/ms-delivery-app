'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  X,
  Building2,
  Trash2,
  Edit,
  CheckSquare,
  Square,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Clients: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentClient, setCurrentClient] = useState({
    id: '',
    name: '',
    address: '',
    phone: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await supabase.from('clients').select('*').order('name');
    if (data) setClients(data);
    setLoading(false);
  };

  // --- SELECTION LOGIC ---
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredClients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredClients.map(client => client.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // --- DELETE LOGIC (Individual & Bulk) ---
  const handleDelete = async (idsToDelete: string[]) => {
    const confirmMessage = idsToDelete.length > 1 
      ? `Are you sure you want to delete ${idsToDelete.length} clients?` 
      : "Are you sure you want to delete this client?";

    if (window.confirm(confirmMessage)) {
      const { error } = await supabase
        .from('clients')
        .delete()
        .in('id', idsToDelete);

      if (error) {
        alert(error.message);
      } else {
        setClients(prev => prev.filter(client => !idsToDelete.includes(client.id)));
        setSelectedIds([]);
      }
    }
  };

  // --- SUBMIT LOGIC (Create & Update) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        const { error } = await supabase
          .from('clients')
          .update({ name: currentClient.name, address: currentClient.address, phone: currentClient.phone })
          .eq('id', currentClient.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([{ name: currentClient.name, address: currentClient.address, phone: currentClient.phone }]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      resetForm();
      fetchClients();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const openEditModal = (client: any) => {
    setIsEditMode(true);
    setCurrentClient(client);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setIsEditMode(false);
    setCurrentClient({ id: '', name: '', address: '', phone: '' });
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 text-sm">{clients.length} Registered Business Partners</p>
        </div>
        
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={() => handleDelete(selectedIds)}
              className="bg-red-50 text-red-600 px-4 py-3 rounded-xl font-bold hover:bg-red-100 transition-all flex items-center gap-2 border border-red-100"
            >
              <Trash2 className="w-5 h-5" />
              Delete ({selectedIds.length})
            </button>
          )}

          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-[#442DD8] hover:bg-[#3925b8] text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm shadow-indigo-500/30 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Add New Client
          </button>
        </div>
      </div>

      {/* Search & Select All */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search clients by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <button 
          onClick={toggleSelectAll}
          className="whitespace-nowrap px-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
        >
          {selectedIds.length === filteredClients.length && filteredClients.length > 0 ? "Deselect All" : "Select All"}
        </button>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-400">Loading clients...</div>
        ) : filteredClients.map((client, index) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            key={client.id}
            className={`bg-white p-6 rounded-2xl border transition-all relative group ${
              selectedIds.includes(client.id) ? 'border-indigo-500 ring-2 ring-indigo-50 shadow-md' : 'border-gray-100 shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <button 
                  onClick={() => toggleSelectOne(client.id)}
                  className="mt-1 transition-transform active:scale-90"
                >
                  {selectedIds.includes(client.id) ? 
                    <CheckSquare className="w-6 h-6 text-indigo-600" /> : 
                    <Square className="w-6 h-6 text-gray-200" />
                  }
                </button>
                <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>
              
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openEditModal(client)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleDelete([client.id])}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-4">{client.name}</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <span className="line-clamp-2">{client.address || 'No address provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{client.phone || 'No phone provided'}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-50 flex justify-between items-center">
              <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-1 rounded uppercase tracking-widest">Active Partner</span>
              <button className="text-indigo-600 text-sm font-bold hover:underline">View Orders</button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Shared Modal (Add & Edit) */}
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
                  {isEditMode ? 'Edit Client' : 'Add New Client'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Client Name</label>
                  <input
                    type="text"
                    required
                    value={currentClient.name}
                    onChange={(e) => setCurrentClient({ ...currentClient, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Company or Person Name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    value={currentClient.address}
                    onChange={(e) => setCurrentClient({ ...currentClient, address: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Full business address"
                    rows={3}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    value={currentClient.phone}
                    onChange={(e) => setCurrentClient({ ...currentClient, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="+1 234 567 890"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 mt-4"
                >
                  {isEditMode ? 'Update Client' : 'Save Client'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Clients;
