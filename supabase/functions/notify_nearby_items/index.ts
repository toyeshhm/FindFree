import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("Webhook payload:", payload);

    if (payload.type !== "INSERT" || payload.table !== "items") {
      return new Response("Ignored", { status: 200 });
    }

    const item = payload.record;
    if (!item.lat || !item.lng) {
      return new Response("No location on item", { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find users who have push tokens, are NOT the poster, and whose location is within their push_radius_miles
    // We use PostGIS ST_DistanceSphere (returns meters)
    const { data: users, error } = await supabase.rpc('get_users_to_notify', {
      item_lat: item.lat,
      item_lng: item.lng,
      poster_id: item.user_id || '00000000-0000-0000-0000-000000000000'
    });

    if (error) {
      console.error("RPC Error:", error);
      throw error;
    }

    if (!users || users.length === 0) {
      console.log("No users to notify");
      return new Response("No users to notify", { status: 200 });
    }

    const pushMessages = users.map((u: any) => ({
      to: u.push_token,
      sound: "default",
      title: `Free ${item.category} nearby!`,
      body: item.title,
      data: { itemId: item.id },
    }));

    console.log(`Sending ${pushMessages.length} push notifications...`);

    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pushMessages),
    });

    const expoResult = await res.json();
    console.log("Expo push result:", expoResult);

    return new Response(JSON.stringify({ success: true, notified: pushMessages.length }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Function error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
