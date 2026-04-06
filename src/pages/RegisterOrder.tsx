import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Save, 
  Clock, 
  Phone, 
  ChevronRight,
  Info,
  MapPin, 
  User, 
  DollarSign,
  Calculator,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatCurrency } from '../lib/utils';

const RegisterOrder: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [outsources, setOutsources] = useState<any[]>([]);
  const [latestOrders, setLatestOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    order_number: `ORD-${Date.now().toString().slice(-6)}`,
    order_date: new Date().toISOString().split('T')[0],
    client_id: '',
    pickup_location: '',
    customer_name: '',
    customer_contact_number: '',
    delivery_location: '',
    map_pin_url: '',
    payment_mode: 'Cash on Delivery (COD)',
    total_amount_received: 0,
    item_charge: 0,
    outsource_id: '',
    outsource_charges: 0,
    remark: ''
  });

  // Auto-calculated values for display
  const deliveryCharge = formData.total_amount_received - formData.item_charge;
  const profit = deliveryCharge - formData.outsource_charges;

  useEffect(() => {
    fetchClients();
    fetchOutsources();
    fetchLatestOrders();
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('*').order('name');
    if (data) setClients(data);
  };

  const fetchOutsources = async () => {
    const { data } = await supabase.from('outsources').select('*').order('name');
    if (data) setOutsources(data);
  };

  const fetchLatestOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15);
    if (data) setLatestOrders(data);
  };

  const handleClientChange = (clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId);
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      // Auto-fill pickup location from client address only
      pickup_location: selectedClient?.address || prev.pickup_location
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'client_id') {
      handleClientChange(value);
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: name.includes('charges') || name.includes('total_amount_received') || name.includes('item_charge') ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Remove estimated_profit from submission as it's calculated by database DEFAULT constraint
      const { estimated_profit, ...orderData } = formData;

      const { error } = await supabase.from('orders').insert([orderData]);

      if (error) throw error;

      alert('Order registered successfully!');
      setFormData({
        order_number: `ORD-${Date.now().toString().slice(-6)}`,
        order_date: new Date().toISOString().split('T')[0],
        client_id: '',
        pickup_location: '',
        customer_name: '',
        customer_contact_number: '',
        delivery_location: '',
        map_pin_url: '',
        payment_mode: 'Cash on Delivery (COD)',
        total_amount_received: 0,
        item_charge: 0,
        outsource_id: '',
        outsource_charges: 0,
        remark: ''
      });
      fetchLatestOrders();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form Section */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Register New Order</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Order Information */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-primary-50 to-white p-6 rounded-2xl border border-primary-200 shadow-lg hover:shadow-xl space-y-4"
          >
            <div className="flex items-center gap-3 text-primary-600 font-semibold mb-4">
              <Info className="w-6 h-6 animate-pulse" />
              <h2 className="text-gradient bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">Order Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Order Date</label>
                <input
                  type="date"
                  name="order_date"
                  value={formData.order_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Order Number</label>
                <input
                  type="text"
                  name="order_number"
                  value={formData.order_number}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pickup Details */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-gradient-to-br from-secondary-50 to-white p-6 rounded-2xl border border-secondary-200 shadow-lg hover:shadow-xl space-y-4"
          >
            <div className="flex items-center gap-3 text-secondary-600 font-semibold mb-4">
              <MapPin className="w-6 h-6 animate-bounce" />
              <h2 className="text-gradient bg-gradient-to-r from-secondary-600 to-secondary-400 bg-clip-text text-transparent">Pickup Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Client Name</label>
                <select
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  required
                >
                  <option value="">Choose a client...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Pickup Location</label>
                <input
                  type="text"
                  name="pickup_location"
                  value={formData.pickup_location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Delivery Details */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-br from-success-50 to-white p-6 rounded-2xl border border-success-200 shadow-lg hover:shadow-xl space-y-4"
          >
            <div className="flex items-center gap-3 text-success-600 font-semibold mb-4">
              <User className="w-6 h-6 animate-pulse" />
              <h2 className="text-gradient bg-gradient-to-r from-success-600 to-success-400 bg-clip-text text-transparent">Delivery Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Customer Name</label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Customer Contact Number</label>
                <input
                  type="text"
                  name="customer_contact_number"
                  value={formData.customer_contact_number}
                  onChange={handleChange}
                  placeholder="+1 234 567 890"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Delivery Location</label>
                <input
                  type="text"
                  name="delivery_location"
                  value={formData.delivery_location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Map Pin URL (Optional)</label>
                <input
                  type="url"
                  name="map_pin_url"
                  value={formData.map_pin_url}
                  onChange={handleChange}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Payment & Item Details */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-gradient-to-br from-warning-50 to-white p-6 rounded-2xl border border-warning-200 shadow-lg hover:shadow-xl space-y-4"
          >
            <div className="flex items-center gap-3 text-warning-600 font-semibold mb-4">
              <DollarSign className="w-6 h-6 animate-pulse" />
              <h2 className="text-gradient bg-gradient-to-r from-warning-600 to-warning-400 bg-clip-text text-transparent">Payment & Item Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Payment Mode</label>
                <select
                  name="payment_mode"
                  value={formData.payment_mode}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                  <option value="Cash on Pickup (COP)">Cash on Pickup (COP)</option>
                  <option value="Online Payment">Online Payment</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Total Amount Received</label>
                <input
                  type="number"
                  name="total_amount_received"
                  value={formData.total_amount_received}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Item Charge</label>
                <input
                  type="number"
                  name="item_charge"
                  value={formData.item_charge}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Outsource Details */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-br from-error-50 to-white p-6 rounded-2xl border border-error-200 shadow-lg hover:shadow-xl space-y-4"
          >
            <div className="flex items-center gap-3 text-error-600 font-semibold mb-4">
              <User className="w-6 h-6 animate-bounce" />
              <h2 className="text-gradient bg-gradient-to-r from-error-600 to-error-400 bg-clip-text text-transparent">Outsource Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Outsource Name</label>
                <select
                  name="outsource_id"
                  value={formData.outsource_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  required
                >
                  <option value="">Choose partner...</option>
                  {outsources.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Outsource Charges</label>
                <input
                  type="number"
                  name="outsource_charges"
                  value={formData.outsource_charges}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Auto-Calculated Summary (Read-Only) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-gradient-to-br from-neutral-50 to-neutral-100 p-6 rounded-2xl border border-neutral-200 shadow-lg hover:shadow-xl space-y-4"
          >
            <div className="flex items-center gap-3 text-neutral-600 font-semibold mb-4">
              <Calculator className="w-6 h-6 animate-pulse" />
              <h2 className="text-gradient bg-gradient-to-r from-neutral-600 to-neutral-400 bg-clip-text text-transparent">Auto-Calculated Summary</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Delivery Charge</label>
                <div className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-bold flex items-center justify-center">
                  {formatCurrency(deliveryCharge)}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Profit</label>
                <div className={cn(
                  "w-full px-4 py-2 rounded-xl border font-bold flex items-center justify-center",
                  profit >= 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
                )}>
                  {formatCurrency(profit)}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Remark</label>
              <textarea
                name="remark"
                value={formData.remark}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registering...' : (
              <>
                <Save className="w-5 h-5" />
                Register Order
              </>
            )}
          </button>
        </form>
      </div>

      {/* Latest Orders Sidebar */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-gray-900 font-bold">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h2>Latest 15 Orders</h2>
        </div>
        <div className="space-y-4">
          {latestOrders.map((order, index) => (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              key={order.id}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-colors group"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {order.customer_name}
                  </p>
                  <p className="text-xs text-gray-500">{order.order_number}</p>
                </div>
                <span className="text-sm font-bold text-indigo-600">
                  {formatCurrency(order.total_amount_received || order.delivery_charges)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{order.delivery_location || order.drop_location}</span>
              </div>
            </motion.div>
          ))}
          {latestOrders.length === 0 && (
            <div className="text-center py-8 text-gray-400 italic">
              No orders registered yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterOrder;
