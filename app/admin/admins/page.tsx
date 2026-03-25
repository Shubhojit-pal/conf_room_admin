'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ShieldCheck, Plus, Pencil, Power, Loader2,
} from 'lucide-react';
import {
    fetchAdmins, createAdmin, updateAdmin, deleteAdmin,
    fetchLocations, getAdminUser, Admin, Location,
} from '@/lib/api';

export default function AdminsPage() {
    const router = useRouter();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState<Admin | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '', email: '', password: '', phone_no: '', dept: '',
        role: 'location_admin', assigned_locations: [] as string[],
    });

    // Role guard — only super_admin
    useEffect(() => {
        const admin = getAdminUser();
        if (!admin || admin.role !== 'super_admin') {
            router.replace('/admin');
        }
    }, [router]);

    const load = async () => {
        setLoading(true);
        try {
            const [adminData, locationData] = await Promise.all([fetchAdmins(), fetchLocations()]);
            setAdmins(adminData);
            setLocations(locationData);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditTarget(null);
        setForm({ name: '', email: '', password: '', phone_no: '', dept: '', role: 'location_admin', assigned_locations: [] });
        setShowForm(true);
    };

    const openEdit = (admin: Admin) => {
        setEditTarget(admin);
        setForm({ name: admin.name, email: admin.email, password: '', phone_no: admin.phone_no, dept: admin.dept || '', role: admin.role, assigned_locations: admin.assigned_locations });
        setShowForm(true);
    };

    const toggleLocation = (loc_id: string) => {
        setForm(prev => ({
            ...prev,
            assigned_locations: prev.assigned_locations.includes(loc_id)
                ? prev.assigned_locations.filter(l => l !== loc_id)
                : [...prev.assigned_locations, loc_id],
        }));
    };

    const handleSave = async () => {
        if (!form.name || !form.email || !form.phone_no || !form.role) return;
        setSaving(true);
        setError('');
        try {
            if (editTarget) {
                const updateData: any = { name: form.name, phone_no: form.phone_no, dept: form.dept, role: form.role, assigned_locations: form.assigned_locations };
                if (form.password) updateData.password = form.password;
                await updateAdmin(editTarget.admin_id, updateData);
            } else {
                if (!form.password) { setError('Password is required.'); setSaving(false); return; }
                await createAdmin({ ...form });
            }
            setShowForm(false);
            await load();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (admin: Admin) => {
        try {
            await updateAdmin(admin.admin_id, { isActive: !admin.isActive });
            await load();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const roleBadge = (role: string) => role === 'super_admin'
        ? <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px]">Super Admin</Badge>
        : <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">Location Admin</Badge>;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-primary" /> Admin Accounts
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manage admin accounts and their location access.
                    </p>
                </div>
                <Button onClick={openCreate} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Admin
                </Button>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
            )}

            {/* Create / Edit Form */}
            {showForm && (
                <Card className="border-primary/30">
                    <CardHeader>
                        <CardTitle className="text-base">{editTarget ? 'Edit Admin' : 'New Admin'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                { label: 'Name *', key: 'name', placeholder: 'Full name', type: 'text' },
                                { label: 'Email *', key: 'email', placeholder: 'email@company.com', type: 'email', disabled: !!editTarget },
                                { label: 'Phone *', key: 'phone_no', placeholder: '+91 ...', type: 'text' },
                                { label: editTarget ? 'New Password (leave blank to keep)' : 'Password *', key: 'password', placeholder: '••••••••', type: 'password' },
                                { label: 'Department', key: 'dept', placeholder: 'IT, Operations...', type: 'text' },
                            ].map(({ label, key, placeholder, type, disabled }) => (
                                <div key={key}>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
                                    <input
                                        type={type}
                                        className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                                        placeholder={placeholder}
                                        value={(form as any)[key]}
                                        disabled={disabled}
                                        onChange={e => setForm({ ...form, [key]: e.target.value })}
                                    />
                                </div>
                            ))}

                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role *</label>
                                <select
                                    className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={form.role}
                                    onChange={e => setForm({ ...form, role: e.target.value })}
                                >
                                    <option value="location_admin">Location Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>
                        </div>

                        {form.role === 'location_admin' && (
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assigned Locations</label>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {locations.map(loc => (
                                        <button
                                            key={loc.location_id}
                                            type="button"
                                            onClick={() => toggleLocation(loc.location_id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                                form.assigned_locations.includes(loc.location_id)
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'bg-background border-border text-muted-foreground hover:border-primary'
                                            }`}
                                        >
                                            {loc.name} ({loc.location_id})
                                        </button>
                                    ))}
                                    {locations.length === 0 && <span className="text-xs text-muted-foreground">No locations yet. Create locations first.</span>}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 justify-end pt-2">
                            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Admin List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            ) : admins.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        No admin accounts yet. Click "Add Admin" to create one.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3">
                    {admins.map(admin => (
                        <Card key={admin.admin_id} className={!admin.isActive ? 'opacity-60' : ''}>
                            <CardContent className="py-4 flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="font-semibold">{admin.name}</span>
                                        <Badge variant="outline" className="text-[10px]">{admin.admin_id}</Badge>
                                        {roleBadge(admin.role)}
                                        {!admin.isActive && <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-[10px]">Inactive</Badge>}
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">{admin.email}</p>
                                    {admin.role === 'location_admin' && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Locations: {admin.assigned_locations.length > 0 ? admin.assigned_locations.join(', ') : 'None assigned'}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button size="sm" variant="ghost" onClick={() => openEdit(admin)} title="Edit">
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleToggleActive(admin)} title={admin.isActive ? 'Deactivate' : 'Activate'}>
                                        <Power className={`w-4 h-4 ${admin.isActive ? 'text-red-400' : 'text-green-500'}`} />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
