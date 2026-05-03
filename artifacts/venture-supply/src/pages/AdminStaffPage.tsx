import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useStaff, useCreateStaff, useUpdateStaff, useDeleteStaff,
  type StaffMember, type StaffPayload,
} from "@/hooks/useStaff";
import { useSalespersons } from "@/hooks/useSalespersons";

const BLANK: StaffPayload = { name: "", email: "", password: "", role: "admin", salespersonId: null };

export function AdminStaffPage() {
  const { toast } = useToast();
  const { data: staff = [], isLoading } = useStaff();
  const { data: salespersons = [] } = useSalespersons();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();

  const [addOpen, setAddOpen] = useState(false);
  const [addData, setAddData] = useState<StaffPayload>(BLANK);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [editData, setEditData] = useState<StaffPayload>(BLANK);

  const openEdit = (s: StaffMember) => {
    setEditTarget(s);
    setEditData({
      name: s.name, email: s.email, password: "",
      role: s.role, salespersonId: s.salespersonId,
    });
  };

  const StaffForm = ({
    data, setData, isEdit,
  }: {
    data: StaffPayload;
    setData: (fn: (p: StaffPayload) => StaffPayload) => void;
    isEdit: boolean;
  }) => (
    <div className="space-y-3">
      <div>
        <Label>Name</Label>
        <Input
          value={data.name}
          onChange={(e) => setData((p) => ({ ...p, name: e.target.value }))}
          data-testid="input-staff-name"
        />
      </div>
      <div>
        <Label>Email</Label>
        <Input
          type="email"
          value={data.email}
          onChange={(e) => setData((p) => ({ ...p, email: e.target.value }))}
          data-testid="input-staff-email"
        />
      </div>
      <div>
        <Label>{isEdit ? "New password (leave blank to keep current)" : "Password"}</Label>
        <Input
          type="password"
          value={data.password ?? ""}
          onChange={(e) => setData((p) => ({ ...p, password: e.target.value }))}
          placeholder={isEdit ? "••••••••" : "Min. 8 characters"}
          minLength={8}
          autoComplete="new-password"
          data-testid="input-staff-password"
        />
      </div>
      <div>
        <Label>Role</Label>
        <select
          className="w-full h-9 px-3 border rounded-md bg-background"
          value={data.role}
          onChange={(e) => setData((p) => ({
            ...p,
            role: e.target.value as "admin" | "sales",
            salespersonId: e.target.value === "admin" ? null : p.salespersonId,
          }))}
          data-testid="select-staff-role"
        >
          <option value="admin">Admin</option>
          <option value="sales">Salesperson</option>
        </select>
      </div>
      {data.role === "sales" && (
        <div>
          <Label>Linked salesperson record</Label>
          <select
            className="w-full h-9 px-3 border rounded-md bg-background"
            value={data.salespersonId ?? ""}
            onChange={(e) => setData((p) => ({ ...p, salespersonId: e.target.value || null }))}
            data-testid="select-staff-salesperson"
          >
            <option value="">— None —</option>
            {salespersons.map((sp) => (
              <option key={sp.id} value={sp.id}>{sp.name} ({sp.id})</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary" /> Staff Access
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage admin and salesperson login accounts. Passwords are hashed before storage.
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) setAddData(BLANK); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" data-testid="button-add-staff">
              <Plus className="w-4 h-4 me-1.5" /> Add staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add staff member</DialogTitle></DialogHeader>
            <StaffForm data={addData} setData={setAddData} isEdit={false} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  if (!addData.name || !addData.email || !addData.password) {
                    toast({ title: "Missing fields", description: "Name, email and password are required.", variant: "destructive" });
                    return;
                  }
                  createStaff.mutate(addData, {
                    onSuccess: () => {
                      toast({ title: "Staff added", description: `${addData.name} can now sign in.` });
                      setAddOpen(false); setAddData(BLANK);
                    },
                    onError: (e) => toast({ title: "Could not add", description: (e as Error).message, variant: "destructive" }),
                  });
                }}
                disabled={createStaff.isPending}
                data-testid="button-save-staff"
              >
                {createStaff.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-5">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
          ) : staff.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No staff records yet. Add the first member to get started.
            </p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Linked salesperson</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {staff.map((s) => (
                  <TableRow key={s.id} data-testid={`row-staff-${s.id}`}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>
                      <Badge variant={s.role === "admin" ? "default" : "outline"} className={s.role === "admin" ? "bg-primary/10 text-primary border-primary/20" : ""}>
                        {s.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.salespersonId ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(s)} data-testid={`button-edit-staff-${s.id}`}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-600"
                          data-testid={`button-delete-staff-${s.id}`}
                          onClick={() => {
                            if (!confirm(`Remove ${s.name}? They will no longer be able to sign in.`)) return;
                            deleteStaff.mutate(s.id, {
                              onSuccess: () => toast({ title: "Removed" }),
                              onError: (e) => toast({ title: "Could not remove", description: (e as Error).message, variant: "destructive" }),
                            });
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit staff member</DialogTitle></DialogHeader>
          <StaffForm data={editData} setData={setEditData} isEdit={true} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!editTarget) return;
                const payload: Partial<StaffPayload> & { id: string } = {
                  id: editTarget.id,
                  name: editData.name,
                  email: editData.email,
                  role: editData.role,
                  salespersonId: editData.role === "sales" ? editData.salespersonId ?? null : null,
                };
                if (editData.password) payload.password = editData.password;
                updateStaff.mutate(payload, {
                  onSuccess: () => { toast({ title: "Updated" }); setEditTarget(null); },
                  onError: (e) => toast({ title: "Could not update", description: (e as Error).message, variant: "destructive" }),
                });
              }}
              disabled={updateStaff.isPending}
              data-testid="button-update-staff"
            >
              {updateStaff.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
