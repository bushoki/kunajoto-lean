/**
 * Link Analytics Manager Component
 * Displays click statistics for admin-created links
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/supabaseClient';

interface LinkAnalyticsManagerProps {
  city: string;
  userId: string;
}

export default function LinkAnalyticsManager({ city, userId }: LinkAnalyticsManagerProps) {
  const [clicks, setClicks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClicks: 0,
    uniqueUsers: 0,
    clicksByType: {} as Record<string, number>
  });

  useEffect(() => {
    loadAnalytics();
  }, [city]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch all clicks for the selected city
      const { data, error } = await supabase
        .from('link_clicks')
        .select('*')
        .eq('city', city)
        .order('clicked_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading analytics:', error);
        return;
      }

      setClicks(data || []);

      // Calculate statistics
      const totalClicks = data?.length || 0;
      const uniqueUsers = new Set(data?.map(click => click.user_id).filter(Boolean)).size;
      
      const clicksByType: Record<string, number> = {};
      data?.forEach(click => {
        clicksByType[click.link_type] = (clicksByType[click.link_type] || 0) + 1;
      });

      setStats({
        totalClicks,
        uniqueUsers,
        clicksByType
      });
    } catch (error) {
      console.error('Error in loadAnalytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Link Analytics - {city}
        </h2>
        
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100">
            <div className="text-3xl font-bold text-blue-600">{stats.totalClicks}</div>
            <div className="text-sm text-gray-600 mt-1">Total Clicks</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl border border-green-100">
            <div className="text-3xl font-bold text-green-600">{stats.uniqueUsers}</div>
            <div className="text-sm text-gray-600 mt-1">Unique Users</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border border-purple-100">
            <div className="text-3xl font-bold text-purple-600">
              {stats.totalClicks > 0 ? (stats.totalClicks / Math.max(stats.uniqueUsers, 1)).toFixed(1) : '0'}
            </div>
            <div className="text-sm text-gray-600 mt-1">Avg Clicks per User</div>
          </div>
        </div>

        {/* Clicks by Type */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Clicks by Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.clicksByType).map(([type, count]) => (
              <div key={type} className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-xs text-gray-600 mt-1 capitalize">{type.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Clicks Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Recent Clicks (Last 100)</h3>
        </div>
        
        {clicks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <i className="fa-solid fa-chart-line text-4xl mb-3"></i>
            <p>No click data available for {city} yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Link Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">URL</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clicks.map((click, index) => (
                  <tr key={click.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(click.clicked_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
                        {click.link_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      <a 
                        href={click.link_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {click.link_url}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {click.user_id ? (
                        <span className="font-mono text-xs">{click.user_id.substring(0, 8)}...</span>
                      ) : (
                        <span className="text-gray-400 italic">Anonymous</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {click.user_location || click.city || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
