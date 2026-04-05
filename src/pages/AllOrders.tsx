import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, Trash2, Edit, CheckSquare, Square, 
  Download, X 
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AllOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`*, clients (name), outsources (name)`)
      .order('created_at', { ascending: false });

    if (!error) setOrders(data || []);
    setLoading(false);
  }

  // --- SELECTION LOGIC ---
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) setSelectedIds([]);
    else setSelectedIds(filteredOrders.map(o => o.id));
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // --- STATUS UPDATE LOGIC ---
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ order_status: newStatus })
      .eq('id', orderId);

    if (error) {
      alert('Failed to update status: ' + error.message);
    } else {
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, order_status: newStatus } : order
      ));
      // Show success notification
      const statusColors = {
        'PENDING': 'bg-yellow-50 text-yellow-600',
        'OUT FOR DELIVERY': 'bg-blue-50 text-blue-600', 
        'COMPLETED': 'bg-green-50 text-green-600',
        'CANCELLED': 'bg-red-50 text-red-600'
      };
      // Simple toast notification
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse';
      toast.textContent = `Status updated to ${newStatus}`;
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 2000);
    }
  };

  // --- DELETE LOGIC ---
  const handleDelete = async (ids: string[]) => {
    if (!window.confirm(`Are you sure you want to delete ${ids.length} order(s)?`)) return;

    const { error } = await supabase.from('orders').delete().in('id', ids);
    if (error) {
      alert(error.message);
    } else {
      setOrders(prev => prev.filter(o => !ids.includes(o.id)));
      setSelectedIds([]);
    }
  };

  // --- EXPORT TO EXCEL ---
  const handleExportExcel = () => {
    const exportData = orders.map(order => ({
      'Order Number': order.order_number,
      'Date': new Date(order.created_at).toLocaleDateString(),
      'Client': order.clients?.name || 'Unknown',
      'Outsource': order.outsources?.name || 'Unassigned',
      'Pickup Location': order.pickup_location,
      'Drop Location': order.drop_location,
      'Delivery Charges': order.delivery_charges,
      'Outsource Charges': order.outsource_charges,
      'Profit': order.estimated_profit,
      'Payment Mode': order.payment_mode,
      'Status': order.payment_status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "All Orders");
    XLSX.writeFile(workbook, "MS_Delivery_Orders.xlsx");
  };

  // --- EDIT LOGIC ---
  const openEditModal = (order: any) => {
    setEditingOrder({ ...order });
    setIsEditModalOpen(true);
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('orders')
      .update({
        customer_name: editingOrder.customer_name,
        customer_contact_number: editingOrder.customer_contact_number,
        pickup_location: editingOrder.pickup_location,
        delivery_location: editingOrder.delivery_location,
        item_charge: editingOrder.item_charge,
        total_amount_received: editingOrder.total_amount_received,
        delivery_charges: editingOrder.delivery_charges,
        outsource_charges: editingOrder.outsource_charges,
        estimated_profit: editingOrder.estimated_profit,
        payment_mode: editingOrder.payment_mode,
        payment_status: editingOrder.payment_status,
        remark: editingOrder.remark
      })
      .eq('id', editingOrder.id);

    if (error) {
      alert("Failed to update: " + error.message);
    } else {
      setIsEditModalOpen(false);
      fetchOrders(); // Refresh the list
    }
  };

  const filteredOrders = orders.filter(o => 
    o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button 
              onClick={() => handleDelete(selectedIds)}
              className="bg-red-50 text-red-600 px-4 py-2 rounded-xl flex items-center gap-2 border border-red-100 hover:bg-red-100 transition-all"
            >
              <Trash2 size={18} /> Delete Selected ({selectedIds.length})
            </button>
          )}
          <button 
            onClick={handleExportExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-green-100 font-bold hover:bg-green-700 transition-all"
          >
            <Download size={18} /> Export Excel
          </button>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search by Order # or Client..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={toggleSelectAll} className="text-sm font-bold text-indigo-600 px-3 py-2 hover:bg-indigo-50 rounded-lg transition-all">
            {selectedIds.length === filteredOrders.length ? "Deselect All" : "Select All"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                <th className="p-4 w-12"></th>
                <th className="p-4">Order Details</th>
                <th className="p-4">Pickup Location</th>
                <th className="p-4">Delivery Location</th>
                <th className="p-4">Client</th>
                <th className="p-4">Outsource Name</th>
                <th className="p-4">Payment Mode</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Financials</th>
                <th className="p-4">Order Status</th>
                <th className="p-4">Payment Status</th>
                <th className="p-4 text-right px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={12} className="text-center p-10 text-gray-400">Loading orders...</td></tr>
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className={`hover:bg-gray-50/50 transition-all ${selectedIds.includes(order.id) ? 'bg-indigo-50/30' : ''}`}>
                  <td className="p-4">
                    <button onClick={() => toggleSelectOne(order.id)} className="transition-transform active:scale-90">
                      {selectedIds.includes(order.id) ? 
                        <CheckSquare className="text-indigo-600 w-5 h-5" /> : 
                        <Square className="text-gray-200 w-5 h-5" />
                      }
                    </button>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-gray-900">{order.order_number}</p>
                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-gray-800">{order.pickup_location || '-'}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-gray-800">{order.drop_location || '-'}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-medium text-gray-800">{order.clients?.name || 'Unknown'}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-indigo-500 font-semibold">{order.outsources?.name || 'Unassigned'}</p>
                  </td>
                  <td className="p-4">
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                      {order.payment_mode || '-'}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-green-600">AED {order.total_amount_received || 0}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-green-600">AED {order.estimated_profit || 0}</p>
                    <p className="text-[10px] text-gray-400 uppercase">Rev: {order.delivery_charges || 0}</p>
                  </td>
                  <td className="p-4">
                    <select
                      value={order.order_status || 'PENDING'}
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                      className="text-xs px-2 py-1 rounded border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold uppercase tracking-tight cursor-pointer"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="OUT FOR DELIVERY">OUT FOR DELIVERY</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </td>
                  <td className="p-4 text-xs font-bold uppercase tracking-tighter">
                    <span className={`px-2 py-1 rounded-md ${order.payment_status === 'Settled' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="p-4 text-right px-6">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(order)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit size={16}/></button>
                      <button onClick={() => handleDelete([order.id])} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- EDIT MODAL --- */}
      {isEditModalOpen && editingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Edit Order {editingOrder.order_number}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleUpdateOrder} className="space-y-4">
              {/* Customer Information */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                    <input
                      type="text"
                      value={editingOrder.customer_name || ''}
                      onChange={(e) => setEditingOrder({...editingOrder, customer_name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input
                      type="tel"
                      value={editingOrder.customer_contact_number || ''}
                      onChange={(e) => setEditingOrder({...editingOrder, customer_contact_number: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Enter contact number"
                    />
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Location Details</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                    <input
                      type="text"
                      value={editingOrder.pickup_location || ''}
                      onChange={(e) => setEditingOrder({...editingOrder, pickup_location: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Enter pickup location"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Drop Location</label>
                    <input
                      type="text"
                      value={editingOrder.drop_location || ''}
                      onChange={(e) => setEditingOrder({...editingOrder, drop_location: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Enter drop location"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Financial Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Charge (AED)</label>
                    <input
                      type="number"
                      value={editingOrder.item_charge || ''}
                      onChange={(e) => setEditingOrder({...editingOrder, item_charge: Number(e.target.value)})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount Received (AED)</label>
                    <input
                      type="number"
                      value={editingOrder.total_amount_received || ''}
                      onChange={(e) => setEditingOrder({...editingOrder, total_amount_received: Number(e.target.value)})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Charges (AED)</label>
                    <input
                      type="number"
                      value={editingOrder.delivery_charges || ''}
                      onChange={(e) => setEditingOrder({...editingOrder, delivery_charges: Number(e.target.value)})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Outsource Charges (AED)</label>
                    <input
                      type="number"
                      value={editingOrder.outsource_charges || ''}
                      onChange={(e) => setEditingOrder({...editingOrder, outsource_charges: Number(e.target.value)})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Profit (AED)</label>
                    <input
                      type="number"
                      value={editingOrder.estimated_profit || ''}
                      onChange={(e) => setEditingOrder({...editingOrder, estimated_profit: Number(e.target.value)})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                    <select 
                      value={editingOrder.payment_mode}
                      onChange={(e) => setEditingOrder({...editingOrder, payment_mode: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                      <option value="Cash on Pickup (COP)">Cash on Pickup (COP)</option>
                      <option value="Online Payment">Online Payment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                    <select 
                      value={editingOrder.payment_status}
                      onChange={(e) => setEditingOrder({...editingOrder, payment_status: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Settled">Settled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3">Additional Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
                    <textarea
                      value={editingOrder.remark || ''}
                      onChange={(e) => setEditingOrder({...editingOrder, remark: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Enter any additional remarks"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
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