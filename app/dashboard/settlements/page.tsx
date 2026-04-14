'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../src/lib/supabase';
import { Wallet, ArrowUpRight, ArrowDownLeft, FileSpreadsheet, Download } from 'lucide-react';

export default function SettlementsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any[]>([]);

  useEffect(() => {
    fetchSettlementData();
  }, []);

  async function fetchSettlementData() {
    setLoading(true);
    // Fetch orders with outsource details
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, outsources(name)')
      .eq('payment_status', 'Pending');

    if (error) {
      console.error(error);
    } else {
      // Group by Outsource to calculate balances
      const balances = orders.reduce((acc: any, order: any) => {
        const name = order.outsources?.name || 'Unknown Outsource';
        if (!acc[name]) acc[name] = { name, cashCollected: 0, onlinePayments: 0, totalProfit: 0 };
        
        if (order.payment_mode === 'Online Payment') {
          acc[name].onlinePayments += Number(order.outsource_charges);
        } else {
          acc[name].cashCollected += Number(order.estimated_profit);
        }
        return acc;
      }, {});

      setSummary(Object.values(balances));
    }
    setLoading(false);
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Financial Settlements</h1>
        <button className="bg-[#442DD8] hover:bg-[#3925b8] text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm shadow-indigo-500/30 transition-all flex items-center gap-2 whitespace-nowrap">
          <Download className="w-5 h-5" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {summary.map((item: any) => {
          const finalBalance = item.cashCollected - item.onlinePayments;
          const needsToPay = finalBalance > 0;

          return (
            <div key={item.name} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">{item.name}</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cash Held (COD/COP)</span>
                  <span className="font-medium text-orange-600">AED {item.cashCollected}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Online (We owe them)</span>
                  <span className="font-medium text-blue-600">AED {item.onlinePayments}</span>
                </div>
                
                <div className={`mt-4 p-4 rounded-xl flex justify-between items-center ${needsToPay ? 'bg-red-50' : 'bg-green-50'}`}>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-500">Final Action</p>
                    <p className={`text-sm font-bold ${needsToPay ? 'text-red-700' : 'text-green-700'}`}>
                      {needsToPay ? 'Collect from Outsource' : 'Pay to Outsource'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black">AED {Math.abs(finalBalance)}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
