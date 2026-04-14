import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, Trash2, Edit, Download, X, Filter,
  Calendar, User, MapPin, DollarSign, CreditCard
} from 'lucide-react';

export default function AllOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);

  // Core Math Engine - Strictly enforced calculations
  const calculateOrderMath = (order: any) => {
    const totalReceived = Number(order.total_amount_received || 0);
    const itemCharge = Number(order.item_charge || 0);
    const outsourceCharge = Number(order.outsource_charges || 0);
    
    const calculatedDeliveryCharge = totalReceived - itemCharge;
    const calculatedProfit = calculatedDeliveryCharge - outsourceCharge;
    
    const pMethod = String(order.payment_mode || '').toUpperCase();
    const isDriverCash = pMethod.includes('CASH') || pMethod.includes('COD') || pMethod.includes('COP');
    
    let payCollectAction = "-";
    let settlementAmount = 0;
    
    if (isDriverCash) {
      payCollectAction = "COLLECT";
      settlementAmount = calculatedProfit;
    } else {
      payCollectAction = "PAY";
      settlementAmount = outsourceCharge;
    }
    
    return {
      calculatedDeliveryCharge,
      calculatedProfit,
      payCollectAction,
      settlementAmount,
      isDriverCash
    };
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`*, clients (name), outsources (name)`)
      .order('created_at', { ascending: false });

    if (!error) setOrders(data || []);
    setLoading(false);
  }

  // Auto-calculate when editing order fields change
  useEffect(() => {
    if (editingOrder && (editingOrder.total_amount_received !== undefined || 
        editingOrder.item_charge !== undefined || 
        editingOrder.outsource_charges !== undefined)) {
      const math = calculateOrderMath(editingOrder);
      setEditingOrder(prev => ({
        ...prev,
        delivery_charges: math.calculatedDeliveryCharge,
        estimated_profit: math.calculatedProfit
      }));
    }
  }, [editingOrder?.total_amount_received, editingOrder?.item_charge, editingOrder?.outsource_charges]);

  // Filter logic
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'Pending' && order.payment_status !== 'Settled') ||
      (statusFilter === 'Settled' && order.payment_status === 'Settled');
    
    return matchesSearch && matchesStatus;
  });

  // Delete logic
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      alert(error.message);
    } else {
      setOrders(prev => prev.filter(o => o.id !== id));
    }
  };

  // Edit logic with database safety
  const openEditModal = (order: any) => {
    setEditingOrder({ ...order });
    setIsEditModalOpen(true);
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Database Update Safety - Remove generated columns
    const updatePayload = {
      customer_name: editingOrder.customer_name,
      customer_contact_number: editingOrder.customer_contact_number || editingOrder.customer_contact,
      pickup_location: editingOrder.pickup_location,
      delivery_location: editingOrder.delivery_location || editingOrder.drop_location,
      total_amount_received: editingOrder.total_amount_received || editingOrder.delivery_charges,
      item_charge: editingOrder.item_charge || 0,
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

  // Flawless CSV Export with exact columns
  const handleExportCSV = () => {
    const csvData = filteredOrders.map(order => {
      const math = calculateOrderMath(order);
      
      return {
        "Order Date": order.created_at ? new Date(order.created_at).toLocaleDateString() : "N/A",
        "Order ID": order.id || "N/A",
        "Outsource Name": order.outsources?.name || order.outsource_name || "N/A",
        "Client Name": order.clients?.name || order.client_name || "N/A",
        "Customer Name": order.customer_name || "N/A",
        "Delivery Location": order.delivery_location || order.delivery_address || "N/A",
        "Payment Method": order.payment_mode || "N/A",
        "Total Amount Received": Number(order.total_amount_received || 0).toFixed(2),
        "Item Charge": Number(order.item_charge || 0).toFixed(2),
        "Delivery Charges": math.calculatedDeliveryCharge.toFixed(2),
        "Outsource Charges": Number(order.outsource_charges || 0).toFixed(2),
        "MS Profit": math.calculatedProfit.toFixed(2),
        "Settlement Amount": math.settlementAmount.toFixed(2),
        "Pay/Collect": math.payCollectAction,
        "Settlement Status": order.payment_status || "Pending"
      };
    });

    // Convert to CSV without duplicate headers
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => row[header] || 'N/A').join(','))
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

  // Status badge component
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
      {/* Top Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Orders Listing</h1>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by ID, Name, Client..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Settled">Settled</option>
                </select>
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
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading orders...</div>
          </div>
        ) : (
          <>
            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-4">
              {filteredOrders.map((order) => {
                const math = calculateOrderMath(order);
                return (
                  <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{order.order_number}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={order.payment_status || 'Pending'} />
                    </div>
                    
                    {/* Client/Location */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <User size={14} className="text-gray-400" />
                        <span className="text-gray-700">{order.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="text-gray-700">{order.delivery_location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign size={14} className="text-gray-400" />
                        <span className="text-gray-700">{order.clients?.name}</span>
                      </div>
                    </div>
                    
                    {/* Financial Summary */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Total Received</p>
                          <p className="font-semibold text-gray-900">
                            AED {Number(order.total_amount_received || 0).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">MS Profit</p>
                          <p className={`font-semibold ${math.calculatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            AED {math.calculatedProfit.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
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

            {/* Desktop View - Table */}
            <div className="hidden md:block">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Driver
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pay Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Received
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Outsource Charge
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          MS Profit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Settlement Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredOrders.map((order) => {
                        const math = calculateOrderMath(order);
                        return (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {order.order_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.outsources?.name || 'Unassigned'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.clients?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.customer_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.delivery_location || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <CreditCard size={14} />
                                {order.payment_mode || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              AED {Number(order.total_amount_received || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              AED {Number(order.outsource_charges || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`font-semibold ${math.calculatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                AED {math.calculatedProfit.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={order.payment_status || 'Pending'} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white">
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
                      <X size={24} />
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
                          value={editingOrder.customer_contact_number || editingOrder.customer_contact || ''}
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
                          value={editingOrder.delivery_location || editingOrder.drop_location || ''}
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
                          value={editingOrder.total_amount_received || editingOrder.delivery_charges || ''}
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
                          value={editingOrder.delivery_charges || ''}
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
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
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