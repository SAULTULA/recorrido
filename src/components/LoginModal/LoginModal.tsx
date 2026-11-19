import React, { useState } from 'react';
import { Bus, Users, ShieldCheck, ClipboardCheck, ArrowRight } from 'lucide-react';
import styles from './LoginModal.module.css';
import { UserRole, Familia } from '../../types';
import { apiService } from '../../services/api';

interface LoginModalProps {
  onLogin: (role: UserRole, nombre: string, dni: string, familia?: Familia) => void;
  onGoToRegister: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onGoToRegister }) => {
  const [nombre, setNombre] = useState('');
  const [dni, setDni] = useState('');
  const [role, setRole] = useState<UserRole>('PADRE');
  const [errorMsg, setErrorMsg] = useState('');

  const familias = apiService.getFamilias();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !dni.trim()) {
      setErrorMsg('Por favor ingresa tu Nombre y DNI.');
      return;
    }

    if (role === 'PADRE') {
      const match = familias.find((f) => f.dni.trim() === dni.trim());
      if (match) {
        onLogin(role, match.nombreTutor, match.dni, match);
      } else {
        // Si no existe, invitar a registrar
        onLogin(role, nombre.trim(), dni.trim(), undefined);
      }
    } else {
      onLogin(role, nombre.trim(), dni.trim());
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
          Control de asistencia y transporte para Oficiales y Suboficiales
        </p>
      </div>

      <form className={styles.loginModal__form} onSubmit={handleSubmit}>
        {errorMsg && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)' }}>{errorMsg}</div>}

        <div className={styles.loginModal__group}>
          <label className={styles.loginModal__label}>Selecciona tu Rol</label>
          <div className={styles.loginModal__roleGrid}>
            <button
              type="button"
              className={`${styles.loginModal__roleOption} ${
                role === 'PADRE' ? styles['loginModal__roleOption--active'] : ''
              }`}
              onClick={() => setRole('PADRE')}
            >
              <div className={styles.loginModal__roleIcon}>
                <Users size={18} />
              </div>
              <div className={styles.loginModal__roleText}>
                <span className={styles.loginModal__roleTitle}>Padre / Madre / Tutor</span>
                <span className={styles.loginModal__roleDesc}>Cargar y gestionar horarios de tus hijos</span>
              </div>
            </button>

            <button
              type="button"
              className={`${styles.loginModal__roleOption} ${
                role === 'ENCARGADA_CONTROL' ? styles['loginModal__roleOption--active'] : ''
              }`}
              onClick={() => setRole('ENCARGADA_CONTROL')}
            >
              <div className={styles.loginModal__roleIcon}>
                <ClipboardCheck size={18} />
              </div>
              <div className={styles.loginModal__roleText}>
                <span className={styles.loginModal__roleTitle}>Encargada de Control</span>
                <span className={styles.loginModal__roleDesc}>Marcar subida de alumnos en el micro y ver alertas</span>
              </div>
            </button>

            <button
              type="button"
              className={`${styles.loginModal__roleOption} ${
                role === 'ENCARGADO_RECORRIDO' ? styles['loginModal__roleOption--active'] : ''
              }`}
              onClick={() => setRole('ENCARGADO_RECORRIDO')}
            >
              <div className={styles.loginModal__roleIcon}>
                <ShieldCheck size={18} />
              </div>
              <div className={styles.loginModal__roleText}>
                <span className={styles.loginModal__roleTitle}>Encargado de Recorrido</span>
                <span className={styles.loginModal__roleDesc}>Monitoreo general, cuotas y descarga de planillas</span>
              </div>
            </button>
          </div>
        </div>

        <div className={styles.loginModal__group}>
          <label className={styles.loginModal__label}>Nombre y Apellido</label>
          <input
            type="text"
            className={styles.loginModal__input}
            placeholder="Ej: Carlos Ávalos"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

        <div className={styles.loginModal__group}>
          <label className={styles.loginModal__label}>DNI / Identificación</label>
          <input
            type="text"
            className={styles.loginModal__input}
            placeholder="Ej: 28456123"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            required
          />
        </div>

        <button type="submit" className={styles.loginModal__btnSubmit}>
          <span>Ingresar al Sistema</span>
          <ArrowRight size={18} />
        </button>

        {role === 'PADRE' && (
          <button
            type="button"
            className={styles.loginModal__btnRegister}
            onClick={onGoToRegister}
          >
            ¿Primera vez en el sistema? Regístrate aquí
          </button>
        )}
      </form>
    </div>
  );
};
