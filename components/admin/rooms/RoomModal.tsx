import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Upload, ImageIcon, Loader2, MapPin } from 'lucide-react';
import { createRoom, updateRoom, Room, uploadRoomImages, uploadRoomPolicy, RoomLayout, fetchLocations, Location } from '@/lib/api';
import { getDirectImageUrl } from '@/lib/imageUtils';
import { RoomLayoutBuilder } from './RoomLayoutBuilder';

interface RoomModalProps {
    onClose: () => void;
    onSuccess: () => void;
    room?: Room; // Optional room for edit mode
}

const AMENITIES_LIST = [
    'Projector',
    'WiFi',
    'AC',
    'Video Conferencing',
    'Whiteboard',
    'Sound System',
    'TV Screen',
    'Telephone',
    'Coffee Machine'
];

export function RoomModal({ onClose, onSuccess, room }: RoomModalProps) {
    const isEdit = !!room;
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [roomLayout, setRoomLayout] = useState<RoomLayout | null>(null);
    const [locations, setLocations] = useState<Location[]>([]);
    const [policyPdfUploading, setPolicyPdfUploading] = useState(false);
    const [formData, setFormData] = useState({
        catalog_id: '',
        room_id: '',
        room_name: '',
        capacity: 10,
        room_type: 'Conference Room',
        location: '',
        location_id: '',
        amenities: '',
        status: 'active',
        floor_no: 1,
        room_number: '',
        availability: 'available',
        image_url: '',
        image_urls: [] as string[],
        mapLink: '',
        policy_pdf: '',
    });

    // Fetch all locations for the dropdown
    useEffect(() => {
        fetchLocations().then(setLocations).catch(console.error);
    }, []);

    useEffect(() => {
        if (room) {
            const amenArr = room.amenities ? room.amenities.split(',').map(a => a.trim()) : [];
            setSelectedAmenities(amenArr);
            setRoomLayout(room.layout || null);
            setFormData({
                catalog_id: room.catalog_id,
                room_id: room.room_id,
                room_name: room.room_name,
                capacity: room.capacity,
                room_type: room.room_type || 'Conference Room',
                location: room.location || '',
                location_id: (room as any).location_id || '',
                amenities: room.amenities || '',
                status: room.status || 'active',
                floor_no: room.floor_no || 1,
                room_number: room.room_number || '',
                availability: room.availability || 'available',
                image_url: room.image_url || '',
                image_urls: room.image_urls || (room.image_url ? [room.image_url] : []),
                mapLink: room.mapLink || '',
                policy_pdf: (room as any).policy_pdf || '',
            });
        }
    }, [room]);

    const handleAmenityToggle = (amenity: string) => {
        setSelectedAmenities(prev => {
            const next = prev.includes(amenity)
                ? prev.filter(a => a !== amenity)
                : [...prev, amenity];
            return next;
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setUploading(true);
        setError('');
        try {
            const { imageUrls } = await uploadRoomImages(files);
            setFormData(prev => {
                const newUrls = [...(prev.image_urls || []), ...imageUrls];
                return { 
                    ...prev, 
                    image_urls: newUrls,
                    image_url: newUrls[0] || '' // Sync primary image
                };
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handlePolicyUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPolicyPdfUploading(true);
        setError('');
        try {
            const { pdfUrl } = await uploadRoomPolicy(file);
            setFormData(prev => ({ ...prev, policy_pdf: pdfUrl }));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setPolicyPdfUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setFormData(prev => {
            const newUrls = (prev.image_urls || []).filter((_, i) => i !== index);
            return {
                ...prev,
                image_urls: newUrls,
                image_url: newUrls[0] || ''
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!formData.room_name) {
                throw new Error('Room Name is required');
            }

            // Join amenities into comma separated string
            const finalData = {
                ...formData,
                amenities: selectedAmenities.join(', '),
                layout: roomLayout,
                policy_pdf: formData.policy_pdf,
            };

            if (isEdit && room) {
                await updateRoom(room.catalog_id, room.room_id, finalData);
            } else {
                await createRoom(finalData);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-border flex items-center justify-between bg-primary/5">
                    <h2 className="text-xl font-bold text-foreground">{isEdit ? 'Edit Room' : 'Add New Room'}</h2>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    {isEdit && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground">Catalog ID</label>
                                <input
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
                                    value={formData.catalog_id}
                                    disabled
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground">Room ID</label>
                                <input
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
                                    value={formData.room_id}
                                    disabled
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Room Name</label>
                            <input
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                                value={formData.room_name}
                                onChange={e => setFormData({ ...formData, room_name: e.target.value })}
                                placeholder="e.g. Executive Suite"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Room Type</label>
                            <select
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                                value={formData.room_type}
                                onChange={e => setFormData({ ...formData, room_type: e.target.value })}
                                required
                            >
                                <option value="Seminar Hall">Seminar Hall</option>
                                <option value="Conference Room">Conference Room</option>
                                <option value="Meeting Room">Meeting Room</option>
                                <option value="Training Room">Training Room</option>
                                <option value="Auditorium">Auditorium</option>
                                <option value="Board Room">Board Room</option>
                                <option value="Discussion Pod">Discussion Pod</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-foreground">Room Image</label>
                            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">URL or Upload</span>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        id="manual-url-input"
                                        placeholder="Paste image URL (e.g. from Cloudinary)"
                                        className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const val = (e.target as HTMLInputElement).value;
                                                if (val) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        image_urls: [...(prev.image_urls || []), val],
                                                        image_url: prev.image_urls && prev.image_urls.length ? prev.image_url : val
                                                    }));
                                                    (e.target as HTMLInputElement).value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="shrink-0"
                                        onClick={() => {
                                            const input = document.getElementById('manual-url-input') as HTMLInputElement;
                                            if (input && input.value) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    image_urls: [...(prev.image_urls || []), input.value],
                                                    image_url: prev.image_urls && prev.image_urls.length ? prev.image_url : input.value
                                                }));
                                                input.value = '';
                                            }
                                        }}
                                    >
                                        Add URL
                                    </Button>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg border border-dashed border-border flex items-center justify-center">
                                        Or upload images directly from your computer
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="room-image-upload"
                                            className="hidden"
                                            accept="image/*"
                                            multiple
                                            onChange={handleFileUpload}
                                            disabled={uploading}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-10 px-3 shrink-0 flex items-center gap-2"
                                            onClick={() => document.getElementById('room-image-upload')?.click()}
                                            disabled={uploading}
                                        >
                                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            <span>Upload Images</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {formData.image_urls && formData.image_urls.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {formData.image_urls.map((url, idx) => (
                                        <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-border bg-muted group">
                                            <img
                                                src={getDirectImageUrl(url)}
                                                alt={`Preview ${idx + 1}`}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x225?text=Invalid+Image';
                                                }}
                                            />
                                            {idx === 0 && (
                                                <div className="absolute top-2 left-2 bg-primary/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                    Primary
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="w-full h-32 rounded-xl border-2 border-dashed border-muted flex flex-col items-center justify-center gap-2 bg-muted/30">
                                    <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                                    <p className="text-xs text-muted-foreground">No images uploaded</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Capacity</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                                value={isNaN(formData.capacity) ? '' : formData.capacity}
                                onChange={e => setFormData({ ...formData, capacity: e.target.value === '' ? parseInt('') : parseInt(e.target.value) })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Location Text</label>
                            <input
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g. Block A, 5th Floor"
                            />
                        </div>
                    </div>

                    {/* Location from Locations Table */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-primary" /> Assign Location
                            <span className="text-[10px] font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">from Locations table</span>
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                            value={formData.location_id}
                            onChange={e => {
                                const selected = locations.find(l => l.location_id === e.target.value);
                                setFormData(prev => ({
                                    ...prev,
                                    location_id: e.target.value,
                                    // Auto-fill mapLink from location's google_maps_url if empty
                                    mapLink: prev.mapLink || selected?.google_maps_url || '',
                                    // Also auto-fill location text if empty
                                    location: prev.location || selected?.name || '',
                                }));
                            }}
                        >
                            <option value="">— No location assigned —</option>
                            {locations.map(loc => (
                                <option key={loc.location_id} value={loc.location_id}>
                                    [{loc.location_id}] {loc.name}{loc.city ? ` — ${loc.city}` : ''}
                                </option>
                            ))}
                        </select>
                        {formData.location_id && (() => {
                            const sel = locations.find(l => l.location_id === formData.location_id);
                            return sel ? (
                                <p className="text-[11px] text-muted-foreground">
                                    📍 {sel.address || sel.city || sel.name}
                                    {sel.google_maps_url && <> · <a href={sel.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View on Maps ↗</a></>}
                                </p>
                            ) : null;
                        })()}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Google Maps Location</label>
                        <p className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full inline-block mb-1">Paste Google Maps Link</p>
                        <input
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                            value={formData.mapLink}
                            onChange={e => setFormData({ ...formData, mapLink: e.target.value })}
                            placeholder="https://maps.google.com/?q=..."
                        />
                    </div>

                    {/* Policy PDF Upload */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-foreground">Booking Policy PDF</label>
                            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Optional — upload or paste URL</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
                                    placeholder="Paste PDF URL (e.g. /uploads/policy.pdf)"
                                    value={formData.policy_pdf}
                                    onChange={e => setFormData({ ...formData, policy_pdf: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-2 items-center">
                                <div className="flex-1 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg border border-dashed border-border flex items-center justify-center">
                                    Or upload a PDF from your computer
                                </div>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="room-policy-pdf-upload"
                                        className="hidden"
                                        accept="application/pdf"
                                        onChange={handlePolicyUpload}
                                        disabled={policyPdfUploading}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-10 px-3 shrink-0 flex items-center gap-2"
                                        onClick={() => document.getElementById('room-policy-pdf-upload')?.click()}
                                        disabled={policyPdfUploading}
                                    >
                                        {policyPdfUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                        <span>Upload PDF</span>
                                    </Button>
                                </div>
                            </div>
                            {formData.policy_pdf && (
                                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                    <span className="text-xs text-green-700 flex-1 truncate">📄 {formData.policy_pdf}</span>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, policy_pdf: '' })}
                                        className="text-red-500 hover:text-red-700 text-xs font-medium shrink-0"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Floor No</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                                value={isNaN(formData.floor_no) ? '' : formData.floor_no}
                                onChange={e => setFormData({ ...formData, floor_no: e.target.value === '' ? parseInt('') : parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Room Number</label>
                            <input
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                                value={formData.room_number}
                                onChange={e => setFormData({ ...formData, room_number: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-foreground">Amenities</label>
                        <div className="grid grid-cols-2 gap-2 p-3 border border-border rounded-lg bg-slate-50/50">
                            {AMENITIES_LIST.map((amenity) => (
                                <label key={amenity} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition-colors group">
                                    <input
                                        type="checkbox"
                                        checked={selectedAmenities.includes(amenity)}
                                        onChange={() => handleAmenityToggle(amenity)}
                                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm text-slate-600 group-hover:text-slate-900">{amenity}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Room Layout Builder */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-foreground">Room Layout</label>
                            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Optional — click to place furniture</span>
                        </div>
                        <RoomLayoutBuilder value={roomLayout} onChange={setRoomLayout} />
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-border">
                        <Button variant="outline" type="button" className="flex-1" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" disabled={loading}>
                            {loading ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update Room' : 'Add Room')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
