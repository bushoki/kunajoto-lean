import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

// Define the structure for a venue from the Supabase table
interface Venue {
  id: string;
  name: string;
  type: string | null;
  image_url: string | null;
  latitude: number;
  longitude: number;
  vibe_score: number | null;
  vibe_confidence: string | null;
  vibe_trend: string | null;
  district: string | null;
  description: string | null;
  price_level: number | null;
  is_promoted: boolean;
  city: string | null;
}

// Google Places API details - requires GOOGLE_API_KEY environment variable
const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
if (!GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY not set");
const GOOGLE_PLACES_BASE_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";

// Comprehensive list of 520+ major cities worldwide
const GLOBAL_CITIES = [
  // North America (100 cities)
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

  // South America (80 cities)
  "São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte", "Manaus", "Curitiba", "Recife", "Porto Alegre",
  "Belém", "Goiânia", "Guarulhos", "Campinas", "São Luís", "São Gonçalo", "Maceió", "Duque de Caxias", "Natal", "Teresina",
  "Campo Grande", "Nova Iguaçu", "São Bernardo do Campo", "João Pessoa", "Santo André", "Osasco", "Jaboatão dos Guararapes", "São José dos Campos", "Ribeirão Preto", "Uberlândia",
  "Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "San Miguel de Tucumán", "Mar del Plata", "Salta", "Santa Fe", "San Juan",
  "Resistencia", "Santiago del Estero", "Corrientes", "Posadas", "Bahía Blanca", "Paraná", "Neuquén", "Formosa", "San Salvador de Jujuy", "Comodoro Rivadavia",
  "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Cúcuta", "Bucaramanga", "Pereira", "Santa Marta", "Ibagué",
  "Pasto", "Manizales", "Neiva", "Villavicencio", "Armenia", "Valledupar", "Montería", "Sincelejo", "Popayán", "Buenaventura",
  "Lima", "Arequipa", "Trujillo", "Chiclayo", "Piura", "Iquitos", "Cusco", "Huancayo", "Chimbote", "Tacna",
  "Santiago", "Valparaíso", "Concepción", "La Serena", "Antofagasta", "Temuco", "Rancagua", "Talca", "Arica", "Puerto Montt",

  // Europe (120 cities)
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

  // Africa (60 cities)
  "Cairo", "Alexandria", "Giza", "Shubra El Kheima", "Port Said", "Suez", "Luxor", "Aswan", "Mansoura", "Tanta",
  "Lagos", "Kano", "Ibadan", "Abuja", "Port Harcourt", "Benin City", "Kaduna", "Maiduguri", "Zaria", "Aba",
  "Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", "Bloemfontein", "East London", "Polokwane", "Nelspruit", "Kimberley",
  "Kinshasa", "Lubumbashi", "Mbuji-Mayi", "Kananga", "Kisangani", "Bukavu", "Goma", "Kolwezi", "Likasi", "Matadi",
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Malindi", "Kitale", "Garissa", "Kakamega",
  "Accra", "Kumasi", "Tamale", "Takoradi", "Ashaiman", "Tema", "Teshie", "Cape Coast", "Obuasi", "Koforidua",
  "Casablanca", "Rabat", "Fez", "Marrakech", "Agadir", "Tangier", "Meknes", "Oujda", "Kenitra", "Tetouan",
  "Addis Ababa", "Dire Dawa", "Mekelle", "Gondar", "Bahir Dar", "Hawassa", "Dessie", "Jimma", "Jijiga", "Shashamane",

  // Asia (100 cities)
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

  // Middle East (40 cities)
  "Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Khor Fakkan", "Dibba Al-Fujairah",
  "Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Tabuk", "Buraidah", "Khamis Mushait", "Hail",
  "Tel Aviv", "Jerusalem", "Haifa", "Rishon LeZion", "Petah Tikva", "Ashdod", "Netanya", "Beersheba", "Holon", "Bnei Brak",
  "Istanbul", "Ankara", "Izmir", "Bursa", "Adana", "Gaziantep", "Konya", "Antalya", "Kayseri", "Mersin",
  "Tehran", "Mashhad", "Isfahan", "Karaj", "Shiraz", "Tabriz", "Qom", "Ahvaz", "Kermanshah", "Urmia",

  // Oceania (20 cities)
  "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Newcastle", "Canberra", "Wollongong", "Geelong",
  "Hobart", "Townsville", "Cairns", "Darwin", "Toowoomba", "Ballarat", "Bendigo", "Albury", "Launceston", "Mackay",
  "Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga", "Napier-Hastings", "Dunedin", "Palmerston North", "Nelson", "Rotorua"
];

// Supabase client setup
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // Use Service Role Key for ingestion
  {
    auth: {
      persistSession: false,
    },
  }
);

