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
  Package,
  CreditCard,
  Truck
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
    customer_contact_number: '',
    delivery_location: '',
    map_pin_url: '',
    outsource_id: '',
    outsource_charges: 0,
    delivery_charges: 0,
    item_charge: 0,
    total_amount_received: 0,
    units: 1,
    payment_mode: 'Cash on Delivery (COD)',
    payment_status: 'Pending',
    estimated_profit: 0,
    remark: ''
  });

  // Auto-calculated values for summary section
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
      // Auto-fill pickup location from client address and contact from client phone
      pickup_location: selectedClient?.address || prev.pickup_location,
      customer_contact_number: selectedClient?.phone || prev.customer_contact_number
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
      [name]: name.includes('charges') || name === 'units' || name === 'item_charge' || name === 'total_amount_received' ? Number(value) : value
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
        outsource_id: '',
        outsource_charges: 0,
        delivery_charges: 0,
        item_charge: 0,
        total_amount_received: 0,
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Register Order</h1>
            <p className="text-gray-600">Enter comprehensive order details for tracking and settlement</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Order Information */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Order Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Order Date</label>
                  <input
                    type="date"
                    name="order_date"
                    value={formData.order_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
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
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-600"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Pickup Details */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Pickup Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Client Name</label>
                  <select
                    name="client_id"
                    value={formData.client_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    required
                  >
                    <option value="">Select a client...</option>
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
                    placeholder="Enter pickup address"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Delivery Details */}
            <div className="bg-green-50 rounded-xl border border-green-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">Delivery Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Customer Name</label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
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
                    placeholder="Enter contact number"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Delivery Location</label>
                  <input
                    type="text"
                    name="delivery_location"
                    value={formData.delivery_location}
                    onChange={handleChange}
                    placeholder="Enter delivery address"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Payment & Item Details */}
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Payment & Item Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Payment Mode</label>
                  <select
                    name="payment_mode"
                    value={formData.payment_mode}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    required
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
                    placeholder="0"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Item Charge</label>
                  <input
                    type="number"
                    name="item_charge"
                    value={formData.item_charge}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Outsource Details */}
            <div className="bg-orange-50 rounded-xl border border-orange-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-semibold text-gray-900">Outsource Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Outsource Name</label>
                  <select
                    name="outsource_id"
                    value={formData.outsource_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    required
                  >
                    <option value="">Select outsource partner...</option>
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
                    placeholder="0"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 6: Auto-Calculated Summary */}
            <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">Auto-Calculated Summary</h2>
                <Info className="w-4 h-4 text-indigo-400 ml-2" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Delivery Charge</label>
                  <div className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 font-semibold">
                    {formatCurrency(deliveryCharge)}
                  </div>
                  <p className="text-xs text-gray-500">Calculated: Total Amount Received - Item Charge</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Profit</label>
                  <div className={cn(
                    "w-full px-4 py-2 rounded-lg border font-semibold",
                    profit >= 0 
                      ? "bg-green-100 border-green-300 text-green-700" 
                      : "bg-red-100 border-red-300 text-red-700"
                  )}>
                    {formatCurrency(profit)}
                  </div>
                  <p className="text-xs text-gray-500">Calculated: Delivery Charge - Outsource Charges</p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Registering Order...' : 'Save / Register Order'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterOrder;
