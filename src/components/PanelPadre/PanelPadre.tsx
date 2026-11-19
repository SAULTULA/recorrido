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
  Phone,
  Send,
  Bus
} from 'lucide-react';
import styles from './PanelPadre.module.css';
import {
  Familia,
  HorarioDiarioHijo,
  CheckInSubida,
  HORARIOS_SALIDA_BARRIO,
  HORARIOS_SALIDA_CIUDAD
} from '../../types';
import {
  apiService,
  getTodayDateStr,
  getTomorrowDateStr,
  isTimeLockedForToday
} from '../../services/api';

interface PanelPadreProps {
  familia: Familia;
  isNightTime: boolean;
}

export const PanelPadre: React.FC<PanelPadreProps> = ({ familia, isNightTime }) => {
  const [selectedHijoId, setSelectedHijoId] = useState<string>(
    familia.hijos[0]?.id || ''
  );
  const [horariosDiarios, setHorariosDiarios] = useState<HorarioDiarioHijo[]>([]);
  const [checkins, setCheckins] = useState<CheckInSubida[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const todayStr = getTodayDateStr();
  const tomorrowStr = getTomorrowDateStr();
  const [targetDate, setTargetDate] = useState<string>(todayStr);

  // Estados temporales de selección para la botonera
  const [draftBarrio, setDraftBarrio] = useState<string | 'NO_USA'>('06:25');
  const [draftCiudad, setDraftCiudad] = useState<string | 'NO_USA'>('12:10');
  const [isSaving, setIsSaving] = useState(false);

  const isTimeSlotLocked = (timeStr: string): boolean => {
    if (targetDate !== todayStr) return false;
    return isTimeLockedForToday(timeStr);
  };

  const loadData = () => {
    const list = apiService.getHorariosDiarios(targetDate);
    setHorariosDiarios(list);
    setCheckins(apiService.getCheckIns(todayStr));
  };

  useEffect(() => {
    loadData();
    // Auto-polling cada 5 segundos para ver en tiempo real si el/la auxiliar marcó la subida o bajada
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [targetDate, todayStr]);

  const selectedHijo = familia.hijos.find((h) => h.id === selectedHijoId) || familia.hijos[0];

  const cleanChildName = (selectedHijo?.nombre || '').trim().toLowerCase();

  const currentHorario: HorarioDiarioHijo | undefined =
    horariosDiarios.find(
      (h: any) =>
        (h.idAlumno === selectedHijo?.id ||
          (cleanChildName && h.nombreAlumno && String(h.nombreAlumno).trim().toLowerCase() === cleanChildName)) &&
        h.fecha === targetDate
    ) ||
    (targetDate === todayStr
      ? apiService.getUltimoHorarioConfirmado(selectedHijo?.id || '', selectedHijo?.nombre)
      : undefined);

  // Sincronizar selección borrador cuando cambia el hijo seleccionado o cuando carga el horario
  useEffect(() => {
    if (currentHorario) {
      setDraftBarrio(currentHorario.usaIda ? currentHorario.horarioBarrio : 'NO_USA');
      setDraftCiudad(currentHorario.usaVuelta ? currentHorario.horarioCiudad : 'NO_USA');
    } else {
      // Si estamos en hoy, buscar el primer horario disponible que no esté bloqueado
      const firstBarrio = HORARIOS_SALIDA_BARRIO.find((h) => !isTimeSlotLocked(h)) || 'NO_USA';
      const firstCiudad = HORARIOS_SALIDA_CIUDAD.find((h) => !isTimeSlotLocked(h)) || 'NO_USA';
      setDraftBarrio(firstBarrio);
      setDraftCiudad(firstCiudad);
    }
  }, [selectedHijoId, currentHorario, targetDate]);

  // Buscar si el/la auxiliar ya marcó el check-in (subida) de este niño hoy
  const checkinIda = checkins.find(
    (c: any) =>
      (c.idAlumno === selectedHijo?.id ||
        (cleanChildName && c.nombreAlumno && String(c.nombreAlumno).trim().toLowerCase() === cleanChildName)) &&
      c.sentido === 'SALIDA_BARRIO' &&
      c.fecha === todayStr
  );

  const checkinVuelta = checkins.find(
    (c: any) =>
      (c.idAlumno === selectedHijo?.id ||
        (cleanChildName && c.nombreAlumno && String(c.nombreAlumno).trim().toLowerCase() === cleanChildName)) &&
      c.sentido === 'SALIDA_CIUDAD' &&
      c.fecha === todayStr
  );

  const isBajoIda = checkinIda?.estado === 'BAJO' || !!checkinIda?.horaBajada;
  const isBajoVuelta = checkinVuelta?.estado === 'BAJO' || !!checkinVuelta?.horaBajada;

  /**
   * Botón para Subir y Confirmar los Horarios del Niño
   */
  const handleConfirmHorarios = () => {
    if (!selectedHijo) return;

    // Validación estricta de 30 minutos de anticipación para el día de hoy
    if (targetDate === todayStr) {
      if (draftBarrio !== 'NO_USA' && isTimeLockedForToday(draftBarrio)) {
        alert(
          `⚠️ No se puede cargar el horario de salida del barrio (${draftBarrio} hs) porque faltan menos de 30 minutos o ya pasó.\nPor favor seleccione un horario con al menos 30 minutos de anticipación o marque 'No usa recorrido'.`
        );
        return;
      }
      if (draftCiudad !== 'NO_USA' && isTimeLockedForToday(draftCiudad)) {
        alert(
          `⚠️ No se puede cargar el horario de salida de ciudad (${draftCiudad} hs) porque faltan menos de 30 minutos o ya pasó.\nPor favor seleccione un horario con al menos 30 minutos de anticipación o marque 'No usa recorrido'.`
        );
        return;
      }
    }

    setIsSaving(true);

    const esCancelacionIda = draftBarrio === 'NO_USA';
    const esCancelacionVuelta = draftCiudad === 'NO_USA';

    const updated: HorarioDiarioHijo = {
      idAlumno: selectedHijo.id,
      nombreAlumno: selectedHijo.nombre,
      parada: familia.paradaFija,
      fecha: targetDate,
      horarioBarrio: draftBarrio,
      horarioCiudad: draftCiudad,
      usaIda: !esCancelacionIda,
      usaVuelta: !esCancelacionVuelta,
      ultimaModificacion: new Date().toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    apiService.saveHorarioDiario(updated);

    setHorariosDiarios((prev) => {
      const idx = prev.findIndex((h) => h.idAlumno === updated.idAlumno && h.fecha === updated.fecha);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [...prev, updated];
    });

    if (esCancelacionIda || esCancelacionVuelta) {
      apiService.crearAviso({
        fecha: targetDate,
        idAlumno: selectedHijo.id,
        nombreAlumno: selectedHijo.nombre,
        tipo: 'CANCELACION',
        horarioAfectado: `Ida: ${draftBarrio} | Vuelta: ${draftCiudad}`,
        detalle: `El tutor confirmó cancelación de recorrido para ${selectedHijo.nombre} (${targetDate}): ${
          esCancelacionIda ? 'No usa Ida. ' : ''
        }${esCancelacionVuelta ? 'No usa Vuelta.' : ''}`
      });
    }

    setIsSaving(false);
    showNotification(
      `¡Horarios de ${selectedHijo.nombre} para el día ${targetDate} subidos y confirmados con éxito!`
    );
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
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
              Por favor seleccione los horarios de sus hijos y presione <strong>"Subir y Confirmar Horarios"</strong> para que el/la auxiliar arme el recorrido del micro.
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
            <div className={styles.panelPadre__childDetailItem}>
              <Calendar size={16} />
              <span>Fecha a Configurar: <strong>{targetDate}</strong></span>
            </div>
          </div>

          {/* Selector de Día: Hoy vs Mañana */}
          <div className={styles.panelPadre__dateSelector}>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--color-text-main)' }}>
              Cargar horarios para:
            </span>
            <button
              type="button"
              className={`${styles.panelPadre__dateBtn} ${
                targetDate === todayStr ? styles['panelPadre__dateBtn--active'] : ''
              }`}
              onClick={() => setTargetDate(todayStr)}
            >
              <Calendar size={14} />
              <span>Hoy ({todayStr})</span>
            </button>
            <button
              type="button"
              className={`${styles.panelPadre__dateBtn} ${
                targetDate === tomorrowStr ? styles['panelPadre__dateBtn--active'] : ''
              }`}
              onClick={() => setTargetDate(tomorrowStr)}
            >
              <Calendar size={14} />
              <span>Mañana ({tomorrowStr})</span>
            </button>
          </div>
        </div>

        <div className={styles.panelPadre__marginNotice}>
          <Info size={16} />
          <span>
            <strong>Margen estricto de anticipación:</strong> Para el día de <strong>HOY</strong>, el sistema bloquea automáticamente cualquier horario que ya pasó o que tenga menos de <strong>30 minutos de anticipación</strong> (a partir de 29 minutos antes ya no es posible reservarlo). Si desea cargar para el día siguiente, seleccione <em>Mañana</em> arriba.
          </span>
        </div>
      </div>

      {/* ====================================================================
          TARJETA 1: HORARIOS VIGENTES EN PANTALLA (CONFIRMADOS)
         ==================================================================== */}
      <div className={styles.panelPadre__currentActiveCard}>
        <div className={styles.panelPadre__currentActiveHeader}>
          <div className={styles.panelPadre__currentActiveTitle}>
            <Clock size={20} />
            <span>Horarios Vigentes Confirmados de {selectedHijo.nombre} ({targetDate})</span>
          </div>
          {currentHorario?.ultimaModificacion && (
            <span style={{ fontSize: 'var(--font-size-xs)', opacity: 0.85 }}>
              Confirmado a las: {currentHorario.ultimaModificacion} hs
            </span>
          )}
        </div>

        <div className={styles.panelPadre__currentActiveGrid}>
          <div className={styles.panelPadre__currentActiveItem}>
            <span className={styles.panelPadre__currentActiveLabel}>☀️ Salida del Barrio (Ida)</span>
            <span className={styles.panelPadre__currentActiveValue}>
              {currentHorario
                ? currentHorario.usaIda
                  ? `${currentHorario.horarioBarrio} hs`
                  : '🚫 No usa recorrido (Ida)'
                : 'Pendiente de confirmación'}
            </span>
            <span style={{ fontSize: '11px', opacity: 0.85 }}>
              Parada: {familia.paradaFija}
            </span>
          </div>

          <div className={styles.panelPadre__currentActiveItem}>
            <span className={styles.panelPadre__currentActiveLabel}>🌙 Salida de Ciudad (Vuelta)</span>
            <span className={styles.panelPadre__currentActiveValue}>
              {currentHorario
                ? currentHorario.usaVuelta
                  ? `${currentHorario.horarioCiudad} hs`
                  : '🚫 No usa recorrido (Vuelta)'
                : 'Pendiente de confirmación'}
            </span>
            <span style={{ fontSize: '11px', opacity: 0.85 }}>
              Desde: {selectedHijo.escuela}
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          TARJETA 2: ESTADO EN TIEMPO REAL: ¿SUBIÓ AL COLECTIVO? ¿BAJÓ?
         ==================================================================== */}
      <div className={styles.panelPadre__liveStatusContainer}>
        {/* Estado Ida */}
        <div
          className={`${styles.panelPadre__liveStatusCard} ${
            isBajoIda
              ? styles['panelPadre__liveStatusCard--descended']
              : checkinIda
              ? styles['panelPadre__liveStatusCard--boarded']
              : currentHorario?.usaIda === false
              ? styles['panelPadre__liveStatusCard--none']
              : styles['panelPadre__liveStatusCard--waiting']
          }`}
        >
          <div className={styles.panelPadre__liveStatusIcon}>
            {isBajoIda ? (
              <CheckCircle2 size={22} />
            ) : checkinIda ? (
              <Bus size={22} />
            ) : currentHorario?.usaIda === false ? (
              <XCircle size={22} />
            ) : (
              <Clock size={22} />
            )}
          </div>
          <div className={styles.panelPadre__liveStatusText}>
            <span className={styles.panelPadre__liveStatusTitle}>
              {isBajoIda
                ? `🏫 ✅ ¡${selectedHijo.nombre} YA BAJÓ DEL COLECTIVO Y LLEGÓ A LA ESCUELA (IDA)!`
                : checkinIda
                ? `🚌 ✅ ¡${selectedHijo.nombre} SE ENCUENTRA A BORDO DEL COLECTIVO (IDA)!`
                : currentHorario?.usaIda === false
                ? '🚫 No utiliza recorrido de Ida hoy'
                : `⏳ Esperando micro de Ida (${currentHorario?.horarioBarrio || draftBarrio} hs)`}
            </span>
            <span className={styles.panelPadre__liveStatusDesc}>
              {isBajoIda
                ? `Descendió a las ${checkinIda?.horaBajada} hs en ${selectedHijo.escuela}. Controlado por ${checkinIda?.responsableControl}.`
                : checkinIda
                ? `Registrado a las ${checkinIda.horaMarcado} hs por ${checkinIda.responsableControl} en ${checkinIda.parada}. Se encuentra en viaje a bordo.`
                : currentHorario?.usaIda === false
                ? 'Aviso de retiro particular registrado.'
                : 'El/la auxiliar marcará su subida cuando suba al colectivo en su parada.'}
            </span>
          </div>
        </div>

        {/* Estado Vuelta */}
        <div
          className={`${styles.panelPadre__liveStatusCard} ${
            isBajoVuelta
              ? styles['panelPadre__liveStatusCard--descended']
              : checkinVuelta
              ? styles['panelPadre__liveStatusCard--boarded']
              : currentHorario?.usaVuelta === false
              ? styles['panelPadre__liveStatusCard--none']
              : styles['panelPadre__liveStatusCard--waiting']
          }`}
        >
          <div className={styles.panelPadre__liveStatusIcon}>
            {isBajoVuelta ? (
              <CheckCircle2 size={22} />
            ) : checkinVuelta ? (
              <Bus size={22} />
            ) : currentHorario?.usaVuelta === false ? (
              <XCircle size={22} />
            ) : (
              <Clock size={22} />
            )}
          </div>
          <div className={styles.panelPadre__liveStatusText}>
            <span className={styles.panelPadre__liveStatusTitle}>
              {isBajoVuelta
                ? `🏠 ✅ ¡${selectedHijo.nombre} YA BAJÓ DEL COLECTIVO EN SU PARADA (VUELTA)!`
                : checkinVuelta
                ? `🚌 ✅ ¡${selectedHijo.nombre} SE ENCUENTRA A BORDO DEL COLECTIVO (VUELTA)!`
                : currentHorario?.usaVuelta === false
                ? '🚫 No utiliza recorrido de Vuelta hoy'
                : `⏳ Pendiente de subida de Vuelta (${currentHorario?.horarioCiudad || draftCiudad} hs)`}
            </span>
            <span className={styles.panelPadre__liveStatusDesc}>
              {isBajoVuelta
                ? `Descendió a las ${checkinVuelta?.horaBajada} hs en ${familia.paradaFija}. Llegó a destino.`
                : checkinVuelta
                ? `Registrado a las ${checkinVuelta.horaMarcado} hs. En viaje de regreso hacia el barrio con ${checkinVuelta.responsableControl}.`
                : currentHorario?.usaVuelta === false
                ? 'El alumno es retirado por su tutor a la salida.'
                : 'Se marcará cuando el micro lo recoja en la salida de la escuela.'}
            </span>
          </div>
        </div>
      </div>

      {notification && (
        <div className={styles.panelPadre__statusCard}>
          <div className={styles.panelPadre__statusIcon}>
            <CheckCircle2 size={20} />
          </div>
          <div className={styles.panelPadre__statusInfo}>
            <span className={styles.panelPadre__statusTitle}>Información Actualizada</span>
            <span className={styles.panelPadre__statusDesc}>{notification}</span>
          </div>
        </div>
      )}

      {/* ====================================================================
          TARJETA 3: BOTONERAS DE SELECCIÓN DE HORARIOS
         ==================================================================== */}
      <div className={styles.panelPadre__routesGrid}>
        {/* Botonera 1: Salida desde el Barrio (Ida) */}
        <div className={styles.panelPadre__routeCard}>
          <div className={styles.panelPadre__routeHeader}>
            <div className={styles.panelPadre__routeTitleGroup}>
              <Clock size={20} color="var(--color-primary)" />
              <h3 className={styles.panelPadre__routeTitle}>Botonera: Salida del Barrio (Ida)</h3>
            </div>
            <span
              className={`${styles.panelPadre__routeBadge} ${
                draftBarrio !== 'NO_USA'
                  ? styles['panelPadre__routeBadge--active']
                  : styles['panelPadre__routeBadge--none']
              }`}
            >
              {draftBarrio !== 'NO_USA' ? `Elegido: ${draftBarrio} hs` : 'No viaja (Ida)'}
            </span>
          </div>

          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-light)' }}>
            Toca el horario en que {selectedHijo.nombre} subirá en su parada fija ({familia.paradaFija}):
          </p>

          <div className={styles.panelPadre__buttonGrid}>
            {HORARIOS_SALIDA_BARRIO.map((h) => {
              const isSelected = draftBarrio === h;
              const isLocked = isTimeSlotLocked(h);
              return (
                <button
                  key={h}
                  type="button"
                  disabled={isLocked}
                  className={`${styles.panelPadre__timeBtn} ${
                    isSelected ? styles['panelPadre__timeBtn--selected'] : ''
                  } ${isLocked ? styles['panelPadre__timeBtn--locked'] : ''}`}
                  onClick={() => !isLocked && setDraftBarrio(h)}
                  title={
                    isLocked
                      ? 'Horario bloqueado: debe reservarse con al menos 30 min de anticipación'
                      : `Seleccionar ${h} hs`
                  }
                >
                  <span style={{ fontSize: 'var(--font-size-md)' }}>
                    {isLocked ? '🔒' : '⏺️'} {h}
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', opacity: 0.85 }}>
                    {isLocked ? 'Cerrado' : 'hs'}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className={`${styles.panelPadre__noTravelBtn} ${
              draftBarrio === 'NO_USA' ? styles['panelPadre__noTravelBtn--selected'] : ''
            }`}
            onClick={() => setDraftBarrio('NO_USA')}
          >
            <XCircle size={16} />
            <span>🚫 No usa recorrido de Ida (Lo llevo particular)</span>
          </button>
        </div>

        {/* Botonera 2: Salida de la Ciudad (Vuelta) */}
        <div className={styles.panelPadre__routeCard}>
          <div className={styles.panelPadre__routeHeader}>
            <div className={styles.panelPadre__routeTitleGroup}>
              <Clock size={20} color="var(--color-secondary)" />
              <h3 className={styles.panelPadre__routeTitle}>Botonera: Salida de Ciudad (Vuelta)</h3>
            </div>
            <span
              className={`${styles.panelPadre__routeBadge} ${
                draftCiudad !== 'NO_USA'
                  ? styles['panelPadre__routeBadge--active']
                  : styles['panelPadre__routeBadge--none']
              }`}
            >
              {draftCiudad !== 'NO_USA' ? `Elegido: ${draftCiudad} hs` : 'No viaja (Vuelta)'}
            </span>
          </div>

          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-light)' }}>
            Toca el horario en que el transporte retira a {selectedHijo.nombre} de su escuela:
          </p>

          <div className={styles.panelPadre__buttonGrid}>
            {HORARIOS_SALIDA_CIUDAD.map((h) => {
              const isSelected = draftCiudad === h;
              const isLocked = isTimeSlotLocked(h);
              return (
                <button
                  key={h}
                  type="button"
                  disabled={isLocked}
                  className={`${styles.panelPadre__timeBtn} ${
                    isSelected ? styles['panelPadre__timeBtn--selected'] : ''
                  } ${isLocked ? styles['panelPadre__timeBtn--locked'] : ''}`}
                  onClick={() => !isLocked && setDraftCiudad(h)}
                  title={
                    isLocked
                      ? 'Horario bloqueado: debe reservarse con al menos 30 min de anticipación'
                      : `Seleccionar ${h} hs`
                  }
                >
                  <span style={{ fontSize: 'var(--font-size-md)' }}>
                    {isLocked ? '🔒' : '⏺️'} {h}
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', opacity: 0.85 }}>
                    {isLocked ? 'Cerrado' : 'hs'}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className={`${styles.panelPadre__noTravelBtn} ${
              draftCiudad === 'NO_USA' ? styles['panelPadre__noTravelBtn--selected'] : ''
            }`}
            onClick={() => setDraftCiudad('NO_USA')}
          >
            <XCircle size={16} />
            <span>🚫 No usa recorrido de Vuelta (Lo retiro yo)</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          BOTÓN GRANDE: SUBIR Y CONFIRMAR HORARIOS DEL HIJO
         ==================================================================== */}
      <div className={styles.panelPadre__submitBox}>
        <button
          type="button"
          className={styles.panelPadre__btnSubmitHorario}
          onClick={handleConfirmHorarios}
          disabled={isSaving}
        >
          <Send size={20} />
          <span>
            {isSaving
              ? 'Guardando en el sistema...'
              : `SUBIR Y CONFIRMAR HORARIOS DE ${selectedHijo.nombre.toUpperCase()} (${targetDate})`}
          </span>
        </button>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          Al presionar este botón, los horarios quedarán asentados como vigentes para el/la auxiliar del micro.
        </span>
      </div>
    </div>
  );
};
