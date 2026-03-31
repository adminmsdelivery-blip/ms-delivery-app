import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency, cn } from '../lib/utils';
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  CheckCircle2, 
  History,
  Plus,
  X,
  Search,
  Download,
  FileText,
  AlertTriangle,
  Calculator,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

// Strict Type Enforcement for Order Data
interface Order {
  id: string;
  driver_id: string; // outsource_id
  order_status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  payment_method: 'COD' | 'COP' | 'ONLINE';
  total_order_amount: number; // delivery_charges
  outsource_charge: number; // outsource_charges
  created_at: string;
  order_number: string;
  clients?: { name: string };
  outsources?: { name: string };
}

interface DriverSettlement {
  driverId: string;
  driver_name: string;
  total_earned: number;
  cash_held_by_driver: number;
  net_balance: number;
  completed_orders_count: number;
  billing_period: {
    start_date: string;
    end_date: string;
  };
}

interface OutsourceBalance {
  outsource_id: string;
  outsource_name: string;
  total_earned: number;
  cash_held_by_driver: number;
  net_balance: number;
  delivery_count: number;
}

const Settlements: React.FC = () => {
  const [balances, setBalances] = useState<OutsourceBalance[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [outsources, setOutsources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [error, setError] = useState<string | null>(null);
  const [newSettlement, setNewSettlement] = useState({
    type: 'Collection' as 'Collection' | 'Payout',
    outsource_id: '',
    amount: 0,
    reference_number: '',
    remark: ''
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Robust Financial Settlement Calculation
  const calculateDriverSettlement = (driverId: string, timePeriod: 'week' | 'month' | 'quarter'): DriverSettlement | null => {
    try {
      console.log(`Calculating settlement for driver ${driverId}, period: ${timePeriod}`);
      
      // Step A: Filter - Get completed orders for driver within time period
      const now = new Date();
      let startDate = new Date();
      
      switch (timePeriod) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
      }

      console.log(`Filtering orders from ${startDate.toISOString()} to ${now.toISOString()}`);

      const driverOrders = allOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        const matchesDriver = order.driver_id === driverId;
        const matchesStatus = order.order_status === 'COMPLETED';
        const matchesDate = orderDate >= startDate && orderDate <= now;
        
        console.log(`Order ${order.id}: driver=${matchesDriver}, status=${matchesStatus}, date=${matchesDate}`);
        
        return matchesDriver && matchesStatus && matchesDate;
      });

      console.log(`Found ${driverOrders.length} orders for driver ${driverId}`);

      if (driverOrders.length === 0) {
        return null; // No orders for this driver in the period
      }

      // Step B: Calculate Total Earned with type coercion
      const total_earned = driverOrders.reduce((sum, order) => {
        const charge = Number(order.outsource_charge) || 0;
        if (isNaN(charge)) {
          console.warn(`Invalid outsource_charge for order ${order.id}: ${order.outsource_charge}`);
          return sum; // Skip invalid values
        }
        return sum + charge;
      }, 0);

      // Step C: Calculate Cash Held (COD/COP only)
      const cash_held_by_driver = driverOrders.reduce((sum, order) => {
        if (order.payment_method === 'COD' || order.payment_method === 'COP') {
          const amount = Number(order.total_order_amount) || 0;
          if (isNaN(amount)) {
            console.warn(`Invalid total_order_amount for order ${order.id}: ${order.total_order_amount}`);
            return sum; // Skip invalid values
          }
          return sum + amount;
        }
        return sum;
      }, 0);

      // Step D: Calculate Final Balance
      const net_balance = total_earned - cash_held_by_driver;

      // Get driver name
      const driver = outsources.find(o => o.id === driverId);
      const driver_name = driver?.name || 'Unknown Driver';

      return {
        driverId,
        driver_name,
        total_earned,
        cash_held_by_driver,
        net_balance,
        completed_orders_count: driverOrders.length,
        billing_period: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: now.toISOString().split('T')[0]
        }
      };
    } catch (error) {
      console.error('Error in calculateDriverSettlement:', error);
      setError('Failed to calculate driver settlement');
      return null;
    }
  };

  useEffect(() => {
    fetchData();
    fetchOutsources();
  }, []);

  const fetchOutsources = async () => {
    const { data } = await supabase.from('outsources').select('*').order('name');
    if (data) setOutsources(data);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all orders with client and outsource details
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*, clients(name), outsources(name)')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Orders fetch error:', ordersError);
        throw ordersError;
      }

      console.log('Raw orders data:', orders);
      console.log('Orders count:', orders?.length || 0);

      if (orders && orders.length > 0) {
        // Convert to Order type with proper field mapping
        const processedOrders: Order[] = orders.map(order => ({
          id: order.id,
          driver_id: order.outsource_id || '',
          order_status: 'COMPLETED', // Treat all orders as completed for settlement calculation
          payment_method: order.payment_mode === 'Cash on Delivery (COD)' ? 'COD' : 
                         order.payment_mode === 'Cash on Pickup (COP)' ? 'COP' : 'ONLINE',
          total_order_amount: Number(order.delivery_charges) || 0,
          outsource_charge: Number(order.outsource_charges) || 0,
          created_at: order.created_at,
          order_number: order.order_number,
          clients: order.clients,
          outsources: order.outsources
        }));

        console.log('Processed orders:', processedOrders);
        setAllOrders(processedOrders);

        // Filter orders that have outsource_id (critical fix)
        const ordersWithDrivers = processedOrders.filter(order => order.driver_id && order.driver_id !== '');
        console.log('Orders with drivers:', ordersWithDrivers);
        
        if (ordersWithDrivers.length === 0) {
          console.log('No orders with valid drivers found');
          setBalances([]);
          return;
        }

        // Get unique driver IDs from orders that actually have drivers
        const uniqueDriverIds = [...new Set(ordersWithDrivers.map(order => order.driver_id).filter(Boolean))];
        console.log('Unique driver IDs:', uniqueDriverIds);

        // Calculate settlements for each driver
        const driverSettlements: OutsourceBalance[] = [];
        
        for (const driverId of uniqueDriverIds) {
          const settlement = calculateDriverSettlement(driverId, selectedPeriod);
          console.log(`Settlement for driver ${driverId}:`, settlement);
          if (settlement) {
            driverSettlements.push({
              outsource_id: settlement.driverId,
              outsource_name: settlement.driver_name,
              total_earned: settlement.total_earned,
              cash_held_by_driver: settlement.cash_held_by_driver,
              net_balance: settlement.net_balance,
              delivery_count: settlement.completed_orders_count
            });
          }
        }
        
        console.log('Final driver settlements:', driverSettlements);
        setBalances(driverSettlements);
      } else {
        console.log('No orders found in database');
        setBalances([]);
      }
    } catch (error: any) {
      console.error('Error fetching settlement data:', error);
      setError(error.message || 'Failed to fetch settlement data');
    } finally {
      setLoading(false);
    }
  };

  const exportMasterReport = () => {
    const dataToExport = balances.map(b => ({
      'Driver Name': b.outsource_name,
      'Total Deliveries': b.delivery_count,
      'Total Earned (AED)': b.total_earned,
      'Cash Held by Driver (AED)': b.cash_held_by_driver,
      'Final Settlement Balance (AED)': b.net_balance,
      'Settlement Status': b.net_balance > 0 
        ? 'You have to pay to outsource' 
        : b.net_balance < 0 
          ? 'You have to collect from outsource' 
          : 'Account Settled',
      'Action Amount (AED)': Math.abs(b.net_balance),
      'Action Required': b.net_balance > 0 
        ? `Pay AED ${Math.abs(b.net_balance)} to ${b.outsource_name}` 
        : b.net_balance < 0 
          ? `Collect AED ${Math.abs(b.net_balance)} from ${b.outsource_name}` 
          : 'No action needed'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Driver Name
      { wch: 15 }, // Total Deliveries
      { wch: 20 }, // Total Earned
      { wch: 25 }, // Cash Held by Driver
      { wch: 25 }, // Final Settlement Balance
      { wch: 25 }, // Settlement Status
      { wch: 20 }, // Action Amount
      { wch: 40 }, // Action Required
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Driver Settlements');
    XLSX.writeFile(wb, `MS_Driver_Settlements_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportDriverLedger = (driverId: string, driverName: string) => {
    const driverOrders = allOrders.filter(o => o.driver_id === driverId);

    const dataToExport = driverOrders.map(o => ({
      'Order Date': new Date(o.created_at).toLocaleDateString(),
      'Order Number': o.order_number,
      'Client Name': o.clients?.name || 'N/A',
      'Payment Method': o.payment_method,
      'Total Order Amount (AED)': o.total_order_amount,
      'Outsource Charge (AED)': o.outsource_charge,
      'Order Status': o.order_status
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    ws['!cols'] = [
      { wch: 15 }, // Order Date
      { wch: 15 }, // Order Number
      { wch: 25 }, // Client Name
      { wch: 15 }, // Payment Method
      { wch: 20 }, // Total Order Amount
      { wch: 20 }, // Outsource Charge
      { wch: 15 }, // Order Status
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Driver Ledger');
    XLSX.writeFile(wb, `Ledger_${driverName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const handleSettlementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Find the driver
      const driver = outsources.find(o => o.id === newSettlement.outsource_id);
      const driverName = driver?.name || 'Unknown Driver';
      
      // Save settlement record to database
      const { error: settlementError } = await supabase
        .from('settlements')
        .insert([{
          type: newSettlement.type,
          outsource_name: driverName,
          amount: newSettlement.amount,
          payment_date: new Date().toISOString().split('T')[0],
          reference_number: newSettlement.reference_number,
          remark: newSettlement.remark
        }]);

      if (settlementError) throw settlementError;

      // Show success toast
      setToastMessage(`Settlement recorded successfully! ${newSettlement.type === 'Collection' ? 'Collected from' : 'Paid to'} ${driverName}: AED ${newSettlement.amount}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      setIsModalOpen(false);
      setNewSettlement({
        type: 'Collection',
        outsource_id: '',
        amount: 0,
        reference_number: '',
        remark: ''
      });
      
      // Refresh data to show updated calculations
      fetchData();
    } catch (error: any) {
      console.error('Error in settlement submission:', error);
      setToastMessage('Failed to record settlement. Please try again.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const filteredBalances = balances.filter(b => 
    b.outsource_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Settlements</h1>
          <p className="text-gray-500 text-sm">Track cash flow between business and outsource partners.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportMasterReport}
            className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Download className="w-5 h-5 text-indigo-600" />
            Export All Balances
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
          >
            <Plus className="w-5 h-5" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Summary Cards - Three Primary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-green-50 p-4 rounded-2xl text-green-600">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Earned (All Drivers)</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(balances.reduce((acc, b) => acc + (b.total_earned || 0), 0))}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-orange-50 p-4 rounded-2xl text-orange-600">
            <Calculator className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Cash Held by Drivers (COD/COP)</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(balances.reduce((acc, b) => acc + (b.cash_held_by_driver || 0), 0))}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className={`p-4 rounded-2xl ${
            balances.reduce((acc, b) => acc + (b.net_balance || 0), 0) > 0 
              ? 'bg-green-50 text-green-600' 
              : balances.reduce((acc, b) => acc + (b.net_balance || 0), 0) < 0 
                ? 'bg-red-50 text-red-600' 
                : 'bg-gray-50 text-gray-600'
          }`}>
            {balances.reduce((acc, b) => acc + (b.net_balance || 0), 0) > 0 ? (
              <TrendingUp className="w-8 h-8" />
            ) : balances.reduce((acc, b) => acc + (b.net_balance || 0), 0) < 0 ? (
              <TrendingDown className="w-8 h-8" />
            ) : (
              <CheckCircle2 className="w-8 h-8" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Final Settlement Balance</p>
            <p className={`text-2xl font-bold ${
              balances.reduce((acc, b) => acc + (b.net_balance || 0), 0) > 0 
                ? 'text-green-600' 
                : balances.reduce((acc, b) => acc + (b.net_balance || 0), 0) < 0 
                  ? 'text-red-600' 
                  : 'text-gray-600'
            }`}>
              {formatCurrency(Math.abs(balances.reduce((acc, b) => acc + (b.net_balance || 0), 0)))}
            </p>
            <p className={`text-xs font-medium ${
              balances.reduce((acc, b) => acc + (b.net_balance || 0), 0) > 0 
                ? 'text-green-600' 
                : balances.reduce((acc, b) => acc + (b.net_balance || 0), 0) < 0 
                  ? 'text-red-600' 
                  : 'text-gray-600'
            }`}>
              {balances.reduce((acc, b) => acc + (b.net_balance || 0), 0) > 0 
                ? 'You have to pay to outsource' 
                : balances.reduce((acc, b) => acc + (b.net_balance || 0), 0) < 0 
                  ? 'You have to collect from outsource' 
                  : 'Account Settled'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex justify-center">
        <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          {(['week', 'month', 'quarter'] as const).map((period) => (
            <button
              key={period}
              onClick={() => {
                setSelectedPeriod(period);
                fetchData(); // Recalculate with new period
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedPeriod === period
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-red-800 font-medium">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Balances Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-600" />
            Driver Settlement Balances
          </h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Driver Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Total Earned</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Cash Held by Driver</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Final Balance</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Settlement Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        Calculating settlements...
                      </div>
                    </td>
                  </tr>
                ) : filteredBalances.map((b) => (
                  <tr key={b.outsource_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{b.outsource_name}</td>
                    <td className="px-6 py-4 text-green-600 font-medium">{formatCurrency(b.total_earned || 0)}</td>
                    <td className="px-6 py-4 text-orange-600 font-medium">{formatCurrency(b.cash_held_by_driver || 0)}</td>
                    <td className={cn(
                      "px-6 py-4 text-right font-bold",
                      (b.net_balance || 0) > 0 ? "text-green-600" : (b.net_balance || 0) < 0 ? "text-red-600" : "text-gray-600"
                    )}>
                      {formatCurrency(Math.abs(b.net_balance || 0))}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <div className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold",
                          (b.net_balance || 0) > 0 
                            ? "bg-green-50 text-green-600 border border-green-200" 
                            : (b.net_balance || 0) < 0 
                              ? "bg-red-50 text-red-600 border border-red-200" 
                              : "bg-gray-50 text-gray-600 border border-gray-200"
                        )}>
                          {(b.net_balance || 0) > 0 
                            ? "You have to pay to outsource" 
                            : (b.net_balance || 0) < 0 
                              ? "You have to collect from outsource" 
                              : "Account Settled"
                          }
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => exportDriverLedger(b.outsource_id, b.outsource_name)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all"
                        >
                          <FileText className="w-3 h-3" />
                          Ledger
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredBalances.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                      No driver settlements found for the selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Settlement History - Temporarily Disabled */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" />
          Recent Settlements
        </h2>
        <div className="bg-gray-50 border border-gray-200 p-8 rounded-2xl text-center">
          <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Settlement history tracking is temporarily disabled</p>
          <p className="text-sm text-gray-500 mt-2">To enable this feature, create a 'settlements' table in your Supabase database.</p>
        </div>
      </div>

      {/* Record Payment Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl text-gray-400">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSettlementSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Settlement Type</label>
                  <select
                    value={newSettlement.type}
                    onChange={(e) => setNewSettlement({ ...newSettlement, type: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Collection">Collection (from Outsource)</option>
                    <option value="Payout">Payout (to Outsource)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Select Outsource</label>
                  <select
                    required
                    value={newSettlement.outsource_id}
                    onChange={(e) => setNewSettlement({ ...newSettlement, outsource_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Choose partner...</option>
                    {outsources.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    required
                    value={newSettlement.amount}
                    onChange={(e) => setNewSettlement({ ...newSettlement, amount: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Reference #</label>
                  <input
                    type="text"
                    value={newSettlement.reference_number}
                    onChange={(e) => setNewSettlement({ ...newSettlement, reference_number: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Transaction ID / Receipt #"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 mt-4"
                >
                  Mark as Settled
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-gray-900 text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl z-[100]"
          >
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settlements;
