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

    // Check if parcel already exists
    const { data: existing } = await supabase
      .from("parcels")
      .select("id, status")
      .eq("awb", awb.trim())
      .maybeSingle();

    if (existing && existing.status !== "CREATED") {
      // Already marked READY or PICKED_UP — log as duplicate
      await supabase.from("scan_log").insert({
        awb: awb.trim(),
        scan_type: "READY",
        operator,
        result: "DUPLICATE",
        message: `Already ${existing.status}`,
      });

      return new Response(
        JSON.stringify({
          result: "DUPLICATE",
          message: `Parcel already marked as ${existing.status}`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const now = new Date().toISOString();

    if (existing) {
      // Update existing CREATED parcel to READY
      await supabase
        .from("parcels")
        .update({
          status: "READY",
          operator_ready: operator,
          ready_at: now,
        })
        .eq("id", existing.id);
    } else {
      // Create new parcel and mark as READY
      await supabase.from("parcels").insert({
        awb: awb.trim(),
        status: "READY",
        operator_ready: operator,
        ready_at: now,
      });
    }

    // Get today's batch count for this operator
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: batchCount } = await supabase
      .from("scan_log")
      .select("*", { count: "exact", head: true })
      .eq("operator", operator)
      .eq("scan_type", "READY")
      .eq("result", "ACCEPTED")
      .gte("created_at", todayStart.toISOString());

    const newBatchCount = (batchCount || 0) + 1;

    // Log the scan
    await supabase.from("scan_log").insert({
      awb: awb.trim(),
      scan_type: "READY",
      operator,
      result: "ACCEPTED",
      message: "Marked READY",
      batch_count: newBatchCount,
    });

    return new Response(
      JSON.stringify({
        result: "ACCEPTED",
        message: "Marked READY",
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