// Helper function to transform Google Places data to our Venue schema
function transformGooglePlaceVenue(place: any, city: string): Venue {
  // Simple logic for vibe score and confidence for now
  const vibeScore = Math.floor(Math.random() * 50) + 50; // Mock 50-99
  // Map to user-friendly labels (matches legend)
  const getVibeConfidenceLabel = (score: number): string => {
    if (score >= 90) return 'Hot';
    if (score >= 70) return 'Popping';
    if (score >= 40) return 'Warming';
    return 'Dead';
  };
  const vibeConfidence = getVibeConfidenceLabel(vibeScore);

  return {
    id: place.place_id,
    name: place.name,
    type: place.types?.[0] || null,
    image_url: place.photos?.[0]?.photo_reference ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}` : null,
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
    vibe_score: vibeScore,
    vibe_confidence: vibeConfidence,
    vibe_trend: "Stable", // Placeholder
    district: place.vicinity || place.formatted_address || null,
    description: place.name, // Using name as description for now
    price_level: place.price_level || null,
    is_promoted: false,
    city: city,
  };
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse request body to get optional parameters
  let requestBody: any = {};
  try {
    requestBody = await req.json();
  } catch (e) {
    // If no body or invalid JSON, use defaults
  }

  // Allow limiting cities for testing or incremental ingestion
  const limit = requestBody.limit || GLOBAL_CITIES.length;
  const offset = requestBody.offset || 0;
  const citiesToProcess = GLOBAL_CITIES.slice(offset, offset + limit);

  let totalVenuesIngested = 0;
  let allErrors: string[] = [];
  let processedCities = 0;

  console.log(`Starting ingestion for ${citiesToProcess.length} cities (offset: ${offset}, limit: ${limit})`);

  for (const city of citiesToProcess) {
    try {
      // 1. Fetch data from Google Places for the current city
      const response = await fetch(
        `${GOOGLE_PLACES_BASE_URL}?query=nightlife in ${city}&key=${GOOGLE_API_KEY}&type=bar|night_club|restaurant&opennow=false&maxresults=50`
      );

      if (!response.ok) {
        throw new Error(`Google Places API for ${city} failed with status: ${response.status}`);
      }

      const data = await response.json();
      const places = data.results;

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        throw new Error(`Google Places API for ${city} returned status: ${data.status}`);
      }

      // 2. Transform and prepare for upsert
      const venuesToUpsert: Venue[] = places.map((place: any) => transformGooglePlaceVenue(place, city));

      // 3. Upsert data into Supabase
      const { data: upsertData, error: upsertError } = await supabase
        .from("venues")
        .upsert(venuesToUpsert, { onConflict: "id", ignoreDuplicates: true })
        .select();

      if (upsertError) {
        console.error(`Supabase Upsert Error for ${city}:`, upsertError);
        allErrors.push(`Supabase Upsert Error for ${city}: ${upsertError.message}`);
        continue;
      }

      totalVenuesIngested += upsertData.length;
      processedCities++;
      console.log(`[${processedCities}/${citiesToProcess.length}] Successfully ingested ${upsertData.length} venues for ${city}.`);

      // Rate limiting: wait 100ms between requests to avoid hitting API limits
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`Ingestion Error for ${city}:`, error.message);
      allErrors.push(`Ingestion Error for ${city}: ${error.message}`);
    }
  }

  const responseMessage = {
    message: `Ingestion completed. Processed ${processedCities} cities.`,
    total_venues_ingested: totalVenuesIngested,
    processed_cities: processedCities,
    total_cities_in_db: GLOBAL_CITIES.length,
    offset: offset,
    limit: limit,
    errors: allErrors.length > 0 ? allErrors : undefined
  };

  if (allErrors.length > 0) {
    return new Response(
      JSON.stringify(responseMessage),
      {
        status: 207, // Multi-Status
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify(responseMessage),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
});
