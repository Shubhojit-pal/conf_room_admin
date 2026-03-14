import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Upload, ImageIcon, Loader2 } from 'lucide-react';
import { createRoom, updateRoom, Room, uploadRoomImages } from '@/lib/api';
import { getDirectImageUrl } from '@/lib/imageUtils';

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
    const [formData, setFormData] = useState({
        catalog_id: '',
        room_id: '',
        room_name: '',
        capacity: 10,
        location: '',
        amenities: '',
        status: 'active',
        floor_no: 1,
        room_number: '',
        availability: 'available',
        image_url: '',
        image_urls: [] as string[],
    });

    useEffect(() => {
        if (room) {
            const amenArr = room.amenities ? room.amenities.split(',').map(a => a.trim()) : [];
            setSelectedAmenities(amenArr);
            setFormData({
                catalog_id: room.catalog_id,
                room_id: room.room_id,
                room_name: room.room_name,
                capacity: room.capacity,
                location: room.location || '',
                amenities: room.amenities || '',
                status: room.status || 'active',
                floor_no: room.floor_no || 1,
                room_number: room.room_number || '',
                availability: room.availability || 'available',
                image_url: room.image_url || '',
                image_urls: room.image_urls || (room.image_url ? [room.image_url] : []),
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
                amenities: selectedAmenities.join(', ')
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

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-foreground">Room Image</label>
                            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">URL or Upload</span>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                                <div className="flex-1 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg border border-dashed border-border flex items-center justify-center">
                                    Upload one or more images for the room gallery
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
                            <label className="text-sm font-semibold text-foreground">Location</label>
                            <input
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g. Block A, 5th Floor"
                            />
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
