import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  ArrowUpRight,
  ChevronRight,
  Calendar,
  BarChart3
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfDay, startOfWeek, startOfMonth, subDays, subWeeks, subMonths } from 'date-fns';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    netProfit: 0,
    totalOrders: 0,
    activeClients: 0
  });
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [salesPeriod, setSalesPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [salesLoading, setSalesLoading] = useState(true);

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
        const { data: orders } = await supabase.from('orders').select('delivery_charges, estimated_profit');
        const { count: clientCount } = await supabase.from('clients').select('*', { count: 'exact', head: true });

        if (orders) {
          const revenue = orders.reduce((acc, curr) => acc + (Number(curr.delivery_charges) || 0), 0);
          const profit = orders.reduce((acc, curr) => acc + (Number(curr.estimated_profit) || 0), 0);
          
          setStats({
            totalRevenue: revenue,
            netProfit: profit,
            totalOrders: orders.length,
            activeClients: clientCount || 0
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    fetchSalesData();
  }, []);

  useEffect(() => {
    fetchSalesData();
  }, [salesPeriod]);

  const kpiCards = [
    { 
      title: 'Total Revenue', 
      value: formatCurrency(stats.totalRevenue), 
      icon: DollarSign, 
      color: 'bg-blue-500',
      trend: '+12.5%'
    },
    { 
      title: 'Net Profit', 
      value: formatCurrency(stats.netProfit), 
      icon: TrendingUp, 
      color: 'bg-green-500',
      trend: '+8.2%'
    },
    { 
      title: 'Total Orders', 
      value: stats.totalOrders.toString(), 
      icon: Package, 
      color: 'bg-indigo-500',
      trend: '+24'
    },
    { 
      title: 'Active Clients', 
      value: stats.activeClients.toString(), 
      icon: Users, 
      color: 'bg-purple-500',
      trend: '+3'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
        <p className="text-gray-500">Here's what's happening with your business today.</p>
      </div>

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
            <div className="flex items-start justify-between">
              <div className={cn("p-3 rounded-xl text-white", card.color)}>
                <card.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                {card.trend}
              </span>
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
    </div>
  );
};

// Helper for class merging
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default Dashboard;
