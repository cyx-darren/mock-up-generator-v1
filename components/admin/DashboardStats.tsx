'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

interface DashboardStatsProps {
  refreshTrigger?: number;
}

interface Statistics {
  products: {
    total: number;
    active: number;
    inactive: number;
    draft: number;
    createdThisWeek: number;
    createdThisMonth: number;
    withHorizontalPlacement: number;
    withVerticalPlacement: number;
    withAllOverPlacement: number;
    trends: {
      totalChange: number;
      activeChange: number;
    };
  };
  categories: {
    count: number;
    breakdown: Record<string, { total: number; active: number; inactive: number }>;
    mostPopular: Array<{ name: string; total: number; active: number; inactive: number }>;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    table: string;
    recordId: string;
    user: string;
    timestamp: string;
    changes?: any;
  }>;
  popularProducts: Array<{
    id: string;
    name: string;
    sku: string;
    category: string;
    thumbnailUrl?: string;
    createdAt: string;
    popularityScore: number;
  }>;
  systemHealth: {
    overall: 'healthy' | 'warning' | 'error';
    database: {
      status: 'healthy' | 'warning' | 'error';
      latency: number;
      lastCheck: string;
    };
    api: {
      status: 'healthy' | 'warning' | 'error';
      responseTime: number;
      uptime: number;
    };
    storage: {
      status: 'healthy' | 'warning' | 'error';
      usedSpace: number;
      availableSpace: number;
    };
    errors: {
      lastHour: number;
      status: 'healthy' | 'warning' | 'error';
    };
  };
  usage: {
    constraintsCreated: {
      thisWeek: number;
      thisMonth: number;
    };
    dailyActivity: Array<{
      date: string;
      products: number;
      constraints: number;
      users: number;
    }>;
    peakUsageTime: string;
    averageSessionDuration: string;
  };
  lastUpdated: string;
}

export function DashboardStats({ refreshTrigger = 0 }: DashboardStatsProps) {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/admin/statistics', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch statistics: ${response.status}`);
      }

      const data = await response.json();
      setStatistics(data);
      setLastRefresh(Date.now());
    } catch (err) {
      console.error('Statistics fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchStatistics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const handleRefresh = () => {
    fetchStatistics();
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;
    
    if (diff < 60 * 1000) return 'just now';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'error': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <span className="text-green-500">↗</span>;
    if (change < 0) return <span className="text-red-500">↘</span>;
    return <span className="text-gray-500">→</span>;
  };

  if (loading && !statistics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardBody>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  if (error && !statistics) {
    return (
      <div className="mb-6">
        <Alert type="error" message={error} />
        <Button onClick={handleRefresh} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!statistics) return null;

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Statistics</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Last updated: {formatTimeAgo(statistics.lastUpdated)}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Product Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={statistics.products.total}
          trend={statistics.products.trends.totalChange}
          icon="📦"
          description={`${statistics.products.createdThisMonth} created this month`}
        />
        <StatCard
          title="Active Products"
          value={statistics.products.active}
          trend={statistics.products.trends.activeChange}
          icon="✅"
          description={`${statistics.products.inactive} inactive`}
        />
        <StatCard
          title="Categories"
          value={statistics.categories.count}
          icon="📂"
          description="Product categories"
        />
        <StatCard
          title="Constraints"
          value={statistics.usage.constraintsCreated.thisWeek}
          icon="⚙️"
          description="Created this week"
        />
      </div>

      {/* Placement Statistics */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Placement Configuration Overview
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {statistics.products.withHorizontalPlacement}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Horizontal Placement
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2 dark:bg-gray-700">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(statistics.products.withHorizontalPlacement / Math.max(statistics.products.total, 1)) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {statistics.products.withVerticalPlacement}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Vertical Placement
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2 dark:bg-gray-700">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(statistics.products.withVerticalPlacement / Math.max(statistics.products.total, 1)) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {statistics.products.withAllOverPlacement}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                All-Over Print
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2 dark:bg-gray-700">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(statistics.products.withAllOverPlacement / Math.max(statistics.products.total, 1)) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              System Health
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(statistics.systemHealth.overall)}`}>
              {statistics.systemHealth.overall}
            </span>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(statistics.systemHealth.database.status)}`}>
                Database
              </div>
              <div className="text-lg font-semibold mt-2">
                {statistics.systemHealth.database.latency}ms
              </div>
              <div className="text-xs text-gray-500">Latency</div>
            </div>
            
            <div className="text-center">
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(statistics.systemHealth.api.status)}`}>
                API
              </div>
              <div className="text-lg font-semibold mt-2">
                {statistics.systemHealth.api.uptime}%
              </div>
              <div className="text-xs text-gray-500">Uptime</div>
            </div>
            
            <div className="text-center">
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(statistics.systemHealth.storage.status)}`}>
                Storage
              </div>
              <div className="text-lg font-semibold mt-2">
                {statistics.systemHealth.storage.usedSpace}%
              </div>
              <div className="text-xs text-gray-500">Used</div>
            </div>
            
            <div className="text-center">
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(statistics.systemHealth.errors.status)}`}>
                Errors
              </div>
              <div className="text-lg font-semibold mt-2">
                {statistics.systemHealth.errors.lastHour}
              </div>
              <div className="text-xs text-gray-500">Last Hour</div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Products */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Popular Products
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {statistics.popularProducts.slice(0, 5).map((product, index) => (
                <div key={product.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {product.sku} • {product.category}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
                    Score: {product.popularityScore}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {statistics.recentActivity.slice(0, 8).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{activity.user}</span> {activity.action.replace('.', ' ')}
                      {activity.table && (
                        <span className="text-gray-500 dark:text-gray-400"> in {activity.table}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Category Breakdown
          </h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {statistics.categories.mostPopular.map((category) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {category.name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {category.total} products
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(category.total / Math.max(statistics.products.total, 1)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  trend?: number;
  icon: string;
  description?: string;
}

function StatCard({ title, value, trend, icon, description }: StatCardProps) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <span className="text-lg">{icon}</span>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {value.toLocaleString()}
                </div>
                {typeof trend !== 'undefined' && (
                  <div className="ml-2 flex items-baseline text-sm">
                    <div className={`flex items-center ${
                      trend > 0 ? 'text-green-600' : 
                      trend < 0 ? 'text-red-600' : 'text-gray-400'
                    }`}>
                      {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'}
                      <span className="ml-1">{Math.abs(trend)}%</span>
                    </div>
                  </div>
                )}
              </dd>
              {description && (
                <dd className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {description}
                </dd>
              )}
            </dl>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}