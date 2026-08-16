// supabase/functions/meta-capi/index.ts
// Deploy with: supabase functions deploy meta-capi
// This receives the trigger from the React dashboard and sends the signal to Meta CAPI.
// Your META_PIXEL_ID and META_ACCESS_TOKEN are kept here, never in the browser.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const PIXEL_ID = Deno.env.get("META_PIXEL_ID")!;
const ACCESS_TOKEN = Deno.env.get("META_ACCESS_TOKEN")!;

async function sha256(value: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(value.trim().toLowerCase());
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

serve(async (req: Request) => {
    // Handle CORS preflight (needed since called from browser)
    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        });
    }

    if (req.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    const { leadId, phone, email, eventName } = await req.json();

    if (!leadId || !eventName) {
        return new Response("Missing leadId or eventName", { status: 400 });
    }

    const userData: Record<string, string> = {};
    if (phone) userData["ph"] = await sha256(phone.replace(/\D/g, "")); // digits only before hashing
    if (email) userData["em"] = await sha256(email);

    const payload = {
        data: [
            {
                event_name: eventName,           // "Lead" for qualified, "Purchase" for paid
                event_time: Math.floor(Date.now() / 1000),
                action_source: "crm",
                user_data: userData,
                custom_data: {
                    lead_id: leadId,
                },
            },
        ],
        // Uncomment below to test without it counting as a real event in Meta:
        // test_event_code: "TEST12345",
    };

    const metaRes = await fetch(
        `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }
    );

    const result = await metaRes.json();

    if (result.error) {
        console.error("Meta CAPI error:", result.error);
        return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
    }

    console.log(`CAPI ${eventName} sent for lead ${leadId}`);
    return new Response(JSON.stringify({ success: true, result }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
});