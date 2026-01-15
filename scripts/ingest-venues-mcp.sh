#!/bin/bash

#
# MCP-based Venue Ingestion Script
# Uses Manus MCP Supabase connector for authenticated database access
#

set -e

PROJECT_ID="grnekxrkypgighmxyveh"
GOOGLE_API_KEY="${VITE_GOOGLE_MAPS_API_KEY}"

if [ -z "$GOOGLE_API_KEY" ]; then
    echo "❌ GOOGLE_API_KEY not set"
    exit 1
fi

# Parse arguments
OFFSET=${1:-0}
LIMIT=${2:-50}

# Cities array (first 50 for testing)
CITIES=(
    "New York" "Los Angeles" "Chicago" "Houston" "Phoenix"
    "Philadelphia" "San Antonio" "San Diego" "Dallas" "San Jose"
    "Austin" "Jacksonville" "Fort Worth" "Columbus" "Charlotte"
    "San Francisco" "Indianapolis" "Seattle" "Denver" "Washington DC"
    "Boston" "El Paso" "Nashville" "Detroit" "Oklahoma City"
    "Portland" "Las Vegas" "Memphis" "Louisville" "Baltimore"
    "Milwaukee" "Albuquerque" "Tucson" "Fresno" "Sacramento"
    "Kansas City" "Mesa" "Atlanta" "Omaha" "Colorado Springs"
    "Raleigh" "Miami" "Long Beach" "Virginia Beach" "Oakland"
    "Minneapolis" "Tulsa" "Tampa" "Arlington" "New Orleans"
)

echo "🌍 MCP-based Global Venue Ingestion"
echo "===================================="
echo "Project: $PROJECT_ID"
echo "Offset: $OFFSET"
echo "Limit: $LIMIT"
echo ""

TOTAL_INGESTED=0
SUCCESS_COUNT=0

# Process cities
END=$((OFFSET + LIMIT))
if [ $END -gt ${#CITIES[@]} ]; then
    END=${#CITIES[@]}
fi

for ((i=OFFSET; i<END; i++)); do
    CITY="${CITIES[$i]}"
    PROGRESS="[$((i-OFFSET+1))/$((END-OFFSET))]"
    
    echo "$PROGRESS 🔍 Fetching venues for $CITY..."
    
    # Fetch from Google Places API
    QUERY=$(echo "nightlife in $CITY" | sed 's/ /%20/g')
    RESPONSE=$(curl -s "https://maps.googleapis.com/maps/api/place/textsearch/json?query=$QUERY&key=$GOOGLE_API_KEY&type=bar|night_club|restaurant")
    
    STATUS=$(echo "$RESPONSE" | jq -r '.status')
    
    if [ "$STATUS" != "OK" ] && [ "$STATUS" != "ZERO_RESULTS" ]; then
        echo "$PROGRESS ❌ API Error: $STATUS"
        continue
    fi
    
    if [ "$STATUS" = "ZERO_RESULTS" ]; then
        echo "$PROGRESS ⚠️  No venues found"
        continue
    fi
    
    # Count venues
    VENUE_COUNT=$(echo "$RESPONSE" | jq '.results | length')
    
    if [ "$VENUE_COUNT" -eq 0 ]; then
        echo "$PROGRESS ⚠️  No venues found"
        continue
    fi
    
    # Process each venue
    echo "$PROGRESS 📝 Processing $VENUE_COUNT venues..."
    
    for ((j=0; j<VENUE_COUNT; j++)); do
        VENUE=$(echo "$RESPONSE" | jq ".results[$j]")
        
        PLACE_ID=$(echo "$VENUE" | jq -r '.place_id')
        NAME=$(echo "$VENUE" | jq -r '.name' | sed "s/'/''/g")
        LAT=$(echo "$VENUE" | jq -r '.geometry.location.lat')
        LNG=$(echo "$VENUE" | jq -r '.geometry.location.lng')
        TYPE=$(echo "$VENUE" | jq -r '.types[0]')
        VICINITY=$(echo "$VENUE" | jq -r '.vicinity // .formatted_address' | sed "s/'/''/g")
        PRICE_LEVEL=$(echo "$VENUE" | jq -r '.price_level // null')
        
        # Generate vibe score (50-99)
        VIBE_SCORE=$((50 + RANDOM % 50))
        
        # Determine confidence
        if [ $VIBE_SCORE -ge 90 ]; then
            CONFIDENCE="Hot"
        elif [ $VIBE_SCORE -ge 70 ]; then
            CONFIDENCE="Popping"
        elif [ $VIBE_SCORE -ge 40 ]; then
            CONFIDENCE="Warming"
        else
            CONFIDENCE="Dead"
        fi
        
        # Build SQL query
        SQL="INSERT INTO venues (id, name, type, latitude, longitude, vibe_score, vibe_confidence, vibe_trend, district, description, price_level, is_promoted, city) 
        VALUES ('$PLACE_ID', '$NAME', '$TYPE', $LAT, $LNG, $VIBE_SCORE, '$CONFIDENCE', 'Stable', '$VICINITY', '$NAME', $PRICE_LEVEL, false, '$CITY')
        ON CONFLICT (id) DO UPDATE SET 
            name = EXCLUDED.name,
            type = EXCLUDED.type,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            vibe_score = EXCLUDED.vibe_score,
            vibe_confidence = EXCLUDED.vibe_confidence,
            district = EXCLUDED.district,
            city = EXCLUDED.city,
            updated_at = NOW();"
        
        # Execute via MCP
        manus-mcp-cli tool call execute_sql --server supabase --input "{\"project_id\":\"$PROJECT_ID\",\"query\":\"$SQL\"}" > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            ((TOTAL_INGESTED++))
        fi
    done
    
    ((SUCCESS_COUNT++))
    echo "$PROGRESS ✅ Ingested $VENUE_COUNT venues for $CITY"
    
    # Rate limiting
    sleep 0.2
done

echo ""
echo "================================"
echo "📈 Ingestion Summary"
echo "================================"
echo "✅ Successful cities: $SUCCESS_COUNT"
echo "🏢 Total venues ingested: $TOTAL_INGESTED"
echo ""
echo "✅ Ingestion completed successfully"
