import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Download, Edit, Trash2, User, MapPin, CreditCard, DollarSign } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_contact_number?: string;
  pickup_location?: string;
  delivery_location?: string;
  payment_mode: string;
  payment_status: string;
  total_amount_received: number;
  item_charge: number;
  outsource_charges: number;
  clients?: { name: string };
  outsources?: { name: string };
  remark?: string;
}

interface MathCalculations {
  calculatedDeliveryCharge: number;
  calculatedProfit: number;
  payCollectAction: string;
  settlementAmount: number;
}

export default function AllOrders() {
  // State & Filtering Architecture
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [timeframe, setTimeframe] = useState('All-Time');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // The Core Math Engine (Strictly Enforced)
  const calculateOrderMath = (order: Order): MathCalculations => {
    const calculatedDeliveryCharge = Number(order.total_amount_received || 0) - Number(order.item_charge || 0);
    const calculatedProfit = calculatedDeliveryCharge - Number(order.outsource_charges || 0);
    
    // Pay/Collect Action Logic
    let payCollectAction = 'PAY';
    let settlementAmount = 0;
    
    if (order.payment_mode?.toLowerCase().includes('cash') || order.payment_mode?.toLowerCase().includes('cod')) {
      payCollectAction = 'COLLECT';
      settlementAmount = calculatedProfit; // Debt = MS Profit
    } else if (order.payment_mode?.toLowerCase().includes('online')) {
      payCollectAction = 'PAY';
      settlementAmount = Number(order.outsource_charges || 0); // Debt = Outsource Charge
    }
    
    return {
      calculatedDeliveryCharge,
      calculatedProfit,
      payCollectAction,
      settlementAmount
    };
  };

  // Timeframe Filtering Logic
  const getTimeframeFilter = () => {
    const now = new Date();
    switch (timeframe) {
      case 'Weekly':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return weekAgo.toISOString();
      case 'Monthly':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return monthAgo.toISOString();
      case 'Yearly':
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return yearAgo.toISOString();
      default:
        return null;
    }
  };

  // Fetch orders with timeframe filtering
  useEffect(() => {
    fetchOrders();
  }, [timeframe]);

  async function fetchOrders() {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select(`*, clients (name), outsources (name)`)
      .order('created_at', { ascending: false });

    const timeframeFilter = getTimeframeFilter();
    if (timeframeFilter) {
      query = query.gte('created_at', timeframeFilter);
    }

    const { data, error } = await query;
    if (!error) setOrders(data || []);
    setLoading(false);
  }

  // Filter orders based on search term
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.outsources?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Bulk selection logic
  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Bulk delete logic
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedOrders.length} order(s)?`)) return;
    
    const { error } = await supabase.from('orders').delete().in('id', selectedOrders);
    if (error) {
      alert(error.message);
    } else {
      setOrders(prev => prev.filter(o => !selectedOrders.includes(o.id)));
      setSelectedOrders([]);
    }
  };

  // Single delete logic
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      alert(error.message);
    } else {
      setOrders(prev => prev.filter(o => o.id !== id));
    }
  };

  // Edit modal functions
  const openEditModal = (order: Order) => {
    setEditingOrder(order);
    setIsEditModalOpen(true);
  };

  // Database Safety (Edit Modal fixes)
  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingOrder) return;
    
    // Database Update Safety - Remove generated columns
    const updatePayload = {
      customer_name: editingOrder.customer_name,
      customer_contact_number: editingOrder.customer_contact_number,
      pickup_location: editingOrder.pickup_location,
      delivery_location: editingOrder.delivery_location,
      total_amount_received: editingOrder.total_amount_received,
      item_charge: editingOrder.item_charge,
      outsource_charges: editingOrder.outsource_charges,
      payment_mode: editingOrder.payment_mode,
      payment_status: editingOrder.payment_status,
      remark: editingOrder.remark
    };
    
    const { error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', editingOrder.id);

    if (error) {
      alert("Failed to update: " + error.message);
    } else {
      setIsEditModalOpen(false);
      fetchOrders();
    }
  };

  // Flawless CSV Export
  const handleExportCSV = () => {
    const csvData = filteredOrders.map(order => {
      const math = calculateOrderMath(order);
      
      return {
        "Order Date": order.created_at ? new Date(order.created_at).toLocaleDateString() : "N/A",
        "Order ID": order.order_number || "N/A",
        "Outsource Name": order.outsources?.name || "N/A",
        "Client Name": order.clients?.name || "N/A",
        "Customer Name": order.customer_name || "N/A",
        "Delivery Location": order.delivery_location || "N/A",
        "Payment Method": order.payment_mode || "N/A",
        "Total Amount Received": Number(order.total_amount_received || 0).toFixed(2),
        "Item Charge": Number(order.item_charge || 0).toFixed(2),
        "Delivery Charges (Calculated)": math.calculatedDeliveryCharge.toFixed(2),
        "Outsource Charges": Number(order.outsource_charges || 0).toFixed(2),
        "MS Profit (Calculated)": math.calculatedProfit.toFixed(2),
        "Settlement Amount": math.settlementAmount.toFixed(2),
        "Pay/Collect": math.payCollectAction,
        "Settlement Status": order.payment_status || "Pending"
      };
    });

    // Convert to CSV without duplicate headers
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header] || 'N/A'}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MS_Delivery_Orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Pay/Collect badge component
  const PayCollectBadge = ({ action }: { action: string }) => {
    const isCollect = action === 'COLLECT';
    return (
      <span className={`text-xs font-medium px-2 py-1 rounded ${
        isCollect 
          ? 'text-orange-600 bg-orange-50' 
          : 'text-blue-600 bg-blue-50'
      }`}>
        {action}
      </span>
    );
  };

  // Settlement status badge
  const StatusBadge = ({ status }: { status: string }) => {
    const isSettled = status === 'Settled';
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
        isSettled 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-orange-100 text-orange-800 border border-orange-200'
      }`}>
        {status || 'Pending'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation & Bulk Actions */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Search Input */}
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by ID, Driver, Client..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Segmented Control for Timeframes */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {['Weekly', 'Monthly', 'Yearly', 'All-Time'].map((option) => (
                  <button
                    key={option}
                    onClick={() => setTimeframe(option)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      timeframe === option 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              
              {/* Export CSV */}
              <button
                onClick={handleExportCSV}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedOrders.length > 0 && (
          <div className="bg-red-50 border-b border-red-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-red-900">
                    {selectedOrders.length} Items Selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkDelete}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete Selected
                  </button>
                  <button
                    onClick={() => setSelectedOrders([])}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading orders...</div>
          </div>
        ) : (
          <>
            {/* Mobile UI (Card View) */}
            <div className="block md:hidden space-y-4">
              {filteredOrders.map((order) => {
                const math = calculateOrderMath(order);
                const isSelected = selectedOrders.includes(order.id);
                return (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(order.id)}
                          className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">{order.order_number}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={order.payment_status || 'Pending'} />
                    </div>
                    
                    {/* Card Body - Grid Layout */}
                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="text-gray-700">{order.outsources?.name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign size={14} className="text-gray-400" />
                        <span className="text-gray-700">{order.clients?.name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="text-gray-700">{order.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} className="text-gray-400" />
                        <span className="text-gray-700">{order.payment_mode}</span>
                      </div>
                    </div>
                    
                    {/* Card Footer - Financial Summary */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Received</span>
                          <span className="font-medium text-gray-900">
                            AED {Number(order.total_amount_received || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Outsource Charge</span>
                          <span className="font-medium text-gray-900">
                            AED {Number(order.outsource_charges || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="text-gray-700">MS Profit</span>
                          <span className={`font-semibold ${math.calculatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            AED {math.calculatedProfit.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Pay/Collect</span>
                          <PayCollectBadge action={math.payCollectAction} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => openEditModal(order)}
                        className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop UI (Table View) */}
            <div className="hidden md:block">
              <div className="w-full overflow-x-auto bg-white shadow-sm rounded-xl border border-gray-200 mt-6">
                <table className="w-full min-w-max text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        <input
                          type="checkbox"
                          checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        Date
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        Order ID
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        Driver
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        Client
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        Customer
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        Location
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        Pay Method
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        Total Received
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        Outsource Charge
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        MS Profit
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        Pay/Collect
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider sticky right-0 bg-gray-50">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.map((order) => {
                      const math = calculateOrderMath(order);
                      const isSelected = selectedOrders.includes(order.id);
                      return (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(order.id)}
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-100">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-100">
                            {order.order_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-100">
                            {order.outsources?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-100">
                            {order.clients?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-100">
                            {order.customer_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-100">
                            {order.delivery_location || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-100">
                            <div className="flex items-center gap-1">
                              <CreditCard size={14} />
                              {order.payment_mode || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-100">
                            AED {Number(order.total_amount_received || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-100">
                            AED {Number(order.outsource_charges || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 border-r border-gray-100">
                            AED {math.calculatedProfit.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
                            <PayCollectBadge action={math.payCollectAction} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white border-l border-gray-100">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEditModal(order)}
                                className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(order.id)}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleUpdateOrder}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Edit Order {editingOrder.order_number}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Customer Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Customer Name
                        </label>
                        <input
                          type="text"
                          value={editingOrder.customer_name || ''}
                          onChange={(e) => setEditingOrder({...editingOrder, customer_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Number
                        </label>
                        <input
                          type="tel"
                          value={editingOrder.customer_contact_number || ''}
                          onChange={(e) => setEditingOrder({...editingOrder, customer_contact_number: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    
                    {/* Locations */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pickup Location
                        </label>
                        <input
                          type="text"
                          value={editingOrder.pickup_location || ''}
                          onChange={(e) => setEditingOrder({...editingOrder, pickup_location: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Delivery Location
                        </label>
                        <input
                          type="text"
                          value={editingOrder.delivery_location || ''}
                          onChange={(e) => setEditingOrder({...editingOrder, delivery_location: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    
                    {/* Financial Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total Amount Received
                        </label>
                        <input
                          type="number"
                          value={editingOrder.total_amount_received || ''}
                          onChange={(e) => setEditingOrder({...editingOrder, total_amount_received: Number(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          min="0"
                          step="0.01"
                          onWheel={(e) => e.target.blur()}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Item Charge
                        </label>
                        <input
                          type="number"
                          value={editingOrder.item_charge || ''}
                          onChange={(e) => setEditingOrder({...editingOrder, item_charge: Number(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          min="0"
                          step="0.01"
                          onWheel={(e) => e.target.blur()}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Outsource Charges
                        </label>
                        <input
                          type="number"
                          value={editingOrder.outsource_charges || ''}
                          onChange={(e) => setEditingOrder({...editingOrder, outsource_charges: Number(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          min="0"
                          step="0.01"
                          onWheel={(e) => e.target.blur()}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Delivery Charges (Calculated)
                        </label>
                        <input
                          type="number"
                          value={editingOrder.total_amount_received && editingOrder.item_charge ? 
                            Number(editingOrder.total_amount_received) - Number(editingOrder.item_charge) : 0}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 font-semibold"
                        />
                      </div>
                    </div>
                    
                    {/* Payment Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Mode
                        </label>
                        <select
                          value={editingOrder.payment_mode}
                          onChange={(e) => setEditingOrder({...editingOrder, payment_mode: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                          <option value="Cash on Pickup (COP)">Cash on Pickup (COP)</option>
                          <option value="Online Payment">Online Payment</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Status
                        </label>
                        <select
                          value={editingOrder.payment_status}
                          onChange={(e) => setEditingOrder({...editingOrder, payment_status: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Settled">Settled</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Remarks */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Remarks
                      </label>
                      <textarea
                        value={editingOrder.remark || ''}
                        onChange={(e) => setEditingOrder({...editingOrder, remark: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
