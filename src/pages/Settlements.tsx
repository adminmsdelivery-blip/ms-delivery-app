import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';
import { 
  Search,
  Download,
  AlertTriangle,
  TrendingUp,
  Users,
  CreditCard,
  Scale
} from 'lucide-react';
import { format } from 'date-fns';

// Order Interface
interface Order {
  id: string;
  outsource_name?: string;
  client_name?: string;
  customer_name?: string;
  delivery_location?: string;
  payment_mode?: string;
  total_amount_received?: number;
  item_charge?: number;
  outsource_charges?: number;
  created_at: string;
  outsources?: { name: string };
  clients?: { name: string };
}

// Driver Row Interface
interface DriverRow {
  name: string;
  earned: number;
  cashHeldByOutsource: number;
  cashHeldByMS: number;
  finalBalance: number;
  status: string;
  actionType: "collect" | "pay" | "settled";
}

// Settlement Data Interface
interface SettlementData {
  totalEarned: number;
  cashHeldByOutsource: number;
  cashHeldByMS: number;
  finalBalance: number;
  driverRows: DriverRow[];
}

const Settlements: React.FC = () => {
  // State & Data Fetching
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year' | 'all'>('all');

  // Modal State Management
  const [selectedDriver, setSelectedDriver] = useState<DriverRow | null>(null);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [isSettling, setIsSettling] = useState(false);

  // Data Fetching with Error Guards
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setDbError(null);

        // Query relational tables to get names
        const { data, error } = await supabase
          .from('orders')
          .select('*, outsources(name), clients(name)');

        if (error) {
          console.error('Supabase Error:', error);
          setDbError(error.message || JSON.stringify(error));
          setOrders([]);
          return;
        }

        // Ensure setOrders only receives an array
        setOrders(data || []);
      } catch (error: any) {
        console.error('Fetch Error:', error);
        setDbError(error.message || 'Failed to fetch data');
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Time Filter Logic (useMemo)
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    
    const now = new Date();
    const filterStart = new Date();
    
    switch (timeFilter) {
      case 'week':
        filterStart.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterStart.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        filterStart.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        return orders;
    }
    
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= filterStart && orderDate <= now;
    });
  }, [orders, timeFilter]);

  // Core Math & Aggregation (useMemo)
  const settlementData: SettlementData = useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) {
      return {
        totalEarned: 0,
        cashHeldByOutsource: 0,
        cashHeldByMS: 0,
        finalBalance: 0,
        driverRows: []
      };
    }

    const driverMap = new Map<string, DriverRow>();
    let totalEarned = 0;
    let cashHeldByOutsource = 0;
    let cashHeldByMS = 0;

    // Map over filteredOrders to calculate ledger
    filteredOrders.forEach((order, index) => {
      // MATCH EXACT DATABASE KEYS:
      const driverName = order.outsources?.name || 'Unknown Driver';
      const clientName = order.clients?.name || 'Unknown Client';
      const pMethod = String(order.payment_mode || '').toUpperCase().trim(); 
      const isDriverCash = pMethod.includes('COD') || pMethod.includes('COP') || pMethod.includes('CASH');
      const isMSCash = pMethod.includes('ONLINE'); 
      const totalAmount = Number(order.total_amount_received) || 0; 
      const itemCharge = Number(order.item_charge) || 0; 
      const outsourceCharge = Number(order.outsource_charges) || 0; 
      const deliveryCharge = Math.max(0, totalAmount - itemCharge);

      // Double-entry accounting logic
      const driverHolds = isDriverCash ? deliveryCharge : 0;
      const msHolds = isMSCash ? deliveryCharge : 0;

      // Update global totals
      totalEarned += outsourceCharge;
      cashHeldByOutsource += driverHolds;
      cashHeldByMS += msHolds;

      // Update driver ledger
      if (!driverMap.has(driverName)) {
        driverMap.set(driverName, {
          name: driverName,
          earned: 0,
          cashHeldByOutsource: 0,
          cashHeldByMS: 0,
          finalBalance: 0,
          status: 'Settled',
          actionType: 'settled'
        });
      }

      const driver = driverMap.get(driverName)!;
      driver.earned += outsourceCharge;
      driver.cashHeldByOutsource += driverHolds;
      driver.cashHeldByMS += msHolds;
    });

    // Calculate final balances and status for each driver
    const driverRows = Array.from(driverMap.values()).map(driver => {
      const netBalance = driver.earned - driver.cashHeldByOutsource;
      
      if (netBalance > 0) {
        driver.status = 'Pay';
        driver.actionType = 'pay';
      } else if (netBalance < 0) {
        driver.status = 'Collect';
        driver.actionType = 'collect';
      } else {
        driver.status = 'Settled';
        driver.actionType = 'settled';
      }

      driver.finalBalance = Math.abs(netBalance);
      return driver;
    });

    const finalBalance = Math.abs(cashHeldByOutsource - totalEarned);

    return {
      totalEarned,
      cashHeldByOutsource,
      cashHeldByMS,
      finalBalance,
      driverRows
    };
  }, [filteredOrders]);

  // Modal Handlers
  const openSettlementModal = (driver: DriverRow) => {
    setSelectedDriver(driver);
    // Default the input to their full final balance
    setSettlementAmount(driver.finalBalance > 0 ? driver.finalBalance.toString() : '');
  };

  const closeSettlementModal = () => {
    setSelectedDriver(null);
    setSettlementAmount('');
  };

  const handleProcessSettlement = async () => {
    if (!selectedDriver || !settlementAmount) return;
    setIsSettling(true);
    
    try {
      const amount = parseFloat(settlementAmount);
      
      // TODO: Update your database here. 
      // Approach A: Mark all specific orders for this driver as "Settled"
      // Approach B: Insert a new row into a `settlement_ledger` table
      
      /* Example Supabase Call:
      const { error } = await supabase
        .from('orders')
        .update({ settlement_status: 'Settled' })
        .eq('outsource_id', selectedDriver.id) // Ensure driver ID is available
        .eq('settlement_status', 'Pending');
      if (error) throw error;
      */
      
      alert(`Successfully processed ${selectedDriver.actionType} of $${amount} for ${selectedDriver.name}`);
      
      // Refresh the page or refetch the orders array here to update the dashboard
      // fetchOrders(); 
      
      closeSettlementModal();
    } catch (error) {
      console.error("Settlement failed:", error);
      alert("Failed to process settlement.");
    } finally {
      setIsSettling(false);
    }
  };

  // CSV Export Logic
  const exportMasterReport = () => {
    let csvContent = '';

    // Section 1: Detailed Ledger
    csvContent += 'Detailed Ledger\n';
    csvContent += 'Order Date,Order ID,Outsource Name,Client Name,Customer Name,Delivery Location,Payment Method,Total Delivery Charge,Total Outsource Charge,MS Profit,Balance Amount (Who Holds whose Cash),Status (Pay/Collect)\n';

    filteredOrders.forEach(order => {
      const driverName = order.outsources?.name || order.outsource_name || 'Unknown Driver';
      const clientName = order.clients?.name || order.client_name || 'Unknown Client';
      const customerName = order.customer_name || 'N/A';
      const deliveryLocation = order.delivery_location || 'N/A';
      const paymentMethod = order.payment_mode || 'N/A';
      const totalAmount = Number(order.total_amount_received) || 0;
      const itemCharge = Number(order.item_charge) || 0;
      const outsourceCharge = Number(order.outsource_charges) || 0;
      const deliveryCharge = Math.max(0, totalAmount - itemCharge);

      // MS Profit = (Total Amount - Item Charge) - Outsource Charge
      const msProfit = deliveryCharge - outsourceCharge;

      // Text Logic
      const isCOD = paymentMethod.toUpperCase().includes('COD') || paymentMethod.toUpperCase().includes('COP') || paymentMethod.toUpperCase().includes('CASH');
      const isOnline = paymentMethod.toUpperCase().includes('ONLINE');

      let balanceAmount = '';
      let whoHolds = '';
      let status = '';

      if (isCOD) {
        balanceAmount = deliveryCharge.toString();
        whoHolds = 'Driver holds MS Cash';
        status = 'Collect';
      } else if (isOnline) {
        balanceAmount = outsourceCharge.toString();
        whoHolds = 'MS holds Driver Cash';
        status = 'Pay';
      } else {
        balanceAmount = '0';
        whoHolds = 'Settled';
        status = 'Settled';
      }

      csvContent += `${format(new Date(order.created_at), 'yyyy-MM-dd')},${order.id},${driverName},${clientName},${customerName},${deliveryLocation},${paymentMethod},${deliveryCharge},${outsourceCharge},${msProfit},${balanceAmount},"${whoHolds}",${status}\n`;
    });

    // Section 2: Settlement Summary (Total)
    csvContent += '\nSettlement Summary\n';
    csvContent += 'Outsource Name,Total Earned (By Outsource),Cash Held by Outsource,Cash Held by MS,Final Balance,Status(Pay/Collect)\n';

    settlementData.driverRows.forEach(driver => {
      csvContent += `${driver.name},${driver.earned},${driver.cashHeldByOutsource},${driver.cashHeldByMS},${driver.finalBalance},${driver.status}\n`;
    });

    // Generate Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `MS_Settlements_Master_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // UI Structure & Early Returns (CRITICAL)
  
  // If dbError is true, return giant red error box
  if (dbError) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border-l-4 border-red-600 text-red-900 p-6 rounded shadow-lg font-mono">
          <h2 className="text-xl font-bold mb-2 uppercase">Database Connection Failed</h2>
          <p className="mb-4">Supabase refused to return orders. Exact error message:</p>
          <pre className="bg-red-50 p-4 rounded border border-red-200 overflow-x-auto">
            {dbError}
          </pre>
        </div>
      </div>
    );
  }

  // If isLoading is true, return spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading settlement data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Settlements</h1>
            <p className="text-gray-500 text-sm mt-1">Track cash flow between MS Delivery and Outsource Drivers</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search drivers..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={exportMasterReport}
              className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download className="w-5 h-5" />
              Export Master Report
            </button>
          </div>
        </div>

        {/* Time Tabs UI */}
        <div className="flex justify-center mb-6">
          <div className="bg-white border rounded-full p-1 shadow-sm inline-flex">
            {(['week', 'month', 'year', 'all'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setTimeFilter(tab)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  timeFilter === tab 
                    ? 'bg-blue-600 text-white shadow' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab === 'all' ? 'All Time' : tab.charAt(0).toUpperCase() + tab.slice(1) + 'ly'}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Earned */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-50 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500 font-medium">Total Earned</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(settlementData.totalEarned)}</p>
            <p className="text-sm text-gray-500 mt-1">By Outsource Drivers</p>
          </div>

          {/* Cash Held by Outsource */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-50 p-3 rounded-xl">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500 font-medium">Cash Held by Outsource</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(settlementData.cashHeldByOutsource)}</p>
            <p className="text-sm text-gray-500 mt-1">COD/COP Orders</p>
          </div>

          {/* Cash Held by MS */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-50 p-3 rounded-xl">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500 font-medium">Cash Held by MS</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(settlementData.cashHeldByMS)}</p>
            <p className="text-sm text-gray-500 mt-1">Online Orders</p>
          </div>

          {/* Final Balance */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-50 p-3 rounded-xl">
                <Scale className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm text-gray-500 font-medium">Final Balance</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(settlementData.finalBalance)}</p>
            <p className="text-sm text-gray-500 mt-1">Settlement Amount</p>
          </div>
        </div>

        {/* 7-Column Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Driver Ledger</h2>
            <p className="text-sm text-gray-500">Individual driver settlement details</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outsource Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Earned</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Held by Outsource</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Held by MS</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {settlementData.driverRows.length > 0 ? (
                  settlementData.driverRows.map((driver, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{driver.name}</td>
                      <td className="px-6 py-4 text-green-600 font-medium">{formatCurrency(driver.earned)}</td>
                      <td className="px-6 py-4 text-blue-600 font-medium">{formatCurrency(driver.cashHeldByOutsource)}</td>
                      <td className="px-6 py-4 text-purple-600 font-medium">{formatCurrency(driver.cashHeldByMS)}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(driver.finalBalance)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          driver.actionType === 'settled' 
                            ? 'bg-gray-100 text-gray-800' 
                            : driver.actionType === 'collect' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {driver.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => openSettlementModal(driver)}
                          disabled={driver.actionType === 'settled'}
                          className={`px-4 py-2 rounded text-sm font-medium text-white ${
                            driver.actionType === 'pay' ? 'bg-red-600 hover:bg-red-700' : 
                            driver.actionType === 'collect' ? 'bg-green-600 hover:bg-green-700' : 
                            'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {driver.actionType === 'pay' ? 'Pay' : driver.actionType === 'collect' ? 'Collect' : 'Settled'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No settlement data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SETTLEMENT POPUP MODAL */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className={`px-6 py-4 border-b ${selectedDriver.actionType === 'pay' ? 'bg-red-50' : 'bg-green-50'}`}>
              <h3 className="text-lg font-bold text-gray-900">
                {selectedDriver.actionType === 'pay' ? 'Process Payment To' : 'Collect Payment From'}: {selectedDriver.name}
              </h3>
            </div>
            
            {/* Body */}
            <div className="p-6">
              <div className="flex justify-between mb-4 text-sm text-gray-600">
                <span>Current Pending Balance:</span>
                <span className={`font-bold ${selectedDriver.actionType === 'pay' ? 'text-red-600' : 'text-green-600'}`}>
                  ${selectedDriver.finalBalance.toFixed(2)}
                </span>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Settlement Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg font-semibold"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 border-t">
              <button 
                onClick={closeSettlementModal}
                disabled={isSettling}
                className="px-4 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleProcessSettlement}
                disabled={isSettling || !settlementAmount || parseFloat(settlementAmount) <= 0}
                className={`px-6 py-2 rounded-lg text-white font-medium transition-colors flex items-center ${
                  selectedDriver.actionType === 'pay' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                } disabled:opacity-50`}
              >
                {isSettling ? 'Processing...' : `Confirm ${selectedDriver.actionType === 'pay' ? 'Pay' : 'Collect'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settlements;
