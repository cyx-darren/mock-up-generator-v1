'use client';

import React from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';

interface UsageChartsProps {
  dailyActivity: Array<{
    date: string;
    products: number;
    constraints: number;
    users: number;
  }>;
  peakUsageTime: string;
  averageSessionDuration: string;
}

export function UsageCharts({ dailyActivity, peakUsageTime, averageSessionDuration }: UsageChartsProps) {
  // Calculate max values for scaling
  const maxProducts = Math.max(...dailyActivity.map(d => d.products));
  const maxConstraints = Math.max(...dailyActivity.map(d => d.constraints));
  const maxUsers = Math.max(...dailyActivity.map(d => d.users));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Activity Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              7-Day Activity Overview
            </h3>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">Products</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">Constraints</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">Users</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {/* Simple Bar Chart */}
          <div className="space-y-4">
            {dailyActivity.map((day, index) => (
              <div key={day.date} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatDate(day.date)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-500">
                    {day.products + day.constraints + day.users} total
                  </span>
                </div>
                
                {/* Products Bar */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-16 text-xs text-gray-500 dark:text-gray-400">Products</div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${maxProducts > 0 ? (day.products / maxProducts) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <div className="w-8 text-xs text-gray-600 dark:text-gray-400">{day.products}</div>
                  </div>
                  
                  {/* Constraints Bar */}
                  <div className="flex items-center space-x-2">
                    <div className="w-16 text-xs text-gray-500 dark:text-gray-400">Constraints</div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${maxConstraints > 0 ? (day.constraints / maxConstraints) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <div className="w-8 text-xs text-gray-600 dark:text-gray-400">{day.constraints}</div>
                  </div>
                  
                  {/* Users Bar */}
                  <div className="flex items-center space-x-2">
                    <div className="w-16 text-xs text-gray-500 dark:text-gray-400">Users</div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${maxUsers > 0 ? (day.users / maxUsers) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <div className="w-8 text-xs text-gray-600 dark:text-gray-400">{day.users}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Usage Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Usage Insights
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {peakUsageTime}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Peak Usage Time
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {averageSessionDuration}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Avg Session Duration
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Weekly Totals
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {dailyActivity.reduce((sum, day) => sum + day.products, 0)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Products</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {dailyActivity.reduce((sum, day) => sum + day.constraints, 0)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Constraints</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {dailyActivity.reduce((sum, day) => sum + day.users, 0)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Users</div>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Activity Heatmap */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Activity Trends
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {/* Daily Trend Indicators */}
              <div className="grid grid-cols-7 gap-1">
                {dailyActivity.map((day, index) => {
                  const totalActivity = day.products + day.constraints + day.users;
                  const maxTotalActivity = Math.max(...dailyActivity.map(d => d.products + d.constraints + d.users));
                  const intensity = maxTotalActivity > 0 ? (totalActivity / maxTotalActivity) : 0;
                  
                  return (
                    <div key={day.date} className="text-center">
                      <div 
                        className="w-8 h-8 rounded mx-auto mb-1 flex items-center justify-center text-xs font-medium transition-all duration-200 hover:scale-110"
                        style={{
                          backgroundColor: `rgba(59, 130, 246, ${0.2 + intensity * 0.8})`,
                          color: intensity > 0.5 ? '#ffffff' : '#374151'
                        }}
                        title={`${formatDate(day.date)}: ${totalActivity} activities`}
                      >
                        {totalActivity}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Less</span>
                <div className="flex space-x-1">
                  {[0.2, 0.4, 0.6, 0.8, 1.0].map((opacity) => (
                    <div 
                      key={opacity}
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: `rgba(59, 130, 246, ${opacity})` }}
                    ></div>
                  ))}
                </div>
                <span>More</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Performance Metrics
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                {((dailyActivity.reduce((sum, day) => sum + day.constraints, 0) / 
                   Math.max(dailyActivity.reduce((sum, day) => sum + day.products, 0), 1)) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Constraint Coverage
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                Constraints per product ratio
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-2">
                {Math.max(...dailyActivity.map(d => d.products + d.constraints + d.users))}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Peak Daily Activity
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                Highest single day total
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                {(dailyActivity.reduce((sum, day) => sum + day.products + day.constraints + day.users, 0) / 7).toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Daily Average
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                Average activities per day
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}