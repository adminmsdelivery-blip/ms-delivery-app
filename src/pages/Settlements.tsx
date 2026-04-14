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
  settlement_status?: string;
  settlement_amount?: number;
}

// Outsource Driver Interface
interface OutsourceDriver {
  name: string;
  cashHeldByOutsource: number;
  actualEarning: number;
  cashHeldByMS: number;
  actualEarningMS: number;
  settlementAmount: number;
  paidCollectedAmount: number;
  totalPaidSoFar?: number; // Track total payments made
  isSettled: boolean; // Track settlement state
  statusText: string; // Status text for display
  status: 'Pay to Outsource' | 'Collect from Outsource' | 'Settled' | 'Collected' | 'Paid to Outsource' | 'Partial Paid' | 'Partial Collected';
}

// Settlement Data Interface
interface SettlementData {
  cashHeldByOutsource: number;
  actualEarning: number;
  cashHeldByMS: number;
  actualEarningMS: number;
  drivers: OutsourceDriver[];
}

const Settlements: React.FC = () => {
  // State & Data Fetching
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year' | 'all'>('all');

  // Modal State Management
  const [selectedDriver, setSelectedDriver] = useState<OutsourceDriver | null>(null);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [isSettling, setIsSettling] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
  }, [refreshTrigger]); // Add refreshTrigger to dependency array

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

  // Core Accounting Rules & Math Engine (useMemo)
  const settlementData: SettlementData = useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) {
      return {
        cashHeldByOutsource: 0,
        actualEarning: 0,
        cashHeldByMS: 0,
        actualEarningMS: 0,
        drivers: []
      };
    }

    const driverMap: Record<string, OutsourceDriver> = {};
    let cashHeldByOutsource = 0;
    let actualEarning = 0;
    let cashHeldByMS = 0;
    let actualEarningMS = 0;

    // Map through orders and calculate per-driver aggregates
    filteredOrders.forEach(order => {
      // 1. Safe Parsing with strict database keys
      const driverName = order.outsources?.name || order.outsource_name || 'Unknown Driver';
      const pMethod = String(order.payment_mode || '').toUpperCase().trim();
      const isDriverCash = pMethod.includes('COD') || pMethod.includes('COP') || pMethod.includes('CASH');
      const isMSCash = pMethod.includes('ONLINE');
      
      const totalAmount = Number(order.total_amount_received) || 0;
      const itemCharge = Number(order.item_charge) || 0;
      const outsourceCharge = Number(order.outsource_charges) || 0;
      const paidOnThisOrder = Number(order.amount_paid) || 0; // Calculate from amount_paid column
      
      // 2. Base Order Calculations
      const deliveryCharge = Math.max(0, totalAmount - itemCharge);
      const msEarning = deliveryCharge - outsourceCharge; // MS profit

      // 3. Cash Holdings (Physical Location of Funds)
      if (isDriverCash) {
        cashHeldByOutsource += deliveryCharge; // Driver holds delivery cash
      } else if (isMSCash) {
        cashHeldByMS += deliveryCharge; // MS holds delivery cash
      }

      actualEarning += outsourceCharge;
      actualEarningMS += msEarning;

      // 4. Initialize driver if not exists
      if (!driverMap[driverName]) {
        driverMap[driverName] = {
          name: driverName,
          cashHeldByOutsource: 0,
          actualEarning: 0,
          cashHeldByMS: 0,
          actualEarningMS: 0,
          settlementAmount: 0,
          paidCollectedAmount: 0,
          totalPaidSoFar: 0,
          isSettled: false,
          statusText: "Settled",
          status: 'Pay to Outsource'
        };
      }

      // Update driver aggregates
      driverMap[driverName].cashHeldByOutsource += isDriverCash ? deliveryCharge : 0;
      driverMap[driverName].actualEarning += outsourceCharge;
      driverMap[driverName].cashHeldByMS += isMSCash ? deliveryCharge : 0;
      driverMap[driverName].actualEarningMS += msEarning;
      driverMap[driverName].totalPaidSoFar += paidOnThisOrder; // Add amount from this order
    });

    // 5. Calculate Settlement Status and Amounts with Dynamic Cash Shift
    const driverRows = Object.values(driverMap).map(driver => {
      // 1. Initial State
      const initialDriverCash = driver.cashHeldByOutsource;
      const initialMsCash = driver.cashHeldByMS;
      const driverEarned = driver.actualEarning;
      const msEarned = driver.actualEarningMS;

      const initialDebt = Math.abs(initialDriverCash - driverEarned);
      const amountPaid = Number(driver.totalPaidSoFar) || 0;
      const remainingBalance = Math.max(0, initialDebt - amountPaid);

      // Bulletproof zero check with epsilon threshold for floating point precision
      const epsilon = 0.001; // One-tenth of a cent
      const isSettled = Math.abs(remainingBalance) < epsilon; // Use absolute value for safety

      // 2. The Dynamic Cash Shift
      let finalDriverCash = initialDriverCash;
      let finalMsCash = initialMsCash;
      let statusText = "";

      if (initialDriverCash > driverEarned) {
        // Driver owed MS -> Driver paid MS
        finalDriverCash -= amountPaid;
        finalMsCash += amountPaid;

        if (isSettled && amountPaid > 0) {
          statusText = "Collected from Outsource";
        } else if (amountPaid > 0) {
          statusText = "Partial Collected";
        } else {
          statusText = "Collect from Outsource";
        }

      } else if (driverEarned > initialDriverCash) {
        // MS owed Driver -> MS paid Driver
        finalDriverCash += amountPaid;
        finalMsCash -= amountPaid;

        if (isSettled) statusText = "Settled";
        else if (amountPaid > 0) statusText = "Partial Paid";
        else statusText = "Pay to Outsource";
        
      } else {
        statusText = "Settled"; // Started at 0 debt
      }

      // 3. Formatting PAID/COLLECTED Column
      let displayAmount = "-";
      if (isSettled) {
        displayAmount = "-"; 
      } else if (amountPaid > 0) {
        displayAmount = `AED ${amountPaid.toFixed(2)}`; // Show partial amount paid so far
      } else {
        displayAmount = "None";
      }

      return {
        name: driver.name,
        cashHeldByOutsource: finalDriverCash, // Passing shifted cash
        actualEarning: driverEarned,
        cashHeldByMS: finalMsCash,          // Passing shifted cash
        actualEarningMS: msEarned,
        settlementAmount: remainingBalance,
        paidCollectedAmount: amountPaid,
        statusText: statusText as any,
        isSettled: isSettled
      };
    });

    return {
      cashHeldByOutsource,
      actualEarning,
      cashHeldByMS,
      actualEarningMS,
      drivers: driverRows
    };
  }, [filteredOrders]);

  // Hard console log for debugging table data
  console.log("CURRENT TABLE DATA:", settlementData);

  // Modal Handlers
  const openSettlementModal = (driver: OutsourceDriver) => {
    setSelectedDriver(driver);
    setSettlementAmount(driver.settlementAmount > 0 ? driver.settlementAmount.toString() : '');
  };

  const closeSettlementModal = () => {
    setSelectedDriver(null);
    setSettlementAmount('');
  };

  const handleProcessSettlement = async () => {
    if (!selectedDriver || !settlementAmount) return;
    setIsSettling(true);
    
    try {
      console.log("--- STARTING PAYMENT SAVE ---");
      console.log("1. Target Driver:", selectedDriver);
      console.log("2. Payment Amount to Apply:", settlementAmount);

      const paymentAmount = parseFloat(settlementAmount);
      
      // 1. Fetch all pending orders for this specific driver
      const { data: pendingOrders, error: fetchError } = await supabase
        .from('orders')
        .select('*, outsources(name)')
        .neq('settlement_status', 'Settled');

      if (fetchError) throw fetchError;
      
      // Filter down to just this driver's orders in JavaScript to avoid Supabase .or() syntax bugs
      const driverOrders = pendingOrders.filter(order => {
        const oName = order.outsources?.name || order.outsource_name;
        return oName === selectedDriver.name;
      });

      console.log("3. Pending Orders Found for this driver:", driverOrders);

      if (!driverOrders || driverOrders.length === 0) {
        console.error("CRITICAL ERROR: No pending orders found for this driver in the database!");
        alert("Error: Could not find any pending orders to apply this payment to.");
        return;
      }

      let remainingPayment = paymentAmount;

      // 2. Distribute payment across their pending orders
      for (const order of driverOrders) {
        if (remainingPayment <= 0) break;
        
        console.log(`4. Processing Order ID: ${order.id} | Remaining Payment to distribute: ${remainingPayment}`);
        
        // Calculate what this specific order needs to be settled
        const deliveryCharge = Number(order.total_amount_received || 0) - Number(order.item_charge || 0);
        const msProfit = deliveryCharge - Number(order.outsource_charges || 0);
        
        const pMethod = String(order.payment_mode || '').toUpperCase();
        const isDriverCash = pMethod.includes('COD') || pMethod.includes('COP') || pMethod.includes('CASH');
        
        // How much debt is attached to this specific order?
        let orderDebt = 0;
        if (isDriverCash) orderDebt = msProfit; // Driver owes MS
        else orderDebt = Number(order.outsource_charges || 0); // MS owes Driver

        const alreadyPaidOnOrder = Number(order.amount_paid || 0);
        const unpaidOnOrder = Math.max(0, orderDebt - alreadyPaidOnOrder);

        console.log(`5. Order Debt Analysis - ID: ${order.id}, Total Debt: ${orderDebt}, Already Paid: ${alreadyPaidOnOrder}, Unpaid: ${unpaidOnOrder}`);

        if (unpaidOnOrder > 0) {
          const paymentToApply = Math.min(remainingPayment, unpaidOnOrder);
          const newTotalPaid = alreadyPaidOnOrder + paymentToApply;
          
          // If order is now fully paid off, mark it Settled
          const newStatus = (newTotalPaid >= orderDebt) ? 'Settled' : order.settlement_status;

          console.log(`6. Attempting to update Supabase -> Order ID: ${order.id}, New amount_paid: ${newTotalPaid}, New Status: ${newStatus}`);

          // 3. Update specific order in Supabase
          const { error: updateError } = await supabase
            .from('orders')
            .update({ 
              amount_paid: newTotalPaid,
              settlement_status: newStatus 
            })
            .eq('id', order.id);

          if (updateError) {
            console.error("SUPABASE UPDATE REJECTED:", updateError);
            throw updateError;
          }
          
          console.log("7. Order successfully updated in database!");
          remainingPayment -= paymentToApply;
        }
      }

      console.log("--- PAYMENT SAVE COMPLETE ---");
      alert("Payment saved successfully!");
      closeSettlementModal();
      
      // TRIGGER AUTOMATIC REFRESH
      setRefreshTrigger(prev => prev + 1); // Increment trigger to force useEffect to refetch data
      console.log("8. Triggering automatic data refetch...");
      
    } catch (error) {
      console.error("SAVE FUNCTION CRASHED:", error);
      alert(`Failed to save payment: ${error.message}`);
    } finally {
      setIsSettling(false);
    }
  };

  // CSV Export Logic
  const exportMasterReport = () => {
    let csvContent = '';

    // Section 1: Line-by-Line Audit with 15 detailed columns
    
    const detailedExportData = filteredOrders.map(order => {
      // 1. Force strict local math calculation
      const totalReceived = Number(order.total_amount_received || 0);
      const itemCharge = Number(order.item_charge || 0);
      const outsourceCharge = Number(order.outsource_charges || 0);
      const amountPaid = Number(order.amount_paid || 0);

      const calcDeliveryCharge = totalReceived - itemCharge;
      const calcProfit = calcDeliveryCharge - outsourceCharge;

      const pMethod = String(order.payment_mode || '').toUpperCase();
      const isDriverCash = pMethod.includes('COD') || pMethod.includes('COP') || pMethod.includes('CASH');

      // Calculate holdings for this order
      const outsourceHolding = isDriverCash ? calcDeliveryCharge : 0;
      const msHolding = !isDriverCash ? calcDeliveryCharge : 0;

      // Calculate remaining settlement amount for this order
      let orderDebt = 0;
      let actionDirection = "-";

      if (isDriverCash) {
        orderDebt = calcProfit; 
        actionDirection = "COLLECT"; // Driver has the cash, MS must collect profit
      } else {
        orderDebt = outsourceCharge;       
        actionDirection = "PAY"; // MS has the cash, MS must pay the driver fee
      }

      // Calculate remaining settlement amount for this order
      const remainingSettlement = Math.max(0, orderDebt - amountPaid);
      const finalActionLabel = remainingSettlement > 0 ? actionDirection : "-";

    return {
      "Order Number": order.order_number || order.tracking_number || "N/A",
      "Total Amount Received": totalReceived.toFixed(2),
      "Item Charge": itemCharge.toFixed(2),
      "Delivery Charges": calcDeliveryCharge.toFixed(2),
      "Outsource Charges": outsourceCharge.toFixed(2),
      "Total Outsource holdings": outsourceHolding.toFixed(2),
      "Total MS holding": msHolding.toFixed(2),
      "MS Profit": calcProfit.toFixed(2), 
      "Settlement Amount": remainingSettlement.toFixed(2),
      "Pay/Collect": finalActionLabel,
      "Settlement Status": order.settlement_status || "Pending"
    };
  }); // <-- Your bottom brackets should now be happy and have no red squigglies!

    // Convert detailedExportData to CSV format
    const headers = Object.keys(detailedExportData[0] || []);
    csvContent += headers.join(',') + '\n';
    
    detailedExportData.forEach(row => {
      const values = headers.map(header => row[header] || 'N/A');
      csvContent += values.join(',') + '\n';
    });

    // Section 2: Monthly Settlement Summary
    csvContent += '\nMonthly Settlement Summary\n';
    csvContent += 'Outsource Name,Cash Held by Outsource,Actual Earning (Outsource),Cash Held by MS,Actual Earning (MS),Total Settlement Amount,Settlement Status,PAID/COLLECTED Details\n';
    
    settlementData.drivers.forEach(driver => {
      // 1. Determine Settlement Status
      const csvSettlementStatus = driver.isSettled ? "Settled" : "Pending";

      // 2. Determine exact PAID/COLLECTED text
      let csvPaidDetails = "None";
      if (driver.paidCollectedAmount && driver.paidCollectedAmount > 0) {
        // Check the statusText to see which direction the money flowed
        const actionWord = driver.statusText.includes("Collect") ? "COLLECTED" : "PAID";
        
        if (driver.isSettled) {
          csvPaidDetails = `AED ${driver.paidCollectedAmount} ${actionWord}`;
        } else {
          csvPaidDetails = `AED ${driver.paidCollectedAmount} ${actionWord} (Bal: AED ${driver.settlementAmount})`;
        }
      }
      
      csvContent += `${driver.name},${formatCurrency(driver.cashHeldByOutsource)},${formatCurrency(driver.actualEarning)},${formatCurrency(driver.cashHeldByMS)},${formatCurrency(driver.actualEarningMS)},${formatCurrency(driver.settlementAmount)},${csvSettlementStatus},${csvPaidDetails}\n`;
    });

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `settlement-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-4 text-gray-600">Loading settlement data...</p>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-600 mb-2">Database Error</h3>
          <p className="text-gray-600">{dbError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#442DD8] text-white rounded-lg hover:bg-[#3925b8] transition-colors"
          >
            Retry
          </button>
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
                    ? 'bg-[#442DD8] text-white shadow' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab === 'all' ? 'All Time' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Live Cash Drawer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Cash Held by Outsource</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(settlementData.cashHeldByOutsource)}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <Scale className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Actual Earning (Outsource)</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(settlementData.actualEarning)}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Cash Held by MS</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(settlementData.cashHeldByMS)}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Actual Earning (MS)</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(settlementData.actualEarningMS)}</p>
            </div>
          </div>
        </div>

        {/* Outsource Ledger Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Scale className="w-6 h-6 text-blue-600" />
              Outsource Ledger
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outsource Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Held by Outsource</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Earning (Outsource)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Held by MS</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Earning (MS)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Settlement Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PAID/COLLECTED</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {settlementData.drivers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No settlement data available
                    </td>
                  </tr>
                ) : (
                  settlementData.drivers.map((row, index) => (
                    <tr key={row.name} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(row.cashHeldByOutsource)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(row.actualEarning)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(row.cashHeldByMS)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(row.actualEarningMS)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(row.settlementAmount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.paidCollectedAmount > 0 ? row.paidCollectedAmount : row.paidCollectedAmount}
                      </td>
                      {/* The Clean Status Cell */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          row.isSettled ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {row.isSettled && row.cashHeldByOutsource > row.actualEarning ? "Collected from Outsource" : 
                           row.isSettled && row.actualEarning > row.cashHeldByOutsource ? "Paid to Outsource" : 
                           row.statusText}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {/* 2. The Action Button (Hard-Locked) */}
                        <button 
                          onClick={() => openSettlementModal(row)}
                          disabled={row.isSettled === true}
                          className={`px-4 py-2 rounded font-medium transition-colors ${
                            row.isSettled === true
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed opacity-70' 
                              : 'bg-[#442DD8] text-white hover:bg-[#3925b8]'
                          }`}
                        >
                          {row.isSettled ? "Settled" : "Collect/Pay"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Settlement Modal */}
        {selectedDriver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* Header */}
              <div className={`px-6 py-4 border-b ${
                selectedDriver.status === 'Pay to Outsource' ? 'bg-red-50' : 'bg-blue-50'
              }`}>
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedDriver.status === 'Pay to Outsource' ? `Pay to ${selectedDriver.name}` : `Collect from ${selectedDriver.name}`}
                </h3>
              </div>
              
              {/* Body */}
              <div className="p-6">
                <div className="flex justify-between mb-4 text-sm text-gray-600">
                  <span>Current Settlement Amount:</span>
                  <span className={`font-bold ${
                    selectedDriver.status === 'Pay to Outsource' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {formatCurrency(selectedDriver.settlementAmount)}
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
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg font-semibold"
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
                    selectedDriver.status === 'Pay to Outsource' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-[#442DD8] hover:bg-[#3925b8]'
                  } disabled:opacity-50`}
                >
                  {isSettling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {selectedDriver.status === 'Pay to Outsource' ? 'Pay' : 'Collect'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settlements;
