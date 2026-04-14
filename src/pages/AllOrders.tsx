import React, { useState, useMemo } from 'react';

// Dummy data for testing the UI instantly (Replace with your Supabase fetch)
const DUMMY_ORDERS = [
  { id: 'ORD-095042', created_at: '2026-04-13', outsources: { name: 'abc services' }, clients: { name: 'Monika bakery' }, customer_name: 'sdasdasd', delivery_location: 'bhawanipur colony', payment_mode: 'Cash on Delivery (COD)', total_amount_received: 50, item_charge: 0, outsource_charges: 27 },
  { id: 'ORD-606238', created_at: '2026-04-11', outsources: { name: 'abc services' }, clients: { name: 'Monika bakery' }, customer_name: 'sdfsdfdsfd', delivery_location: 'bhawanipur colony', payment_mode: 'Online Payment', total_amount_received: 250, item_charge: 0, outsource_charges: 20 },
  { id: 'ORD-562758', created_at: '2026-04-11', outsources: { name: 'abc services' }, clients: { name: 'lucky bakery' }, customer_name: 'dsdafsdf', delivery_location: 'bhawanipur colony', payment_mode: 'Cash on Pickup (COP)', total_amount_received: 200, item_charge: 0, outsource_charges: 40 },
];

export default function OrdersList() {
  const [orders, setOrders] = useState(DUMMY_ORDERS); // NOTE: Replace DUMMY_ORDERS with your Supabase state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All-Time');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // --- MATH ENGINE ---
  const processedOrders = useMemo(() => {
    return orders.map(order => {
      const total = Number(order.total_amount_received || 0);
      const item = Number(order.item_charge || 0);
      const outsource = Number(order.outsource_charges || 0);
      
      const deliveryCharge = total - item;
      const msProfit = deliveryCharge - outsource;
      
      const pMethod = String(order.payment_mode || '').toUpperCase();
      const isCash = pMethod.includes('COD') || pMethod.includes('COP') || pMethod.includes('CASH');
      const action = isCash ? 'COLLECT' : 'PAY';

      return { ...order, deliveryCharge, msProfit, action };
    });
  }, [orders]);

  // --- SELECTION HANDLERS ---
  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedOrders(processedOrders.map(o => o.id));
    else setSelectedOrders([]);
  };

  const handleSelectOne = (e, id) => {
    if (e.target.checked) setSelectedOrders(prev => [...prev, id]);
    else setSelectedOrders(prev => prev.filter(item => item !== id));
  };

  // --- EDIT MODAL FUNCTIONS ---
  const openEditModal = (order) => {
    setEditingOrder({...order});
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingOrder(null);
    setIsEditModalOpen(false);
  };

  const handleSaveEdit = () => {
    if (editingOrder) {
      setOrders(prev => prev.map(order => 
        order.id === editingOrder.id ? editingOrder : order
      ));
      closeEditModal();
    }
  };

  const handleInputChange = (field, value) => {
    setEditingOrder(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    /* 1. MAIN PAGE WRAPPER - Soft blue-gray background to make the white card pop */
    <div className="min-h-screen w-full bg-[#f4f7f9] p-4 sm:p-6 lg:p-8 font-sans text-gray-800">
      
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* 2. TOP HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Orders Listing</h1>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Soft Search Bar */}
            <div className="relative w-full md:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </span>
              <input 
                type="text" 
                placeholder="Search order" 
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>

            {/* Indigo Primary Button */}
            <button className="bg-[#635BFF] hover:bg-[#524be0] text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm shadow-indigo-500/30 transition-all flex items-center gap-2 whitespace-nowrap">
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 3. THE MAIN WHITE CARD */}
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          
          {/* Card Header (Tabs & Bulk Action) */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
            
            {/* Segmented Control Tabs */}
            <div className="flex bg-gray-50/80 p-1 rounded-xl border border-gray-100">
              {['Weekly', 'Monthly', 'Yearly', 'All-Time'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    activeTab === tab 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Bulk Action Slide-in */}
            {selectedOrders.length > 0 && (
              <div className="flex items-center gap-3 animate-fade-in">
                <span className="text-sm font-medium text-gray-600">{selectedOrders.length} selected</span>
                <button className="text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-sm font-medium border border-red-100 transition-colors">
                  Delete Selected
                </button>
              </div>
            )}
          </div>

          {/* 4. THE TABLE */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              
              {/* Soft, minimal headers */}
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-4 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-10">
                    <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" onChange={handleSelectAll} checked={selectedOrders.length === processedOrders.length && processedOrders.length > 0} />
                  </th>
                  <th className="px-6 py-4 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order ID</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Total Charges</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Item Charges</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Delivery Charges</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Outsource Charges</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">MS Profit</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest sticky right-0 bg-white shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.02)]">Actions</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-gray-50">
                {processedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#f8fafc] transition-colors duration-150 group">
                    
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked={selectedOrders.includes(order.id)} onChange={(e) => handleSelectOne(e, order.id)} />
                    </td>
                    
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.id}</td>
                    
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="font-medium text-gray-900">{order.customer_name}</div>
                      <div className="text-xs text-gray-400">{order.clients?.name}</div>
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-600">{order.delivery_location}</td>
                    
                    <td className="px-6 py-4 text-sm text-gray-600 text-right font-medium">AED {order.total_amount_received?.toFixed(2)}</td>
                    
                    <td className="px-6 py-4 text-sm text-gray-600 text-right font-medium">AED {order.item_charge?.toFixed(2)}</td>
                    
                    <td className="px-6 py-4 text-sm text-gray-600 text-right font-medium">AED {order.deliveryCharge?.toFixed(2)}</td>
                    
                    <td className="px-6 py-4 text-sm text-gray-600 text-right font-medium">AED {order.outsource_charges?.toFixed(2)}</td>
                    
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold text-right">
                      <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md">
                        AED {order.msProfit?.toFixed(2)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 sticky right-0 bg-white group-hover:bg-[#f8fafc] transition-colors duration-150 text-center shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.02)]">
                      <button 
                        onClick={() => openEditModal(order)}
                        className="text-gray-400 hover:text-blue-600 transition-colors mr-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete order: ${order.id}?`)) {
                            setOrders(prev => prev.filter(o => o.id !== order.id));
                          }
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Edit Order {editingOrder.id}
                  </h3>
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={editingOrder.customer_name || ''}
                      onChange={(e) => handleInputChange('customer_name', e.target.value)}
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
                      onChange={(e) => handleInputChange('delivery_location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Amount Received
                      </label>
                      <input
                        type="number"
                        value={editingOrder.total_amount_received || ''}
                        onChange={(e) => handleInputChange('total_amount_received', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item Charge
                      </label>
                      <input
                        type="number"
                        value={editingOrder.item_charge || ''}
                        onChange={(e) => handleInputChange('item_charge', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Outsource Charges
                      </label>
                      <input
                        type="number"
                        value={editingOrder.outsource_charges || ''}
                        onChange={(e) => handleInputChange('outsource_charges', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Mode
                      </label>
                      <select
                        value={editingOrder.payment_mode || ''}
                        onChange={(e) => handleInputChange('payment_mode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                        <option value="Cash on Pickup (COP)">Cash on Pickup (COP)</option>
                        <option value="Online Payment">Online Payment</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}