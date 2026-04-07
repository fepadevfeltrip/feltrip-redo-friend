import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'pt', name: 'PT' },
  { code: 'en', name: 'EN' },
  { code: 'es', name: 'ES' },
];
export function LanguageSelector() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (value: string) => {
    // 1. Muda a língua no i18n
    i18n.changeLanguage(value);
    // 2. Grava na memória forçadamente
    localStorage.setItem('i18nextLng', value);
    // 3. (OPCIONAL MAS RECOMENDADO) Dispara um evento global para os componentes teimosos
    window.dispatchEvent(new Event('language-changed'));
  };

  return (
    <Select value={i18n.language?.substring(0, 2) || 'pt'} onValueChange={handleLanguageChange}>
      {/* ... resto do código igual */}
      <SelectTrigger className="w-auto gap-1.5 bg-transparent border-none shadow-none text-muted-foreground hover:text-foreground px-2 h-9">
        <Globe className="h-4 w-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="z-50">
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
