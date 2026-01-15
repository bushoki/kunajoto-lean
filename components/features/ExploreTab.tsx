import React, { useState, useEffect } from 'react';
import CityGauge from './CityGauge';
import { dataService } from '../../services/dataService';
import { Venue } from '../../types';

interface ExploreTabProps {
  locationName: string;
  onOpenPreferences: () => void;
  hasCompletedPrefs: boolean;
  isAuthenticated: boolean;
  onVenueSelect: (venue: Venue) => void;
  onOpenPlans: () => void;
}

const ExploreTab: React.FC<ExploreTabProps> = ({
  locationName,
  onOpenPreferences,
  hasCompletedPrefs,
  isAuthenticated,
  onVenueSelect,
  onOpenPlans
}) => {
  const [userPlans, setUserPlans] = useState<any[]>([]);
  const [recommendedVenues, setRecommendedVenues] = useState<Venue[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingVenues, setLoadingVenues] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserPlans();
      loadRecommendedVenues();
    }
  }, [isAuthenticated, locationName]);

  const loadUserPlans = async () => {
    try {
      setLoadingPlans(true);
      const plans = await dataService.fetchUserPlans();
      // Get upcoming plans only
      const upcoming = plans.filter((p: any) => p.status === 'upcoming' || p.status === 'draft');
      setUserPlans(upcoming.slice(0, 3)); // Show top 3
    } catch (error) {
      console.error('[ExploreTab] Error loading plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const loadRecommendedVenues = async () => {
    try {
      setLoadingVenues(true);
      // Get venues for current city with high vibe scores
      const allVenues = await dataService.fetchVenues();
      const cityVenues = allVenues.filter((v: Venue) => 
        v.city === locationName || v.district === locationName
      );
      // Sort by vibe score and get top 6
      const sorted = cityVenues.sort((a: Venue, b: Venue) => 
        (b.vibeScore || 0) - (a.vibeScore || 0)
      );
      setRecommendedVenues(sorted.slice(0, 6));
    } catch (error) {
      console.error('[ExploreTab] Error loading venues:', error);
    } finally {
      setLoadingVenues(false);
    }
  };

  return (
    <div className="explore-tab" style={{ 
      height: '100%', 
      overflowY: 'auto', 
      padding: '16px',
      backgroundColor: '#f5f5f5'
    }}>
      {/* City Gauge Section */}
      <div style={{ marginBottom: '20px' }}>
        <CityGauge
          locationName={locationName}
          onOpenPreferences={onOpenPreferences}
          hasCompletedPrefs={hasCompletedPrefs}
          isAuthenticated={isAuthenticated}
        />
      </div>

      {isAuthenticated && (
        <>
          {/* My Plans Section */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                📅 My Plans
              </h3>
              <button
                onClick={onOpenPlans}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FF6B35',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                View All →
              </button>
            </div>

            {loadingPlans ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                Loading plans...
              </div>
            ) : userPlans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                <p>No upcoming plans yet</p>
                <button
                  onClick={onOpenPlans}
                  style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    backgroundColor: '#FF6B35',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Create Your First Plan
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {userPlans.map((plan: any) => (
                  <div
                    key={plan.id}
                    onClick={onOpenPlans}
                    style={{
                      padding: '12px',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: '1px solid #eee',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f0f0';
                      e.currentTarget.style.borderColor = '#FF6B35';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9f9f9';
                      e.currentTarget.style.borderColor = '#eee';
                    }}
                  >
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      {plan.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {plan.date ? new Date(plan.date).toLocaleDateString() : 'No date set'} • {plan.plan_venues?.length || 0} venues
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommended Venues Section */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                ⭐ Recommended for You
              </h3>
            </div>

            {loadingVenues ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                Loading recommendations...
              </div>
            ) : recommendedVenues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                No venues found in {locationName}
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '12px'
              }}>
                {recommendedVenues.map((venue: Venue) => (
                  <div
                    key={venue.id}
                    onClick={() => onVenueSelect(venue)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid #eee',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      height: '100px',
                      backgroundImage: `url(${venue.imageUrl || 'https://via.placeholder.com/300x200'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }} />
                    <div style={{ padding: '8px' }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        marginBottom: '4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {venue.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#666',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: venue.vibeScore >= 70 ? '#4CAF50' : 
                                         venue.vibeScore >= 50 ? '#FF9800' : '#999'
                        }} />
                        {((venue.vibeScore || 0) / 10).toFixed(1)} / 10
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ExploreTab;
