import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.2";

// Eventbrite API Key from user input
const EVENTBRITE_API_KEY = Deno.env.get("EVENTBRITE_API_KEY");
if (!EVENTBRITE_API_KEY) throw new Error("EVENTBRITE_API_KEY not set");

// Supabase Service Role Key from user input (for secure data insertion)
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // 1. Fetch Events from Eventbrite (Example: Events in London)
    const eventbriteUrl = `https://www.eventbriteapi.com/v3/events/search/?location.address=London&token=${EVENTBRITE_API_KEY}`;
    
    const eventbriteResponse = await fetch(eventbriteUrl, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!eventbriteResponse.ok) {
      const errorText = await eventbriteResponse.text();
      console.error("Eventbrite API failed:", eventbriteResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `Eventbrite API failed with status: ${eventbriteResponse.status}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const eventbriteData = await eventbriteResponse.json();
    const rawEvents = eventbriteData.events || [];

    // 2. Insert raw data into a staging table (as per the emphasis document)
    // NOTE: Since we don't have a raw_data_staging table, we'll log the raw data for now
    // and focus on the core logic in the next phase.

    console.log(`Successfully fetched ${rawEvents.length} events from Eventbrite.`);

    // 3. For demonstration, we'll just return the count
    return new Response(
      JSON.stringify({ message: `Eventbrite ingestion complete. Fetched ${rawEvents.length} events.` }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Ingestion error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
