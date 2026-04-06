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
  total_order_amount: number; // total_order_amount
  outsource_charge: number; // outsource_charges
  item_charge?: number; // item_charge (may be missing/undefined)
  created_at: string;
  order_number: string;
  clients?: { name: string };
  outsources?: { name: string };
}

interface DriverSettlement {
  driverId: string;
  outsource_name: string;
  total_earned: number;
  cash_held_by_driver: number;
  base_balance: number;
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
  final_balance: number;
  delivery_count: number;
}

const Settlements: React.FC = () => {
  const [balances, setBalances] = useState<OutsourceBalance[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [outsources, setOutsources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('week');
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
  const [selectedOutsourceForModal, setSelectedOutsourceForModal] = useState<OutsourceBalance | null>(null);

  // Calculate max allowed amount for input validation
  const maxAllowed = selectedOutsourceForModal?.final_balance && selectedOutsourceForModal.final_balance > 0 
    ? selectedOutsourceForModal.final_balance 
    : Math.abs(selectedOutsourceForModal?.final_balance || 0);

  // Robust Financial Settlement Calculation
  const calculateOutsourceSettlement = (outsourceId: string, timePeriod: 'week' | 'month' | 'quarter'): DriverSettlement | null => {
    try {
      console.log(`🔍 Calculating settlement for outsource ${outsourceId}, period: ${timePeriod}`);
      console.log(`📊 Available orders: ${allOrders.length}, Available outsources: ${outsources.length}`);
      
      // Guard: Ensure we have data
      if (allOrders.length === 0 || outsources.length === 0) {
        console.log('⚠️ No orders or outsources available for calculation');
        return null;
      }
      
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

      const driverOrders = allOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return (
          order.driver_id === outsourceId &&
          order.order_status === 'COMPLETED' &&
          orderDate >= startDate &&
          orderDate <= now
        );
      });
      
      console.log(`📦 Found ${driverOrders.length} orders for outsource ${outsourceId}`);

      if (driverOrders.length === 0) {
        console.log(`⚠️ No orders found for outsource ${outsourceId} in period ${timePeriod}`);
        return null; // No orders for this driver in the period
      }

      // Step B: Calculate Total Earned - Sum of outsource_charge for ALL completed orders
      const total_earned = driverOrders.reduce((sum, order) => {
        const charge = Number(order.outsource_charge) || 0;
        if (isNaN(charge)) {
          console.warn(`Invalid outsource_charge for order ${order.id}: ${order.outsource_charge}`);
          return sum; // Skip invalid values
        }
        return sum + charge;
      }, 0);

      // Step C: Calculate Cash Held - Sum of delivery charges (Total Order Amount - Item Charge) ONLY for COD/COP orders
      const cash_held_by_driver = driverOrders.reduce((sum, order) => {
        const pMethod = String(order.payment_method || '').toUpperCase().trim();
        
        if (pMethod === 'COD' || pMethod === 'COP') {
          const total = Number(order.total_order_amount) || 0;
          const item = Number(order.item_charge) || 0; // Handle null by converting to 0
          const deliveryCharge = total - item;
          
          console.log(`💰 Order ${order.id}: ${pMethod}, Total: ${total}, Item: ${item}, Delivery: ${deliveryCharge}`);
          
          // Add to sum (prevent negative values if data is dirty)
          return sum + (deliveryCharge > 0 ? deliveryCharge : 0);
        }
        return sum;
      }, 0);
      
      console.log(`💰 Final cash held by driver: ${cash_held_by_driver}`);

      // Step D: Calculate Base Balance
      const base_balance = total_earned - cash_held_by_driver;

      // Get outsource name
      const outsource = outsources.find(o => o.id === outsourceId);
      const partner_name = outsource?.name || 'Unknown Partner';

      return {
        driverId: outsourceId,
        outsource_name: partner_name,
        total_earned,
        cash_held_by_driver,
        base_balance,
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
    console.log('🔄 Settlements component mounted - fetching initial data');
    // First fetch outsources, then fetch data that depends on outsources
    fetchOutsources().then(() => {
      console.log('📊 Outsources loaded, now fetching settlement data');
      fetchData();
    }).catch(error => {
      console.error('❌ Initial data fetch failed:', error);
      // Fallback: Try fetching data anyway
      fetchData();
    });
  }, []); // Run on initial mount

  // Fallback useEffect in case the first one fails
  useEffect(() => {
    // If after 3 seconds we still have no data, try again
    const timer = setTimeout(() => {
      if (balances.length === 0 && !loading) {
        console.log('⚠️ No data after 3 seconds, retrying...');
        handleRefresh();
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [balances.length, loading]);

  useEffect(() => {
    console.log('🔄 Period changed to:', selectedPeriod, ' - refetching data');
    // Ensure outsources are loaded before fetching settlement data
    if (outsources.length > 0) {
      fetchData();
    } else {
      console.log('⚠️ Outsources not loaded yet, fetching them first');
      fetchOutsources().then(() => {
        fetchData();
      });
    }
  }, [selectedPeriod, outsources.length]);

  // Add manual refresh function
  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setLoading(true);
    try {
      // First refresh outsources, then refresh settlement data
      await fetchOutsources();
      await fetchData();
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add test function to verify calculations
  const testCalculations = () => {
    console.log('🧪 Testing calculations...');
    console.log('📊 Current state:', {
      allOrdersCount: allOrders.length,
      outsourcesCount: outsources.length,
      balancesCount: balances.length,
      selectedPeriod
    });
    
    if (allOrders.length > 0) {
      console.log('📦 Sample orders:', allOrders.slice(0, 3).map(o => ({
        id: o.id,
        driver_id: o.driver_id,
        payment_method: o.payment_method,
        total_order_amount: o.total_order_amount
      })));
    }
    
    if (balances.length > 0) {
      console.log('💰 Current balances:', balances.map(b => ({
        name: b.outsource_name,
        cash_held: b.cash_held_by_driver,
        total_earned: b.total_earned
      })));
    }
  };

  const fetchOutsources = async () => {
    console.log('📊 Fetching outsources...');
    try {
      const { data } = await supabase.from('outsources').select('*').order('name');
      if (data) {
        console.log('✅ Outsources fetched:', data.length);
        setOutsources(data);
      } else {
        console.log('⚠️ No outsources found');
        setOutsources([]);
      }
    } catch (error) {
      console.error('❌ Error fetching outsources:', error);
      setOutsources([]);
    }
  };

  const fetchData = async () => {
    console.log('🔄 Starting settlement data fetch for period:', selectedPeriod);
    setLoading(true);
    setError(null);
    try {
      // Guard: Ensure outsources are loaded
      if (outsources.length === 0) {
        console.log('⚠️ Outsources not loaded, cannot fetch settlement data');
        setBalances([]);
        return;
      }
      
      // Add small delay to ensure loading state is visible
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('📊 Fetching orders and settlements...');
      console.log('Fetching settlement data for period:', selectedPeriod);
      
      // Fetch all orders with client and outsource details
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*, clients(name), outsources(name)')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      console.log('Fetched orders:', orders?.length || 0);

      // Fetch manual settlements from database
      const { data: settlements, error: settlementsError } = await supabase
        .from('settlements')
        .select('*')
        .order('created_at', { ascending: false });

      if (settlementsError) throw settlementsError;
      console.log('Fetched settlements:', settlements?.length || 0);

      if (orders) {
        // Convert to Order type with proper field mapping
        const processedOrders: Order[] = orders.map(order => ({
          id: order.id,
          driver_id: order.outsource_id || '',
          order_status: order.payment_status === 'Settled' ? 'COMPLETED' : 'COMPLETED', // For now, treat all as completed
          // Bulletproof payment mode mapping with debug logging
          payment_method: (() => {
            const rawMode = order.payment_mode || order.paymentMode || order['Payment Mode'] || '';
            const pMode = String(rawMode).toUpperCase().trim();
            console.log(`🔍 Order mapping payment mode: "${rawMode}" -> "${pMode}"`);
            
            if (pMode.includes('COD') || pMode === 'CASH ON DELIVERY') {
              return 'COD';
            } else if (pMode.includes('COP') || pMode === 'CASH ON PICKUP') {
              return 'COP';
            } else {
              return 'ONLINE';
            }
          })(),
          total_order_amount: Number(order.delivery_charges) || 0,
          outsource_charge: Number(order.outsource_charges) || 0,
          created_at: order.created_at,
          order_number: order.order_number,
          clients: order.clients,
          outsources: order.outsources
        }));

        setAllOrders(processedOrders);
        console.log('Processed orders:', processedOrders.length);

        // Calculate settlements for each outsource using the new logic
        const outsourceSettlements: OutsourceBalance[] = [];
        const uniqueOutsourceIds = [...new Set(processedOrders.map(order => order.driver_id).filter(Boolean))];
        console.log('Unique outsource IDs:', uniqueOutsourceIds.length);

        // Fallback: If no orders or no unique outsource IDs, show empty state
        if (processedOrders.length === 0 || uniqueOutsourceIds.length === 0) {
          console.log('⚠️ No orders or outsource IDs found, setting empty balances');
          setBalances([]);
          return;
        }

        for (const outsourceId of uniqueOutsourceIds) {
          const baseSettlement = calculateOutsourceSettlement(outsourceId, selectedPeriod);
          if (baseSettlement) {
            console.log(`Base settlement for outsource ${baseSettlement.outsource_name}:`, baseSettlement);
            
            // Calculate manual settlements for this outsource
            const outsourceManualSettlements = settlements?.filter(s => s.outsource_name === baseSettlement.outsource_name) || [];
            const totalManualSettlements = outsourceManualSettlements.reduce((sum, s) => {
              return sum + (s.type === 'Collection' ? s.amount : -s.amount);
            }, 0);

            // Calculate FINAL BALANCE: Base Balance + Manual Settlements
            const final_balance = baseSettlement.base_balance + totalManualSettlements;

            outsourceSettlements.push({
              outsource_id: baseSettlement.driverId,
              outsource_name: baseSettlement.outsource_name,
              total_earned: baseSettlement.total_earned,
              cash_held_by_driver: baseSettlement.cash_held_by_driver,
              final_balance,
              delivery_count: baseSettlement.completed_orders_count
            });
          } else {
            console.log(`No settlement data for outsource ID: ${outsourceId}`);
          }
        }

        console.log('Final outsource settlements:', outsourceSettlements.length);
        console.log('Outsource settlements data:', outsourceSettlements);
        
        // Always set balances, even if empty, to trigger re-render
        setBalances(outsourceSettlements);
        
        // Additional debug: Log cash held total
        const totalCashHeld = outsourceSettlements.reduce((sum, b) => sum + (b.cash_held_by_driver || 0), 0);
        console.log(`💰 Total cash held by all drivers: ${totalCashHeld}`);
        console.log(`💰 Dashboard card will show: ${formatCurrency(totalCashHeld)}`);
      }
    } catch (error: any) {
      console.error('Error fetching settlement data:', error);
      setError(error.message || 'Failed to fetch settlement data');
    } finally {
      console.log('✅ Settlement data fetch completed');
      setLoading(false);
    }
  };

  const exportMasterReport = () => {
    // Get all orders for combined report
    const allOrdersData = allOrders.map(order => {
      // Calculate values according to requirements
      const totalAmountReceived = order.total_order_amount || 0;
      const itemCharge = 0; // Default to 0 since not in current schema
      const deliveryCharge = totalAmountReceived - itemCharge;
      const outsourceCharges = order.outsource_charge || 0;
      const profit = deliveryCharge - outsourceCharges;
      
      // Calculate Receivable or Payable
      let receivableOrPayable = '';
      if (order.payment_method === 'ONLINE') {
        receivableOrPayable = `Pay ${outsourceCharges} to Outsource`;
      } else if (order.payment_method === 'COD' || order.payment_method === 'COP') {
        const collectAmount = totalAmountReceived - outsourceCharges;
        receivableOrPayable = `Collect ${collectAmount} from Outsource`;
      }

      return {
        'Order Date': new Date(order.created_at).toLocaleDateString(),
        'Order Number': order.order_number,
        'Client Name': order.clients?.name || 'Unknown',
        'Pickup Location': order.pickup_location || 'N/A',
        'Customer Name': order.customer_name || 'N/A',
        'Delivery Location': order.delivery_location || order.drop_location || 'N/A',
        'Customer Contact Number': order.customer_contact_number || order.customer_contact || 'N/A',
        'Payment Mode': order.payment_method,
        'Total Amount Received': totalAmountReceived,
        'Delivery Charge': deliveryCharge,
        'Item Charge': itemCharge,
        'Outsource Name': order.outsources?.name || 'Unassigned',
        'Outsource Charges': outsourceCharges,
        'Profit': profit,
        'Receivable or Payable': receivableOrPayable
      };
    });

    const ws = XLSX.utils.json_to_sheet(allOrdersData);
    
    // Set column widths according to the exact sequence
    ws['!cols'] = [
      { wch: 15 }, // Order Date
      { wch: 20 }, // Order Number
      { wch: 25 }, // Client Name
      { wch: 30 }, // Pickup Location
      { wch: 25 }, // Customer Name
      { wch: 30 }, // Delivery Location
      { wch: 20 }, // Customer Contact Number
      { wch: 15 }, // Payment Mode
      { wch: 20 }, // Total Amount Received
      { wch: 18 }, // Delivery Charge
      { wch: 15 }, // Item Charge
      { wch: 20 }, // Outsource Name
      { wch: 18 }, // Outsource Charges
      { wch: 15 }, // Profit
      { wch: 40 }, // Receivable or Payable
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Combined Outsource Report');
    XLSX.writeFile(wb, `MS_Delivery_Combined_Settlement_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportDriverLedger = (driverId: string, driverName: string) => {
    const driverOrders = allOrders.filter(o => 
      o.driver_id === driverId && 
      o.order_status === 'COMPLETED'
    );

    // Map orders to exact column requirements
    const driverOrdersData = driverOrders.map(order => {
      // Calculate values according to requirements
      const totalAmountReceived = order.total_order_amount || 0;
      const itemCharge = 0; // Default to 0 since not in current schema
      const deliveryCharge = totalAmountReceived - itemCharge;
      const outsourceCharges = order.outsource_charge || 0;
      const profit = deliveryCharge - outsourceCharges;
      
      // Calculate Receivable or Payable
      let receivableOrPayable = '';
      if (order.payment_method === 'ONLINE') {
        receivableOrPayable = `Pay ${outsourceCharges} to Outsource`;
      } else if (order.payment_method === 'COD' || order.payment_method === 'COP') {
        const collectAmount = totalAmountReceived - outsourceCharges;
        receivableOrPayable = `Collect ${collectAmount} from Outsource`;
      }

      return {
        'Order Date': new Date(order.created_at).toLocaleDateString(),
        'Order Number': order.order_number,
        'Client Name': order.clients?.name || 'Unknown',
        'Pickup Location': order.pickup_location || 'N/A',
        'Customer Name': order.customer_name || 'N/A',
        'Delivery Location': order.delivery_location || order.drop_location || 'N/A',
        'Customer Contact Number': order.customer_contact_number || order.customer_contact || 'N/A',
        'Payment Mode': order.payment_method,
        'Total Amount Received': totalAmountReceived,
        'Delivery Charge': deliveryCharge,
        'Item Charge': itemCharge,
        'Outsource Name': order.outsources?.name || 'Unassigned',
        'Outsource Charges': outsourceCharges,
        'Profit': profit,
        'Receivable or Payable': receivableOrPayable
      };
    });

    const ws = XLSX.utils.json_to_sheet(driverOrdersData);
    
    // Set column widths according to exact sequence
    ws['!cols'] = [
      { wch: 15 }, // Order Date
      { wch: 20 }, // Order Number
      { wch: 25 }, // Client Name
      { wch: 30 }, // Pickup Location
      { wch: 25 }, // Customer Name
      { wch: 30 }, // Delivery Location
      { wch: 20 }, // Customer Contact Number
      { wch: 15 }, // Payment Mode
      { wch: 20 }, // Total Amount Received
      { wch: 18 }, // Delivery Charge
      { wch: 15 }, // Item Charge
      { wch: 20 }, // Outsource Name
      { wch: 18 }, // Outsource Charges
      { wch: 15 }, // Profit
      { wch: 40 }, // Receivable or Payable
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Individual Outsource Report');
    XLSX.writeFile(wb, `Settlement_Report_${driverName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const handleSettlementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!selectedOutsourceForModal) {
        throw new Error('No outsource partner selected');
      }

      const partnerName = selectedOutsourceForModal.outsource_name;
      const currentBalance = selectedOutsourceForModal.final_balance || 0;
      const settlementAmount = newSettlement.amount;
      
      // Validate settlement amount
      if (!settlementAmount || settlementAmount <= 0) {
        throw new Error('Please enter a valid amount greater than 0');
      }
      
      // For collections (negative balance), allow amount up to absolute value of balance
      // For payments (positive balance), allow amount up to balance value
      const maxAllowed = newSettlement.type === 'Payout' ? currentBalance : Math.abs(currentBalance);
      
      if (newSettlement.type === 'Payout' && settlementAmount > currentBalance) {
        throw new Error(`Amount cannot exceed the balance of ${formatCurrency(currentBalance)}`);
      }
      if (newSettlement.type === 'Collection' && settlementAmount > Math.abs(currentBalance)) {
        throw new Error(`Amount cannot exceed the balance of ${formatCurrency(Math.abs(currentBalance))}`);
      }
      
      // Calculate new balance based on transaction type
      
      // Calculate new balance based on transaction type
      let newBalance: number;
      if (newSettlement.type === 'Payout') {
        // Business pays out: we owe them money (positive balance), so we reduce what we owe
        newBalance = currentBalance - settlementAmount;
      } else {
        // Business collects: they owe us money (negative balance), so we reduce what they owe
        newBalance = currentBalance + settlementAmount;
      }

      // Save settlement record to database
      console.log('Inserting settlement record:', {
        type: newSettlement.type,
        outsource_name: partnerName,
        amount: settlementAmount,
        payment_date: new Date().toISOString().split('T')[0],
        reference_number: newSettlement.reference_number,
        remark: newSettlement.remark
      });

      // Check if account is now settled
      const isNowSettled = Math.abs(newBalance) < 0.01;

      const { error: settlementError } = await supabase
        .from('settlements')
        .insert([{
          type: newSettlement.type,
          outsource_name: partnerName,
          amount: settlementAmount,
          payment_date: new Date().toISOString().split('T')[0],
          reference_number: newSettlement.reference_number || '',
          remark: newSettlement.remark || ''
        }]);

      if (settlementError) {
        console.error('Database insertion error:', settlementError);
        throw settlementError;
      }

      // Show success toast with new balance information
      const actionText = newSettlement.type === 'Payout' ? 'Paid to' : 'Collected from';
      const balanceStatus = isNowSettled ? 'Account now settled!' : `New balance: ${formatCurrency(Math.abs(newBalance))}`;
      
      setToastMessage(`${actionText} ${partnerName}: AED ${settlementAmount}. ${balanceStatus}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);

      // Close modal and reset state
      setIsModalOpen(false);
      setSelectedOutsourceForModal(null);
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
      let errorMessage = 'Failed to record settlement. Please try again.';
      
      if (error.message) {
        if (error.message.includes('No outsource partner selected')) {
          errorMessage = 'No partner selected. Please try again.';
        } else if (error.message.includes('duplicate key')) {
          errorMessage = 'Duplicate reference number. Please use a unique reference.';
        } else if (error.message.includes('foreign key')) {
          errorMessage = 'Invalid partner selected. Please try again.';
        } else if (error.message.includes('null value')) {
          errorMessage = 'Missing required fields. Please fill all fields.';
        } else {
          errorMessage = `Database error: ${error.message}`;
        }
      }
      
      setToastMessage(errorMessage);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  const filteredBalances = balances.filter(b => 
    b.outsource_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-gray-600 font-medium">Loading settlement data...</p>
          </div>
        </div>
      )}
      
      {/* Main Content - Only show when not loading */}
      {!loading && (
        <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Settlements</h1>
          <p className="text-gray-500 text-sm">Track cash flow between business and outsource partners.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportMasterReport}
            disabled={loading}
            className="bg-green-50 border border-green-200 text-green-700 px-6 py-3 rounded-xl font-bold hover:bg-green-100 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Download className="w-5 h-5" />
            </motion.div>
            Export Master Report
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
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Outsource Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Total Earned</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Cash Held by Outsource</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Final Balance</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Settlement Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Ledger</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
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
                      (b.final_balance || 0) > 0 ? "text-green-600" : (b.final_balance || 0) < 0 ? "text-red-600" : "text-gray-600"
                    )}>
                      {formatCurrency(Math.abs(b.final_balance || 0))}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <div className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold",
                          (b.final_balance || 0) > 0 
                            ? "bg-yellow-50 text-yellow-600 border border-yellow-200" 
                            : (b.final_balance || 0) < 0 
                              ? "bg-yellow-50 text-yellow-600 border border-yellow-200" 
                              : "bg-green-50 text-green-600 border border-green-200"
                        )}>
                          {(b.final_balance || 0) > 0 
                            ? "Pending" 
                            : (b.final_balance || 0) < 0 
                              ? "Pending" 
                              : "✓ Settled"
                          }
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => exportDriverLedger(b.outsource_id, b.outsource_name)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all"
                        >
                          <FileText className="w-3 h-3" />
                          Ledger
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        {(b.final_balance || 0) !== 0 && (
                          <button
                            onClick={() => {
                              setSelectedOutsourceForModal(b);
                              setNewSettlement({
                                type: (b.final_balance || 0) > 0 ? 'Payout' : 'Collection',
                                outsource_id: b.outsource_id,
                                amount: Math.abs(b.final_balance || 0),
                                reference_number: '',
                                remark: ''
                              });
                              setIsModalOpen(true);
                            }}
                            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                              (b.final_balance || 0) > 0 
                                ? 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200' 
                                : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                            }`}
                          >
                            {(b.final_balance || 0) > 0 ? (
                              <>
                                <ArrowUpCircle className="w-3 h-3" />
                                Pay
                              </>
                            ) : (
                              <>
                                <ArrowDownCircle className="w-3 h-3" />
                                Collect
                              </>
                            )}
                          </button>
                        )}
                        {(b.final_balance || 0) === 0 && (
                          <div className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 text-green-600 border border-green-200">
                            <CheckCircle2 className="w-3 h-3 inline mr-1" />
                            Settled
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredBalances.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">
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
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedOutsourceForModal?.final_balance && selectedOutsourceForModal.final_balance > 0 
                    ? 'Record Payment' 
                    : 'Record Collection'
                  }
                </h2>
                <button onClick={() => {
                  setIsModalOpen(false);
                  setSelectedOutsourceForModal(null);
                }} className="p-2 hover:bg-white rounded-xl text-gray-400">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSettlementSubmit} className="p-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm font-medium text-gray-700">Partner</p>
                  <p className="text-lg font-bold text-gray-900">{selectedOutsourceForModal?.outsource_name}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm font-medium text-gray-700">Current Balance</p>
                  <p className={`text-lg font-bold ${
                    (selectedOutsourceForModal?.final_balance || 0) > 0 
                      ? 'text-green-600' 
                      : (selectedOutsourceForModal?.final_balance || 0) < 0 
                        ? 'text-red-600' 
                        : 'text-gray-600'
                  }`}>
                    {formatCurrency(Math.abs(selectedOutsourceForModal?.final_balance || 0))}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(selectedOutsourceForModal?.final_balance || 0) > 0 
                      ? 'Business needs to pay this amount' 
                      : (selectedOutsourceForModal?.final_balance || 0) < 0 
                        ? 'Business needs to collect this amount' 
                        : 'Account settled'
                    }
                  </p>
                </div>
                
                <input type="hidden" name="type" value={newSettlement.type} />
                <input type="hidden" name="outsource_id" value={newSettlement.outsource_id} />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    {selectedOutsourceForModal?.final_balance && selectedOutsourceForModal.final_balance > 0 
                      ? 'Payment Amount (AED)' 
                      : 'Collection Amount (AED)'
                    }
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    max={maxAllowed}
                    value={newSettlement.amount}
                    onChange={(e) => setNewSettlement({ ...newSettlement, amount: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder={`Max: ${formatCurrency(maxAllowed)}`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    New balance will be: {formatCurrency(Math.abs((selectedOutsourceForModal?.final_balance || 0) - (selectedOutsourceForModal?.final_balance && selectedOutsourceForModal.final_balance > 0 ? newSettlement.amount : -newSettlement.amount)))}
                  </p>
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
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg mt-4 ${
                    selectedOutsourceForModal?.final_balance && selectedOutsourceForModal.final_balance > 0
                      ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-200'
                      : 'bg-red-600 text-white hover:bg-red-700 shadow-red-200'
                  }`}
                >
                  {selectedOutsourceForModal?.final_balance && selectedOutsourceForModal.final_balance > 0 
                    ? 'Record Payment' 
                    : 'Record Collection'
                  }
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
        </>
      )}
    </div>
  );
};

export default Settlements;
