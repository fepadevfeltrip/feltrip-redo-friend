import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MapPin, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface CreateCommunityPinProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  latitude: number;
  longitude: number;
  onSuccess: () => void;
}

const COPY = {
  pt: {
    title: "Adicionar Dor ou Delícia",
    desc: "Compartilhe uma dor ou delícia com a comunidade.",
    titleLabel: "Título *",
    titlePlaceholder: "Ex: Melhor café da cidade",
    category: "Tipo",
    descLabel: "Descrição (opcional)",
    descPlaceholder: "Conte mais sobre este lugar...",
    photo: "Foto (opcional)",
    clickUpload: "Clique para enviar",
    cancel: "Cancelar",
    add: "Adicionar",
    saving: "Salvando...",
    success: "Dor/Delícia adicionada!",
    successDesc: "Sua contribuição foi compartilhada com a comunidade.",
    pain: "Dor 🚩",
    delight: "Delícia 💎",
  },
  en: {
    title: "Add Pain or Delight",
    desc: "Share a pain or delight with the community.",
    titleLabel: "Title *",
    titlePlaceholder: "e.g., Best coffee shop",
    category: "Type",
    descLabel: "Description (optional)",
    descPlaceholder: "Share more details about this place...",
    photo: "Photo (optional)",
    clickUpload: "Click to upload",
    cancel: "Cancel",
    add: "Add",
    saving: "Saving...",
    success: "Pain/Delight added!",
    successDesc: "Your contribution has been shared with the community.",
    pain: "Pain 🚩",
    delight: "Delight 💎",
  },
  es: {
    title: "Añadir Dolor o Delicia",
    desc: "Comparte un dolor o delicia con la comunidad.",
    titleLabel: "Título *",
    titlePlaceholder: "Ej: Mejor cafetería",
    category: "Tipo",
    descLabel: "Descripción (opcional)",
    descPlaceholder: "Cuenta más sobre este lugar...",
    photo: "Foto (opcional)",
    clickUpload: "Clic para subir",
    cancel: "Cancelar",
    add: "Añadir",
    saving: "Guardando...",
    success: "¡Dolor/Delicia añadida!",
    successDesc: "Tu contribución fue compartida con la comunidad.",
    pain: "Dolor 🚩",
    delight: "Delicia 💎",
  },
};

const typeOptions = [
  { value: 'delicia', icon: '💎' },
  { value: 'dor', icon: '🚩' },
];

export function CreateCommunityPin({ open, onOpenChange, latitude, longitude, onSuccess }: CreateCommunityPinProps) {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const lang = (i18n.language?.substring(0, 2) as 'pt' | 'en' | 'es') || 'pt';
  const t = COPY[lang] || COPY.pt;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('delicia');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setIsSubmitting(true);
    try {
      let imageUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('map-images').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('map-images').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      const { error } = await supabase.from('map_pins').insert({
        user_id: user.id,
        title: title.trim(),
        content: content.trim() || null,
        type,
        latitude,
        longitude,
        image_url: imageUrl,
        is_shared_to_community: true,
      });

      if (error) throw error;

      toast.success(t.success, { description: t.successDesc });

      setTitle('');
      setContent('');
      setType('delicia');
      setImageFile(null);
      setImagePreview(null);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error('Error', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeLabel = (val: string) => val === 'dor' ? t.pain : t.delight;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {t.title}
          </DialogTitle>
          <DialogDescription>{t.desc}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t.titleLabel}</Label>
            <Input
              id="title"
              placeholder={t.titlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.category}</Label>
            <div className="flex gap-2">
              {typeOptions.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={type === opt.value ? 'default' : 'outline'}
                  className="flex-1 text-lg gap-2"
                  onClick={() => setType(opt.value)}
                  disabled={isSubmitting}
                >
                  <span>{opt.icon}</span>
                  <span className="text-sm">{typeLabel(opt.value)}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">{t.descLabel}</Label>
            <Textarea
              id="content"
              placeholder={t.descPlaceholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.photo}</Label>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={removeImage}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground mt-1">{t.clickUpload}</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={isSubmitting} />
              </label>
            )}
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              {t.cancel}
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.saving}</>
              ) : (
                <><MapPin className="mr-2 h-4 w-4" />{t.add}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
