import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft, Save } from 'lucide-react';
import styles from './RegistroPersonal.module.css';
import { PersonalStaff } from '../../types';
import { apiService } from '../../services/api';

interface RegistroPersonalProps {
  onSuccess: (staff: PersonalStaff) => void;
  onCancel: () => void;
  defaultRole?: 'ENCARGADA_CONTROL' | 'ENCARGADO_RECORRIDO';
}

export const RegistroPersonal: React.FC<RegistroPersonalProps> = ({
  onSuccess,
  onCancel,
  defaultRole = 'ENCARGADA_CONTROL'
}) => {
  const [nombre, setNombre] = useState('');
  const [dni, setDni] = useState('');
  const [celular, setCelular] = useState('');
  const [rol, setRol] = useState<'ENCARGADA_CONTROL' | 'ENCARGADO_RECORRIDO'>(defaultRole);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !dni.trim() || !celular.trim()) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    const nuevo: PersonalStaff = {
      id: 'staff-' + Date.now(),
      nombre: nombre.trim(),
      dni: dni.trim(),
      celular: celular.trim(),
      rol,
      fechaRegistro: new Date().toISOString().split('T')[0]
    };

    apiService.savePersonal(nuevo);
    onSuccess(nuevo);
  };

  return (
    <div className={styles.regPersonal}>
      <div className={styles.regPersonal__header}>
        <div className={styles.regPersonal__titleGroup}>
          <div className={styles.regPersonal__icon}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className={styles.regPersonal__title}>Alta de Personal de Control</h2>
            <p className={styles.regPersonal__subtitle}>
              Registro de Encargadas y Encargados del Recorrido Tala
            </p>
          </div>
        </div>
        <button type="button" className={styles.regPersonal__btnBack} onClick={onCancel}>
          <ArrowLeft size={14} />
          <span>Volver</span>
        </button>
      </div>

      <form className={styles.regPersonal__form} onSubmit={handleSubmit}>
        {errorMsg && (
          <div style={{ color: 'var(--color-danger)', fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>
            {errorMsg}
          </div>
        )}

        <div className={styles.regPersonal__group}>
          <label className={styles.regPersonal__label}>Función / Puesto *</label>
          <select
            className={styles.regPersonal__select}
            value={rol}
            onChange={(e) => setRol(e.target.value as any)}
          >
            <option value="ENCARGADA_CONTROL">Encargada de Control (Sube al colectivo)</option>
            <option value="ENCARGADO_RECORRIDO">Encargado de Recorrido (Coordinación y gestión)</option>
          </select>
        </div>

        <div className={styles.regPersonal__group}>
          <label className={styles.regPersonal__label}>Nombre y Apellido *</label>
          <input
            type="text"
            className={styles.regPersonal__input}
            placeholder="Ej: Silvia Benítez"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

        <div className={styles.regPersonal__group}>
          <label className={styles.regPersonal__label}>DNI *</label>
          <input
            type="text"
            className={styles.regPersonal__input}
            placeholder="Ej: 29334455"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            required
          />
        </div>

        <div className={styles.regPersonal__group}>
          <label className={styles.regPersonal__label}>Celular / WhatsApp *</label>
          <input
            type="tel"
            className={styles.regPersonal__input}
            placeholder="Ej: +54 9 11 2345-6789"
            value={celular}
            onChange={(e) => setCelular(e.target.value)}
            required
          />
        </div>

        <button type="submit" className={styles.regPersonal__btnSubmit}>
          <Save size={16} />
          <span>Registrar y Dar de Alta</span>
        </button>
      </form>
    </div>
  );
};

