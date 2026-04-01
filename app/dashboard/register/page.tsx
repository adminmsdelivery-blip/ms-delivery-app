'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../src/lib/supabase';

export default function RegisterOrder() {
  const [clients, setClients] = useState([]);
  const [outsources, setOutsources] = useState([]);
  const [formData, setFormData] = useState({
    client_id: '',
    outsource_id: '',
    pickup_location: '',
    customer_contact: '',
    delivery_charges: 0,
    outsource_charges: 0,
    payment_mode: 'Cash on Delivery (COD)'
  });

  // Load Dropdown Data
  useEffect(() => {
    const loadData = async () => {
      const { data: c } = await supabase.from('clients').select('id, name, address, phone');
      const { data: o } = await supabase.from('outsources').select('id, name');
      setClients(c || []);
      setOutsources(o || []);
    };
    loadData();
  }, []);

  // AUTO-FILL LOGIC: Triggered when Client changes
  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    setFormData({
      ...formData,
      client_id: clientId,
      pickup_location: client?.address || '',
      customer_contact: client?.phone || ''
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold mb-6">Register New Order</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Client</label>
          <select 
            onChange={(e) => handleClientSelect(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-gray-50"
          >
            <option value="">Choose a Bakery/Client</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Outsource Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Assign Outsource</label>
          <select 
            onChange={(e) => setFormData({...formData, outsource_id: e.target.value})}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-gray-50"
          >
            <option value="">Select Outsource Partner</option>
            {outsources.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>

        {/* Auto-filled Fields */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50 p-4 rounded-lg">
          <div>
            <label className="text-xs font-bold text-indigo-600 uppercase">Pickup Location (Auto)</label>
            <input type="text" value={formData.pickup_location} readOnly className="w-full bg-transparent border-none font-medium" />
          </div>
          <div>
            <label className="text-xs font-bold text-indigo-600 uppercase">Customer Contact (Auto)</label>
            <input type="text" value={formData.customer_contact} readOnly className="w-full bg-transparent border-none font-medium" />
          </div>
        </div>

        {/* Financials */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Delivery Charge (Income)</label>
          <input 
            type="number" 
            onChange={(e) => setFormData({...formData, delivery_charges: Number(e.target.value)})}
            className="w-full border p-2 rounded-md" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Outsource Cost (Expense)</label>
          <input 
            type="number" 
            onChange={(e) => setFormData({...formData, outsource_charges: Number(e.target.value)})}
            className="w-full border p-2 rounded-md" 
          />
        </div>

        <div className="md:col-span-2">
           <div className="text-right font-bold text-lg text-green-600">
             Estimated Profit: AED {formData.delivery_charges - formData.outsource_charges}
           </div>
        </div>
      </div>
    </div>
  );
}