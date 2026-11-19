import React, { useState } from 'react';
import { UserCheck, Plus, Trash2, ArrowLeft, Save, MapPin, School, Home } from 'lucide-react';
import styles from './RegistroPadre.module.css';
import {
  Familia,
  Hijo,
  Jerarquia,
  PARADAS_SUBOFICIALES,
  PARADAS_OFICIALES
} from '../../types';
import { apiService } from '../../services/api';

interface RegistroPadreProps {
  initialDni?: string;
  initialNombre?: string;
  onSuccess: (familia: Familia) => void;
  onCancel: () => void;
}

export const RegistroPadre: React.FC<RegistroPadreProps> = ({
  initialDni = '',
  initialNombre = '',
  onSuccess,
  onCancel
}) => {
  const [nombreTutor, setNombreTutor] = useState(initialNombre);
  const [dni, setDni] = useState(initialDni);
  const [jerarquia, setJerarquia] = useState<Jerarquia>('Suboficial');
  const [celular, setCelular] = useState('');
  const [numeroCasa, setNumeroCasa] = useState('');
  const [paradaFija, setParadaFija] = useState(PARADAS_SUBOFICIALES[0].nombre);

  const [hijos, setHijos] = useState<Omit<Hijo, 'id' | 'idFamilia'>[]>([
    {
      nombre: '',
      escuela: '',
      grado: '',
      turno: 'Mañana'
    }
  ]);

  const [errorMsg, setErrorMsg] = useState('');

  // Actualizar parada predeterminada cuando cambia la jerarquía
  const handleJerarquiaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevaJerarquia = e.target.value as Jerarquia;
    setJerarquia(nuevaJerarquia);
    if (nuevaJerarquia === 'Suboficial') {
      setParadaFija(PARADAS_SUBOFICIALES[0].nombre);
    } else {
      setParadaFija(PARADAS_OFICIALES[0].nombre);
    }
  };

  const handleAddHijo = () => {
    setHijos((prev) => [
      ...prev,
      {
        nombre: '',
        escuela: '',
        grado: '',
        turno: 'Mañana'
      }
    ]);
  };

  const handleRemoveHijo = (index: number) => {
    if (hijos.length <= 1) {
      alert('Debe cargar al menos un niño para registrarse.');
      return;
    }
    setHijos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleHijoChange = (
    index: number,
    field: keyof Omit<Hijo, 'id' | 'idFamilia'>,
    value: string
  ) => {
    setHijos((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombreTutor.trim() || !dni.trim()) {
      setErrorMsg('Nombre del responsable y DNI son obligatorios.');
      return;
    }

    if (!celular.trim()) {
      setErrorMsg('El número de celular es obligatorio para el contacto del recorrido.');
      return;
    }

    // Validar que cada hijo tenga nombre y escuela
    for (let i = 0; i < hijos.length; i++) {
      if (!hijos[i].nombre.trim() || !hijos[i].escuela.trim()) {
        setErrorMsg(`Por favor completa el Nombre y la Escuela para el hijo N° ${i + 1}.`);
        return;
      }
    }

    const idFamilia = 'fam-' + Date.now();
    const hijosCompletos: Hijo[] = hijos.map((h, i) => ({
      id: `alu-${Date.now()}-${i}`,
      idFamilia: idFamilia,
      nombre: h.nombre.trim(),
      escuela: h.escuela.trim(),
      grado: h.grado?.trim(),
      turno: h.turno
    }));

    const nuevaFamilia: Familia = {
      id: idFamilia,
      nombreTutor: nombreTutor.trim(),
      dni: dni.trim(),
      jerarquia,
      celular: celular.trim(),
      numeroCasa: numeroCasa.trim(),
      paradaFija,
      fechaRegistro: new Date().toISOString().split('T')[0],
      hijos: hijosCompletos
    };

    apiService.saveFamilia(nuevaFamilia);
    onSuccess(nuevaFamilia);
  };

  const paradasDisponibles =
    jerarquia === 'Suboficial' ? PARADAS_SUBOFICIALES : PARADAS_OFICIALES;

  return (
    <div className={styles.registro}>
      <div className={styles.registro__header}>
        <div className={styles.registro__titleGroup}>
          <div className={styles.registro__icon}>
            <UserCheck size={24} />
          </div>
          <div>
            <h2 className={styles.registro__title}>Registro de Familia y Alumnos</h2>
            <p className={styles.registro__subtitle}>
              Carga tus datos y los de tus hijos para el Recorrido Escolar
            </p>
          </div>
        </div>
        <button type="button" className={styles.registro__btnBack} onClick={onCancel}>
          <ArrowLeft size={14} />
          <span>Volver</span>
        </button>
      </div>

      <form className={styles.registro__form} onSubmit={handleSubmit}>
        {errorMsg && (
          <div style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
            {errorMsg}
          </div>
        )}

        {/* Sección: Datos del Responsable */}
        <div className={styles.registro__section}>
          <h3 className={styles.registro__sectionTitle}>
            <Home size={18} />
            <span>Datos del Responsable (Padre / Madre / Tutor)</span>
          </h3>

          <div className={styles.registro__grid}>
            <div className={styles.registro__group}>
              <label className={styles.registro__label}>
                Nombre y Apellido <span className={styles.registro__required}>*</span>
              </label>
              <input
                type="text"
                className={styles.registro__input}
                placeholder="Ej: Carlos Ávalos"
                value={nombreTutor}
                onChange={(e) => setNombreTutor(e.target.value)}
                required
              />
            </div>

            <div className={styles.registro__group}>
              <label className={styles.registro__label}>
                DNI <span className={styles.registro__required}>*</span>
              </label>
              <input
                type="text"
                className={styles.registro__input}
                placeholder="Ej: 28456123"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                required
              />
            </div>

            <div className={styles.registro__group}>
              <label className={styles.registro__label}>
                Jerarquía <span className={styles.registro__required}>*</span>
              </label>
              <select
                className={styles.registro__select}
                value={jerarquia}
                onChange={handleJerarquiaChange}
              >
                <option value="Suboficial">Suboficial (Barrio Suboficiales)</option>
                <option value="Oficial">Oficial (Barrio Oficiales)</option>
              </select>
            </div>

            <div className={styles.registro__group}>
              <label className={styles.registro__label}>
                Celular / WhatsApp <span className={styles.registro__required}>*</span>
              </label>
              <input
                type="tel"
                className={styles.registro__input}
                placeholder="Ej: +54 9 11 4512-8899"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
                required
              />
            </div>

            <div className={styles.registro__group}>
              <label className={styles.registro__label}>Número de Casa / Domicilio</label>
              <input
                type="text"
                className={styles.registro__input}
                placeholder="Ej: Casa 14 - Manzana B"
                value={numeroCasa}
                onChange={(e) => setNumeroCasa(e.target.value)}
              />
            </div>

            <div className={styles.registro__group}>
              <label className={styles.registro__label}>
                <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
                Parada Fija Asignada <span className={styles.registro__required}>*</span>
              </label>
              <select
                className={styles.registro__select}
                value={paradaFija}
                onChange={(e) => setParadaFija(e.target.value)}
              >
                {paradasDisponibles.map((p) => (
                  <option key={p.id} value={p.nombre}>
                    {p.nombre} ({p.barrio})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sección: Datos de los Niños */}
        <div className={styles.registro__section}>
          <h3 className={styles.registro__sectionTitle}>
            <School size={18} />
            <span>Hijos / Niños a Cargo (Cargar 1 o más)</span>
          </h3>

          <div className={styles.registro__hijosList}>
            {hijos.map((hijo, idx) => (
              <div key={idx} className={styles.registro__hijoCard}>
                <div className={styles.registro__hijoHeader}>
                  <span className={styles.registro__hijoBadge}>Hijo/a #{idx + 1}</span>
                  {hijos.length > 1 && (
                    <button
                      type="button"
                      className={styles.registro__btnRemoveHijo}
                      onClick={() => handleRemoveHijo(idx)}
                    >
                      <Trash2 size={14} />
                      <span>Quitar este niño</span>
                    </button>
                  )}
                </div>

                <div className={styles.registro__grid}>
                  <div className={styles.registro__group}>
                    <label className={styles.registro__label}>
                      Nombre Completo del Niño <span className={styles.registro__required}>*</span>
                    </label>
                    <input
                      type="text"
                      className={styles.registro__input}
                      placeholder="Ej: Mateo Ávalos"
                      value={hijo.nombre}
                      onChange={(e) => handleHijoChange(idx, 'nombre', e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.registro__group}>
                    <label className={styles.registro__label}>
                      Establecimiento Escolar <span className={styles.registro__required}>*</span>
                    </label>
                    <input
                      type="text"
                      className={styles.registro__input}
                      placeholder="Ej: Escuela Normal N° 1"
                      value={hijo.escuela}
                      onChange={(e) => handleHijoChange(idx, 'escuela', e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.registro__group}>
                    <label className={styles.registro__label}>Grado / Año</label>
                    <input
                      type="text"
                      className={styles.registro__input}
                      placeholder="Ej: 4to Grado A"
                      value={hijo.grado}
                      onChange={(e) => handleHijoChange(idx, 'grado', e.target.value)}
                    />
                  </div>

                  <div className={styles.registro__group}>
                    <label className={styles.registro__label}>Turno</label>
                    <select
                      className={styles.registro__select}
                      value={hijo.turno}
                      onChange={(e) => handleHijoChange(idx, 'turno', e.target.value)}
                    >
                      <option value="Mañana">Turno Mañana</option>
                      <option value="Tarde">Turno Tarde</option>
                      <option value="Doble">Jornada Completa / Doble Turno</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              className={styles.registro__btnAddHijo}
              onClick={handleAddHijo}
            >
              <Plus size={16} />
              <span>+ Agregar otro hijo/a</span>
            </button>
          </div>
        </div>

        <div className={styles.registro__footer}>
          <button type="submit" className={styles.registro__btnSubmit}>
            <Save size={18} />
            <span>Completar Registro y Continuar</span>
          </button>
        </div>
      </form>
    </div>
  );
};
