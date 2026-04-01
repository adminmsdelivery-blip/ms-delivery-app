import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    netProfit: 0,
    totalOrders: 0,
    activeClients: 0
  });
  const [loading, setLoading] = useState(true);

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
  }, []);

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

      {/* Promotional Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200"
      >
        <div className="relative z-10 max-w-lg">
          <h2 className="text-3xl font-bold mb-4">Ready to scale your logistics?</h2>
          <p className="text-indigo-100 mb-6">
            Get advanced insights, automated reporting, and multi-user access with our Premium Plan.
          </p>
          <button className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2">
            Upgrade Now
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 translate-y-1/4 translate-x-1/4 w-64 h-64 bg-indigo-400/20 rounded-full blur-2xl" />
      </motion.div>
    </div>
  );
};

// Helper for class merging
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default Dashboard;
