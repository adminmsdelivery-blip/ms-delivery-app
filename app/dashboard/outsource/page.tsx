'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../src/lib/supabase';
import { Truck, Plus, Trash2, Edit, X, CheckSquare, Square } from 'lucide-react';

export default function OutsourcePage() {
  const [outsources, setOutsources] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selection States
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Fetch Outsource Partners
  async function fetchOutsources() {
    setLoading(true);
    const { data, error } = await supabase.from('outsources').select('*').order('name');
    if (!error) setOutsources(data);
    setLoading(false);
  }

  useEffect(() => { fetchOutsources(); }, []);

  // --- CHECKBOX LOGIC ---
  const toggleSelectAll = () => {
    if (selectedIds.length === outsources.length) {
      setSelectedIds([]); // Deselect all
    } else {
      setSelectedIds(outsources.map(item => item.id)); // Select all
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // --- DELETE LOGIC (Individual & Bulk) ---
  const handleDelete = async (idsToDelete) => {
    const confirmMessage = idsToDelete.length > 1 
      ? `Are you sure you want to delete ${idsToDelete.length} partners?` 
      : "Are you sure you want to delete this partner?";

    if (window.confirm(confirmMessage)) {
      const { error } = await supabase
        .from('outsources')
        .delete()
        .in('id', idsToDelete);

      if (error) {
        alert("Error: " + error.message);
      } else {
        setOutsources(prev => prev.filter(item => !idsToDelete.includes(item.id)));
        setSelectedIds([]); // Clear selection after delete
      }
    }
  };

  // --- EDIT LOGIC ---
  const openEditModal = (item) => {
    setEditingItem({ ...item });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('outsources')
      .update({
        name: editingItem.name,
        phone: editingItem.phone,
        vehicle_details: editingItem.vehicle_details
      })
      .eq('id', editingItem.id);

    if (error) {
      alert(error.message);
    } else {
      setIsEditModalOpen(false);
      fetchOutsources(); // Refresh list
    }
  };

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Outsource Management</h1>
          <p className="text-sm text-gray-500">{outsources.length} Partners Registered</p>
        </div>
        
        <div className="flex gap-3">
          {/* Bulk Delete Button - Only shows if 2 or more items selected */}
          {selectedIds.length > 0 && (
            <button 
              onClick={() => handleDelete(selectedIds)}
              className="bg-red-50 text-red-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-100 border border-red-200 transition"
            >
              <Trash2 size={18} /> Delete Selected ({selectedIds.length})
            </button>
          )}

          <button onClick={toggleSelectAll} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 border">
            {selectedIds.length === outsources.length ? "Deselect All" : "Select All"}
          </button>

          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm">
            <Plus size={20} /> Add New
          </button>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {outsources.map((item) => (
          <div 
            key={item.id} 
            className={`bg-white p-5 rounded-xl border transition-all ${
              selectedIds.includes(item.id) ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md' : 'border-gray-200 shadow-sm'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                {/* Individual Checkbox */}
                <button 
                  onClick={() => toggleSelectOne(item.id)} 
                  className="mt-1 text-indigo-600 hover:scale-110 transition"
                >
                  {selectedIds.includes(item.id) ? <CheckSquare size={22} /> : <Square size={22} className="text-gray-300" />}
                </button>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Truck size={24} />
                </div>
              </div>

              <div className="flex gap-1">
                <button 
                  onClick={() => openEditModal(item)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                >
                  <Edit size={18}/>
                </button>
                <button 
                  onClick={() => handleDelete([item.id])}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 size={18}/>
                </button>
              </div>
            </div>

            <div className="mt-4 ml-8">
              <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
              <p className="text-gray-500 text-sm">{item.phone}</p>
              <div className="mt-2 text-xs font-semibold text-indigo-500 bg-indigo-50 inline-block px-2 py-1 rounded">
                Vehicle: {item.vehicle_details || 'Not Specified'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- EDIT MODAL --- */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Edit Outsource Partner</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24}/>
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  value={editingItem.phone}
                  onChange={(e) => setEditingItem({...editingItem, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Details</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  value={editingItem.vehicle_details || ''}
                  onChange={(e) => setEditingItem({...editingItem, vehicle_details: e.target.value})}
                  placeholder="e.g. Chiller Van - DXB 12345"
                />
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
