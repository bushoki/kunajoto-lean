#!/usr/bin/env python3
"""
Global Venue Ingestion Script (Python)

Efficiently fetches venues from Google Places API for 520+ cities worldwide
and batch-inserts them into Supabase.

Usage:
    python3 scripts/ingest_venues.py --limit 50
    python3 scripts/ingest_venues.py --offset 100 --limit 50
"""

import os
import sys
import time
import json
import argparse
import requests
from typing import List, Dict, Any

# Import cities list
sys.path.append(os.path.dirname(__file__))

GLOBAL_CITIES = [
    # North America (100 cities)
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose",
    "Austin", "Jacksonville", "Fort Worth", "Columbus", "Charlotte", "San Francisco", "Indianapolis", "Seattle", "Denver", "Washington DC",
    "Boston", "El Paso", "Nashville", "Detroit", "Oklahoma City", "Portland", "Las Vegas", "Memphis", "Louisville", "Baltimore",
    "Milwaukee", "Albuquerque", "Tucson", "Fresno", "Sacramento", "Kansas City", "Mesa", "Atlanta", "Omaha", "Colorado Springs",
    "Raleigh", "Miami", "Long Beach", "Virginia Beach", "Oakland", "Minneapolis", "Tulsa", "Tampa", "Arlington", "New Orleans",
    "Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg", "Quebec City", "Hamilton", "Kitchener",
    "London ON", "Victoria", "Halifax", "Oshawa", "Windsor", "Saskatoon", "Regina", "St Johns", "Kelowna", "Barrie",
    "Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "León", "Juárez", "Zapopan", "Mérida", "San Luis Potosí",
    "Aguascalientes", "Hermosillo", "Saltillo", "Mexicali", "Culiacán", "Querétaro", "Chihuahua", "Morelia", "Cancún", "Acapulco",
    "Veracruz", "Toluca", "Mazatlán", "Playa del Carmen", "Cabo San Lucas", "Puerto Vallarta", "Oaxaca", "Guanajuato", "Cuernavaca", "Durango",

    # South America (80 cities)
    "São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte", "Manaus", "Curitiba", "Recife", "Porto Alegre",
    "Belém", "Goiânia", "Guarulhos", "Campinas", "São Luís", "São Gonçalo", "Maceió", "Duque de Caxias", "Natal", "Teresina",
    "Campo Grande", "Nova Iguaçu", "São Bernardo do Campo", "João Pessoa", "Santo André", "Osasco", "Jaboatão dos Guararapes", "São José dos Campos", "Ribeirão Preto", "Uberlândia",
    "Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "San Miguel de Tucumán", "Mar del Plata", "Salta", "Santa Fe", "San Juan",
    "Resistencia", "Santiago del Estero", "Corrientes", "Posadas", "Bahía Blanca", "Paraná", "Neuquén", "Formosa", "San Salvador de Jujuy", "Comodoro Rivadavia",
    "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Cúcuta", "Bucaramanga", "Pereira", "Santa Marta", "Ibagué",
    "Pasto", "Manizales", "Neiva", "Villavicencio", "Armenia", "Valledupar", "Montería", "Sincelejo", "Popayán", "Buenaventura",
    "Lima", "Arequipa", "Trujillo", "Chiclayo", "Piura", "Iquitos", "Cusco", "Huancayo", "Chimbote", "Tacna",
    "Santiago", "Valparaíso", "Concepción", "La Serena", "Antofagasta", "Temuco", "Rancagua", "Talca", "Arica", "Puerto Montt",

    # Europe (120 cities)
    "London", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Leeds", "Sheffield", "Edinburgh", "Bristol", "Leicester",
    "Coventry", "Bradford", "Cardiff", "Belfast", "Nottingham", "Newcastle", "Brighton", "Southampton", "Portsmouth", "Reading",
    "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille",
    "Rennes", "Reims", "Saint-Étienne", "Toulon", "Le Havre", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne",
    "Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Dortmund", "Essen", "Leipzig",
    "Bremen", "Dresden", "Hanover", "Nuremberg", "Duisburg", "Bochum", "Wuppertal", "Bielefeld", "Bonn", "Münster",
    "Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga", "Murcia", "Palma", "Las Palmas", "Bilbao",
    "Alicante", "Córdoba", "Valladolid", "Vigo", "Gijón", "L'Hospitalet", "Granada", "Elche", "Oviedo", "Badalona",
    "Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence", "Bari", "Catania",
    "Venice", "Verona", "Messina", "Padua", "Trieste", "Taranto", "Brescia", "Prato", "Parma", "Modena",
    "Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Tilburg", "Groningen", "Almere", "Breda", "Nijmegen",
    "Brussels", "Antwerp", "Ghent", "Charleroi", "Liège", "Bruges", "Namur", "Leuven", "Mons", "Aalst",
    "Vienna", "Graz", "Linz", "Salzburg", "Innsbruck", "Klagenfurt", "Villach", "Wels", "Sankt Pölten", "Dornbirn",

    # Africa (60 cities)
    "Cairo", "Alexandria", "Giza", "Shubra El Kheima", "Port Said", "Suez", "Luxor", "Aswan", "Mansoura", "Tanta",
    "Lagos", "Kano", "Ibadan", "Abuja", "Port Harcourt", "Benin City", "Kaduna", "Maiduguri", "Zaria", "Aba",
    "Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", "Bloemfontein", "East London", "Polokwane", "Nelspruit", "Kimberley",
    "Kinshasa", "Lubumbashi", "Mbuji-Mayi", "Kananga", "Kisangani", "Bukavu", "Goma", "Kolwezi", "Likasi", "Matadi",
    "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Malindi", "Kitale", "Garissa", "Kakamega",
    "Accra", "Kumasi", "Tamale", "Takoradi", "Ashaiman", "Tema", "Teshie", "Cape Coast", "Obuasi", "Koforidua",

    # Asia (100 cities)
    "Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka", "Kobe", "Kyoto", "Kawasaki", "Saitama",
    "Hiroshima", "Sendai", "Chiba", "Kitakyushu", "Sakai", "Niigata", "Hamamatsu", "Kumamoto", "Sagamihara", "Shizuoka",
    "Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju", "Suwon", "Ulsan", "Changwon", "Goyang",
    "Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Chongqing", "Tianjin", "Wuhan", "Dongguan", "Xi'an",
    "Hangzhou", "Nanjing", "Shenyang", "Harbin", "Qingdao", "Jinan", "Dalian", "Zhengzhou", "Changsha", "Kunming",
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Pune", "Jaipur", "Surat",
    "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara",
    "Bangkok", "Nonthaburi", "Pak Kret", "Hat Yai", "Chiang Mai", "Nakhon Ratchasima", "Udon Thani", "Surat Thani", "Khon Kaen", "Nakhon Si Thammarat",
    "Singapore", "Kuala Lumpur", "George Town", "Ipoh", "Shah Alam", "Petaling Jaya", "Johor Bahru", "Malacca City", "Kota Kinabalu", "Kuching",
    "Manila", "Quezon City", "Davao", "Caloocan", "Cebu City", "Zamboanga", "Taguig", "Antipolo", "Pasig", "Cagayan de Oro",

    # Middle East (40 cities)
    "Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Khor Fakkan", "Dibba Al-Fujairah",
    "Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Tabuk", "Buraidah", "Khamis Mushait", "Hail",
    "Tel Aviv", "Jerusalem", "Haifa", "Rishon LeZion", "Petah Tikva", "Ashdod", "Netanya", "Beersheba", "Holon", "Bnei Brak",
    "Istanbul", "Ankara", "Izmir", "Bursa", "Adana", "Gaziantep", "Konya", "Antalya", "Kayseri", "Mersin",
    "Tehran", "Mashhad", "Isfahan", "Karaj", "Shiraz", "Tabriz", "Qom", "Ahvaz", "Kermanshah", "Urmia",

    # Oceania (30 cities)
    "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Newcastle", "Canberra", "Wollongong", "Geelong",
    "Hobart", "Townsville", "Cairns", "Darwin", "Toowoomba", "Ballarat", "Bendigo", "Albury", "Launceston", "Mackay",
    "Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga", "Napier-Hastings", "Dunedin", "Palmerston North", "Nelson", "Rotorua"
]

