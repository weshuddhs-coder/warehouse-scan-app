import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { operator, screen, limit = 5 } = await req.json();

    if (!operator) {
      return new Response(
        JSON.stringify({ scans: [] }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get today's start
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let query = supabase
      .from("scan_log")
      .select("awb, result, created_at")
      .eq("operator", operator)
      .gte("created_at", todayStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(limit);

    // Filter by scan type if screen is specified
    if (screen === "READY" || screen === "PICKED_UP") {
      query = query.eq("scan_type", screen);
    }

    const { data: scans, error } = await query;

    if (error) throw error;

    return new Response(
      JSON.stringify({ scans: scans || [] }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message, scans: [] }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
