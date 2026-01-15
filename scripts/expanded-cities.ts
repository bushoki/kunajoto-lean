/**
 * Expanded list of 800+ cities worldwide for comprehensive venue coverage
 * Includes: Major cities, secondary cities, tourist destinations, regional capitals
 */

export const EXPANDED_GLOBAL_CITIES = [
  // ========== NORTH AMERICA (150 cities) ==========
  
  // USA - Major Cities (50)
  "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose",
  "Austin", "Jacksonville", "Fort Worth", "Columbus", "Charlotte", "San Francisco", "Indianapolis", "Seattle", "Denver", "Washington DC",
  "Boston", "El Paso", "Nashville", "Detroit", "Oklahoma City", "Portland", "Las Vegas", "Memphis", "Louisville", "Baltimore",
  "Milwaukee", "Albuquerque", "Tucson", "Fresno", "Sacramento", "Kansas City", "Mesa", "Atlanta", "Omaha", "Colorado Springs",
  "Raleigh", "Miami", "Long Beach", "Virginia Beach", "Oakland", "Minneapolis", "Tulsa", "Tampa", "Arlington", "New Orleans",
  
  // USA - Secondary Cities & Tourist Destinations (50)
  "Honolulu", "Anchorage", "Boise", "Salt Lake City", "Spokane", "Tacoma", "Eugene", "Bend", "Santa Fe", "Aspen",
  "Vail", "Park City", "Napa", "Sonoma", "Carmel", "Big Sur", "Monterey", "Santa Barbara", "Malibu", "Newport Beach",
  "Laguna Beach", "Palm Springs", "Scottsdale", "Sedona", "Flagstaff", "Key West", "Fort Lauderdale", "West Palm Beach", "Sarasota", "Naples",
  "Clearwater", "St Petersburg", "Panama City Beach", "Destin", "Pensacola", "Savannah", "Charleston", "Asheville", "Wilmington", "Myrtle Beach",
  "Hilton Head", "Atlantic City", "Ocean City", "Rehoboth Beach", "Cape May", "Martha's Vineyard", "Nantucket", "Bar Harbor", "Burlington", "Stowe",
  
  // Canada (30)
  "Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg", "Quebec City", "Hamilton", "Kitchener",
  "London ON", "Victoria", "Halifax", "Oshawa", "Windsor", "Saskatoon", "Regina", "St Johns", "Kelowna", "Barrie",
  "Whistler", "Banff", "Jasper", "Niagara Falls", "Charlottetown", "Fredericton", "Whitehorse", "Yellowknife", "Iqaluit", "Thunder Bay",
  
  // Mexico (20)
  "Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "León", "Juárez", "Zapopan", "Mérida", "San Luis Potosí",
  "Cancún", "Playa del Carmen", "Tulum", "Cabo San Lucas", "Puerto Vallarta", "Mazatlán", "Acapulco", "Oaxaca", "Guanajuato", "San Miguel de Allende",
  
  // ========== SOUTH AMERICA (120 cities) ==========
  
  // Brazil (40)
  "São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte", "Manaus", "Curitiba", "Recife", "Porto Alegre",
  "Belém", "Goiânia", "Guarulhos", "Campinas", "São Luís", "São Gonçalo", "Maceió", "Duque de Caxias", "Natal", "Teresina",
  "Campo Grande", "Nova Iguaçu", "São Bernardo do Campo", "João Pessoa", "Santo André", "Osasco", "Jaboatão dos Guararapes", "São José dos Campos", "Ribeirão Preto", "Uberlândia",
  "Florianópolis", "Foz do Iguaçu", "Paraty", "Búzios", "Angra dos Reis", "Ilhabela", "Gramado", "Canela", "Bonito", "Fernando de Noronha",
  
  // Argentina (25)
  "Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "San Miguel de Tucumán", "Mar del Plata", "Salta", "Santa Fe", "San Juan",
  "Resistencia", "Santiago del Estero", "Corrientes", "Posadas", "Bahía Blanca", "Paraná", "Neuquén", "Formosa", "San Salvador de Jujuy", "Comodoro Rivadavia",
  "Bariloche", "Ushuaia", "El Calafate", "Puerto Madryn", "Iguazú",
  
  // Colombia (20)
  "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Cúcuta", "Bucaramanga", "Pereira", "Santa Marta", "Ibagué",
  "Pasto", "Manizales", "Neiva", "Villavicencio", "Armenia", "Valledupar", "Montería", "Sincelejo", "Popayán", "San Andrés",
  
  // Peru (15)
  "Lima", "Arequipa", "Trujillo", "Chiclayo", "Piura", "Iquitos", "Cusco", "Huancayo", "Chimbote", "Tacna",
  "Puno", "Ayacucho", "Huaraz", "Paracas", "Máncora",
  
  // Chile (10)
  "Santiago", "Valparaíso", "Concepción", "La Serena", "Antofagasta", "Temuco", "Rancagua", "Talca", "Arica", "Puerto Montt",
  
  // Other South America (10)
  "Quito", "Guayaquil", "Cuenca", "Galápagos", "Montevideo", "Punta del Este", "La Paz", "Santa Cruz", "Asunción", "Caracas",
  
  // ========== EUROPE (200 cities) ==========
  
  // UK & Ireland (30)
  "London", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Leeds", "Sheffield", "Edinburgh", "Bristol", "Leicester",
  "Coventry", "Bradford", "Cardiff", "Belfast", "Nottingham", "Newcastle", "Brighton", "Southampton", "Portsmouth", "Reading",
  "Cambridge", "Oxford", "Bath", "York", "Canterbury", "Dublin", "Cork", "Galway", "Limerick", "Killarney",
  
  // France (30)
  "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille",
  "Rennes", "Reims", "Saint-Étienne", "Toulon", "Le Havre", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne",
  "Cannes", "Monaco", "Biarritz", "Saint-Tropez", "Avignon", "Aix-en-Provence", "Chamonix", "Annecy", "Colmar", "La Rochelle",
  
  // Germany (30)
  "Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Dortmund", "Essen", "Leipzig",
  "Bremen", "Dresden", "Hanover", "Nuremberg", "Duisburg", "Bochum", "Wuppertal", "Bielefeld", "Bonn", "Münster",
  "Heidelberg", "Freiburg", "Rothenburg", "Bamberg", "Würzburg", "Regensburg", "Konstanz", "Garmisch-Partenkirchen", "Baden-Baden", "Trier",
  
  // Spain (30)
  "Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga", "Murcia", "Palma", "Las Palmas", "Bilbao",
  "Alicante", "Córdoba", "Valladolid", "Vigo", "Gijón", "L'Hospitalet", "Granada", "Elche", "Oviedo", "Badalona",
  "Ibiza", "Marbella", "San Sebastián", "Salamanca", "Toledo", "Segovia", "Ronda", "Tarragona", "Pamplona", "Santander",
  
  // Italy (30)
  "Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence", "Bari", "Catania",
  "Venice", "Verona", "Messina", "Padua", "Trieste", "Taranto", "Brescia", "Prato", "Parma", "Modena",
  "Pisa", "Siena", "Lucca", "Perugia", "Assisi", "Amalfi", "Positano", "Capri", "Sorrento", "Cinque Terre",
  
  // Netherlands & Belgium (20)
  "Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Tilburg", "Groningen", "Almere", "Breda", "Nijmegen",
  "Brussels", "Antwerp", "Ghent", "Charleroi", "Liège", "Bruges", "Namur", "Leuven", "Mons", "Aalst",
  
  // Austria & Switzerland (20)
  "Vienna", "Graz", "Linz", "Salzburg", "Innsbruck", "Klagenfurt", "Villach", "Wels", "Sankt Pölten", "Dornbirn",
  "Zurich", "Geneva", "Basel", "Bern", "Lausanne", "Lucerne", "Zermatt", "Interlaken", "St Moritz", "Lugano",
  
  // Scandinavia (20)
  "Stockholm", "Gothenburg", "Malmö", "Uppsala", "Copenhagen", "Aarhus", "Odense", "Oslo", "Bergen", "Trondheim",
  "Helsinki", "Espoo", "Tampere", "Reykjavik", "Akureyri", "Tromsø", "Lofoten", "Stavanger", "Ålesund", "Kiruna",
  
  // Eastern Europe (20)
  "Prague", "Brno", "Budapest", "Debrecen", "Warsaw", "Kraków", "Gdańsk", "Wrocław", "Bucharest", "Cluj-Napoca",
  "Sofia", "Plovdiv", "Athens", "Thessaloniki", "Santorini", "Mykonos", "Crete", "Rhodes", "Dubrovnik", "Split",
  
  // ========== AFRICA (80 cities) ==========
  
  // Egypt (10)
  "Cairo", "Alexandria", "Giza", "Shubra El Kheima", "Port Said", "Suez", "Luxor", "Aswan", "Hurghada", "Sharm el-Sheikh",
  
  // Nigeria (10)
  "Lagos", "Kano", "Ibadan", "Abuja", "Port Harcourt", "Benin City", "Kaduna", "Maiduguri", "Zaria", "Aba",
  
  // South Africa (15)
  "Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", "Bloemfontein", "East London", "Polokwane", "Nelspruit", "Kimberley",
  "Stellenbosch", "Knysna", "Hermanus", "Plettenberg Bay", "Franschhoek",
  
  // DR Congo (10)
  "Kinshasa", "Lubumbashi", "Mbuji-Mayi", "Kananga", "Kisangani", "Bukavu", "Goma", "Kolwezi", "Likasi", "Matadi",
  
  // Kenya (10)
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Malindi", "Kitale", "Lamu", "Diani Beach",
  
  // Ghana (5)
  "Accra", "Kumasi", "Tamale", "Takoradi", "Cape Coast",
  
  // Morocco (10)
  "Casablanca", "Rabat", "Fez", "Marrakech", "Agadir", "Tangier", "Meknes", "Oujda", "Essaouira", "Chefchaouen",
  
  // Ethiopia (5)
  "Addis Ababa", "Dire Dawa", "Mekelle", "Gondar", "Bahir Dar",
  
  // Other Africa (5)
  "Tunis", "Algiers", "Dakar", "Abidjan", "Kampala",
  
  // ========== ASIA (150 cities) ==========
  
  // Japan (25)
  "Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka", "Kobe", "Kyoto", "Kawasaki", "Saitama",
  "Hiroshima", "Sendai", "Chiba", "Kitakyushu", "Sakai", "Niigata", "Hamamatsu", "Kumamoto", "Sagamihara", "Shizuoka",
  "Nara", "Hakone", "Nikko", "Takayama", "Kanazawa",
  
  // South Korea (15)
  "Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju", "Suwon", "Ulsan", "Changwon", "Goyang",
  "Jeju", "Gyeongju", "Jeonju", "Sokcho", "Gangneung",
  
  // China (30)
  "Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Chongqing", "Tianjin", "Wuhan", "Dongguan", "Xi'an",
  "Hangzhou", "Nanjing", "Shenyang", "Harbin", "Qingdao", "Jinan", "Dalian", "Zhengzhou", "Changsha", "Kunming",
  "Suzhou", "Guilin", "Lijiang", "Dali", "Yangshuo", "Huangshan", "Lhasa", "Urumqi", "Macau", "Hong Kong",
  
  // India (30)
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Pune", "Jaipur", "Surat",
  "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara",
  "Goa", "Udaipur", "Varanasi", "Agra", "Rishikesh", "Dharamshala", "Shimla", "Manali", "Kochi", "Mysore",
  
  // Thailand (15)
  "Bangkok", "Nonthaburi", "Pak Kret", "Hat Yai", "Chiang Mai", "Nakhon Ratchasima", "Udon Thani", "Surat Thani", "Khon Kaen", "Nakhon Si Thammarat",
  "Phuket", "Pattaya", "Krabi", "Koh Samui", "Ayutthaya",
  
  // Southeast Asia (20)
  "Singapore", "Kuala Lumpur", "George Town", "Ipoh", "Johor Bahru", "Malacca City", "Langkawi", "Kota Kinabalu", "Kuching", "Cameron Highlands",
  "Manila", "Quezon City", "Davao", "Cebu City", "Boracay", "Palawan", "Hanoi", "Ho Chi Minh City", "Da Nang", "Hoi An",
  
  // Other Asia (15)
  "Kathmandu", "Pokhara", "Colombo", "Kandy", "Dhaka", "Chittagong", "Yangon", "Bagan", "Phnom Penh", "Siem Reap",
  "Vientiane", "Luang Prabang", "Bali", "Jakarta", "Yogyakarta",
  
  // ========== MIDDLE EAST (60 cities) ==========
  
  // UAE (10)
  "Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Khor Fakkan", "Dibba Al-Fujairah",
  
  // Saudi Arabia (10)
  "Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Tabuk", "Buraidah", "Khamis Mushait", "Hail",
  
  // Israel (10)
  "Tel Aviv", "Jerusalem", "Haifa", "Rishon LeZion", "Petah Tikva", "Ashdod", "Netanya", "Beersheba", "Holon", "Bnei Brak",
  
  // Turkey (15)
  "Istanbul", "Ankara", "Izmir", "Bursa", "Adana", "Gaziantep", "Konya", "Antalya", "Kayseri", "Mersin",
  "Bodrum", "Fethiye", "Pamukkale", "Cappadocia", "Ephesus",
  
  // Iran (10)
  "Tehran", "Mashhad", "Isfahan", "Karaj", "Shiraz", "Tabriz", "Qom", "Ahvaz", "Kermanshah", "Urmia",
  
  // Other Middle East (5)
  "Beirut", "Amman", "Petra", "Doha", "Muscat",
  
  // ========== OCEANIA (40 cities) ==========
  
  // Australia (25)
  "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Newcastle", "Canberra", "Wollongong", "Geelong",
  "Hobart", "Townsville", "Cairns", "Darwin", "Toowoomba", "Ballarat", "Bendigo", "Albury", "Launceston", "Mackay",
  "Byron Bay", "Noosa", "Port Douglas", "Whitsundays", "Margaret River",
  
  // New Zealand (15)
  "Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga", "Napier-Hastings", "Dunedin", "Palmerston North", "Nelson", "Rotorua",
  "Queenstown", "Wanaka", "Taupo", "Milford Sound", "Franz Josef"
];

export const EXPANDED_CITIES_COUNT = EXPANDED_GLOBAL_CITIES.length;

console.log(`Total expanded cities: ${EXPANDED_CITIES_COUNT}`);
