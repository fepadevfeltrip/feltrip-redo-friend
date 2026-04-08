import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { useState, useEffect } from 'react';
import { Bell, BellRing, Mail, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { toast } from 'sonner';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'default' | 'granted' | 'denied'>('default');
  const {
    emailEnabled,
    pushEnabled,
    toggleEmailNotifications,
    togglePushNotifications,
    isLoading: prefsLoading
  } = useNotificationPreferences();

  // Verifica o status inicial da permissão (Web e Nativo)
  useEffect(() => {
    const checkInitialPermissions = async () => {
      if (Capacitor.isNativePlatform()) {
        const permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'granted') {
          setPushPermission('granted');
        } else if (permStatus.receive === 'denied') {
          setPushPermission('denied');
        } else {
          setPushPermission('default');
        }
      } else if ('Notification' in window) {
        setPushPermission(Notification.permission);
      }
    };

    checkInitialPermissions();
  }, []);

  // Adiciona os ouvintes para capturar o Token da Apple
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      PushNotifications.addListener('registration', (token) => {
        console.log('✅ Push registration success, Token do iPhone: ', token.value);
        // FUTURO: Salvar este token.value no Supabase
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('❌ Erro ao registrar Push Notifications: ', error);
      });
    }

    // Limpa os ouvintes ao desmontar
    return () => {
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
    };
  }, []);

  const handleRequestPushPermission = async () => {
    // 1. LÓGICA NATIVA (iOS / Android)
    if (Capacitor.isNativePlatform()) {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        setPushPermission('denied');
        toast.error('Permissão negada. Ative nas configurações do seu celular.');
        return;
      }

      // Se aceitou, registra para gerar o token
      await PushNotifications.register();

      setPushPermission('granted');
      await togglePushNotifications();
      toast.success('Notificações push ativadas!');

    } else {
      // 2. LÓGICA WEB (Navegador)
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setPushPermission('granted');
          await togglePushNotifications();
          toast.success('Notificações push ativadas!');
        } else {
          setPushPermission(Notification.permission);
          if (Notification.permission === 'denied') {
            toast.error('Permissão negada. Ative nas configurações do navegador.');
          }
        }
      }
    }
  };

  const handleToggleEmail = async () => {
    const success = await toggleEmailNotifications();
    if (success) {
      toast.success(emailEnabled ? 'Notificações por email desativadas' : 'Notificações por email ativadas!');
    }
  };

  const handleTogglePush = async () => {
    if (!pushEnabled && pushPermission !== 'granted') {
      await handleRequestPushPermission();
    } else {
      const success = await togglePushNotifications();
      if (success) {
        toast.success(pushEnabled ? 'Notificações push desativadas' : 'Notificações push ativadas!');
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="flex items-center gap-2 p-3 border-b">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <h4 className="font-semibold text-sm">Preferências de Notificação</h4>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Email</span>
            </div>
            <Switch
              checked={emailEnabled}
              onCheckedChange={handleToggleEmail}
              disabled={prefsLoading}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Push</span>
            </div>
            <Switch
              checked={pushEnabled && pushPermission === 'granted'}
              onCheckedChange={handleTogglePush}
              disabled={prefsLoading || pushPermission === 'denied'}
            />
          </div>
          {pushPermission === 'denied' && (
            <p className="text-xs text-destructive">
              Push bloqueado nas configurações
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}