import React, { useState } from 'react';
import {
  Bus,
  Users,
  ShieldCheck,
  ClipboardCheck,
  ArrowRight,
  UserPlus,
  AlertCircle,
  KeyRound,
  LogIn
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
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [nombre, setNombre] = useState('');
  const [dni, setDni] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [role, setRole] = useState<UserRole>('PADRE');
  const [errorMsg, setErrorMsg] = useState('');

  const familias = apiService.getFamilias();
  const personal = apiService.getPersonal();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // 1. Caso SuperAdmin
    if (role === 'SUPERADMIN') {
      if (apiService.checkAdminPassword(adminPassword)) {
        onLogin('SUPERADMIN', 'Super Administrador', '00000000');
      } else {
        setErrorMsg('Clave de SuperAdmin incorrecta. (Clave por defecto: admin123)');
      }
      return;
    }

    if (!dni.trim()) {
      setErrorMsg('Por favor ingresa tu DNI registrado.');
      return;
    }

    const cleanDni = dni.trim().toLowerCase();

    // 2. Caso Padre: validación estricta en el padrón
    if (role === 'PADRE') {
      const match = familias.find(
        (f) => String(f.dni).trim().toLowerCase() === cleanDni
      );

      if (match) {
        onLogin(role, match.nombreTutor, match.dni, match);
      } else {
        setErrorMsg(
          `El DNI ${dni.trim()} NO está registrado en el sistema. Los padres deben registrarse primero con sus hijos antes de ingresar.`
        );
      }
      return;
    }

    // 3. Caso Encargada de Control
    if (role === 'ENCARGADA_CONTROL') {
      const match = personal.find(
        (p) => String(p.dni).trim().toLowerCase() === cleanDni && p.rol === 'ENCARGADA_CONTROL'
      );

      if (match) {
        onLogin(role, match.nombre, match.dni);
      } else {
        setErrorMsg(
          `No existe una Encargada de Control registrada con el DNI ${dni.trim()}. Debe darse de alta en la pestaña Registrarse.`
        );
      }
      return;
    }

    // 4. Caso Encargado de Recorrido
    if (role === 'ENCARGADO_RECORRIDO') {
      const match = personal.find(
        (p) => String(p.dni).trim().toLowerCase() === cleanDni && p.rol === 'ENCARGADO_RECORRIDO'
      );

      if (match) {
        onLogin(role, match.nombre, match.dni);
      } else {
        setErrorMsg(
          `No existe un Encargado registrado con el DNI ${dni.trim()}. Debe registrarse primero.`
        );
      }
      return;
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

      {/* Tabs Superiores: Iniciar Sesión vs Registrarse */}
      <div className={styles.loginModal__topTabs}>
        <button
          type="button"
          className={`${styles.loginModal__topTab} ${
            activeTab === 'LOGIN' ? styles['loginModal__topTab--active'] : ''
          }`}
          onClick={() => {
            setActiveTab('LOGIN');
            setErrorMsg('');
          }}
        >
          <LogIn size={16} />
          <span>INICIAR SESIÓN</span>
        </button>

        <button
          type="button"
          className={`${styles.loginModal__topTab} ${
            activeTab === 'REGISTER' ? styles['loginModal__topTab--active'] : ''
          }`}
          onClick={() => {
            setActiveTab('REGISTER');
            setErrorMsg('');
          }}
        >
          <UserPlus size={16} />
          <span>REGISTRARSE (NUEVO)</span>
        </button>
      </div>

      {activeTab === 'REGISTER' ? (
        /* VISTA 1: REGISTRARSE */
        <div className={styles.loginModal__registerChoices}>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            El registro es obligatorio antes de ingresar para validar tus datos y los de los alumnos.
          </p>

          <div
            className={styles.loginModal__regCard}
            onClick={onGoToRegisterPadre}
          >
            <div className={styles.loginModal__regCardIcon}>
              <Users size={22} />
            </div>
            <div className={styles.loginModal__regCardText}>
              <span className={styles.loginModal__regCardTitle}>
                Registro de Familia y Alumnos (Padres / Tutores)
              </span>
              <span className={styles.loginModal__regCardDesc}>
                Carga tus datos, parada fija y registra a uno o más de tus hijos.
              </span>
            </div>
            <ArrowRight size={18} color="var(--color-primary)" />
          </div>

          <div
            className={styles.loginModal__regCard}
            onClick={() => onGoToRegisterPersonal('ENCARGADA_CONTROL')}
          >
            <div
              className={styles.loginModal__regCardIcon}
              style={{ backgroundColor: 'var(--color-secondary)' }}
            >
              <ClipboardCheck size={22} />
            </div>
            <div className={styles.loginModal__regCardText}>
              <span className={styles.loginModal__regCardTitle}>
                Registro de Encargada de Control
              </span>
              <span className={styles.loginModal__regCardDesc}>
                Personal asignado al colectivo para marcar subidas de los niños.
              </span>
            </div>
            <ArrowRight size={18} color="var(--color-secondary)" />
          </div>

          <div
            className={styles.loginModal__regCard}
            onClick={() => onGoToRegisterPersonal('ENCARGADO_RECORRIDO')}
          >
            <div
              className={styles.loginModal__regCardIcon}
              style={{ backgroundColor: '#0f172a' }}
            >
              <ShieldCheck size={22} />
            </div>
            <div className={styles.loginModal__regCardText}>
              <span className={styles.loginModal__regCardTitle}>
                Registro de Encargado de Recorrido
              </span>
              <span className={styles.loginModal__regCardDesc}>
                Coordinación, choferes y administración general del servicio.
              </span>
            </div>
            <ArrowRight size={18} color="#0f172a" />
          </div>
        </div>
      ) : (
        /* VISTA 2: INICIAR SESIÓN CON CONTROL DE PADRÓN */
        <form className={styles.loginModal__form} onSubmit={handleLoginSubmit}>
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
                onClick={() => setActiveTab('REGISTER')}
              >
                👉 Ir a la pestaña Registrarse
              </button>
            </div>
          )}

          <div className={styles.loginModal__group}>
            <label className={styles.loginModal__label}>Selecciona cómo deseas ingresar</label>
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
                  <Users size={16} />
                </div>
                <span className={styles.loginModal__roleTitle}>Padre / Tutor</span>
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
                  <ClipboardCheck size={16} />
                </div>
                <span className={styles.loginModal__roleTitle}>Encargada</span>
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
                  <ShieldCheck size={16} />
                </div>
                <span className={styles.loginModal__roleTitle}>Encargado</span>
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
                  <KeyRound size={16} />
                </div>
                <span className={styles.loginModal__roleTitle}>SuperAdmin</span>
              </button>
            </div>
          </div>

          {role === 'SUPERADMIN' ? (
            <div className={styles.loginModal__group}>
              <label className={styles.loginModal__label}>Clave Maestra de SuperAdmin</label>
              <input
                type="password"
                className={styles.loginModal__input}
                placeholder="Ingresa la clave maestra de administrador"
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
                <label className={styles.loginModal__label}>DNI Registrado *</label>
                <input
                  type="text"
                  className={styles.loginModal__input}
                  placeholder="Ingresa el DNI con el que te registraste"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  required
                />
              </div>

              <div className={styles.loginModal__group}>
                <label className={styles.loginModal__label}>Nombre (Opcional)</label>
                <input
                  type="text"
                  className={styles.loginModal__input}
                  placeholder="Tu nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
            </>
          )}

          <button type="submit" className={styles.loginModal__btnSubmit}>
            <span>Verificar e Ingresar</span>
            <ArrowRight size={18} />
          </button>
        </form>
      )}
    </div>
  );
};
