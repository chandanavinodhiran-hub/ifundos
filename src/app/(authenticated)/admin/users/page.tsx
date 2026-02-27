"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UserPlus, Search, MoreHorizontal, Pencil, Ban, CheckCircle, Trash2, Loader2,
} from "lucide-react";

interface Org { id: string; name: string; trustTier: string }
interface User {
  id: string; name: string; email: string; role: string; status: string;
  clearanceLevel: number; createdAt: string;
  organization: Org | null;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
  FUND_MANAGER: "bg-blue-100 text-blue-800 border-blue-200",
  CONTRACTOR: "bg-emerald-100 text-emerald-800 border-emerald-200",
  AUDITOR: "bg-amber-100 text-amber-800 border-amber-200",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-leaf-100 text-leaf-800 border-leaf-200",
  SUSPENDED: "bg-red-100 text-red-800 border-red-200",
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin", FUND_MANAGER: "Fund Manager", CONTRACTOR: "Contractor", AUDITOR: "Auditor",
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "CONTRACTOR",
    organizationId: "", clearanceLevel: "1",
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (roleFilter !== "ALL") params.set("role", roleFilter);
    const res = await fetch(`/api/users?${params.toString()}`);
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }, [search, roleFilter]);

  const fetchOrgs = useCallback(async () => {
    const res = await fetch("/api/organizations");
    const data = await res.json();
    setOrgs(data.organizations || []);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  function openCreate() {
    setEditingUser(null);
    setForm({ name: "", email: "", password: "", role: "CONTRACTOR", organizationId: "", clearanceLevel: "1" });
    setDialogOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setForm({
      name: user.name, email: user.email, password: "",
      role: user.role, organizationId: user.organization?.id || "",
      clearanceLevel: String(user.clearanceLevel),
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editingUser) {
        const body: Record<string, unknown> = {
          name: form.name, email: form.email, role: form.role,
          organizationId: form.organizationId === "none" ? null : form.organizationId || null,
          clearanceLevel: parseInt(form.clearanceLevel),
        };
        if (form.password) body.password = form.password;
        await fetch(`/api/users/${editingUser.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/users", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name, email: form.email, password: form.password,
            role: form.role,
            organizationId: form.organizationId === "none" ? null : form.organizationId || null,
            clearanceLevel: parseInt(form.clearanceLevel),
          }),
        });
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(user: User) {
    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    await fetch(`/api/users/${user.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchUsers();
  }

  async function deleteUser(user: User) {
    if (!confirm(`Delete user ${user.name}? This cannot be undone.`)) return;
    await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    fetchUsers();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage platform users and access control</p>
        </div>
        <Button onClick={openCreate} className="gap-2 w-full sm:w-auto">
          <UserPlus className="w-4 h-4" /> Add User
        </Button>
      </div>

      {/* Search + Role Filter */}
      <Card className="rounded-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="FUND_MANAGER">Fund Manager</SelectItem>
                <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                <SelectItem value="AUDITOR">Auditor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="rounded-md">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            All Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-leaf-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Trust Tier</TableHead>
                  <TableHead className="hidden sm:table-cell">Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div>
                        {user.name}
                        <p className="text-xs text-muted-foreground sm:hidden">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={ROLE_COLORS[user.role] || ""}>
                        {ROLE_LABELS[user.role] || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{user.organization?.name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[user.status] || ""}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{user.organization?.trustTier || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs hidden sm:table-cell">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(user)}>
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(user)}>
                            {user.status === "ACTIVE" ? (
                              <><Ban className="w-4 h-4 mr-2" /> Suspend</>
                            ) : (
                              <><CheckCircle className="w-4 h-4 mr-2" /> Activate</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteUser(user)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Update user details and access level." : "Create a new user account."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{editingUser ? "New Password (leave blank to keep)" : "Password"}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                    <SelectItem value="FUND_MANAGER">Fund Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="AUDITOR">Auditor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Clearance Level</Label>
                <Select value={form.clearanceLevel} onValueChange={(v) => setForm({ ...form, clearanceLevel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((l) => (
                      <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Organization</Label>
              <Select value={form.organizationId || "none"} onValueChange={(v) => setForm({ ...form, organizationId: v })}>
                <SelectTrigger><SelectValue placeholder="Select organization (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {orgs.map((org) => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingUser ? "Save Changes" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
