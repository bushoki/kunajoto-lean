/**
 * ItineraryLayer.tsx
 * Renders city itineraries as curved routes with stop bubbles on the Google Map.
 * Supports free (fully visible) and paid (locked stops) itineraries.
 * Supports bubblesMinimized prop to hide/show stop info bubbles without removing dots.
 * Branch: map-features
 */

import React, { useEffect, useRef, useCallback, MutableRefObject } from 'react';
import { Itinerary, ItineraryStop } from '../../services/itineraryService';

declare var google: any;

interface ItineraryLayerProps {
  map: any; // Google Maps instance
  itineraries: Itinerary[];
  activeItineraryId: string | null;
  onItinerarySelect: (id: string | null) => void;
  onSubscribeClick: (itinerary: Itinerary) => void;
  bubblesMinimized?: boolean; // When true, hide info bubbles but keep route dots visible
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute a bezier curve midpoint offset for drawing curved routes.
 * Returns a LatLng that is offset perpendicular to the line between two points.
 */
function getBezierControlPoint(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number },
  curvature: number = 0.4
): { lat: number; lng: number } {
  const midLat = (p1.lat + p2.lat) / 2;
  const midLng = (p1.lng + p2.lng) / 2;
  const dLat = p2.lat - p1.lat;
  const dLng = p2.lng - p1.lng;
  // Perpendicular offset
  return {
    lat: midLat - dLng * curvature,
    lng: midLng + dLat * curvature,
  };
}

/**
 * Generate points along a quadratic bezier curve for smooth route rendering.
 */
