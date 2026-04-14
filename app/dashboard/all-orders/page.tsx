'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../src/lib/supabase';
import { Search, Trash2, Edit, CheckSquare, Square, Download } from 'lucide-react';

export default function AllOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, clients(name), outsources(name)')
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === orders.length) setSelectedIds([]);
    else setSelectedIds(orders.map(o => o.id));
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleExportCSV = () => {
    const csvData = orders.map(order => ({
      "Order Number": order.order_number || order.tracking_number || "N/A",
      "Order Date": order.created_at ? new Date(order.created_at).toLocaleDateString() : "N/A",
      "Customer Name": order.customer_name || "N/A",
      "Customer Contact": order.customer_contact_number || "N/A",
      "Client Name": order.clients?.name || "N/A",
      "Outsource Name": order.outsources?.name || "N/A",
      "Pickup Location": order.pickup_location || "N/A",
      "Delivery Location": order.delivery_location || "N/A",
      "Payment Mode": order.payment_mode || "N/A",
      "Total Charges Received": `AED ${Number(order.total_amount_received || 0).toFixed(2)}`,
      "Item Charges": `AED ${Number(order.item_charge || 0).toFixed(2)}`,
      "Delivery Charges": `AED ${Number((order.total_amount_received || 0) - (order.item_charge || 0)).toFixed(2)}`,
      "Outsource Charges": `AED ${Number(order.outsource_charges || 0).toFixed(2)}`,
      "MS Profit": `AED ${Number(order.estimated_profit || 0).toFixed(2)}`
    }));

    // Convert to CSV
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Orders</h1>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button className="bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-200 flex items-center gap-2">
              <Trash2 size={18} /> Delete Selected ({selectedIds.length})
            </button>
          )}
          <button onClick={handleExportCSV} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Download size={18} /> Export Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4">
                <button onClick={toggleSelectAll}>
                  {selectedIds.length === orders.length ? <CheckSquare className="text-indigo-600" /> : <Square className="text-gray-300" />}
                </button>
              </th>
              <th className="p-4 text-sm font-bold text-gray-500 uppercase">Order Details</th>
              <th className="p-4 text-sm font-bold text-gray-500 uppercase">Client</th>
              <th className="p-4 text-sm font-bold text-gray-500 uppercase">Outsource</th>
              <th className="p-4 text-sm font-bold text-gray-500 uppercase">Net Profit</th>
              <th className="p-4 text-sm font-bold text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                <td className="p-4">
                  <button onClick={() => toggleOne(order.id)}>
                    {selectedIds.includes(order.id) ? <CheckSquare className="text-indigo-600" /> : <Square className="text-gray-300" />}
                  </button>
                </td>
                <td className="p-4 font-medium text-gray-900">
                  {order.order_number}
                  <p className="text-xs text-gray-400 font-normal">{order.order_date}</p>
                </td>
                <td className="p-4 text-gray-600 text-sm">{order.clients?.name}</td>
                <td className="p-4 text-gray-600 text-sm">{order.outsources?.name}</td>
                <td className="p-4 font-bold text-green-600">AED {order.estimated_profit}</td>
                <td className="p-4">
                   <span className="text-[10px] font-bold px-2 py-1 rounded bg-orange-50 text-orange-600 uppercase">
                     {order.payment_status}
                   </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
