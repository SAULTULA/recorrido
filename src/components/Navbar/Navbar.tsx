import React, { useState, useEffect } from 'react';
import { Bus, Server, CheckCircle2, XCircle, LogOut, User, Bell, Download } from 'lucide-react';
import styles from './Navbar.module.css';
import { BackendStatus, UserRole } from '../../types';

interface NavbarProps {
  currentRole: UserRole | null;
  userName?: string;
  backendStatus: BackendStatus;
  onOpenBackendModal: () => void;
  onLogout: () => void;
  isNightTime: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  userName,
  backendStatus,
  onOpenBackendModal,
  onLogout,
  isNightTime
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    // Detectar si ya está instalada como PWA
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      alert(
        'Para instalar en tu iPhone / iPad:\n1. Toca el botón "Compartir" (el ícono del cuadrado con la flecha hacia arriba abajo en Safari)\n2. Selecciona "Agregar a pantalla de inicio" 📲'
      );
    } else {
      alert(
        'Para instalar en tu PC o Android:\nHaz clic en los tres puntos del navegador y selecciona "Instalar aplicación" o "Agregar a la pantalla principal".'
      );
    }
  };

  const getRoleLabel = (role: UserRole | null) => {
    switch (role) {
      case 'PADRE':
        return 'Padre / Tutor';
      case 'ENCARGADA_CONTROL':
        return 'Encargada de Control';
      case 'ENCARGADO_RECORRIDO':
        return 'Encargado de Recorrido';
      default:
        return 'Sin Sesión';
    }
  };

  const renderStatusBadge = () => {
    if (!backendStatus.online) {
      return (
        <button
          className={`${styles.navbar__statusBadge} ${styles['navbar__statusBadge--offline']}`}
          onClick={onOpenBackendModal}
          title="Fallo de conexión. Clic para verificar"
        >
          <XCircle size={14} />
          <span>Backend Desconectado</span>
        </button>
      );
    }

    if (backendStatus.mode === 'APPS_SCRIPT') {
      return (
        <button
          className={`${styles.navbar__statusBadge} ${styles['navbar__statusBadge--online']}`}
          onClick={onOpenBackendModal}
          title={`Google Apps Script conectado (${backendStatus.latencyMs}ms)`}
        >
          <CheckCircle2 size={14} />
          <span>Backend Nube ({backendStatus.latencyMs}ms)</span>
        </button>
      );
    }

    return (
      <button
        className={`${styles.navbar__statusBadge} ${styles['navbar__statusBadge--warning']}`}
        onClick={onOpenBackendModal}
        title="Modo local persistente activo. Clic para conectar Google Sheets"
      >
        <Server size={14} />
        <span>Backend Local</span>
      </button>
    );
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.navbar__container}>
        <div className={styles.navbar__brand}>
          <div className={styles.navbar__icon}>
            <Bus size={22} />
          </div>
          <div className={styles.navbar__titles}>
            <span className={styles.navbar__title}>Recorrido Escolar</span>
            <span className={styles.navbar__subtitle}>Control de Transporte Escolar Tala</span>
          </div>
        </div>

        <div className={styles.navbar__actions}>
          {/* Botón de Instalar PWA */}
          {!isStandalone && (
            <button
              className={`${styles.navbar__btn} ${styles['navbar__btn--install']}`}
              onClick={handleInstallClick}
              title="Instalar como aplicación en tu celular o PC"
            >
              <Download size={14} />
              <span>Instalar App</span>
            </button>
          )}

          {isNightTime && (
            <div className={styles.navbar__reminderPill} title="Horario de carga para el día siguiente">
              <Bell size={13} />
              <span>Recordatorio 20:00 hs</span>
            </div>
          )}

          {renderStatusBadge()}

          {currentRole && (
            <div className={styles.navbar__userPill}>
              <User size={14} />
              <span>{userName || 'Usuario'}</span>
              <span className={styles.navbar__userRole}>({getRoleLabel(currentRole)})</span>
            </div>
          )}

          {currentRole && (
            <button
              className={`${styles.navbar__btn} ${styles['navbar__btn--outline']}`}
              onClick={onLogout}
              title="Cambiar de usuario o rol"
            >
              <LogOut size={14} />
              <span>Cambiar Rol</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