function getBezierPoints(
  p1: { lat: number; lng: number },
  control: { lat: number; lng: number },
  p2: { lat: number; lng: number },
  steps: number = 30
): { lat: number; lng: number }[] {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = (1 - t) * (1 - t) * p1.lat + 2 * (1 - t) * t * control.lat + t * t * p2.lat;
    const lng = (1 - t) * (1 - t) * p1.lng + 2 * (1 - t) * t * control.lng + t * t * p2.lng;
    points.push({ lat, lng });
  }
  return points;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ItineraryLayer: React.FC<ItineraryLayerProps> = ({
  map,
  itineraries,
  activeItineraryId,
  onItinerarySelect,
  onSubscribeClick,
  bubblesMinimized = false,
}) => {
  const overlaysRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const markersRef = useRef<any[]>([]);
  // Track bubble DOM elements so we can show/hide without full re-render
  const bubbleElemsRef = useRef<HTMLElement[]>([]);

  const clearAll = useCallback(() => {
    overlaysRef.current.forEach(o => o.setMap(null));
    overlaysRef.current = [];
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    bubbleElemsRef.current = [];
  }, []);

  // ── Effect: toggle bubble visibility instantly without re-rendering overlays ──
  useEffect(() => {
    bubbleElemsRef.current.forEach(el => {
      el.style.display = bubblesMinimized ? 'none' : 'block';
    });
  }, [bubblesMinimized]);

  useEffect(() => {
    if (!map || !google) return;
    clearAll();
    bubbleElemsRef.current = [];

    itineraries.forEach((itin) => {
      const isActive = activeItineraryId === itin.id || activeItineraryId === null;
      const opacity = activeItineraryId !== null && activeItineraryId !== itin.id ? 0.2 : 1;
      const color = itin.color || '#FF6B35';
      const stops = itin.stops || [];

      if (stops.length === 0) return;

      // ── Draw route lines between stops ──────────────────────────────────
      const validStops = stops.filter(s => s.latitude && s.longitude);
      if (validStops.length >= 2) {
        for (let i = 0; i < validStops.length - 1; i++) {
          const p1 = { lat: validStops[i].latitude!, lng: validStops[i].longitude! };
          const p2 = { lat: validStops[i + 1].latitude!, lng: validStops[i + 1].longitude! };
          const control = getBezierControlPoint(p1, p2, 0.35);
          const curvePoints = getBezierPoints(p1, control, p2, 40);

          const polyline = new google.maps.Polyline({
            path: curvePoints,
            geodesic: false,
            strokeColor: color,
            strokeOpacity: opacity,
            strokeWeight: isActive ? 3 : 2,
            icons: [{
              icon: {
                path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
                strokeOpacity: opacity,
                strokeColor: color,
                scale: 3,
              },
              offset: '50%',
            }],
            map,
            zIndex: isActive ? 10 : 5,
          });

          polyline.addListener('click', () => {
            onItinerarySelect(activeItineraryId === itin.id ? null : itin.id);
          });

          polylinesRef.current.push(polyline);
        }
      }

      // ── Draw stop markers and bubbles ────────────────────────────────────
      stops.forEach((stop, idx) => {
        if (!stop.latitude || !stop.longitude) return;

        const position = new google.maps.LatLng(stop.latitude, stop.longitude);
        const isLocked = !itin.has_access && !stop.is_starting_point;

        // Stop dot marker
        const dotDiv = document.createElement('div');
        dotDiv.style.cssText = `
          width: 14px; height: 14px; border-radius: 50%;
          background: ${stop.is_starting_point ? '#22C55E' : stop.is_ending_point ? '#EF4444' : color};
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          cursor: pointer;
          opacity: ${opacity};
          transition: transform 0.2s;
        `;
        dotDiv.addEventListener('mouseenter', () => { dotDiv.style.transform = 'scale(1.4)'; });
        dotDiv.addEventListener('mouseleave', () => { dotDiv.style.transform = 'scale(1)'; });

        // ── Custom Overlay for dot ──────────────────────────────────────────
        class DotOverlay extends google.maps.OverlayView {
          private pos: any;
          private el: HTMLElement;
          constructor(pos: any, el: HTMLElement) {
            super();
            this.pos = pos;
            this.el = el;
          }
          onAdd() {
            this.getPanes().overlayMouseTarget.appendChild(this.el);
          }
          draw() {
            const proj = this.getProjection();
            if (!proj) return;
            const point = proj.fromLatLngToDivPixel(this.pos);
            if (point) {
              this.el.style.left = `${point.x - 7}px`;
              this.el.style.top = `${point.y - 7}px`;
              this.el.style.position = 'absolute';
            }
          }
          onRemove() {
            if (this.el.parentNode) this.el.parentNode.removeChild(this.el);
          }
        }

        const dotOverlay = new DotOverlay(position, dotDiv);
        dotOverlay.setMap(map);
        overlaysRef.current.push(dotOverlay);

        // ── Info bubble ─────────────────────────────────────────────────────
        const bubbleDiv = document.createElement('div');
        bubbleDiv.style.cssText = `
          position: absolute;
          background: white;
          border-radius: 12px;
          padding: 10px 12px;
          max-width: 200px;
          min-width: 140px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          cursor: pointer;
          opacity: ${opacity};
          z-index: 20;
          border: 1.5px solid ${color}40;
          transform: translateX(-50%) translateY(-110%);
          pointer-events: auto;
          display: ${bubblesMinimized ? 'none' : 'block'};
        `;
        // Register bubble for show/hide toggling
        bubbleElemsRef.current.push(bubbleDiv);

        if (isLocked) {
          // Locked / subscribe to unlock bubble
          bubbleDiv.innerHTML = `
            <div style="text-align:center;">
              <div style="
                background: ${color};
                color: white;
                font-size: 11px;
                font-weight: 800;
                padding: 6px 14px;
                border-radius: 8px;
                letter-spacing: 0.5px;
                cursor: pointer;
              " class="subscribe-btn">
                SUBSCRIBE TO UNLOCK
              </div>
            </div>
          `;
          bubbleDiv.querySelector('.subscribe-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            onSubscribeClick(itin);
          });
        } else {
          const stopLabel = stop.is_starting_point ? '🟢 START' : stop.is_ending_point ? '🔴 END' : `Stop ${idx + 1}`;
          bubbleDiv.innerHTML = `
            <div style="font-size:9px; font-weight:800; color:${color}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">
              ${stopLabel}
            </div>
            <div style="font-size:10px; font-weight:700; color:#1a1a1a; margin-bottom:4px; line-height:1.3;">
              ${stop.name}
            </div>
            ${stop.description ? `<div style="font-size:9px; color:#555; line-height:1.4; margin-bottom:4px;">${stop.description}</div>` : ''}
            ${(stop.arrive_time || stop.leave_time) ? `
              <div style="font-size:9px; color:${color}; font-weight:700;">
                ${stop.arrive_time ? `Arrive: ${stop.arrive_time}` : ''}
                ${stop.arrive_time && stop.leave_time ? ' · ' : ''}
                ${stop.leave_time ? `Leave: ${stop.leave_time}` : ''}
              </div>
            ` : ''}
          `;
        }

        // Tail triangle
        const tail = document.createElement('div');
        tail.style.cssText = `
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid white;
          filter: drop-shadow(0 2px 2px rgba(0,0,0,0.1));
        `;
        bubbleDiv.appendChild(tail);

        class BubbleOverlay extends google.maps.OverlayView {
          private pos: any;
          private el: HTMLElement;
          constructor(pos: any, el: HTMLElement) {
            super();
            this.pos = pos;
            this.el = el;
          }
          onAdd() {
            this.getPanes().overlayMouseTarget.appendChild(this.el);
          }
          draw() {
            const proj = this.getProjection();
            if (!proj) return;
            const point = proj.fromLatLngToDivPixel(this.pos);
            if (point) {
              this.el.style.left = `${point.x}px`;
              this.el.style.top = `${point.y}px`;
              this.el.style.position = 'absolute';
            }
          }
          onRemove() {
            if (this.el.parentNode) this.el.parentNode.removeChild(this.el);
          }
        }

        const bubbleOverlay = new BubbleOverlay(position, bubbleDiv);
        bubbleOverlay.setMap(map);
        overlaysRef.current.push(bubbleOverlay);

        // Click on dot → select itinerary
        dotDiv.addEventListener('click', () => {
          onItinerarySelect(activeItineraryId === itin.id ? null : itin.id);
        });
      });
    });

    return () => {
      clearAll();
    };
  }, [map, itineraries, activeItineraryId, clearAll, onItinerarySelect, onSubscribeClick]);

  return null; // Renders directly onto the Google Map canvas
};

export default ItineraryLayer;
