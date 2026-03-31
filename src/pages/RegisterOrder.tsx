import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { cn, formatCurrency } from '../lib/utils';
import { 
  Save, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  DollarSign,
  Info,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

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
    customer_contact: '',
    drop_location: '',
    map_pin_url: '',
    outsource_id: '',
    outsource_charges: 0,
    delivery_charges: 0,
    units: 1,
    payment_mode: 'Cash on Delivery (COD)',
    payment_status: 'Pending',
    estimated_profit: 0,
    remark: ''
  });

  const estimatedProfit = formData.delivery_charges - formData.outsource_charges;

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
      // Auto-fill pickup location from client address and contact from client phone
      pickup_location: selectedClient?.address || prev.pickup_location,
      customer_contact: selectedClient?.phone || prev.customer_contact
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
      [name]: name.includes('charges') || name === 'units' ? Number(value) : value
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
        customer_contact: '',
        drop_location: '',
        map_pin_url: '',
        outsource_id: '',
        outsource_charges: 0,
        delivery_charges: 0,
        units: 1,
        payment_mode: 'Cash on Delivery (COD)',
        payment_status: 'Pending',
        estimated_profit: 0,
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
          {/* Basic Info */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold mb-2">
              <Info className="w-5 h-5" />
              <h2>Basic Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Order Number</label>
                <input
                  type="text"
                  name="order_number"
                  value={formData.order_number}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
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
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Select Client</label>
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
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold mb-2">
              <User className="w-5 h-5" />
              <h2>Customer Details</h2>
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
                <label className="text-sm font-medium text-gray-700">Contact Number</label>
                <input
                  type="text"
                  name="customer_contact"
                  value={formData.customer_contact}
                  onChange={handleChange}
                  placeholder="+1 234 567 890"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  required
                />
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
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Drop Location</label>
                <input
                  type="text"
                  name="drop_location"
                  value={formData.drop_location}
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

          {/* Financials & Logistics */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold mb-2">
              <DollarSign className="w-5 h-5" />
              <h2>Financials & Logistics</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Select Outsource</label>
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
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Delivery Charges</label>
                <input
                  type="number"
                  name="delivery_charges"
                  value={formData.delivery_charges}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Units</label>
                <input
                  type="number"
                  name="units"
                  value={formData.units}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
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
                <label className="text-sm font-medium text-gray-700">Estimated Profit</label>
                <div className={cn(
                  "w-full px-4 py-2 rounded-xl border font-bold flex items-center justify-center",
                  estimatedProfit >= 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
                )}>
                  {formatCurrency(estimatedProfit)}
                </div>
              </div>
            </div>
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
                  {formatCurrency(order.delivery_charges)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{order.drop_location}</span>
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
