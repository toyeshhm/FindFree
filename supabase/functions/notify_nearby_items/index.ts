import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

serve(async (req) => {
  // Validate shared webhook secret before doing any work.
  const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("WEBHOOK_SECRET env var is not set");
    return new Response("Misconfigured", { status: 500 });
  }
  const incoming = req.headers.get("x-webhook-secret") ?? "";
  if (!timingSafeEqual(incoming, webhookSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const payload = await req.json();

    if (payload.type !== "INSERT" || payload.table !== "items") {
      return new Response("Ignored", { status: 200 });
    }

    // Do not trust payload.record — re-fetch from DB with the service-role client
    // so notification content can never be spoofed via a crafted webhook body.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const itemId = payload.record?.id;
    if (!itemId) {
      return new Response("No item id in payload", { status: 200 });
    }

    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("id, title, category, lat, lng, user_id")
      .eq("id", itemId)
      .single();

    if (itemError || !item) {
      console.error("Item fetch error:", itemError);
      return new Response("Item not found", { status: 200 });
    }

    if (!item.lat || !item.lng) {
      return new Response("No location on item", { status: 200 });
    }

    const { data: users, error } = await supabase.rpc("get_users_to_notify", {
      item_lat: item.lat,
      item_lng: item.lng,
      poster_id: item.user_id ?? "00000000-0000-0000-0000-000000000000",
    });

    if (error) {
      console.error("RPC Error:", error);
      throw error;
    }

    if (!users || users.length === 0) {
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
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pushMessages),
    });

    const expoResult = await res.json();
    console.log("Expo push result:", expoResult);

    return new Response(
      JSON.stringify({ success: true, notified: pushMessages.length }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("Function error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
