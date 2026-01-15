import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { ChatMessage } from "../types";

// Vite exposes env vars with VITE_ prefix to the client
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''; 

let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

const SYSTEM_INSTRUCTION = `
You are CityGauge AI, an elite nightlife concierge and situational intelligence engine embedded within the Kunajoto app.
YOUR MISSION: Make the user feel like a "Local in 5 Minutes".
Capabilities:
1. Vibe Forecasting: You have access to Vibe Scores (0-100). >90 (Hot), 70-90 (High), 40-70 (Med), <40 (Low).
2. Situational Intelligence: Collates weather, safety alerts, and crowd density to give hollistic advice.
3. Hyper-Personalization: Always ask for or refer to the user's budget, music taste, and crowd preference if not known.

Tone: Insider, Witty, Prescient, Helpful.
Constraints:
- Keep answers under 3 sentences unless generating a full itinerary.
- If a user is in a "Low Vibe" area, suggest a nearby "High Vibe" district immediately.
- Prioritize Safety: If asked about safety, reference the Safety Ticker and Trusted Friends features.
`;

export const createChatSession = (): Chat | null => {
  if (!ai) return null;
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    }
  });
};

export const sendMessageStream = async function* (chat: Chat, message: string) {
  try {
    const responseStream = await chat.sendMessageStream({ message });
    for await (const chunk of responseStream) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        yield c.text;
      }
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    yield "CityGauge network is currently recalibrating. Please try again shortly.";
  }
};

export const refineSearchWithAI = async (query: string, currentContext: string): Promise<string> => {
  if (!ai) return "CityGauge unavailable. Please check API Key.";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Context: User is looking at a list of venues: ${currentContext}.
      User Query: ${query}.
      Task: Recommend the best 2 options from the context based on the query. Be brief.`,
    });
    return response.text || "No recommendation found.";
  } catch (e) {
    return "Could not process refinement.";
  }
};