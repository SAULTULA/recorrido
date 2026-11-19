import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  MapPin,
  School,
  User,
  CheckCircle2,
  XCircle,
  Info,
  Calendar,
  Phone
} from 'lucide-react';
import styles from './PanelPadre.module.css';
import {
  Familia,
  HorarioDiarioHijo,
  HORARIOS_SALIDA_BARRIO,
  HORARIOS_SALIDA_CIUDAD
} from '../../types';
import { apiService, getTodayDateStr } from '../../services/api';

interface PanelPadreProps {
  familia: Familia;
  isNightTime: boolean;
}

export const PanelPadre: React.FC<PanelPadreProps> = ({ familia, isNightTime }) => {
  const [selectedHijoId, setSelectedHijoId] = useState<string>(
    familia.hijos[0]?.id || ''
  );
  const [horariosDiarios, setHorariosDiarios] = useState<HorarioDiarioHijo[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const todayStr = getTodayDateStr();

  useEffect(() => {
    const list = apiService.getHorariosDiarios(todayStr);
    setHorariosDiarios(list);
  }, [todayStr]);

  const selectedHijo = familia.hijos.find((h) => h.id === selectedHijoId) || familia.hijos[0];

  const currentHorario: HorarioDiarioHijo = horariosDiarios.find(
    (h) => h.idAlumno === selectedHijo?.id && h.fecha === todayStr
  ) || {
    idAlumno: selectedHijo?.id || '',
    fecha: todayStr,
    horarioBarrio: '06:25',
    horarioCiudad: '12:10',
    usaIda: true,
    usaVuelta: true
  };

  /**
   * Verifica si faltan menos de 30 minutos para un horario determinado
   */
  const isWithinMargin = (timeStr: string): boolean => {
    if (!timeStr || timeStr === 'NO_USA') return false;
    const [h, m] = timeStr.split(':').map(Number);
    const now = new Date();
    const scheduled = new Date();
    scheduled.setHours(h, m, 0, 0);

    const diffMinutes = (scheduled.getTime() - now.getTime()) / (1000 * 60);
    return diffMinutes >= 0 && diffMinutes <= 30;
  };

  const handleSelectBarrio = (horario: string | 'NO_USA') => {
    if (!selectedHijo) return;

    const esCancelacion = horario === 'NO_USA';
    const horarioAnterior = currentHorario.horarioBarrio;

    const updated: HorarioDiarioHijo = {
      ...currentHorario,
      horarioBarrio: horario,
      usaIda: !esCancelacion
    };

    apiService.saveHorarioDiario(updated);
    setHorariosDiarios((prev) =>
      prev.map((item) =>
        item.idAlumno === updated.idAlumno && item.fecha === updated.fecha ? updated : item
      )
    );

    // Emitir aviso/alerta a la encargada si cancela o modifica
    const sobreLaHora = isWithinMargin(horarioAnterior) || (horario !== 'NO_USA' && isWithinMargin(horario));
    const detalleMargen = sobreLaHora ? ' [AVISO URGENTE: Menos de 30 min de margen]' : '';

    if (esCancelacion) {
      apiService.crearAviso({
        fecha: todayStr,
        idAlumno: selectedHijo.id,
        nombreAlumno: selectedHijo.nombre,
        tipo: 'CANCELACION',
        horarioAfectado: `Ida Barrio (${horarioAnterior})`,
        detalle: `El padre informó que ${selectedHijo.nombre} NO utilizará el recorrido de Ida en el Barrio.${detalleMargen}`
      });
      showNotification(`Aviso registrado: ${selectedHijo.nombre} no utilizará el recorrido de ida.${detalleMargen}`);
    } else {
      if (horarioAnterior !== horario) {
        apiService.crearAviso({
          fecha: todayStr,
          idAlumno: selectedHijo.id,
          nombreAlumno: selectedHijo.nombre,
          tipo: 'CAMBIO_HORARIO',
          horarioAfectado: `Ida Barrio: ${horario} hs`,
          detalle: `Cambio de horario de subida en Barrio para ${selectedHijo.nombre} a las ${horario} hs (Anterior: ${horarioAnterior}).${detalleMargen}`
        });
        showNotification(
          `Horario de Ida actualizado a las ${horario} hs para ${selectedHijo.nombre}.${detalleMargen}`
        );
      }
    }
  };

  const handleSelectCiudad = (horario: string | 'NO_USA') => {
    if (!selectedHijo) return;

    const esCancelacion = horario === 'NO_USA';
    const horarioAnterior = currentHorario.horarioCiudad;

    const updated: HorarioDiarioHijo = {
      ...currentHorario,
      horarioCiudad: horario,
      usaVuelta: !esCancelacion
    };

    apiService.saveHorarioDiario(updated);
    setHorariosDiarios((prev) =>
      prev.map((item) =>
        item.idAlumno === updated.idAlumno && item.fecha === updated.fecha ? updated : item
      )
    );

    // Emitir aviso si cancela o modifica
    const sobreLaHora = isWithinMargin(horarioAnterior) || (horario !== 'NO_USA' && isWithinMargin(horario));
    const detalleMargen = sobreLaHora ? ' [AVISO URGENTE: Menos de 30 min de margen]' : '';

    if (esCancelacion) {
      apiService.crearAviso({
        fecha: todayStr,
        idAlumno: selectedHijo.id,
        nombreAlumno: selectedHijo.nombre,
        tipo: 'CANCELACION',
        horarioAfectado: `Vuelta Ciudad (${horarioAnterior})`,
        detalle: `El padre informó que ${selectedHijo.nombre} NO utilizará el recorrido de Vuelta desde la Ciudad (lo retira personalmente).${detalleMargen}`
      });
      showNotification(`Aviso registrado: ${selectedHijo.nombre} no viajará en el recorrido de vuelta.${detalleMargen}`);
    } else {
      if (horarioAnterior !== horario) {
        apiService.crearAviso({
          fecha: todayStr,
          idAlumno: selectedHijo.id,
          nombreAlumno: selectedHijo.nombre,
          tipo: 'CAMBIO_HORARIO',
          horarioAfectado: `Vuelta Ciudad: ${horario} hs`,
          detalle: `Cambio de horario de salida de Ciudad para ${selectedHijo.nombre} a las ${horario} hs (Anterior: ${horarioAnterior}).${detalleMargen}`
        });
        showNotification(
          `Horario de Vuelta actualizado a las ${horario} hs para ${selectedHijo.nombre}.${detalleMargen}`
        );
      }
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  if (!selectedHijo) {
    return <div>No hay hijos cargados en esta familia.</div>;
  }

  return (
    <div className={styles.panelPadre}>
      {/* Banner de las 20:00 hs */}
      {isNightTime && (
        <div className={styles.panelPadre__reminderBanner}>
          <div className={styles.panelPadre__reminderIcon}>
            <Bell size={22} />
          </div>
          <div>
            <div className={styles.panelPadre__reminderTitle}>
              ⏰ Recordatorio de las 20:00 hs - Confirmación de Horarios
            </div>
            <div className={styles.panelPadre__reminderDesc}>
              Por favor, seleccione o confirme los horarios de subida de sus hijos para el día de mañana para que la encargada arme la lista de paradas.
            </div>
          </div>
        </div>
      )}

      {/* Encabezado y Datos de la Familia */}
      <div className={styles.panelPadre__headerCard}>
        <div className={styles.panelPadre__headerTop}>
          <h2 className={styles.panelPadre__familyTitle}>Panel del Padre / Tutor</h2>
          <div className={styles.panelPadre__familyBadges}>
            <span
              className={`${styles.panelPadre__badge} ${styles['panelPadre__badge--primary']}`}
            >
              <User size={13} />
              <span>{familia.nombreTutor} ({familia.jerarquia})</span>
            </span>
            <span
              className={`${styles.panelPadre__badge} ${styles['panelPadre__badge--accent']}`}
            >
              <MapPin size={13} />
              <span>Parada Fija: {familia.paradaFija}</span>
            </span>
            <span
              className={`${styles.panelPadre__badge} ${styles['panelPadre__badge--primary']}`}
            >
              <Phone size={13} />
              <span>{familia.celular}</span>
            </span>
          </div>
        </div>

        {/* Pestañas de Selección de Hijos si tiene más de uno */}
        <div>
          <div className={styles.panelPadre__childrenTabs}>
            {familia.hijos.map((hijo) => (
              <button
                key={hijo.id}
                type="button"
                className={`${styles.panelPadre__childTab} ${
                  hijo.id === selectedHijoId ? styles['panelPadre__childTab--active'] : ''
                }`}
                onClick={() => setSelectedHijoId(hijo.id)}
              >
                <User size={16} />
                <span>{hijo.nombre}</span>
              </button>
            ))}
          </div>

          <div className={styles.panelPadre__childDetails}>
            <div className={styles.panelPadre__childDetailItem}>
              <School size={16} />
              <span>Establecimiento: <strong>{selectedHijo.escuela}</strong></span>
            </div>
            {selectedHijo.grado && (
              <div className={styles.panelPadre__childDetailItem}>
                <span>Grado/Año: <strong>{selectedHijo.grado}</strong></span>
              </div>
            )}
            {selectedHijo.turno && (
              <div className={styles.panelPadre__childDetailItem}>
                <span>Turno habitual: <strong>{selectedHijo.turno}</strong></span>
              </div>
            )}
            <div className={styles.panelPadre__childDetailItem}>
              <Calendar size={16} />
              <span>Día actual: <strong>{todayStr}</strong></span>
            </div>
          </div>
        </div>

        <div className={styles.panelPadre__marginNotice}>
          <Info size={16} />
          <span>
            <strong>Margen de aviso:</strong> Toda modificación o aviso de retiro/suspensión debe realizarse con al menos <strong>media hora (30 min) de anticipación</strong> al horario establecido para alertar a la encargada del colectivo.
          </span>
        </div>
      </div>

      {notification && (
        <div className={styles.panelPadre__statusCard}>
          <div className={styles.panelPadre__statusIcon}>
            <CheckCircle2 size={20} />
          </div>
          <div className={styles.panelPadre__statusInfo}>
            <span className={styles.panelPadre__statusTitle}>Guardado en tiempo real</span>
            <span className={styles.panelPadre__statusDesc}>{notification}</span>
          </div>
        </div>
      )}

      {/* Grilla de Botoneras de Horarios */}
      <div className={styles.panelPadre__routesGrid}>
        {/* Botonera 1: Salida desde el Barrio (Ida) */}
        <div className={styles.panelPadre__routeCard}>
          <div className={styles.panelPadre__routeHeader}>
            <div className={styles.panelPadre__routeTitleGroup}>
              <Clock size={20} color="var(--color-primary)" />
              <h3 className={styles.panelPadre__routeTitle}>Salida desde el Barrio (Ida)</h3>
            </div>
            <span
              className={`${styles.panelPadre__routeBadge} ${
                currentHorario.usaIda
                  ? styles['panelPadre__routeBadge--active']
                  : styles['panelPadre__routeBadge--none']
              }`}
            >
              {currentHorario.usaIda
                ? `Programado: ${currentHorario.horarioBarrio} hs`
                : 'No viaja (Ida)'}
            </span>
          </div>

          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-light)' }}>
            Selecciona el horario en que {selectedHijo.nombre} subirá en su parada fija ({familia.paradaFija}):
          </p>

          <div className={styles.panelPadre__buttonGrid}>
            {HORARIOS_SALIDA_BARRIO.map((h) => {
              const isSelected = currentHorario.usaIda && currentHorario.horarioBarrio === h;
              return (
                <button
                  key={h}
                  type="button"
                  className={`${styles.panelPadre__timeBtn} ${
                    isSelected ? styles['panelPadre__timeBtn--selected'] : ''
                  }`}
                  onClick={() => handleSelectBarrio(h)}
                >
                  <span style={{ fontSize: 'var(--font-size-md)' }}>⏺️ {h}</span>
                  <span style={{ fontSize: 'var(--font-size-xs)', opacity: 0.85 }}>hs</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className={`${styles.panelPadre__noTravelBtn} ${
              !currentHorario.usaIda ? styles['panelPadre__noTravelBtn--selected'] : ''
            }`}
            onClick={() => handleSelectBarrio('NO_USA')}
          >
            <XCircle size={16} />
            <span>🚫 No usa recorrido (Ida / Se retira antes)</span>
          </button>
        </div>

        {/* Botonera 2: Salida de la Ciudad (Vuelta) */}
        <div className={styles.panelPadre__routeCard}>
          <div className={styles.panelPadre__routeHeader}>
            <div className={styles.panelPadre__routeTitleGroup}>
              <Clock size={20} color="var(--color-secondary)" />
              <h3 className={styles.panelPadre__routeTitle}>Salida de la Ciudad (Vuelta)</h3>
            </div>
            <span
              className={`${styles.panelPadre__routeBadge} ${
                currentHorario.usaVuelta
                  ? styles['panelPadre__routeBadge--active']
                  : styles['panelPadre__routeBadge--none']
              }`}
            >
              {currentHorario.usaVuelta
                ? `Programado: ${currentHorario.horarioCiudad} hs`
                : 'No viaja (Vuelta)'}
            </span>
          </div>

          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-light)' }}>
            Selecciona el horario en que el transporte recoge a {selectedHijo.nombre} a la salida de su escuela:
          </p>

          <div className={styles.panelPadre__buttonGrid}>
            {HORARIOS_SALIDA_CIUDAD.map((h) => {
              const isSelected = currentHorario.usaVuelta && currentHorario.horarioCiudad === h;
              return (
                <button
                  key={h}
                  type="button"
                  className={`${styles.panelPadre__timeBtn} ${
                    isSelected ? styles['panelPadre__timeBtn--selected'] : ''
                  }`}
                  onClick={() => handleSelectCiudad(h)}
                >
                  <span style={{ fontSize: 'var(--font-size-md)' }}>⏺️ {h}</span>
                  <span style={{ fontSize: 'var(--font-size-xs)', opacity: 0.85 }}>hs</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className={`${styles.panelPadre__noTravelBtn} ${
              !currentHorario.usaVuelta ? styles['panelPadre__noTravelBtn--selected'] : ''
            }`}
            onClick={() => handleSelectCiudad('NO_USA')}
          >
            <XCircle size={16} />
            <span>🚫 No usa recorrido (Vuelta / Lo retira padre)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
