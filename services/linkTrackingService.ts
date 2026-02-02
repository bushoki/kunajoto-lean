/**
 * Link Tracking Service
 * Tracks clicks on external links with user analytics
 */

import { supabase } from '../src/supabaseClient';

export interface LinkClickData {
  linkUrl: string;
  linkType: string;
  contentId?: string;
  contentType?: string;
  city?: string;
  userLocation?: string;
}

/**
 * Track a link click and open the URL
 */
export async function trackAndOpenLink(
  data: LinkClickData,
  userId?: string
): Promise<void> {
  try {
    // Get user agent and attempt to get IP (browser limitations)
    const userAgent = navigator.userAgent;
    
    // Log the click to database
    const { error } = await supabase.from('link_clicks').insert({
      user_id: userId || null,
      link_url: data.linkUrl,
      link_type: data.linkType,
      content_id: data.contentId || null,
      content_type: data.contentType || null,
      city: data.city || null,
      user_location: data.userLocation || null,
      user_agent: userAgent,
      clicked_at: new Date().toISOString()
    });

    if (error) {
      console.error('Error tracking link click:', error);
    }

    // Open the link in a new tab
    window.open(data.linkUrl, '_blank', 'noopener,noreferrer');
  } catch (error) {
    console.error('Error in trackAndOpenLink:', error);
    // Still open the link even if tracking fails
    window.open(data.linkUrl, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Get click analytics for a specific content item
 */
export async function getClickAnalytics(contentId: string) {
  try {
    const { data, error } = await supabase
      .from('link_clicks')
      .select('*')
      .eq('content_id', contentId)
      .order('clicked_at', { ascending: false });

    if (error) {
      console.error('Error fetching click analytics:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getClickAnalytics:', error);
    return [];
  }
}

/**
 * Get aggregated click statistics for admin dashboard
 */
export async function getClickStatistics(city?: string) {
  try {
    let query = supabase
      .from('link_clicks')
      .select('*')
      .order('clicked_at', { ascending: false });

    if (city) {
      query = query.eq('city', city);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching click statistics:', error);
      return {
        totalClicks: 0,
        uniqueUsers: 0,
        clicksByType: {},
        recentClicks: []
      };
    }

    // Aggregate statistics
    const totalClicks = data?.length || 0;
    const uniqueUsers = new Set(data?.map(click => click.user_id).filter(Boolean)).size;
    
    const clicksByType: Record<string, number> = {};
    data?.forEach(click => {
      clicksByType[click.link_type] = (clicksByType[click.link_type] || 0) + 1;
    });

    return {
      totalClicks,
      uniqueUsers,
      clicksByType,
      recentClicks: data?.slice(0, 50) || []
    };
  } catch (error) {
    console.error('Error in getClickStatistics:', error);
    return {
      totalClicks: 0,
      uniqueUsers: 0,
      clicksByType: {},
      recentClicks: []
    };
  }
}
