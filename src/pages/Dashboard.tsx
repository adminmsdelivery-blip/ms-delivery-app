import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  ArrowUpRight,
  ChevronRight,
  Calendar,
  BarChart3,
  Wallet
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfDay, startOfWeek, startOfMonth, subDays, subWeeks, subMonths } from 'date-fns';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    netProfit: 0,
    totalOrders: 0,
    activeClients: 0,
    cashHeldByOutsource: 0
  });
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [salesPeriod, setSalesPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [salesLoading, setSalesLoading] = useState(true);
  const [previousStats, setPreviousStats] = useState({
    totalRevenue: 0,
    netProfit: 0,
    totalOrders: 0
  });

  const fetchPreviousPeriodData = async () => {
    try {
      const now = new Date();
      let startDate: Date;
      
      switch (salesPeriod) {
        case 'daily':
          // Previous day (yesterday)
          startDate = subDays(now, 1);
          break;
        case 'weekly':
          // Previous week (7-14 days ago)
          startDate = subDays(now, 14);
          break;
        case 'monthly':
          // Previous month (30-60 days ago)
          startDate = subDays(now, 60);
          break;
      }

      const { data: previousOrders } = await supabase
        .from('orders')
        .select('delivery_charges, estimated_profit')
        .gte('order_date', startDate.toISOString())
        .lt('order_date', startDate.toISOString())
        .order('order_date', { ascending: true });

      if (previousOrders) {
        const prevRevenue = previousOrders.reduce((acc, curr) => acc + (Number(curr.delivery_charges) || 0), 0);
        const prevProfit = previousOrders.reduce((acc, curr) => acc + (Number(curr.estimated_profit) || 0), 0);
        const prevOrders = previousOrders.length;

        setPreviousStats({
          totalRevenue: prevRevenue,
          netProfit: prevProfit,
          totalOrders: prevOrders
        });
      }
    } catch (error) {
      console.error('Error fetching previous period data:', error);
    }
  };

  const calculateGrowth = (current: number, previous: number): { percentage: number; isPositive: boolean; display: string } => {
    const currentValue = Number(current) || 0;
    const previousValue = Number(previous) || 0;
    
    console.log("DEBUG - Current:", currentValue, "Previous:", previousValue);
    
    if (previousValue === 0) {
      return { 
        percentage: currentValue > 0 ? 100 : 0, 
        isPositive: currentValue > 0, 
        display: currentValue > 0 ? 'New' : '0%' 
      };
    }
    
    const change = currentValue - previousValue;
    const percentage = previousValue > 0 ? (change / previousValue) * 100 : 100;
    const isPositive = change >= 0;
    
    return {
      percentage: Math.abs(Math.round(percentage * 10) / 10),
      isPositive,
      display: isPositive ? `+${Math.round(percentage * 10) / 10}%` : `-${Math.round(percentage * 10) / 10}%`
    };
  };

  const fetchSalesData = async () => {
    setSalesLoading(true);
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('delivery_charges, order_date')
        .not('delivery_charges', 'is', null)
        .order('order_date', { ascending: true });

      if (error) throw error;

      console.log("RAW ORDERS:", orders);

      let processedData: any[] = [];
      const now = new Date();

      if (salesPeriod === 'daily') {
        // Group by hour for current date
        const todayOrders = orders?.filter(order => {
          const orderDate = new Date(order.order_date);
          console.log("Order date from DB:", order.order_date, "Parsed to:", orderDate);
          return orderDate.toDateString() === now.toDateString();
        }) || [];

        const hourlyData = Array.from({ length: 24 }, (_, hour) => {
          const hourOrders = todayOrders.filter(order => {
            const orderHour = new Date(order.order_date).getHours();
            return orderHour === hour;
          });
          
          const totalRevenue = hourOrders.reduce((sum, order) => 
            sum + (Number(order.delivery_charges) || 0), 0
          );

          return {
            label: `${hour.toString().padStart(2, '0')}:00`,
            value: totalRevenue,
            hour
          };
        });

        processedData = hourlyData.filter(item => item.value > 0 || item.hour === now.getHours());
      } else if (salesPeriod === 'weekly') {
        // Group by day for last 7 days
        const weekAgo = subDays(now, 7);
        const weekOrders = orders?.filter(order => {
          const orderDate = new Date(order.order_date);
          return orderDate >= weekAgo;
        }) || [];

        const dailyData = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(now, 6 - i);
          const dayOrders = weekOrders.filter(order => {
            const orderDate = new Date(order.order_date);
            return orderDate.toDateString() === date.toDateString();
          });

          const totalRevenue = dayOrders.reduce((sum, order) => 
            sum + (Number(order.delivery_charges) || 0), 0
          );

          return {
            label: format(date, 'EEE'),
            value: totalRevenue,
            date: format(date, 'MMM dd')
          };
        });

        processedData = dailyData;
      } else {
        // Group by date for current month
        const monthStart = startOfMonth(now);
        const monthOrders = orders?.filter(order => {
          const orderDate = new Date(order.order_date);
          return orderDate >= monthStart;
        }) || [];

        const dailyData = Array.from({ length: now.getDate() }, (_, i) => {
          const date = new Date(now.getFullYear(), now.getMonth(), i + 1);
          const dayOrders = monthOrders.filter(order => {
            const orderDate = new Date(order.order_date);
            return orderDate.toDateString() === date.toDateString();
          });

          const totalRevenue = dayOrders.reduce((sum, order) => 
            sum + (Number(order.delivery_charges) || 0), 0
          );

          return {
            label: (i + 1).toString(),
            value: totalRevenue,
            date: format(date, 'MMM dd')
          };
        });

        processedData = dailyData;
      }

      console.log("GRAPH DATA:", processedData);
      setSalesData(processedData);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setSalesLoading(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log("🔍 Fetching dashboard stats...");
        const { data: orders, error } = await supabase.from('orders').select('id, delivery_charges, estimated_profit, payment_mode, total_amount_received, item_charge, outsource_charges');
        const { count: clientCount } = await supabase.from('clients').select('*', { count: 'exact', head: true });

        console.log("📊 Raw orders data:", orders);
        console.log("👥 Client count:", clientCount);

        if (error) {
          console.error("❌ Database error:", error);
          throw error;
        }

        if (orders) {
          // Debug payment modes
          const paymentModes = orders.map(o => ({ payment_mode: o.payment_mode, normalized: String(o.payment_mode || '').toUpperCase().trim() }));
          console.log("💳 Payment modes found:", paymentModes);

          // Bulletproof cash held by outsource calculation
          const outsourceHeldTotal = orders.reduce((sum, order) => {
            // 1. Safely extract the payment mode, handling potential key variations
            const rawMode = order.payment_mode || '';
            const pMode = String(rawMode).toUpperCase().trim();
            
            console.log(`🔍 Order payment mode: "${rawMode}" -> "${pMode}"`);
            
            // 2. Check if it's cash collected by the driver
            const isDriverCash = pMode === 'COD' || pMode === 'COP';
            
            console.log(`💰 Is driver cash: ${isDriverCash}`);
            
            // 3. Calculate the delivery charge (Total Received - Item Charge)
            if (isDriverCash) {
              const totalReceived = Number(order.total_amount_received) || 0;
              const itemCharge = Number(order.item_charge) || 0;
              const deliveryCharge = totalReceived - itemCharge;
              console.log(`💵 Delivery charge: ${totalReceived} - ${itemCharge} = ${deliveryCharge}`);
              return sum + deliveryCharge;
            }
            
            return sum;
          }, 0);

          console.log(`💰 Final outsource held total: ${outsourceHeldTotal}`);

          // Bulletproof Total Revenue Calculation
          const revenue = orders.reduce((sum, order) => {
            console.log(`🔍 Calculating revenue for order ${order.id}:`, {
              delivery_charges: order.delivery_charges,
              total_amount_received: order.total_amount_received,
              item_charge: order.item_charge
            });
            
            // Method 1: Try to use delivery_charges if available and valid
            const deliveryCharge = Number(order.delivery_charges);
            if (!isNaN(deliveryCharge) && deliveryCharge > 0) {
              console.log(`💰 Using delivery_charges: ${deliveryCharge}`);
              return sum + deliveryCharge;
            }
            
            // Method 2: Calculate on the fly (Total Received - Item Charge)
            const totalReceived = Number(order.total_amount_received) || 0;
            const itemCharge = Number(order.item_charge) || 0;
            const calculatedDeliveryCharge = totalReceived - itemCharge;
            
            if (calculatedDeliveryCharge > 0) {
              console.log(`💰 Calculated delivery charge: ${totalReceived} - ${itemCharge} = ${calculatedDeliveryCharge}`);
              return sum + calculatedDeliveryCharge;
            }
            
            console.log(`⚠️ No valid revenue for order ${order.id}`);
            return sum;
          }, 0);
          
          console.log(`💰 Final calculated revenue: ${revenue}`);
          
          // Bulletproof Net Profit Calculation
          // First calculate total outsource costs
          const totalOutsourceCosts = orders.reduce((sum, order) => {
            const outsourceCharge = Number(order.outsource_charges) || 0;
            console.log(`🏢 Outsource charge for order ${order.id}: ${outsourceCharge}`);
            return sum + outsourceCharge;
          }, 0);
          
          console.log(`🏢 Total outsource costs: ${totalOutsourceCosts}`);
          
          // Calculate profit as Revenue - Outsource Costs
          const profit = revenue - totalOutsourceCosts;
          
          console.log(`📊 Profit calculation: ${revenue} - ${totalOutsourceCosts} = ${profit}`);
          
          const newStats = {
            totalRevenue: revenue,
            netProfit: profit,
            totalOrders: orders.length,
            activeClients: clientCount || 0,
            cashHeldByOutsource: outsourceHeldTotal
          };
          
          console.log("📈 New stats:", newStats);
          setStats(newStats);
        }
      } catch (error) {
        console.error('❌ Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    const refreshData = () => {
      console.log("🔄 Refreshing dashboard data...");
      fetchStats();
      fetchSalesData();
      fetchPreviousPeriodData();
    };

    refreshData();
  }, []);

  useEffect(() => {
    console.log("🔄 Sales period changed to:", salesPeriod);
    fetchSalesData();
    fetchPreviousPeriodData();
  }, [salesPeriod]);

  const kpiCards = [
    { 
      title: 'Total Revenue', 
      value: formatCurrency(stats.totalRevenue), 
      icon: DollarSign, 
      color: 'from-success-500 to-success-600',
      isPositive: true
    },
    { 
      title: 'Net Profit', 
      value: formatCurrency(stats.netProfit), 
      icon: TrendingUp, 
      color: 'from-primary-500 to-primary-600',
      isPositive: stats.netProfit >= 0
    },
    { 
      title: 'Total Orders', 
      value: stats.totalOrders.toLocaleString(), 
      icon: Package, 
      color: 'from-warning-500 to-warning-600',
      isPositive: true
    },
    { 
      title: 'Cash Held by Outsource', 
      value: formatCurrency(stats.cashHeldByOutsource), 
      icon: Wallet, 
      color: 'from-error-500 to-error-600',
      isPositive: stats.cashHeldByOutsource >= 0
    },
    { 
      title: 'Active Clients', 
      value: stats.activeClients.toLocaleString(), 
      icon: Users, 
      color: 'from-secondary-500 to-secondary-600',
      isPositive: true
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-neutral-900 tracking-tight mb-2">
          Delivery Dashboard
        </h1>
        <p className="text-neutral-600 text-lg">
          Manage your delivery operations efficiently
        </p>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCards.map((card, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={card.title}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${card.color}`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  card.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className="w-4 h-4" />
                  <span>+12%</span>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
            </motion.div>
        ))}
      </div>

      {/* Sales Analytics Graph */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Sales Analytics
            </h2>
            <p className="text-sm text-gray-500 mt-1">Total Sales Revenue by Period</p>
          </div>
          
          {/* Period Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSalesPeriod('daily')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                salesPeriod === 'daily'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setSalesPeriod('weekly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                salesPeriod === 'weekly'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setSalesPeriod('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                salesPeriod === 'monthly'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-80">
          {salesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : salesData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <BarChart3 className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">No sales recorded for this period</p>
              <p className="text-xs mt-1">Try selecting a different time period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `AED ${value.toLocaleString()}`}
                />
                <Tooltip 
                  formatter={(value: number) => [`AED ${value.toLocaleString()}`, 'Revenue']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.date || label;
                    }
                    return label;
                  }}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#6366f1" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>
    </>
  );
};

// Helper for class merging
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default Dashboard;
