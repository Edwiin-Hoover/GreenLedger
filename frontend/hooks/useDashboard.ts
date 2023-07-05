import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { DashboardStats, ChartData } from '@/types';
import { dashboardApi } from '@/utils/api';

export const useDashboard = () => {
  const { address } = useAccount();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reductionHistory, setReductionHistory] = useState<any[]>([]);
  const [creditHistory, setCreditHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await dashboardApi.getStats(address);
      
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch dashboard stats');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Fetch reduction history
  const fetchReductionHistory = useCallback(async (period: 'week' | 'month' | 'year' = 'month') => {
    if (!address) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await dashboardApi.getReductionHistory(address, period);
      
      if (response.success && response.data) {
        setReductionHistory(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch reduction history');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reduction history');
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Fetch credit history
  const fetchCreditHistory = useCallback(async (period: 'week' | 'month' | 'year' = 'month') => {
    if (!address) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await dashboardApi.getCreditHistory(address, period);
      
      if (response.success && response.data) {
        setCreditHistory(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch credit history');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch credit history');
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Generate chart data for reductions
  const getReductionChartData = useCallback((): ChartData => {
    if (!reductionHistory.length) {
      return {
        labels: [],
        datasets: [{
          label: 'Carbon Reductions (tons CO2)',
          data: [],
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 2,
        }],
      };
    }

    const labels = reductionHistory.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const data = reductionHistory.map(item => item.amount);

    return {
      labels,
      datasets: [{
        label: 'Carbon Reductions (tons CO2)',
        data,
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        fill: true,
      }],
    };
  }, [reductionHistory]);

  // Generate chart data for credits
  const getCreditChartData = useCallback((): ChartData => {
    if (!creditHistory.length) {
      return {
        labels: [],
        datasets: [{
          label: 'Carbon Credits Issued',
          data: [],
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
        }],
      };
    }

    const labels = creditHistory.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const data = creditHistory.map(item => item.amount);

    return {
      labels,
      datasets: [{
        label: 'Carbon Credits Issued',
        data,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        fill: true,
      }],
    };
  }, [creditHistory]);

  // Generate pie chart data for project types
  const getProjectTypeChartData = useCallback((): ChartData => {
    if (!stats) {
      return {
        labels: [],
        datasets: [{
          label: 'Project Types',
          data: [],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(6, 182, 212, 0.8)',
          ],
        }],
      };
    }

    // This would typically come from the API
    const projectTypes = [
      { name: 'Renewable Energy', count: 45 },
      { name: 'Energy Efficiency', count: 30 },
      { name: 'Forest Conservation', count: 20 },
      { name: 'Reforestation', count: 15 },
      { name: 'Carbon Capture', count: 10 },
      { name: 'Waste Management', count: 8 },
    ];

    return {
      labels: projectTypes.map(type => type.name),
      datasets: [{
        label: 'Project Types',
        data: projectTypes.map(type => type.count),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(6, 182, 212, 0.8)',
        ],
      }],
    };
  }, [stats]);

  // Calculate carbon footprint trend
  const getCarbonFootprintTrend = useCallback((): 'up' | 'down' | 'stable' => {
    if (!reductionHistory.length || reductionHistory.length < 2) {
      return 'stable';
    }

    const recent = reductionHistory.slice(-3);
    const older = reductionHistory.slice(-6, -3);

    const recentAvg = recent.reduce((sum, item) => sum + item.amount, 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + item.amount, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }, [reductionHistory]);

  // Get performance metrics
  const getPerformanceMetrics = useCallback(() => {
    if (!stats) return null;

    const metrics = {
      totalReductions: stats.totalReductions,
      totalCredits: stats.totalCredits,
      activeProjects: stats.activeProjects,
      monthlyReduction: stats.monthlyReduction,
      carbonFootprint: stats.carbonFootprint,
      creditsHeld: stats.creditsHeld,
      creditsIssued: stats.creditsIssued,
    };

    // Calculate efficiency score (0-100)
    const efficiencyScore = Math.min(100, Math.max(0, 
      (metrics.totalReductions / Math.max(metrics.carbonFootprint, 1)) * 100
    ));

    // Calculate sustainability rating
    let sustainabilityRating = 'C';
    if (efficiencyScore >= 80) sustainabilityRating = 'A+';
    else if (efficiencyScore >= 70) sustainabilityRating = 'A';
    else if (efficiencyScore >= 60) sustainabilityRating = 'B+';
    else if (efficiencyScore >= 50) sustainabilityRating = 'B';
    else if (efficiencyScore >= 40) sustainabilityRating = 'C+';

    return {
      ...metrics,
      efficiencyScore,
      sustainabilityRating,
      trend: getCarbonFootprintTrend(),
    };
  }, [stats, getCarbonFootprintTrend]);

  // Refresh all data
  const refreshData = useCallback(async (period: 'week' | 'month' | 'year' = 'month') => {
    await Promise.all([
      fetchStats(),
      fetchReductionHistory(period),
      fetchCreditHistory(period),
    ]);
  }, [fetchStats, fetchReductionHistory, fetchCreditHistory]);

  // Auto-fetch data when address changes
  useEffect(() => {
    if (address) {
      refreshData();
    }
  }, [address, refreshData]);

  return {
    // State
    stats,
    reductionHistory,
    creditHistory,
    loading,
    error,
    
    // Actions
    fetchStats,
    fetchReductionHistory,
    fetchCreditHistory,
    refreshData,
    
    // Chart data generators
    getReductionChartData,
    getCreditChartData,
    getProjectTypeChartData,
    
    // Utilities
    getCarbonFootprintTrend,
    getPerformanceMetrics,
  };
};
