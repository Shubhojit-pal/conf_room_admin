'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    MapPin, Plus, Pencil, CheckCircle, XCircle, Loader2, ExternalLink, Navigation,
} from 'lucide-react';
import {
    fetchLocations, createLocation, updateLocation,
    getAdminUser, Location,
} from '@/lib/api';

export default function LocationsPage() {
    const router = useRouter();
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState<Location | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '', address: '', city: '', description: '', google_maps_url: '',
    });

    // Role guard — only super_admin can access this page
    useEffect(() => {
        const admin = getAdminUser();
        if (!admin || admin.role !== 'super_admin') {
            router.replace('/admin');
        }
    }, [router]);

    const load = async () => {
        setLoading(true);
        try {
            const data = await fetchLocations();
            setLocations(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditTarget(null);
        setForm({ name: '', address: '', city: '', description: '', google_maps_url: '' });
        setShowForm(true);
    };

    const openEdit = (loc: Location) => {
        setEditTarget(loc);
        setForm({
            name: loc.name,
            address: loc.address || '',
            city: loc.city || '',
            description: loc.description || '',
            google_maps_url: loc.google_maps_url || '',
        });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        setError('');
        try {
            if (editTarget) {
                await updateLocation(editTarget.location_id, form);
            } else {
                await createLocation(form);
            }
            setShowForm(false);
            await load();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (loc: Location) => {
        try {
            await updateLocation(loc.location_id, { isActive: !loc.isActive });
            await load();
        } catch (e: any) {
            setError(e.message);
        }
    };

    return (
        <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
                        <MapPin className="w-5 h-5 lg:w-6 lg:h-6 text-primary" /> Locations
                    </h1>
                    <p className="text-muted-foreground text-xs mt-1">
                        Manage your office locations.
                    </p>
                </div>
                <Button onClick={openCreate} className="flex items-center gap-2 self-start sm:self-auto h-9 text-xs">
                    <Plus className="w-4 h-4" /> Add Location
                </Button>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
            )}

            {/* Create / Edit Form */}
            {showForm && (
                <Card className="border-primary/30">
                    <CardHeader>
                        <CardTitle className="text-base">{editTarget ? 'Edit Location' : 'New Location'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name *</label>
                                <input
                                    className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="e.g. Kolkata HQ"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">City</label>
                                <input
                                    className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="e.g. Kolkata"
                                    value={form.city}
                                    onChange={e => setForm({ ...form, city: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Address</label>
                                <input
                                    className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Street address"
                                    value={form.address}
                                    onChange={e => setForm({ ...form, address: e.target.value })}
                                />
                            </div>
                            {/* Google Maps URL */}
                            <div className="md:col-span-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                    <Navigation className="w-3 h-3" /> Google Maps URL
                                </label>
                                <div className="mt-1 flex gap-2 items-center">
                                    <input
                                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="https://maps.google.com/?q=IEM+Kolkata or paste share link"
                                        value={form.google_maps_url}
                                        onChange={e => setForm({ ...form, google_maps_url: e.target.value })}
                                    />
                                    {form.google_maps_url && (
                                        <a
                                            href={form.google_maps_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="shrink-0 px-3 py-2 rounded-lg border border-border bg-background text-sm hover:bg-muted flex items-center gap-1"
                                        >
                                            <ExternalLink className="w-4 h-4" /> Test
                                        </a>
                                    )}
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    Go to <span className="font-medium">Google Maps</span> → search your office → click Share → Copy link. Paste it here.
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</label>
                                <textarea
                                    className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                    rows={2}
                                    placeholder="Optional notes"
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Location List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            ) : locations.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        No locations yet. Click "Add Location" to create your first office.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {locations.map(loc => (
                        <Card key={loc.location_id} className={!loc.isActive ? 'opacity-60' : ''}>
                            <CardContent className="py-4 flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="font-semibold text-base">{loc.name}</span>
                                        <Badge variant="outline" className="text-[9px] px-1 py-0">{loc.location_id}</Badge>
                                        {loc.isActive
                                            ? <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[9px] px-1 py-0">Active</Badge>
                                            : <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-[9px] px-1 py-0">Inactive</Badge>
                                        }
                                        {/* Google Maps badge */}
                                        {loc.google_maps_url && (
                                            <a
                                                href={loc.google_maps_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-[9px] px-2 py-0 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                                            >
                                                <Navigation className="w-2 h-2" /> View on Maps
                                            </a>
                                        )}
                                    </div>
                                    {loc.city && <p className="text-sm text-muted-foreground">{loc.city}</p>}
                                    {loc.address && <p className="text-xs text-muted-foreground mt-0.5">{loc.address}</p>}
                                    {loc.description && <p className="text-xs text-muted-foreground mt-1 italic">{loc.description}</p>}
                                    {/* Show truncated maps URL */}
                                    {loc.google_maps_url && (
                                        <p className="text-[10px] text-muted-foreground/60 mt-1 truncate max-w-sm">
                                            🗺 {loc.google_maps_url}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {/* Direct open maps */}
                                    {loc.google_maps_url && (
                                        <a href={loc.google_maps_url} target="_blank" rel="noopener noreferrer">
                                            <Button size="sm" variant="ghost" title="Open in Google Maps" asChild={false}>
                                                <ExternalLink className="w-4 h-4 text-blue-500" />
                                            </Button>
                                        </a>
                                    )}
                                    <Button size="sm" variant="ghost" onClick={() => handleToggleActive(loc)} title={loc.isActive ? 'Deactivate' : 'Activate'}>
                                        {loc.isActive ? <XCircle className="w-4 h-4 text-red-400" /> : <CheckCircle className="w-4 h-4 text-green-500" />}
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => openEdit(loc)}>
                                        <Pencil className="w-4 h-4" />
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
