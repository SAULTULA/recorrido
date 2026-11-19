import React, { useState } from 'react';
import {
  Bus,
  Users,
  ShieldCheck,
  ClipboardCheck,
  ArrowRight,
  UserPlus,
  AlertCircle,
  KeyRound
} from 'lucide-react';
import styles from './LoginModal.module.css';
import { UserRole } from '../../types';
import { apiService } from '../../services/api';

interface LoginModalProps {
  onLogin: (role: UserRole, nombre: string, dni: string, familia?: any) => void;
  onGoToRegisterPadre: () => void;
  onGoToRegisterPersonal: (defaultRole: 'ENCARGADA_CONTROL' | 'ENCARGADO_RECORRIDO') => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onLogin,
  onGoToRegisterPadre,
  onGoToRegisterPersonal
}) => {
  const [nombre, setNombre] = useState('');
  const [dni, setDni] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [role, setRole] = useState<UserRole>('PADRE');
  const [errorMsg, setErrorMsg] = useState('');
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);

  const familias = apiService.getFamilias();
  const personal = apiService.getPersonal();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setShowRegisterPrompt(false);

    // Caso SuperAdmin
    if (role === 'SUPERADMIN') {
      if (apiService.checkAdminPassword(adminPassword)) {
        onLogin('SUPERADMIN', 'Super Administrador', '00000000');
      } else {
        setErrorMsg('Clave de SuperAdmin incorrecta. La clave inicial es: admin123');
      }
      return;
    }

    if (!nombre.trim() || !dni.trim()) {
      setErrorMsg('Por favor completa tu Nombre y DNI.');
      return;
    }

    const cleanDni = dni.trim().toLowerCase();

    if (role === 'PADRE') {
      const match = familias.find(
        (f) => f.dni.trim().toLowerCase() === cleanDni
      );

      if (match) {
        onLogin(role, match.nombreTutor, match.dni, match);
      } else {
        setErrorMsg(
          `El DNI ${dni.trim()} no se encuentra registrado. Como padre debes registrarte primero para que figuren tus datos y los de tus hijos.`
        );
        setShowRegisterPrompt(true);
      }
    } else if (role === 'ENCARGADA_CONTROL') {
      const match = personal.find(
        (p) => p.dni.trim().toLowerCase() === cleanDni && p.rol === 'ENCARGADA_CONTROL'
      );

      if (match) {
        onLogin(role, match.nombre, match.dni);
      } else {
        setErrorMsg(
          `No existe una Encargada de Control registrada con el DNI ${dni.trim()}. Debe registrarse primero o ser dada de alta por el Encargado.`
        );
        setShowRegisterPrompt(true);
      }
    } else if (role === 'ENCARGADO_RECORRIDO') {
      const match = personal.find(
        (p) => p.dni.trim().toLowerCase() === cleanDni && p.rol === 'ENCARGADO_RECORRIDO'
      );

      if (match) {
        onLogin(role, match.nombre, match.dni);
      } else {
        setErrorMsg(
          `No existe un Encargado de Recorrido registrado con el DNI ${dni.trim()}. Debes registrarte primero.`
        );
        setShowRegisterPrompt(true);
      }
    }
  };

  return (
    <div className={styles.loginModal}>
      <div className={styles.loginModal__header}>
        <div className={styles.loginModal__icon}>
          <Bus size={28} />
        </div>
        <h1 className={styles.loginModal__title}>Recorrido Escolar</h1>
        <p className={styles.loginModal__subtitle}>
          Control de Transporte Escolar Tala
        </p>
      </div>

      <form className={styles.loginModal__form} onSubmit={handleSubmit}>
        {/* Banner de Registro Obligatorio según Rol */}
        {role === 'PADRE' && (
          <div
            style={{
              backgroundColor: 'var(--color-primary-light)',
              border: '1px solid var(--color-primary-border)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--spacing-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'var(--color-primary)'
              }}
            >
              ¿Aún no has registrado a tus hijos en el sistema?
            </span>
            <button
              type="button"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: 'var(--radius-xs)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              onClick={onGoToRegisterPadre}
            >
              <UserPlus size={14} />
              <span>REGISTRAR FAMILIA Y ALUMNOS PRIMERO</span>
            </button>
          </div>
        )}

        {(role === 'ENCARGADA_CONTROL' || role === 'ENCARGADO_RECORRIDO') && (
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--spacing-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: '#166534' }}>
              ¿Eres nuevo personal del recorrido?
            </span>
            <button
              type="button"
              style={{
                backgroundColor: '#16a34a',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: 'var(--radius-xs)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              onClick={() => onGoToRegisterPersonal(role as any)}
            >
              <UserPlus size={14} />
              <span>REGISTRARSE COMO PERSONAL PRIMERO</span>
            </button>
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              backgroundColor: 'var(--color-danger-light)',
              border: '1px solid var(--color-danger-border)',
              color: 'var(--color-danger-hover)',
              padding: 'var(--spacing-sm)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-size-xs)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={16} />
              <span style={{ fontWeight: 600 }}>{errorMsg}</span>
            </div>
            {showRegisterPrompt && (
              <button
                type="button"
                style={{
                  backgroundColor: 'var(--color-danger)',
                  color: '#fff',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-xs)',
                  fontWeight: 700,
                  fontSize: 'var(--font-size-xs)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
                onClick={() => {
                  if (role === 'PADRE') onGoToRegisterPadre();
                  else if (role === 'ENCARGADA_CONTROL' || role === 'ENCARGADO_RECORRIDO') {
                    onGoToRegisterPersonal(role);
                  }
                }}
              >
                👉 Haz clic aquí para Registrarte ahora
              </button>
            )}
          </div>
        )}

        <div className={styles.loginModal__group}>
          <label className={styles.loginModal__label}>Selecciona tu Rol</label>
          <div className={styles.loginModal__roleGrid}>
            <button
              type="button"
              className={`${styles.loginModal__roleOption} ${
                role === 'PADRE' ? styles['loginModal__roleOption--active'] : ''
              }`}
              onClick={() => {
                setRole('PADRE');
                setErrorMsg('');
              }}
            >
              <div className={styles.loginModal__roleIcon}>
                <Users size={18} />
              </div>
              <div className={styles.loginModal__roleText}>
                <span className={styles.loginModal__roleTitle}>Padre / Madre / Tutor</span>
                <span className={styles.loginModal__roleDesc}>Ingresar con DNI registrado</span>
              </div>
            </button>

            <button
              type="button"
              className={`${styles.loginModal__roleOption} ${
                role === 'ENCARGADA_CONTROL' ? styles['loginModal__roleOption--active'] : ''
              }`}
              onClick={() => {
                setRole('ENCARGADA_CONTROL');
                setErrorMsg('');
              }}
            >
              <div className={styles.loginModal__roleIcon}>
                <ClipboardCheck size={18} />
              </div>
              <div className={styles.loginModal__roleText}>
                <span className={styles.loginModal__roleTitle}>Encargada de Control</span>
                <span className={styles.loginModal__roleDesc}>Marcar subida de alumnos</span>
              </div>
            </button>

            <button
              type="button"
              className={`${styles.loginModal__roleOption} ${
                role === 'ENCARGADO_RECORRIDO' ? styles['loginModal__roleOption--active'] : ''
              }`}
              onClick={() => {
                setRole('ENCARGADO_RECORRIDO');
                setErrorMsg('');
              }}
            >
              <div className={styles.loginModal__roleIcon}>
                <ShieldCheck size={18} />
              </div>
              <div className={styles.loginModal__roleText}>
                <span className={styles.loginModal__roleTitle}>Encargado de Recorrido</span>
                <span className={styles.loginModal__roleDesc}>Gestión, eliminación y cuotas</span>
              </div>
            </button>

            <button
              type="button"
              className={`${styles.loginModal__roleOption} ${
                role === 'SUPERADMIN' ? styles['loginModal__roleOption--active'] : ''
              }`}
              onClick={() => {
                setRole('SUPERADMIN');
                setErrorMsg('');
              }}
            >
              <div className={styles.loginModal__roleIcon}>
                <KeyRound size={18} />
              </div>
              <div className={styles.loginModal__roleText}>
                <span className={styles.loginModal__roleTitle}>SuperAdmin</span>
                <span className={styles.loginModal__roleDesc}>Control total y eliminación de usuarios</span>
              </div>
            </button>
          </div>
        </div>

        {role === 'SUPERADMIN' ? (
          <div className={styles.loginModal__group}>
            <label className={styles.loginModal__label}>Clave Maestra de Administrador</label>
            <input
              type="password"
              className={styles.loginModal__input}
              placeholder="Ingresa la clave de SuperAdmin"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              required
            />
            <span style={{ fontSize: '11px', color: 'var(--color-text-light)' }}>
              Clave inicial: <code>admin123</code>
            </span>
          </div>
        ) : (
          <>
            <div className={styles.loginModal__group}>
              <label className={styles.loginModal__label}>Nombre Completo Registrado</label>
              <input
                type="text"
                className={styles.loginModal__input}
                placeholder="Ej: Juan Pérez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            <div className={styles.loginModal__group}>
              <label className={styles.loginModal__label}>DNI Registrado</label>
              <input
                type="text"
                className={styles.loginModal__input}
                placeholder="Ej: 28456123"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                required
              />
            </div>
          </>
        )}

        <button type="submit" className={styles.loginModal__btnSubmit}>
          <span>Ingresar al Sistema</span>
          <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
};
