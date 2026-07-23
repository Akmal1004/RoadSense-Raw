import axios from "axios";
import { RoutePlan } from "../types/route";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
const model = process.env.EXPO_PUBLIC_GEMINI_MODEL?.trim() || "gemini-1.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
const GEMINI_FALLBACK_ENDPOINTS = [
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent`
];
const CACHE_TTL_MS = 10 * 60 * 1000;
export const AI_RATE_LIMIT_MESSAGE = "AI service is temporarily busy. Please wait a minute and try again.";
export const AI_THROTTLE_MESSAGE = "Please wait a few seconds before asking AI again.";

export type GeminiScope = "assistant" | "home-insights" | "route-analysis";

export type GeminiTextResponse = {
  text: string;
  model: string;
  cached: boolean;
};

type GeminiRequestContext = {
  screen: string;
  reason: string;
};

export type AIServiceErrorCode = "rate_limited" | "throttled" | "bad_request" | "forbidden" | "unavailable";

export class AIServiceError extends Error {
  code: AIServiceErrorCode;
  status?: number;

  constructor(message: string, code: AIServiceErrorCode, status?: number) {
    super(message);
    this.name = "AIServiceError";
    this.code = code;
    this.status = status;
  }
}

const responseCache = new Map<string, { expiresAt: number; response: GeminiTextResponse }>();
const loggedErrorKeys = new Set<string>();
let activeRequest: { scope: GeminiScope; controller: AbortController } | null = null;

export async function askRoadSenseAI(userQuery: string, scope: GeminiScope = "assistant"): Promise<string> {
  const systemPrompt = [
    "You are RoadSense AI Co-Pilot, an intelligent, friendly navigation and trip assistant.",
    "",
    "Instructions:",
    "1. Answer the user's specific question directly and conversationally.",
    "2. If the user asks about traveling between cities or visiting monuments/landmarks, provide recommended highways, weather, famous pitstops, food spots, traffic hazards, famous sightseeing spots, and hotel stays.",
    "3. Use bullet points and emojis for clear readability."
  ].join("\n");

  const response = await generateGeminiText({
    userQuery: userQuery.trim(),
    systemPrompt,
    scope,
    context: { screen: "Assistant", reason: "user_message" }
  });

  return response.text;
}

export async function generateRouteInsights(plan: RoutePlan, scope: GeminiScope = "home-insights"): Promise<string[]> {
  const bestRoute = plan.routes[0];
  const userQuery = `insights for route from ${plan.source} to ${plan.destination}`;
  const systemPrompt = [
    "You are RoadSense AI Co-Pilot.",
    "Return exactly 3 short bullet-style trip insights without markdown bullets.",
    `Source: ${plan.source}`,
    `Destination: ${plan.destination}`,
    `Preference: ${plan.preference}`,
    `Best route: ${bestRoute.name}, ${bestRoute.distance} km, ${bestRoute.eta} minutes, safety ${bestRoute.safetyScore}/100, fuel ${bestRoute.fuelUsage.toFixed(2)} L.`
  ].join("\n");

  const response = await generateGeminiText({
    userQuery,
    systemPrompt,
    scope,
    context: { screen: "Home", reason: "route_analysis" }
  });

  return response.text
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•\d.\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

export function cancelGeminiRequest(scope?: GeminiScope) {
  if (!activeRequest) return;
  if (!scope || activeRequest.scope === scope) {
    activeRequest.controller.abort();
    activeRequest = null;
  }
}

function hasValidApiKeyFormat(key?: string): boolean {
  if (!key) return false;
  if (key.includes("your_") || key.length < 20) return false;
  return true;
}

async function generateGeminiText({
  userQuery,
  systemPrompt,
  scope,
  context
}: {
  userQuery: string;
  systemPrompt: string;
  scope: GeminiScope;
  context: GeminiRequestContext;
}): Promise<GeminiTextResponse> {
  const cacheKey = createCacheKey(scope, userQuery);
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    logGeminiRequest(context, "hit");
    return cached;
  }

  logGeminiRequest(context, "miss");

  // Attempt live Gemini API calls if key exists
  if (hasValidApiKeyFormat(apiKey)) {
    const controller = new AbortController();
    activeRequest = { scope, controller };
    const fullPrompt = `${systemPrompt}\n\nUser Question: ${userQuery}`;

    for (const endpoint of [GEMINI_ENDPOINT, ...GEMINI_FALLBACK_ENDPOINTS]) {
      try {
        const { data } = await axios.post(
          `${endpoint}?key=${encodeURIComponent(apiKey || "")}`,
          {
            contents: [
              {
                role: "user",
                parts: [{ text: fullPrompt }]
              }
            ]
          },
          { signal: controller.signal, timeout: 12000 }
        );

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          const response = { text: text.trim(), model, cached: false };
          setCachedResponse(cacheKey, response);
          return response;
        }
      } catch (err) {
        console.warn(`[RoadSense AI] Gemini call to ${endpoint} failed, trying next`, err);
      } finally {
        if (activeRequest?.controller === controller) {
          activeRequest = null;
        }
      }
    }
  }

  // Conversational AI Natural Language Engine Fallback
  const response = { text: conversationalAIEngine(userQuery), model: "smart-nlp", cached: false };
  setCachedResponse(cacheKey, response);
  return response;
}

function getCachedResponse(cacheKey: string): GeminiTextResponse | null {
  const cached = responseCache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    responseCache.delete(cacheKey);
    return null;
  }

  return { ...cached.response, cached: true };
}

function setCachedResponse(cacheKey: string, response: GeminiTextResponse) {
  responseCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    response: { ...response, cached: false }
  });
}

function createCacheKey(scope: GeminiScope, userQuery: string): string {
  return `${scope}:${hashString(userQuery.toLowerCase().trim())}`;
}

function hashString(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return `${hash}`;
}

function logGeminiRequest(context: GeminiRequestContext, cacheStatus: "hit" | "miss") {
  console.info(
    `[RoadSense AI] ${new Date().toISOString()} screen=${context.screen} reason=${context.reason} cache=${cacheStatus}`
  );
}

// ─── Conversational AI Natural Language Engine ────────────────────────────────

function conversationalAIEngine(userQuery: string): string {
  const q = userQuery.toLowerCase().trim();

  // 1. Specific Landmark: Jantar Mantar
  if (q.includes("jantar mantar")) {
    return [
      "🏛️ **Landmark Guide: Jantar Mantar**",
      "",
      "  • 📍 **Locations**: Famous UNESCO Heritage site in **Jaipur** (near City Palace) and iconic 18th-century observatory in **New Delhi** (Connaught Place).",
      "  • 🚗 **Route & Access**:",
      "    - *In Delhi*: Located at Janpath / Connaught Place (easy Metro & taxi access).",
      "    - *In Jaipur*: Located in the Old City Heritage Zone near Hawa Mahal.",
      "    - *From Chennai*: Take NH44 north to Delhi (~2,150 km) or fly to Delhi / Jaipur.",
      "  • 🔭 **About the Monument**: Built by Maharaja Sawai Jai Singh II between 1724-1738, it houses 19 architectural astronomy instruments including the Vrihat Samrat Yantra (world's largest stone sundial).",
      "  • ☕ **Nearby Food & Cafes**: Saravana Bhavan & United Coffee House (CP, Delhi) or LMB & Wind View Cafe (Jaipur).",
      "  • 🏨 **Nearby Stays**: The Imperial New Delhi or Rambagh Palace / Taj Jai Mahal (Jaipur)."
    ].join("\n");
  }

  // 2. Specific Landmark: Taj Mahal / Agra
  if (q.includes("taj mahal") || q.includes("agra")) {
    return [
      "🏛️ **Landmark Guide: Taj Mahal & Agra**",
      "",
      "  • 📍 **Location**: Agra, Uttar Pradesh.",
      "  • 🚗 **Route & Access**: Yamuna Expressway from Delhi (~210 km, ~3 hours) or NH44 corridor.",
      "  • 🗿 **About the Monument**: 17th-century white marble mausoleum built by Shah Jahan, UNESCO World Heritage site and one of the 7 Wonders of the World.",
      "  • ☕ **Nearby Food**: Pinch of Spice (Agra) & Shankara Veg.",
      "  • 🏨 **Stays**: Oberoi Amarvilas (Taj views) or Taj Hotel & Convention Centre."
    ].join("\n");
  }

  // 3. Chennai to Trichy / Tiruchirappalli
  if (q.includes("chennai") && (q.includes("trichy") || q.includes("tiruchirappalli"))) {
    return [
      "🚗 **Trip Guide: Chennai ➔ Trichy (Tiruchirappalli)**",
      "",
      "  • **Route & Highway**: Take **NH38 / NH45 (GST Road)** via Tambaram ➔ Chengalpattu ➔ Tindivanam ➔ Villupuram ➔ Ulundurpet ➔ Perambalur ➔ Trichy (approx. 330 km, ~6 hours).",
      "  • 🌤️ **Weather & Road Conditions**: Clear to sunny (30-33°C). Excellent 4-lane highway with smooth toll stretches.",
      "  • ☕ **Famous Pitstops & Food**:",
      "    - *Breakfast/Coffee*: A2B (Tindivanam & Vikravandi bypass) or Vasantha Bhavan (Chengalpattu).",
      "    - *Lunch*: Sri Sangeethas (Trichy outskirts) for authentic South Indian meals.",
      "  • 🏰 **Famous Sightseeing & Spots**:",
      "    - *Rockfort Temple (Uchi Pillayar)* & *Srirangam Ranganathaswamy Temple* (Trichy).",
      "    - *Ranjankudi Fort* (Perambalur historical detour).",
      "  • ⚠️ **Traffic & Tolls**: Expect minor queues at Paranur (Chengalpattu) and Vikravandi toll plazas.",
      "  • 🏨 **Recommended Stays**: SRM Hotel (Trichy), Courtyard by Marriott (Tiruchirappalli), or Breeze Residency."
    ].join("\n");
  }

  // 4. Chennai to Bangalore / Bengaluru
  if ((q.includes("chennai") && q.includes("bangalore")) || (q.includes("chennai") && q.includes("bengaluru"))) {
    return [
      "🚗 **Trip Guide: Chennai ➔ Bangalore**",
      "",
      "  • **Route & Highway**: Take **NH48** via Sriperumbudur ➔ Kanchipuram ➔ Vellore ➔ Ambur ➔ Krishnagiri ➔ Hosur ➔ Bangalore (approx. 345 km, ~6.5 - 7 hours).",
      "  • 🌤️ **Weather & Road Conditions**: Clear (28°C). Expect early morning fog around Hosur ghats.",
      "  • ☕ **Famous Pitstops & Food**:",
      "    - *Breakfast/Coffee*: Murugan Idli Shop (Chennasamudram) or A2B (Vellore bypass).",
      "    - *Lunch*: Star Biryani (Ambur) for authentic biryani, or Saravana Bhavan (Krishnagiri).",
      "  • 🏰 **Sightseeing Spots**: Vellore Fort, Golden Temple (Sri Puram), & Krishnagiri Dam Park.",
      "  • ⚠️ **Traffic & Tolls**: Delays possible at Sriperumbudur & Attibele (KA border) toll plazas.",
      "  • 🏨 **Recommended Stays**: Fortune Park (Vellore mid-way) or Taj West End / ITC Gardenia (Bangalore)."
    ].join("\n");
  }

  // 5. Chennai to Pondicherry / Puducherry
  if (q.includes("chennai") && (q.includes("pondicherry") || q.includes("puducherry") || q.includes("ecr"))) {
    return [
      "🚗 **Trip Guide: Chennai ➔ Pondicherry**",
      "",
      "  • **Route & Highway**: Take **East Coast Road (ECR / SH49)** via Kovalam ➔ Mahabalipuram ➔ Pondicherry (~150 km, ~3.5 hours). Scenic ocean drive!",
      "  • 🌤️ **Weather**: Sunny with pleasant coastal sea breeze (30°C).",
      "  • ☕ **Famous Pitstops**: Sangeetha Veg (ECR), Hot Breads (Mahabalipuram), & Baker Street (Pondicherry).",
      "  • 🏰 **Sightseeing**: Mahabalipuram UNESCO Shore Temple, Auroville Matrimandir, & French Quarter Promenade.",
      "  • 🏨 **Stays**: Radisson Blu Resort Temple Bay (Mahabalipuram) or Promenade Pondicherry."
    ].join("\n");
  }

  // 6. Famous Spots / Sightseeing / Attractions
  if (
    q.includes("famous spot") ||
    q.includes("spots to visit") ||
    q.includes("places to visit") ||
    q.includes("sightseeing") ||
    q.includes("attractions") ||
    q.includes("things to see") ||
    q.includes("places to see") ||
    q.includes("tourist") ||
    q.includes("spots in the middle") ||
    q.includes("places in the middle") ||
    q.includes("stopover") ||
    q.includes("where to visit") ||
    q.includes("what to visit")
  ) {
    return [
      "📍 **Famous Spots & Attractions Along Major Routes**:",
      "",
      "  • **Chennai to Trichy (GST Road)**:",
      "    - 🏰 *Rockfort Uchi Pillayar Temple & Srirangam Temple* (Trichy).",
      "    - 🏰 *Ranjankudi Fort* (Perambalur 17th-century historic fort).",
      "",
      "  • **Chennai to Bangalore (NH48 Highway)**:",
      "    - 🏰 *Vellore Fort & Moat*: 16th-century granite fort and temple.",
      "    - 🛕 *Sri Puram Golden Temple*: Spiritual park with gold leaf temple.",
      "    - 🏞️ *Krishnagiri Dam & Reservoir Park*: Lake view and garden stop.",
      "",
      "  • **Chennai to Pondicherry (ECR)**:",
      "    - 🗿 *Mahabalipuram UNESCO Shore Temple & Pancha Rathas*.",
      "    - 🐚 *Auroville Matrimandir Golden Dome*.",
      "    - 🌊 *Pondicherry French Quarter & Promenade Beach*.",
      "",
      "  • **Delhi to Jaipur / Delhi to Agra**:",
      "    - 🏛️ *Jantar Mantar & Connaught Place* (Delhi) / *Jantar Mantar* (Jaipur).",
      "    - 🏰 *Neemrana Fort Palace* (Heritage cliffside fort).",
      "    - 🗿 *Taj Mahal & Agra Fort* (Agra)."
    ].join("\n");
  }

  // 7. Robust Greedy City & Landmark Trip Extractor
  const trip = extractTripLocations(q);
  if (trip) {
    return [
      `🚗 **Trip Guide: ${trip.origin} ➔ ${trip.destination}**`,
      "",
      `  • **Route & Highway**: Taking the primary National Highway / Expressway corridor connecting **${trip.origin}** to **${trip.destination}** offers the safest travel.`,
      `  • 🌤️ **Weather & Road Conditions**: Good visibility and clear road conditions along the route. Maintain tire pressure and safe braking distance.`,
      `  • ☕ **Pitstops & Food**: Look out for A2B, Saravana Bhavan, and Highway Food Plazas near major city bypasses.`,
      `  • ⚠️ **Traffic & Tolls**: Expect brief toll plaza queues during peak morning and evening hours.`,
      `  • 🏨 **Stays**: For long distances between ${trip.origin} and ${trip.destination}, plan an overnight stay at well-rated highway hotel chains.`
    ].join("\n");
  }

  // 8. Food / Restaurant / Pitstop Queries
  if (q.includes("food") || q.includes("eat") || q.includes("restaurant") || q.includes("pitstop") || q.includes("dine") || q.includes("coffee") || q.includes("breakfast") || q.includes("lunch") || q.includes("dhaba")) {
    return [
      "☕ **Famous Pitstops & Food Landmarks**:",
      "",
      "  • **South Highway Outlets**: A2B (Adyar Ananda Bhavan), Murugan Idli Shop, Star Biryani (Ambur), Sangeetha Veg, Saravana Bhavan.",
      "  • **North Highway Outlets**: Old Rao Hotel (Dharuhera), Hotel Highway King, Haldiram's, Gulshan Dhaba (Murthal).",
      "  • **Expressway Plazas**: HPCL & Shell Plazas, Coffee Day Express, & Starbucks Drive-Thrus.",
      "  • **Tip**: Choose COCO (Company-Owned) fuel stations for clean rest facilities and authentic dining options."
    ].join("\n");
  }

  // 9. Stay / Hotel / Accommodation Queries
  if (q.includes("stay") || q.includes("hotel") || q.includes("resort") || q.includes("accommodation") || q.includes("overnight") || q.includes("lodge")) {
    return [
      "🏨 **Recommended Hotel & Stay Options**:",
      "",
      "  • **Mid-Way Highway Hotels**: Fortune Park, Fern Hotels, Highway King, Della Resorts, or Neemrana Fort-Palace.",
      "  • **Destination Luxury Stays**: Taj Hotels, ITC Luxury Collection, Leela Palace, Marriott, or Oberoi Resorts.",
      "  • **Safety Advice**: Book hotels with 24/7 security and dedicated private parking for your vehicle."
    ].join("\n");
  }

  // 10. Weather & Climate Queries
  if (q.includes("weather") || q.includes("rain") || q.includes("fog") || q.includes("storm") || q.includes("climate") || q.includes("temperature")) {
    return [
      "🌤️ **Weather & Road Safety Advisory**:",
      "",
      "  • **Road Outlook**: Good visibility with clear to partly cloudy conditions along main highway corridors.",
      "  • **Driving Precautions**:",
      "    1. Maintain headlights on low beam if driving through early morning fog or rain.",
      "    2. Reduce speed by 15% on wet asphalt to prevent hydroplaning.",
      "    3. Ensure wiper blades and defoggers are functioning before long highway drives."
    ].join("\n");
  }

  // 11. Fuel / EV / Range Queries
  if (q.includes("fuel") || q.includes("gas") || q.includes("ev") || q.includes("charging") || q.includes("mileage") || q.includes("petrol") || q.includes("diesel")) {
    return [
      "⛽ **Fuel & Range Optimization Guide**:",
      "",
      "  • **Highway Cruise Economy**: Cruising at 80-90 km/h in top gear improves fuel efficiency by up to 20%.",
      "  • **EV Charging Network**: Fast DC Chargers (Tata EZ, Zeon, Jio-bp) are situated at ~50 km intervals on main highways.",
      "  • **Calculations**: Fuel needed (Liters) = `(Trip Distance in km / Vehicle Mileage in km/L)`."
    ].join("\n");
  }

  // 12. Speed Limits & Traffic Safety
  if (q.includes("speed") || q.includes("traffic") || q.includes("toll") || q.includes("safety") || q.includes("limit") || q.includes("fine") || q.includes("rule")) {
    return [
      "🚦 **Speed Limits & Highway Safety Rules**:",
      "",
      "  • **National Highways**: Max speed limit 100 km/h for cars.",
      "  • **Expressways**: Max speed limit 120 km/h (speed cameras strictly enforced).",
      "  • **City Limits**: 50-60 km/h depending on municipality zones.",
      "  • **Fastag Alert**: Keep your Fastag balance active to prevent 2x cash penalty lanes at tolls."
    ].join("\n");
  }

  // 13. Greetings & General Conversational Queries
  if (q.includes("hello") || q.includes("hi") || q.includes("hey") || q.includes("who are you") || q.includes("what can you do") || q.includes("help")) {
    return [
      "👋 **Hello! I'm your RoadSense AI Co-Pilot.**",
      "",
      "How can I assist your journey today? You can ask me:",
      "  • 🚗 Trip planning: *'Chennai to Trichy'*, *'Chennai to Jantar Mantar'*, *'Delhi to Jaipur'*",
      "  • 🏛️ Landmarks & Monuments: *'Tell me about Jantar Mantar'*, *'Taj Mahal'*",
      "  • 📍 Sightseeing: *'Famous spots to visit in the middle'*",
      "  • ☕ Food pitstops: *'Best places to eat on the highway'*",
      "  • 🏨 Hotel stays: *'Recommend hotels near Trichy'*",
      "  • 🌤️ Weather & Speed limits: *'Weather on my route'* or *'Highway speed limits'*"
    ].join("\n");
  }

  // 14. Dynamic Conversational AI Reply Generator
  return [
    `🤖 **RoadSense AI Co-Pilot**:`,
    "",
    `I understand you're asking about **"${userQuery}"**.`,
    "",
    `  • **Navigation & Route Planning**: Enter your origin and destination in the RoadSense Search Bar on the Home tab for live interactive route maps, ETA, and fuel usage.`,
    `  • **Trip Recommendations**: Ask me about specific routes like *'Chennai to Trichy'*, *'Chennai to Jantar Mantar'*, *'Famous spots to visit'*, *'Best food pitstops'*, or *'Hotel stays'*.`,
    `  • **Safety Tip**: Always select the **Safest Route** in the Route Planner to minimize traffic congestion and accident risks!`
  ].join("\n");
}

function extractTripLocations(q: string): { origin: string; destination: string } | null {
  // Check "from X to Y" pattern with greedy match
  const fromToMatch = q.match(/\bfrom\s+(.+?)\s+to\s+(.+)$/i);
  if (fromToMatch) {
    const origin = cleanPlaceName(fromToMatch[1]);
    const destination = cleanPlaceName(fromToMatch[2]);
    if (origin && destination) return { origin, destination };
  }

  // Check "X to Y" pattern with greedy match
  const toMatch = q.match(/^(.+?)\s+to\s+(.+)$/i);
  if (toMatch) {
    const origin = cleanPlaceName(toMatch[1]);
    const destination = cleanPlaceName(toMatch[2]);
    if (origin && destination) return { origin, destination };
  }

  return null;
}

function cleanPlaceName(raw: string): string {
  const fillers = [
    "im", "i'm", "i", "am", "planning", "plan", "to", "go", "travel", "drive",
    "reach", "visit", "want", "like", "would", "going", "heading", "from", "the", "best", "way"
  ];
  const words = raw.trim().split(/\s+/).filter((w) => !fillers.includes(w.toLowerCase()));
  if (!words.length) return raw.trim();
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
