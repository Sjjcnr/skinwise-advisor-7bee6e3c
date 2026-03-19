import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Camera, Upload, ArrowLeft, Plus, Trash2, X, Loader2,
  CalendarDays, SplitSquareHorizontal, ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';

interface ProgressPhoto {
  id: string;
  photo_url: string;
  notes: string | null;
  created_at: string;
}

export default function Progress() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchPhotos();
  }, [user]);

  const fetchPhotos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('skin_progress_photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Could not load photos.', variant: 'destructive' });
    } else {
      setPhotos(data as ProgressPhoto[]);
    }
    setLoading(false);
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('skin-progress').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('skin-progress')
      .upload(filePath, file, { contentType: file.type });

    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const publicUrl = getPublicUrl(filePath);

    const { error: dbError } = await supabase
      .from('skin_progress_photos')
      .insert({ user_id: user.id, photo_url: publicUrl, notes: notes.trim() || null });

    if (dbError) {
      toast({ title: 'Error saving', description: dbError.message, variant: 'destructive' });
    } else {
      toast({ title: 'Photo added!', description: 'Your progress photo has been saved.' });
      setNotes('');
      setShowUpload(false);
      await fetchPhotos();
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [user, notes]);

  const deletePhoto = async (photo: ProgressPhoto) => {
    setDeletingId(photo.id);
    // Extract storage path from URL
    const urlParts = photo.photo_url.split('/skin-progress/');
    const storagePath = urlParts[1] ? decodeURIComponent(urlParts[1]) : null;

    const { error: dbError } = await supabase
      .from('skin_progress_photos')
      .delete()
      .eq('id', photo.id);

    if (dbError) {
      toast({ title: 'Error', description: 'Could not delete photo.', variant: 'destructive' });
    } else {
      if (storagePath) {
        await supabase.storage.from('skin-progress').remove([storagePath]);
      }
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
      setSelectedPhotos(prev => prev.filter(id => id !== photo.id));
      toast({ title: 'Deleted', description: 'Progress photo removed.' });
    }
    setDeletingId(null);
  };

  const togglePhotoSelection = (id: string) => {
    setSelectedPhotos(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const comparedPhotos = photos.filter(p => selectedPhotos.includes(p.id));

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Skin Progress</h1>
          </div>
          <div className="flex items-center gap-2">
            {photos.length >= 2 && (
              <Button
                variant={compareMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setCompareMode(!compareMode); setSelectedPhotos([]); }}
                className="gap-1.5"
              >
                <SplitSquareHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Compare</span>
              </Button>
            )}
            <Button size="sm" onClick={() => setShowUpload(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Photo</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Upload section */}
        {showUpload && (
          <Card className="border-primary/30 animate-fade-in">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">New Progress Photo</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowUpload(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Optional notes — e.g. started new serum, breakout on chin…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1 gap-2"
                >
                  {uploading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
                  ) : (
                    <><Upload className="h-4 w-4" /> Choose Photo</>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: Take photos in the same lighting and angle each time for best comparison.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Compare banner */}
        {compareMode && (
          <div className="text-center py-2">
            <Badge variant="secondary" className="text-sm">
              Select 2 photos to compare side-by-side ({selectedPhotos.length}/2 selected)
            </Badge>
          </div>
        )}

        {/* Side-by-side comparison */}
        {compareMode && comparedPhotos.length === 2 && (
          <Card className="overflow-hidden animate-fade-in">
            <CardContent className="p-0">
              <div className="grid grid-cols-2 divide-x divide-border">
                {comparedPhotos.map(photo => (
                  <div key={photo.id} className="space-y-2">
                    <div className="aspect-[3/4] overflow-hidden bg-muted">
                      <img
                        src={photo.photo_url}
                        alt={`Progress photo from ${format(new Date(photo.created_at), 'MMM d, yyyy')}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3 pt-0">
                      <p className="text-sm font-medium text-foreground">
                        {format(new Date(photo.created_at), 'MMM d, yyyy')}
                      </p>
                      {photo.notes && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{photo.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photo timeline */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">No progress photos yet</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Start tracking your skin journey by adding your first photo.
              </p>
            </div>
            <Button onClick={() => setShowUpload(true)} className="gap-2">
              <Camera className="h-4 w-4" />
              Add First Photo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map(photo => {
              const isSelected = selectedPhotos.includes(photo.id);
              return (
                <Card
                  key={photo.id}
                  className={`overflow-hidden group cursor-pointer transition-all ${
                    compareMode && isSelected ? 'ring-2 ring-primary' : ''
                  } ${compareMode ? 'hover:ring-2 hover:ring-primary/50' : ''}`}
                  onClick={() => compareMode && togglePhotoSelection(photo.id)}
                >
                  <div className="relative aspect-[3/4] bg-muted">
                    <img
                      src={photo.photo_url}
                      alt={`Progress ${format(new Date(photo.created_at), 'MMM d')}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {compareMode && isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Badge className="text-xs">
                          {selectedPhotos.indexOf(photo.id) + 1}
                        </Badge>
                      </div>
                    )}
                    {!compareMode && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); deletePhoto(photo); }}
                        disabled={deletingId === photo.id}
                      >
                        {deletingId === photo.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      {format(new Date(photo.created_at), 'MMM d, yyyy')}
                    </div>
                    {photo.notes && (
                      <p className="text-xs text-foreground mt-1 line-clamp-2">{photo.notes}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
