"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Loader2, Search, UserPlus, ChevronRight, Ban, CheckCircle,
  Trash2, X, KeyRound, Mail,
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  clearanceLevel: number;
  createdAt: string;
  organization?: { id: string; name: string } | null;
}

interface Org {
  id: string;
  name: string;
}

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
const ROLE_COLORS: Record<string, string> = {
  ADMIN: "#64748B",
  FUND_MANAGER: "#5C6FB5",
  CONTRACTOR: "rgba(75, 165, 195, 1)",
  AUDITOR: "#B8953F",
};

const ROLE_BADGE_BG: Record<string, string> = {
  ADMIN: "rgba(100, 116, 139, 0.1)",
  FUND_MANAGER: "rgba(92, 111, 181, 0.1)",
  CONTRACTOR: "rgba(75, 165, 195, 0.1)",
  AUDITOR: "rgba(184, 149, 63, 0.1)",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  FUND_MANAGER: "Fund Manager",
  CONTRACTOR: "Contractor",
  AUDITOR: "Auditor",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "rgba(74, 140, 106, 0.85)",
  PENDING: "rgba(175, 148, 63, 0.85)",
  SUSPENDED: "#9c4a4a",
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* Shared neumorphic style constants */
const NEU_RAISED = {
  background: "rgba(255, 255, 255, 0.55)",
  backdropFilter: "blur(12px)",
  borderTop: "1.5px solid rgba(255, 255, 255, 0.8)",
  borderLeft: "1.5px solid rgba(255, 255, 255, 0.7)",
  borderBottom: "1.5px solid rgba(255, 255, 255, 0.15)",
  borderRight: "1.5px solid rgba(255, 255, 255, 0.15)",
  boxShadow: "10px 10px 25px rgba(155, 161, 180, 0.4), -10px -10px 25px rgba(255, 255, 255, 0.8)",
};

const NEU_INSET = {
  background: "rgba(228, 231, 238, 0.5)",
  boxShadow: "inset 4px 4px 10px rgba(155, 161, 180, 0.25), inset -4px -4px 10px rgba(255, 255, 255, 0.7)",
};

const NEU_INSET_INPUT = {
  background: "rgba(228, 231, 238, 0.5)",
  boxShadow: "inset 4px 4px 10px rgba(155, 161, 180, 0.25), inset -4px -4px 10px rgba(255, 255, 255, 0.7)",
  color: "rgba(30, 34, 53, 0.85)",
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({
    ADMIN: 0, FUND_MANAGER: 0, CONTRACTOR: 0, AUDITOR: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "suspend" | "delete";
    user: User;
  } | null>(null);

  // Invite form state
  const [invName, setInvName] = useState("");
  const [invEmail, setInvEmail] = useState("");
  const [invPassword, setInvPassword] = useState("");
  const [invRole, setInvRole] = useState("CONTRACTOR");
  const [invOrg, setInvOrg] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (roleFilter !== "ALL") params.set("role", roleFilter);
    const res = await fetch(`/api/users?${params}`);
    const data = await res.json();
    setUsers(data.users ?? data);
  }, [search, roleFilter]);

  useEffect(() => {
    Promise.all([
      fetchUsers(),
      fetch("/api/organizations").then((r) => r.json()).then((d) => setOrgs(d)),
      fetch("/api/stats").then((r) => r.json()).then((d) => {
        if (d.roleCountMap) setRoleCounts(d.roleCountMap);
      }),
    ]).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loading) fetchUsers();
  }, [search, roleFilter, fetchUsers, loading]);

  /* ── Actions ── */
  async function handleInvite() {
    if (!invEmail || !invName) return;
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: invName,
          email: invEmail,
          password: invPassword || "Welcome123!",
          role: invRole,
          organizationId: invOrg || undefined,
        }),
      });
      if (res.ok) {
        setSheetOpen(false);
        setInvName(""); setInvEmail(""); setInvPassword(""); setInvRole("CONTRACTOR"); setInvOrg("");
        fetchUsers();
        fetch("/api/stats").then((r) => r.json()).then((d) => {
          if (d.roleCountMap) setRoleCounts(d.roleCountMap);
        });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(user: User) {
    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setConfirmDialog(null);
    fetchUsers();
  }

  async function handleDelete(user: User) {
    await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    setConfirmDialog(null);
    setExpandedId(null);
    fetchUsers();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  /* ── Filter users ── */
  const filteredUsers = users.filter((u) => {
    if (statusFilter !== "ALL" && u.status !== statusFilter) return false;
    return true;
  });

  const pendingUsers = filteredUsers.filter((u) => u.status === "PENDING");
  const activeUsers = filteredUsers.filter((u) => u.status === "ACTIVE");
  const suspendedUsers = filteredUsers.filter((u) => u.status === "SUSPENDED");

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-[100px] md:pb-0">
      {/* ── Header ── */}
      <div>
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "#64748B", fontFamily: "'DM Sans', sans-serif", letterSpacing: "2.5px" }}
        >
          ADMINISTRATION
        </p>
        <h1
          className="text-[22px] leading-tight mt-1"
          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: "rgba(30, 34, 53, 0.85)" }}
        >
          Users
        </h1>
        <p className="text-[13px] mt-0.5" style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif" }}>
          Manage platform access and roles
        </p>
      </div>

      {/* ── 4 Role Count Wells — inset neumorphic ── */}
      <div className="grid grid-cols-4 gap-3">
        {(["ADMIN", "FUND_MANAGER", "CONTRACTOR", "AUDITOR"] as const).map((role) => (
          <div
            key={role}
            className="p-3 text-center rounded-[18px]"
            style={NEU_INSET}
          >
            <AnimatedCounter
              end={roleCounts[role] ?? 0}
              duration={800}
              className="font-light text-[36px] leading-none tabular-nums"
              style={{ color: ROLE_COLORS[role], fontFamily: "'DM Sans', sans-serif" }}
            />
            <p
              className="mt-1"
              style={{
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "2.5px",
                color: "rgba(30, 34, 53, 0.5)",
                fontFamily: "'DM Sans', sans-serif",
                textTransform: "uppercase" as const,
              }}
            >
              {role === "FUND_MANAGER" ? "Fund Mgrs" : ROLE_LABELS[role] + "s"}
            </p>
          </div>
        ))}
      </div>

      {/* ── Search — inset neumorphic ── */}
      <div
        className="rounded-[14px] px-5 py-3.5 flex items-center gap-2"
        style={NEU_INSET_INPUT}
      >
        <Search className="w-4 h-4 shrink-0" style={{ color: "rgba(30, 34, 53, 0.3)" }} />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-[14px]"
          style={{ color: "rgba(30, 34, 53, 0.85)", fontFamily: "'DM Sans', sans-serif" }}
        />
      </div>

      {/* ── Role Filter Pills ── */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: "All", value: "ALL" },
          { label: "Admins", value: "ADMIN" },
          { label: "Fund Mgrs", value: "FUND_MANAGER" },
          { label: "Contractors", value: "CONTRACTOR" },
          { label: "Auditors", value: "AUDITOR" },
        ].map((pill) => {
          const active = roleFilter === pill.value;
          return (
            <button
              key={pill.value}
              onClick={() => setRoleFilter(pill.value)}
              className="px-4 py-1.5 rounded-full text-[12px] font-medium cursor-pointer transition-all"
              style={{
                color: active ? "#5C6FB5" : "rgba(30, 34, 53, 0.5)",
                background: active ? "rgba(92, 111, 181, 0.12)" : "transparent",
                border: active ? "none" : "1px solid rgba(30, 34, 53, 0.12)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* ── Status Filter Pills ── */}
      <div className="flex gap-2 flex-wrap -mt-2">
        {[
          { label: "All", value: "ALL", color: "rgba(30, 34, 53, 0.5)" },
          { label: "Active", value: "ACTIVE", color: "rgba(74, 140, 106, 0.85)" },
          { label: "Pending", value: "PENDING", color: "rgba(175, 148, 63, 0.85)" },
          { label: "Suspended", value: "SUSPENDED", color: "#9c4a4a" },
        ].map((pill) => {
          const active = statusFilter === pill.value;
          return (
            <button
              key={pill.value}
              onClick={() => setStatusFilter(pill.value)}
              className="px-4 py-1.5 rounded-full text-[12px] font-medium cursor-pointer transition-all"
              style={{
                color: active ? pill.color : "rgba(30, 34, 53, 0.4)",
                background: active ? `${pill.color}15` : "transparent",
                border: active ? "none" : "1px solid rgba(30, 34, 53, 0.1)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* ── User Cards — grouped by status ── */}
      {pendingUsers.length > 0 && (
        <div className="space-y-3">
          <h3
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: "rgba(175, 148, 63, 0.85)", fontFamily: "'DM Sans', sans-serif", letterSpacing: "2.5px" }}
          >
            Pending Activation ({pendingUsers.length})
          </h3>
          {pendingUsers.map((user) => renderUserCard(user, "accent-left-amber"))}
        </div>
      )}

      {activeUsers.length > 0 && (
        <div className="space-y-3">
          <h3
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif", letterSpacing: "2.5px" }}
          >
            Active Users ({activeUsers.length})
          </h3>
          {activeUsers.map((user) => renderUserCard(user))}
        </div>
      )}

      {suspendedUsers.length > 0 && (
        <div className="space-y-3">
          <h3
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: "#9c4a4a", fontFamily: "'DM Sans', sans-serif", letterSpacing: "2.5px" }}
          >
            Suspended ({suspendedUsers.length})
          </h3>
          {suspendedUsers.map((user) => renderUserCard(user, "accent-left-critical"))}
        </div>
      )}

      {filteredUsers.length === 0 && (
        <EmptyState icon={Search} title="No users found" description="Try adjusting your search or filters" />
      )}

      {/* ── FAB — Invite User ── */}
      <button
        className="fixed bottom-24 right-5 md:bottom-8 md:right-8 w-14 h-14 rounded-full flex items-center justify-center z-40 cursor-pointer"
        style={{
          background: "linear-gradient(135deg, #5C6FB5, #7B8DC8)",
          boxShadow:
            "6px 6px 16px rgba(155, 161, 180, 0.45), -6px -6px 16px rgba(255, 255, 255, 0.8), 0 0 16px rgba(92, 111, 181, 0.2)",
        }}
        onClick={() => setSheetOpen(true)}
      >
        <UserPlus className="w-6 h-6" style={{ color: "#fff" }} />
      </button>

      {/* ── Bottom Sheet — Invite Form ── */}
      {sheetOpen && (
        <>
          <div
            className="fixed inset-0 z-50"
            style={{ background: "rgba(30, 34, 53, 0.4)", backdropFilter: "blur(4px)" }}
            onClick={() => setSheetOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto">
            <div
              className="rounded-t-[24px] p-5 space-y-4"
              style={{
                background: "var(--surface-light)",
                boxShadow: "0 -8px 30px rgba(155, 161, 180, 0.3)",
              }}
            >
              <div className="w-10 h-1 rounded-full mx-auto" style={{ background: "rgba(30, 34, 53, 0.15)" }} />
              <div className="flex items-center justify-between">
                <h3 className="text-[18px]" style={{ fontWeight: 500, color: "rgba(30, 34, 53, 0.85)", fontFamily: "'DM Sans', sans-serif" }}>Invite User</h3>
                <button onClick={() => setSheetOpen(false)} className="cursor-pointer p-1">
                  <X className="w-5 h-5" style={{ color: "rgba(30, 34, 53, 0.4)" }} />
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={invName}
                  onChange={(e) => setInvName(e.target.value)}
                  placeholder="e.g. Omar Al-Harithi"
                  className="w-full mt-1.5 px-4 py-3 rounded-xl text-[14px] outline-none"
                  style={NEU_INSET_INPUT}
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={invEmail}
                  onChange={(e) => setInvEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full mt-1.5 px-4 py-3 rounded-xl text-[14px] outline-none font-mono"
                  style={NEU_INSET_INPUT}
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif" }}>
                  Password
                </label>
                <input
                  type="password"
                  value={invPassword}
                  onChange={(e) => setInvPassword(e.target.value)}
                  placeholder="Default: Welcome123!"
                  className="w-full mt-1.5 px-4 py-3 rounded-xl text-[14px] outline-none"
                  style={NEU_INSET_INPUT}
                />
              </div>

              {/* Role Selector */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif" }}>
                  Role
                </label>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {(["CONTRACTOR", "FUND_MANAGER", "AUDITOR", "ADMIN"] as const).map((r) => {
                    const active = invRole === r;
                    return (
                      <button
                        key={r}
                        onClick={() => setInvRole(r)}
                        className="px-3 py-2 rounded-xl text-[12px] font-medium cursor-pointer transition-all"
                        style={{
                          color: active ? ROLE_COLORS[r] : "rgba(30, 34, 53, 0.4)",
                          background: active ? ROLE_BADGE_BG[r] : "transparent",
                          border: active ? "none" : "1px solid rgba(30, 34, 53, 0.1)",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {ROLE_LABELS[r]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Organization */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif" }}>
                  Organization (Optional)
                </label>
                <select
                  value={invOrg}
                  onChange={(e) => setInvOrg(e.target.value)}
                  className="w-full mt-1.5 px-4 py-3 rounded-xl text-[14px] outline-none appearance-none cursor-pointer"
                  style={NEU_INSET_INPUT}
                >
                  <option value="">None</option>
                  {orgs.map((org) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>

              {/* Submit */}
              <Button
                variant="neu-primary"
                className="w-full"
                disabled={!invName || !invEmail || saving}
                onClick={handleInvite}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                Send Invitation
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ── Confirmation Dialog ── */}
      {confirmDialog && (
        <>
          <div
            className="fixed inset-0 z-50"
            style={{ background: "rgba(30, 34, 53, 0.4)", backdropFilter: "blur(4px)" }}
            onClick={() => setConfirmDialog(null)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 px-6">
            <div
              className="rounded-[20px] p-5 max-w-sm w-full space-y-4"
              style={{
                ...NEU_RAISED,
                borderRadius: "20px",
              }}
            >
              <h3 className="text-[16px]" style={{ fontWeight: 500, color: "rgba(30, 34, 53, 0.85)", fontFamily: "'DM Sans', sans-serif" }}>
                {confirmDialog.type === "suspend"
                  ? `Suspend ${confirmDialog.user.name}?`
                  : `Remove ${confirmDialog.user.name}?`}
              </h3>
              <p className="text-[13px] leading-relaxed" style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif" }}>
                {confirmDialog.type === "suspend"
                  ? "They will lose access to all programs immediately."
                  : "This action cannot be undone. The user will be permanently removed."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer"
                  style={{
                    color: "rgba(30, 34, 53, 0.6)",
                    background: "rgba(228, 231, 238, 0.5)",
                    boxShadow: "6px 6px 16px rgba(155, 161, 180, 0.4), -6px -6px 16px rgba(255, 255, 255, 0.8)",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    confirmDialog.type === "suspend"
                      ? handleToggleStatus(confirmDialog.user)
                      : handleDelete(confirmDialog.user)
                  }
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer text-white"
                  style={{
                    background: "#9c4a4a",
                    boxShadow: "6px 6px 16px rgba(155, 161, 180, 0.4), -6px -6px 16px rgba(255, 255, 255, 0.8)",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {confirmDialog.type === "suspend" ? "Confirm Suspension" : "Remove User"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  /* ── User Card Renderer ── */
  function renderUserCard(user: User, accentClass?: string) {
    const isExpanded = expandedId === user.id;
    const isSuspended = user.status === "SUSPENDED";
    const initial = (user.name ?? "U")[0].toUpperCase();

    return (
      <div key={user.id} style={{ opacity: isSuspended ? 0.5 : 1 }}>
        <button
          className={`w-full text-left rounded-[20px] p-4 cursor-pointer ${accentClass ?? ""}`}
          style={{
            ...NEU_RAISED,
            borderRadius: "20px",
            overflow: "hidden",
          }}
          onClick={() => setExpandedId(isExpanded ? null : user.id)}
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "rgba(228, 231, 238, 0.7)",
              }}
            >
              <span className="text-sm" style={{ fontWeight: 500, color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif" }}>
                {initial}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h3
                className="text-[16px] leading-[1.3]"
                style={{ fontWeight: 500, color: "rgba(30, 34, 53, 0.85)", wordBreak: "break-word", maxWidth: "calc(100% - 10px)", fontFamily: "'DM Sans', sans-serif" }}
              >
                {user.name ?? "Unnamed User"}
              </h3>
              <p className="text-[13px] font-mono truncate" style={{ color: "rgba(30, 34, 53, 0.4)" }}>
                {user.email}
              </p>
            </div>

            {/* Role Badge */}
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider shrink-0"
              style={{
                color: ROLE_COLORS[user.role] ?? "rgba(30, 34, 53, 0.6)",
                background: ROLE_BADGE_BG[user.role] ?? "rgba(30, 34, 53, 0.06)",
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "1px",
              }}
            >
              {ROLE_LABELS[user.role] ?? user.role}
            </span>

            <ChevronRight
              className="w-4 h-4 shrink-0 transition-transform"
              style={{
                color: "rgba(30, 34, 53, 0.2)",
                transform: isExpanded ? "rotate(90deg)" : "none",
              }}
            />
          </div>

          {/* Status row */}
          <div className="flex items-center gap-2 mt-2 ml-[52px]">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: STATUS_COLORS[user.status] ?? "rgba(30, 34, 53, 0.3)" }}
            />
            <span className="text-[12px]" style={{ color: STATUS_COLORS[user.status] ?? "rgba(30, 34, 53, 0.4)", fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>
              {user.status === "ACTIVE"
                ? `Active · Joined ${relativeTime(user.createdAt)}`
                : user.status === "PENDING"
                  ? `Invited ${relativeTime(user.createdAt)} · Not yet activated`
                  : `Suspended · ${relativeTime(user.createdAt)}`}
            </span>
          </div>
        </button>

        {/* ── Expanded Detail ── */}
        {isExpanded && (
          <div className="mt-3 space-y-3 ml-2 mr-2">
            {/* Info */}
            <div
              className="rounded-[14px] p-4 space-y-2"
              style={NEU_INSET}
            >
              <div className="flex justify-between text-[12px]">
                <span style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif" }}>Email</span>
                <span className="font-mono" style={{ color: "rgba(30, 34, 53, 0.85)" }}>{user.email}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif" }}>Organization</span>
                <span style={{ color: "rgba(30, 34, 53, 0.85)", fontFamily: "'DM Sans', sans-serif" }}>{user.organization?.name ?? "None"}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif" }}>Clearance</span>
                <span className="font-mono" style={{ color: "rgba(30, 34, 53, 0.85)" }}>Level {user.clearanceLevel}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif" }}>Registered</span>
                <span className="font-mono" style={{ color: "rgba(30, 34, 53, 0.85)" }}>
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="flex gap-2 flex-wrap">
              {user.status === "ACTIVE" && (
                <Button
                  variant="neu-outline"
                  className="text-[12px] gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDialog({ type: "suspend", user });
                  }}
                >
                  <Ban className="w-3.5 h-3.5" /> Suspend
                </Button>
              )}
              {user.status === "SUSPENDED" && (
                <Button
                  variant="neu-outline"
                  className="text-[12px] gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleStatus(user);
                  }}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Reactivate
                </Button>
              )}
              {user.status === "PENDING" && (
                <Button
                  variant="neu-outline"
                  className="text-[12px] gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Mail className="w-3.5 h-3.5" /> Resend Invite
                </Button>
              )}
              <Button
                variant="neu-outline"
                className="text-[12px] gap-1.5"
                onClick={(e) => { e.stopPropagation(); }}
              >
                <KeyRound className="w-3.5 h-3.5" /> Reset Password
              </Button>
              {user.id !== (session?.user as { userId?: string })?.userId && (
                <Button
                  variant="neu-critical"
                  className="text-[12px] gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDialog({ type: "delete", user });
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}
