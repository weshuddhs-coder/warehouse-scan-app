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
    const { awb, operator } = await req.json();

    if (!awb || !operator) {
      return new Response(
        JSON.stringify({
          result: "REJECTED",
          message: "Missing AWB or operator name",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if parcel exists and is READY
    const { data: existing } = await supabase
      .from("parcels")
      .select("id, status")
      .eq("awb", awb.trim())
      .maybeSingle();

    if (!existing) {
      // Parcel not found — must be scanned as READY first
      await supabase.from("scan_log").insert({
        awb: awb.trim(),
        scan_type: "PICKED_UP",
        operator,
        result: "REJECTED",
        message: "Not found — scan READY first",
      });

      return new Response(
        JSON.stringify({
          result: "REJECTED",
          message: "Parcel not found. Scan as READY first!",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (existing.status === "CREATED") {
      await supabase.from("scan_log").insert({
        awb: awb.trim(),
        scan_type: "PICKED_UP",
        operator,
        result: "REJECTED",
        message: "Not READY yet",
      });

      return new Response(
        JSON.stringify({
          result: "REJECTED",
          message: "Parcel not marked READY yet. Scan as READY first!",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (existing.status === "PICKED_UP") {
      await supabase.from("scan_log").insert({
        awb: awb.trim(),
        scan_type: "PICKED_UP",
        operator,
        result: "DUPLICATE",
        message: "Already picked up",
      });

      return new Response(
        JSON.stringify({
          result: "DUPLICATE",
          message: "Parcel already marked as PICKED UP",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Status is READY — mark as PICKED_UP
    const now = new Date().toISOString();

    await supabase
      .from("parcels")
      .update({
        status: "PICKED_UP",
        operator_picked_up: operator,
        picked_up_at: now,
      })
      .eq("id", existing.id);

    // Get today's batch count for this operator
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: batchCount } = await supabase
      .from("scan_log")
      .select("*", { count: "exact", head: true })
      .eq("operator", operator)
      .eq("scan_type", "PICKED_UP")
      .eq("result", "ACCEPTED")
      .gte("created_at", todayStart.toISOString());

    const newBatchCount = (batchCount || 0) + 1;

    // Log the scan
    await supabase.from("scan_log").insert({
      awb: awb.trim(),
      scan_type: "PICKED_UP",
      operator,
      result: "ACCEPTED",
      message: "Marked PICKED UP",
      batch_count: newBatchCount,
    });

    return new Response(
      JSON.stringify({
        result: "ACCEPTED",
        message: "Marked PICKED UP",
        batch_count: newBatchCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