# Configuration
GOOGLE_API_KEY = os.getenv('VITE_GOOGLE_MAPS_API_KEY') or os.getenv('GOOGLE_API_KEY')
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('VITE_SUPABASE_ANON_KEY')

if not GOOGLE_API_KEY:
    print("❌ GOOGLE_API_KEY not found in environment")
    sys.exit(1)

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Supabase credentials not found in environment")
    sys.exit(1)

def get_vibe_confidence(score: int) -> str:
    """Get vibe confidence label from score"""
    if score >= 90:
        return 'Hot'
    elif score >= 70:
        return 'Popping'
    elif score >= 40:
        return 'Warming'
    return 'Dead'

def fetch_venues_for_city(city: str) -> List[Dict[str, Any]]:
    """Fetch venues from Google Places API for a city"""
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {
        'query': f'nightlife in {city}',
        'key': GOOGLE_API_KEY,
        'type': 'bar|night_club|restaurant'
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    if data['status'] not in ['OK', 'ZERO_RESULTS']:
        raise Exception(f"Google Places API error: {data['status']}")
    
    if data['status'] == 'ZERO_RESULTS':
        return []
    
    venues = []
    for place in data.get('results', []):
        vibe_score = 50 + (hash(place['place_id']) % 50)  # Deterministic 50-99
        
        venue = {
            'id': place['place_id'],
            'name': place['name'],
            'type': place.get('types', [None])[0],
            'image_url': f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={place['photos'][0]['photo_reference']}&key={GOOGLE_API_KEY}" if place.get('photos') else None,
            'latitude': place['geometry']['location']['lat'],
            'longitude': place['geometry']['location']['lng'],
            'vibe_score': vibe_score,
            'vibe_confidence': get_vibe_confidence(vibe_score),
            'vibe_trend': 'Stable',
            'district': place.get('vicinity') or place.get('formatted_address'),
            'description': place['name'],
            'price_level': place.get('price_level'),
            'is_promoted': False,
            'city': city
        }
        venues.append(venue)
    
    return venues

def upsert_venues_to_supabase(venues: List[Dict[str, Any]]) -> int:
    """Batch upsert venues to Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/venues"
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
    }
    
    response = requests.post(url, headers=headers, json=venues)
    
    if response.status_code not in [200, 201]:
        raise Exception(f"Supabase error: {response.status_code} - {response.text}")
    
    return len(venues)

def main():
    parser = argparse.ArgumentParser(description='Ingest venues from Google Places API')
    parser.add_argument('--offset', type=int, default=0, help='Starting city index')
    parser.add_argument('--limit', type=int, default=50, help='Number of cities to process')
    args = parser.parse_args()
    
    print("🌍 Global Venue Ingestion Script (Python)")
    print("=" * 50)
    print(f"📊 Total cities: {len(GLOBAL_CITIES)}")
    print(f"🎯 Processing cities {args.offset} to {args.offset + args.limit}")
    print()
    
    cities_to_process = GLOBAL_CITIES[args.offset:args.offset + args.limit]
    
    total_venues = 0
    successful_cities = 0
    failed_cities = []
    
    for i, city in enumerate(cities_to_process, 1):
        progress = f"[{i}/{len(cities_to_process)}]"
        
        try:
            print(f"{progress} 🔍 Fetching venues for {city}...")
            
            venues = fetch_venues_for_city(city)
            
            if not venues:
                print(f"{progress} ⚠️  No venues found for {city}")
                continue
            
            count = upsert_venues_to_supabase(venues)
            total_venues += count
            successful_cities += 1
            
            print(f"{progress} ✅ Ingested {count} venues for {city}")
            
            # Rate limiting
            time.sleep(0.15)
            
        except Exception as e:
            print(f"{progress} ❌ Error processing {city}: {str(e)}")
            failed_cities.append(city)
    
    # Summary
    print()
    print("=" * 50)
    print("📈 Ingestion Summary")
    print("=" * 50)
    print(f"✅ Successful cities: {successful_cities}/{len(cities_to_process)}")
    print(f"🏢 Total venues ingested: {total_venues}")
    print(f"❌ Failed cities: {len(failed_cities)}")
    
    if failed_cities:
        print(f"\nFailed cities: {', '.join(failed_cities)}")
    
    # Next batch suggestion
    next_offset = args.offset + args.limit
    if next_offset < len(GLOBAL_CITIES):
        print(f"\n💡 To process the next batch, run:")
        print(f"   python3 scripts/ingest_venues.py --offset={next_offset} --limit={args.limit}")
    else:
        print("\n🎉 All cities processed!")

if __name__ == '__main__':
    main()
