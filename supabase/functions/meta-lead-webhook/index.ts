// supabase/functions/meta-lead-webhook/index.ts
// Deploy with: supabase functions deploy meta-lead-webhook

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VERIFY_TOKEN = Deno.env.get("META_WEBHOOK_VERIFY_TOKEN")!; // Set in Supabase secrets
const PAGE_ACCESS_TOKEN = Deno.env.get("META_PAGE_ACCESS_TOKEN")!; // Set in Supabase secrets
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

serve(async (req: Request) => {
    const url = new URL(req.url);

    // ─── Meta webhook verification handshake (GET) ───────────────────────────
    if (req.method === "GET") {
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            console.log("Webhook verified");
            return new Response(challenge, { status: 200 });
        }
        return new Response("Forbidden", { status: 403 });
    }

    // ─── Incoming lead event (POST) ──────────────────────────────────────────
    if (req.method === "POST") {
        const body = await req.json();
        console.log("Received webhook:", JSON.stringify(body));

        for (const entry of body.entry ?? []) {
            for (const change of entry.changes ?? []) {
                if (change.field !== "leadgen") continue;

                const leadgenId: string = change.value.leadgen_id;
                const pageId: string = change.value.page_id;
                const adId: string = change.value.ad_id;
                const adsetId: string = change.value.adset_id;
                const campaignId: string = change.value.campaign_id;
                const formId: string = change.value.form_id;
                const createdTime = new Date(change.value.created_time * 1000).toISOString();

                // Fetch full lead details from Meta Graph API
                const metaRes = await fetch(
                    `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${PAGE_ACCESS_TOKEN}`
                );
                const leadData = await metaRes.json();

                if (leadData.error) {
                    console.error("Meta API error:", leadData.error);
                    continue;
                }

                // Parse field_data array into a flat object
                const fields: Record<string, string> = {};
                for (const field of leadData.field_data ?? []) {
                    fields[field.name] = field.values?.[0] ?? "";
                }

                const lead = {
                    lead_id: leadgenId,
                    full_name: fields["full_name"] || fields["name"] || null,
                    phone: fields["phone_number"] || fields["phone"] || null,
                    email: fields["email"] || null,
                    city: fields["city"] || null,
                    form_name: formId,
                    ad_id: adId,
                    adset_id: adsetId,
                    campaign_id: campaignId,
                    page_id: pageId,
                    created_time: createdTime,
                    status: "new",
                };

                const { error } = await supabase
                    .from("meta_leads")
                    .upsert(lead, { onConflict: "lead_id" }); // idempotent — safe if Meta sends twice

                if (error) {
                    console.error("Supabase insert error:", error);
                } else {
                    console.log("Lead saved:", leadgenId);
                }
            }
        }

        return new Response("OK", { status: 200 });
    }

    return new Response("Method not allowed", { status: 405 });
});