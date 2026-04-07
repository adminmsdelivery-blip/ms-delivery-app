import React, { useState, useEffect, useMemo } from 'react';
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
  TrendingDown,
  Users,
  DollarSign,
  CreditCard,
  Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

// Order Interface
interface Order {
  id: string;
  driver_id: string;
  order_status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  payment_method: 'COD' | 'COP' | 'ONLINE';
  total_order_amount: number;
  outsource_charge: number;
  item_charge?: number;
  created_at: string;
  order_number: string;
  clients?: { name: string };
  outsources?: { name: string };
  customer_name?: string;
  delivery_location?: string;
  drop_location?: string;
}

// Driver Row Interface
interface DriverRow {
  name: string;
  earned: number;
  driverCash: number;
  msCash: number;
  netBalance: number;
  action: string;
  actionType: "settled" | "collect" | "pay";
  statusColor: string;
}

// Settlement Data Interface
interface SettlementData {
  totalEarned: number;
  cashHeldByDrivers: number;
  cashHeldByMS: number;
  finalBalance: number;
  driverRows: DriverRow[];
}

const Settlements: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('month'); // 'week', 'month', 'year'

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*, clients(name), outsources(name)')
          .order('created_at', { ascending: false });

        console.log("3. Supabase Response:", { ordersData, ordersError });
        console.log("3. Raw Orders Data Length:", ordersData?.length);
        console.log("3. Raw Orders Sample:", ordersData?.slice(0, 2));

        if (ordersError) throw ordersError;

        if (ordersData) {
          console.log("3. Processing orders...");
          const processedOrders: Order[] = ordersData.map(order => ({
            id: order.id,
            driver_id: order.driver_id || order.outsource_id || '',
            order_status: order.order_status || 'COMPLETED',
            payment_method: order.payment_method || 'ONLINE',
            total_order_amount: Number(order.total_order_amount) || 0,
            outsource_charge: Number(order.outsource_charge) || 0,
            item_charge: Number(order.item_charge) || 0,
            created_at: order.created_at,
            order_number: order.order_number || '',
            clients: order.clients,
            outsources: order.outsources,
            customer_name: order.customer_name,
            delivery_location: order.delivery_location || order.drop_location,
          }));

          console.log("3. Processed Orders Length:", processedOrders.length);
          console.log("3. Processed Orders Sample:", processedOrders.slice(0, 2));

          setOrders(processedOrders);
          console.log("3. Orders state updated");
        }
      } catch (error: any) {
        console.error('Error fetching settlement data:', error);
        setError(error.message || 'Failed to fetch settlement data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Core Data Aggregation
  console.log("1. Raw Orders Array:", orders);
  console.log("1. Orders Length:", orders?.length);
  console.log("1. Orders Sample:", orders?.slice(0, 2));

  // Pre-Filter Logic based on time filter
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    
    const now = new Date();
    return orders.filter(order => {
      if (!order.created_at) return true; // Include if no date
      
      const orderDate = new Date(order.created_at);
      const diffTime = Math.abs(now.getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (timeFilter === 'week') return diffDays <= 7;
      if (timeFilter === 'month') return diffDays <= 30;
      if (timeFilter === 'year') return diffDays <= 365;
      return true;
    });
  }, [orders, timeFilter]);

  console.log("1. Filtered Orders Length:", filteredOrders.length);
  
  const settlementData: SettlementData = useMemo(() => {
    console.log("2. useMemo running with filtered orders:", filteredOrders.length);
    if (!filteredOrders || filteredOrders.length === 0) {
      console.log("2. useMemo: Filtered orders empty, returning fallback");
      return { totalEarned: 0, cashHeldByDrivers: 0, cashHeldByMS: 0, finalBalance: 0, driverRows: [] };
    }

    let globalEarned = 0;
    let globalDriverCash = 0;
    let globalMSCash = 0;
    const driverMap: { [key: string]: { name: string; earned: number; driverCash: number; msCash: number } } = {};

    filteredOrders.forEach(order => {
      const driverName = order.outsources?.name || order.outsource_name || 'Unknown Driver';
      const pMethod = String(order.payment_method || '').toUpperCase().trim();
      const isDriverCash = pMethod.includes('COD') || pMethod.includes('COP') || pMethod.includes('CASH');
      const isMSCash = pMethod.includes('ONLINE'); 
      
      const totalAmount = Number(order.total_order_amount) || 0;
      const itemCharge = Number(order.item_charge) || 0;
      const outsourceCharge = Number(order.outsource_charge) || 0;
      
      const deliveryCharge = Math.max(0, totalAmount - itemCharge);
      const driverCollected = isDriverCash ? deliveryCharge : 0;
      const msCollected = isMSCash ? deliveryCharge : 0;

      globalEarned += outsourceCharge; 
      globalDriverCash += driverCollected; 
      globalMSCash += msCollected; 

      if (!driverMap[driverName]) {
        driverMap[driverName] = { name: driverName, earned: 0, driverCash: 0, msCash: 0 };
      }
      driverMap[driverName].earned += outsourceCharge;
      driverMap[driverName].driverCash += driverCollected;
      driverMap[driverName].msCash += msCollected;
    });

    const driverRows = Object.values(driverMap).map(driver => {
      const netBalance = Math.abs(driver.driverCash - driver.earned);
      let action = "Settled";
      let actionType: "settled" | "collect" | "pay" = "settled";
      let statusColor = "text-gray-500";
      
      if (driver.driverCash > driver.earned) {
        action = "Pending";
        actionType = "collect";
        statusColor = "text-green-600"; 
      } else if (driver.earned > driver.driverCash) {
        action = "Pending";
        actionType = "pay";
        statusColor = "text-red-600"; 
      }

      return { ...driver, netBalance, action, actionType, statusColor };
    });

    return { 
      totalEarned: globalEarned, 
      cashHeldByDrivers: globalDriverCash, 
      cashHeldByMS: globalMSCash,
      finalBalance: Math.abs(globalDriverCash - globalEarned),
      driverRows 
    };
  }, [filteredOrders]);

  console.log("2. Final Settlement Data:", settlementData);
  console.log("2. Driver Rows Count:", settlementData.driverRows.length);

  // Filter driver rows based on search
  const filteredDriverRows = useMemo(() => {
    if (!searchTerm) return settlementData.driverRows;
    return settlementData.driverRows.filter(driver => 
      driver.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [settlementData.driverRows, searchTerm]);

  // Early returns AFTER all hooks - Loading and Error states
  if (loading) {
    console.log("🔍 Component in loading state, showing loader");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading settlements data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.log("🔍 Component in error state, showing error");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  console.log("🔍 Component reached main render section");
  console.log("🔍 Current state - Loading:", loading, "Error:", error, "Orders length:", orders?.length);

  // Export Master Report Logic
  const exportMasterReport = () => {
    // Section 1: Detailed Ledger
    let csvContent = "Detailed Ledger\n";
    csvContent += "Order Date,Order ID,Outsource Name,Client Name,Customer Name,Delivery Location,Payment Method,Total Delivery Charge,Total Outsource Charge,MS Profit,Balance Amount (Who Holds whose Cash),Status (Pay/Collect)\n";

    orders.forEach(order => {
      const driverName = order.outsources?.name || order.outsource_name || 'Unknown Driver';
      const clientName = order.clients?.name || 'Unknown Client';
      const customerName = order.customer_name || 'N/A';
      const deliveryLocation = order.delivery_location || 'N/A';
      const paymentMethod = order.payment_method || 'UNKNOWN';
      
      const totalAmount = Number(order.total_order_amount) || 0;
      const itemCharge = Number(order.item_charge) || 0;
      const outsourceCharge = Number(order.outsource_charge) || 0;
      
      const deliveryCharge = Math.max(0, totalAmount - itemCharge);
      const msProfit = deliveryCharge - outsourceCharge;
      
      let balanceAmount = '';
      let balanceText = '';
      let status = '';
      
      const pMethod = String(paymentMethod).toUpperCase().trim();
      const isDriverCash = pMethod.includes('COD') || pMethod.includes('COP') || pMethod.includes('CASH');
      const isMSCash = pMethod.includes('ONLINE');
      
      if (isDriverCash) {
        balanceAmount = deliveryCharge.toString();
        balanceText = "Driver holds MS Cash";
        status = "Collect";
      } else if (isMSCash) {
        balanceAmount = outsourceCharge.toString();
        balanceText = "MS holds Driver Cash";
        status = "Pay";
      }

      csvContent += `${format(new Date(order.created_at), 'yyyy-MM-dd')},${order.order_number},${driverName},${clientName},${customerName},${deliveryLocation},${paymentMethod},${deliveryCharge},${outsourceCharge},${msProfit},${balanceAmount},"${balanceText}",${status}\n`;
    });

    // Section 2: Settlement Summary
    csvContent += "\nSettlement Summary\n";
    csvContent += "Outsource Name,Total Earned (By Outsource),Cash Held by Outsource,Cash Held by MS,Final Balance,Status (Pay/Collect)\n";

    settlementData.driverRows.forEach(driver => {
      csvContent += `${driver.name},${driver.earned},${driver.driverCash},${driver.msCash},${driver.netBalance},${driver.action}\n`;
    });

    // Create and download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `MS_Settlements_Master_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading settlement data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

        {/* Time Filter Tabs */}
        <div className="flex justify-center mb-6">
          <div className="bg-white border rounded-full p-1 shadow-sm inline-flex">
            {['week', 'month', 'year'].map((tab) => (
              <button
                key={tab}
                onClick={() => setTimeFilter(tab)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  timeFilter === tab 
                    ? 'bg-blue-600 text-white shadow' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}ly
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
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

          {/* Cash Held by Drivers */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-50 p-3 rounded-xl">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500 font-medium">Cash Held by Drivers</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(settlementData.cashHeldByDrivers)}</p>
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

        {/* Driver Ledger Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Driver Ledger</h2>
            <p className="text-sm text-gray-500 mt-1">Individual driver settlement details</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Settlement Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDriverRows.length > 0 ? (
                  filteredDriverRows.map((driver, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{driver.name}</td>
                      <td className="px-6 py-4 text-green-600 font-medium">{formatCurrency(driver.earned)}</td>
                      <td className="px-6 py-4 text-blue-600 font-medium">{formatCurrency(driver.driverCash)}</td>
                      <td className="px-6 py-4 text-purple-600 font-medium">{formatCurrency(driver.msCash)}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(driver.netBalance)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${driver.actionType === 'settled' ? 'bg-gray-100 text-gray-800' : driver.actionType === 'collect' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {driver.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {driver.actionType === 'collect' && (
                          <button className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                            Collect
                          </button>
                        )}
                        {driver.actionType === 'pay' && (
                          <button className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                            Pay
                          </button>
                        )}
                        {driver.actionType === 'settled' && (
                          <button className="bg-gray-200 text-gray-600 px-3 py-1 rounded-lg text-sm font-medium" disabled>
                            Settled
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      {searchTerm ? 'No drivers found matching your search' : 'No settlement data available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 p-3 rounded-xl">
                <Calculator className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Orders Processed</p>
                <p className="text-xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-3 rounded-xl">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Drivers</p>
                <p className="text-xl font-bold text-gray-900">{settlementData.driverRows.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-orange-50 p-3 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Settlements</p>
                <p className="text-xl font-bold text-gray-900">
                  {settlementData.driverRows.filter(d => d.actionType !== 'settled').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settlements;
