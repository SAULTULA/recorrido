import React from 'react';
import { Bus, Server, CheckCircle2, XCircle, LogOut, User, Bell } from 'lucide-react';
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
            <span className={styles.navbar__subtitle}>Barrio Oficiales & Suboficiales</span>
          </div>
        </div>

        <div className={styles.navbar__actions}>
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
