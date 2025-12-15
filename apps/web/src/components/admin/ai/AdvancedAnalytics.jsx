import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, DollarSign, TrendingUp, Clock, Activity, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export default function AdvancedAnalytics({ usageLogs, configs }) {
  const [timeRange, setTimeRange] = React.useState('7d');
  const [filterFeature, setFilterFeature] = React.useState('all');

  // Filter logs based on time range
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const ranges = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    const cutoff = new Date(now - ranges[timeRange]);
    return usageLogs.filter(log => {
      const logDate = new Date(log.created_date);
      const matchesTime = logDate >= cutoff;
      const matchesFeature = filterFeature === 'all' || log.feature_type === filterFeature;
      return matchesTime && matchesFeature;
    });
  }, [usageLogs, timeRange, filterFeature]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalRequests = filteredLogs.length;
    const successCount = filteredLogs.filter(l => l.success).length;
    const totalTokens = filteredLogs.reduce((sum, log) => sum + (log.total_tokens || 0), 0);
    const totalCost = filteredLogs.reduce((sum, log) => sum + (log.cost_estimate || 0), 0);
    const avgLatency = totalRequests > 0
      ? filteredLogs.reduce((sum, log) => sum + (log.latency_ms || 0), 0) / totalRequests
      : 0;
    const avgExecutionTime = totalRequests > 0
      ? filteredLogs.reduce((sum, log) => sum + (log.execution_time_ms || 0), 0) / totalRequests
      : 0;

    return {
      totalRequests,
      successRate: totalRequests > 0 ? (successCount / totalRequests * 100).toFixed(1) : 0,
      totalTokens,
      totalCost: totalCost.toFixed(4),
      avgLatency: avgLatency.toFixed(0),
      avgExecutionTime: avgExecutionTime.toFixed(0)
    };
  }, [filteredLogs]);

  // Group by feature
  const featureStats = useMemo(() => {
    const stats = {};
    filteredLogs.forEach(log => {
      if (!stats[log.feature_type]) {
        stats[log.feature_type] = {
          count: 0,
          tokens: 0,
          cost: 0,
          success: 0
        };
      }
      stats[log.feature_type].count++;
      stats[log.feature_type].tokens += log.total_tokens || 0;
      stats[log.feature_type].cost += log.cost_estimate || 0;
      if (log.success) stats[log.feature_type].success++;
    });
    
    return Object.entries(stats).map(([name, data]) => ({
      name: name.replace(/_/g, ' '),
      count: data.count,
      tokens: data.tokens,
      cost: data.cost,
      successRate: (data.success / data.count * 100).toFixed(0)
    }));
  }, [filteredLogs]);

  // Group by provider
  const providerStats = useMemo(() => {
    const stats = {};
    filteredLogs.forEach(log => {
      const provider = log.ai_provider || 'unknown';
      if (!stats[provider]) {
        stats[provider] = { name: provider, count: 0, cost: 0 };
      }
      stats[provider].count++;
      stats[provider].cost += log.cost_estimate || 0;
    });
    return Object.values(stats);
  }, [filteredLogs]);

  // Time series data
  const timeSeriesData = useMemo(() => {
    const grouped = {};
    filteredLogs.forEach(log => {
      const date = new Date(log.created_date).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = { date, requests: 0, tokens: 0, cost: 0 };
      }
      grouped[date].requests++;
      grouped[date].tokens += log.total_tokens || 0;
      grouped[date].cost += log.cost_estimate || 0;
    });
    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredLogs]);

  // Quality metrics
  const qualityMetrics = useMemo(() => {
    const withFeedback = filteredLogs.filter(l => l.user_feedback);
    const thumbsUp = withFeedback.filter(l => l.user_feedback?.thumbs === 'up').length;
    const thumbsDown = withFeedback.filter(l => l.user_feedback?.thumbs === 'down').length;
    const avgQuality = filteredLogs.reduce((sum, l) => sum + (l.quality_score || 0), 0) / filteredLogs.length || 0;
    
    return {
      totalFeedback: withFeedback.length,
      thumbsUp,
      thumbsDown,
      avgQuality: avgQuality.toFixed(2)
    };
  }, [filteredLogs]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-3">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[150px] bg-zinc-900 border-zinc-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
            <SelectItem value="24h" className="text-white hover:bg-white/10">Last 24 Hours</SelectItem>
            <SelectItem value="7d" className="text-white hover:bg-white/10">Last 7 Days</SelectItem>
            <SelectItem value="30d" className="text-white hover:bg-white/10">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterFeature} onValueChange={setFilterFeature}>
          <SelectTrigger className="w-[200px] bg-zinc-900 border-zinc-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
            <SelectItem value="all" className="text-white hover:bg-white/10">All Features</SelectItem>
            <SelectItem value="question_generation" className="text-white hover:bg-white/10">Question Generation</SelectItem>
            <SelectItem value="explanation_generation" className="text-white hover:bg-white/10">Explanation Generation</SelectItem>
            <SelectItem value="study_plan" className="text-white hover:bg-white/10">Study Plan</SelectItem>
            <SelectItem value="text_to_questions" className="text-white hover:bg-white/10">Text to Questions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="glass-card border-0 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Requests</p>
              <p className="text-2xl font-bold text-white">{metrics.totalRequests}</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card border-0 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Success Rate</p>
              <p className="text-2xl font-bold text-white">{metrics.successRate}%</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card border-0 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Tokens</p>
              <p className="text-2xl font-bold text-white">{metrics.totalTokens.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card border-0 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Cost</p>
              <p className="text-2xl font-bold text-white">${metrics.totalCost}</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card border-0 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-600/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Avg Latency</p>
              <p className="text-2xl font-bold text-white">{metrics.avgLatency}ms</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card border-0 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-600/20 flex items-center justify-center">
              <ThumbsUp className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Quality Score</p>
              <p className="text-2xl font-bold text-white">{qualityMetrics.avgQuality}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests Over Time */}
        <Card className="glass-card border-0 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Requests Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} />
              <Line type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Cost Over Time */}
        <Card className="glass-card border-0 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Cost Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} />
              <Line type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Feature Usage */}
        <Card className="glass-card border-0 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Usage by Feature</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={featureStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} />
              <Bar dataKey="count" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Provider Distribution */}
        <Card className="glass-card border-0 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Provider Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={providerStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {providerStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Detailed Stats Table */}
      <Card className="glass-card border-0 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Feature Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-sm text-white pb-3">Feature</th>
                <th className="text-right text-sm text-white pb-3">Requests</th>
                <th className="text-right text-sm text-white pb-3">Tokens</th>
                <th className="text-right text-sm text-white pb-3">Cost</th>
                <th className="text-right text-sm text-white pb-3">Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {featureStats.map((stat, idx) => (
                <tr key={idx} className="border-b border-white/5">
                  <td className="py-3 text-white capitalize">{stat.name}</td>
                  <td className="py-3 text-right text-white">{stat.count}</td>
                  <td className="py-3 text-right text-white">{stat.tokens.toLocaleString()}</td>
                  <td className="py-3 text-right text-white">${stat.cost.toFixed(4)}</td>
                  <td className="py-3 text-right">
                    <Badge className={parseFloat(stat.successRate) >= 90 ? 'bg-green-600' : 'bg-amber-600'}>
                      {stat.successRate}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}