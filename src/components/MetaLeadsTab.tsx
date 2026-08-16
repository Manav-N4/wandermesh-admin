// components/MetaLeadsTab.tsx
// Drop this as a new tab in your existing dashboard.

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type LeadStatus = "new" | "called" | "qualified" | "paid" | "junk";

interface MetaLead {
    id: string;
    lead_id: string;
    full_name: string | null;
    phone: string | null;
    email: string | null;
    city: string | null;
    form_name: string | null;
    campaign_id: string | null;
    created_time: string | null;
    status: LeadStatus;
    notes: string | null;
    capi_sent: boolean;
    inserted_at: string;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
    new: "New",
    called: "Called",
    qualified: "Qualified",
    paid: "Paid",
    junk: "Junk",
};

const STATUS_COLORS: Record<LeadStatus, string> = {
    new: "#E6F1FB",
    called: "#FAEEDA",
    qualified: "#EAF3DE",
    paid: "#1D9E75",
    junk: "#F1EFE8",
};

const STATUS_TEXT: Record<LeadStatus, string> = {
    new: "#185FA5",
    called: "#854F0B",
    qualified: "#3B6D11",
    paid: "#ffffff",
    junk: "#5F5E5A",
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export default function MetaLeadsTab() {
    const [leads, setLeads] = useState<MetaLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<LeadStatus | "all">("all");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [editingNote, setEditingNote] = useState<string | null>(null);
    const [noteText, setNoteText] = useState("");

    useEffect(() => {
        fetchLeads();

        const channel = supabase
            .channel("meta_leads_changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "meta_leads" }, () => fetchLeads())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    async function fetchLeads() {
        setLoading(true);
        const { data, error } = await supabase
            .from("meta_leads")
            .select("*")
            .order("inserted_at", { ascending: false });

        if (!error && data) setLeads(data as MetaLead[]);
        setLoading(false);
    }

    async function updateStatus(lead: MetaLead, newStatus: LeadStatus) {
        setUpdatingId(lead.id);

        const { error } = await supabase
            .from("meta_leads")
            .update({ status: newStatus })
            .eq("id", lead.id);

        if (!error) {
            if (newStatus === "qualified" || newStatus === "paid") {
                await triggerCAPI(lead, newStatus);
            }
            setLeads((prev) =>
                prev.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l))
            );
        }

        setUpdatingId(null);
    }

    async function triggerCAPI(lead: MetaLead, status: "qualified" | "paid") {
        try {
            await fetch(`${SUPABASE_URL}/functions/v1/meta-capi`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({
                    leadId: lead.lead_id,
                    phone: lead.phone,
                    email: lead.email,
                    eventName: status === "paid" ? "Purchase" : "Lead",
                }),
            });

            await supabase
                .from("meta_leads")
                .update({
                    capi_sent: true,
                    capi_event: status === "paid" ? "Purchase" : "Lead",
                    capi_sent_at: new Date().toISOString(),
                })
                .eq("id", lead.id);

            setLeads((prev) =>
                prev.map((l) => (l.id === lead.id ? { ...l, capi_sent: true } : l))
            );
        } catch (e) {
            console.error("CAPI trigger failed:", e);
        }
    }

    async function saveNote(leadId: string) {
        await supabase.from("meta_leads").update({ notes: noteText }).eq("id", leadId);
        setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, notes: noteText } : l)));
        setEditingNote(null);
    }

    const filtered = filterStatus === "all" ? leads : leads.filter((l) => l.status === filterStatus);

    const counts = leads.reduce((acc, l) => {
        acc[l.status] = (acc[l.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div style={{ padding: "1.5rem 0" }}>
            {/* Summary strip */}
            <div style={{ display: "flex", gap: 12, marginBottom: "1.5rem", flexWrap: "wrap" }}>
                {(["new", "called", "qualified", "paid", "junk"] as LeadStatus[]).map((s) => (
                    <div
                        key={s}
                        onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
                        style={{
                            background: filterStatus === s ? STATUS_COLORS[s] : "#f9f9f8",
                            border: `0.5px solid ${filterStatus === s ? STATUS_COLORS[s] : "#e5e5e3"}`,
                            borderRadius: 8,
                            padding: "10px 16px",
                            cursor: "pointer",
                            minWidth: 80,
                            transition: "all 0.15s",
                        }}
                    >
                        <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {STATUS_LABELS[s]}
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 500, color: "#1a1a1a", marginTop: 2 }}>
                            {counts[s] || 0}
                        </div>
                    </div>
                ))}
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
                    <button onClick={fetchLeads} style={{ fontSize: 13, padding: "8px 14px", cursor: "pointer" }}>
                        ↻ Refresh
                    </button>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <p style={{ color: "#888", fontSize: 14 }}>Loading leads…</p>
            ) : filtered.length === 0 ? (
                <p style={{ color: "#888", fontSize: 14 }}>
                    No leads yet. Once Meta sends a webhook, they'll appear here instantly.
                </p>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                            <tr style={{ borderBottom: "0.5px solid #e5e5e3" }}>
                                {["Name", "Phone", "Email", "City", "Form", "Received", "Status", "CAPI", "Notes"].map((h) => (
                                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontWeight: 500, color: "#888", whiteSpace: "nowrap" }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((lead) => (
                                <tr key={lead.id} style={{ borderBottom: "0.5px solid #e5e5e3" }}>
                                    <td style={{ padding: "10px 12px", fontWeight: 500, whiteSpace: "nowrap" }}>
                                        {lead.full_name || "—"}
                                    </td>
                                    <td style={{ padding: "10px 12px" }}>{lead.phone || "—"}</td>
                                    <td style={{ padding: "10px 12px" }}>{lead.email || "—"}</td>
                                    <td style={{ padding: "10px 12px" }}>{lead.city || "—"}</td>
                                    <td style={{ padding: "10px 12px", color: "#888", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {lead.form_name || "—"}
                                    </td>
                                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap", color: "#888" }}>
                                        {lead.created_time
                                            ? new Date(lead.created_time).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                                            : new Date(lead.inserted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                    </td>
                                    <td style={{ padding: "10px 12px" }}>
                                        <select
                                            disabled={updatingId === lead.id}
                                            value={lead.status}
                                            onChange={(e) => updateStatus(lead, e.target.value as LeadStatus)}
                                            style={{
                                                background: STATUS_COLORS[lead.status],
                                                color: STATUS_TEXT[lead.status],
                                                border: "none",
                                                borderRadius: 6,
                                                padding: "4px 8px",
                                                fontSize: 12,
                                                fontWeight: 500,
                                                cursor: "pointer",
                                            }}
                                        >
                                            {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
                                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td style={{ padding: "10px 12px" }}>
                                        {lead.capi_sent ? (
                                            <span style={{ fontSize: 11, background: "#EAF3DE", color: "#3B6D11", borderRadius: 4, padding: "2px 7px", fontWeight: 500 }}>
                                                Sent ✓
                                            </span>
                                        ) : (
                                            <span style={{ color: "#bbb", fontSize: 11 }}>—</span>
                                        )}
                                    </td>
                                    <td style={{ padding: "10px 12px", minWidth: 140 }}>
                                        {editingNote === lead.id ? (
                                            <div style={{ display: "flex", gap: 6 }}>
                                                <input
                                                    autoFocus
                                                    value={noteText}
                                                    onChange={(e) => setNoteText(e.target.value)}
                                                    onKeyDown={(e) => e.key === "Enter" && saveNote(lead.id)}
                                                    style={{ fontSize: 12, padding: "4px 8px", width: 100 }}
                                                    placeholder="Add note…"
                                                />
                                                <button onClick={() => saveNote(lead.id)} style={{ fontSize: 11, padding: "4px 8px" }}>Save</button>
                                            </div>
                                        ) : (
                                            <span
                                                onClick={() => { setEditingNote(lead.id); setNoteText(lead.notes || ""); }}
                                                style={{ cursor: "pointer", color: lead.notes ? "#1a1a1a" : "#bbb", fontSize: 12 }}
                                            >
                                                {lead.notes || "Add note"}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}