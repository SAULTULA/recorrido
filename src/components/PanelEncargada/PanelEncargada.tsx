import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  School,
  AlertTriangle,
  Bus,
  Check,
  Eye,
  Home,
  ArrowDownCircle
} from 'lucide-react';
import styles from './PanelEncargada.module.css';
import {
  Familia,
  Hijo,
  HorarioDiarioHijo,
  CheckInSubida,
  AvisoAlerta,
  SentidoRecorrido,
  HORARIOS_SALIDA_BARRIO,
  HORARIOS_SALIDA_CIUDAD,
  TODAS_LAS_PARADAS
} from '../../types';
import { apiService, getTodayDateStr } from '../../services/api';

interface PanelEncargadaProps {
  controllerName: string;
}

export const PanelEncargada: React.FC<PanelEncargadaProps> = ({ controllerName }) => {
  const [sentido, setSentido] = useState<SentidoRecorrido>('SALIDA_BARRIO');
  const [selectedTime, setSelectedTime] = useState<string>('06:25');
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [horarios, setHorarios] = useState<HorarioDiarioHijo[]>([]);
  const [checkins, setCheckins] = useState<CheckInSubida[]>([]);
  const [avisos, setAvisos] = useState<AvisoAlerta[]>([]);
  const [viewCompleted, setViewCompleted] = useState<boolean>(false);

  const todayStr = getTodayDateStr();

  const loadData = () => {
    setFamilias(apiService.getFamilias());
    setHorarios(apiService.getHorariosDiarios(todayStr));
    setCheckins(apiService.getCheckIns(todayStr));
    setAvisos(apiService.getAvisos().filter((a) => !a.leido));
  };

  useEffect(() => {
    loadData();
    // Auto-refresh interval cada 10 segundos
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [todayStr]);

  // Lista de horarios según sentido
  const availableTimes =
    sentido === 'SALIDA_BARRIO' ? HORARIOS_SALIDA_BARRIO : HORARIOS_SALIDA_CIUDAD;

  // Si cambia de sentido y el horario actual no existe en el nuevo sentido, tomar el primero
  useEffect(() => {
    if (!availableTimes.includes(selectedTime)) {
      setSelectedTime(availableTimes[0]);
    }
  }, [sentido, availableTimes, selectedTime]);

  // Determinar si estamos en turno mañana o tarde
  const isMorningTime = (timeStr: string) => {
    const hour = parseInt(timeStr.split(':')[0], 10);
    return hour < 15;
  };

  // Filtrar alumnos que corresponden a este sentido y horario
  const getEligibleStudents = () => {
    const list: {
      alumno: Hijo;
      familia: Familia;
      horarioConfig: HorarioDiarioHijo;
      checkedIn: boolean;
      checkinInfo?: CheckInSubida;
    }[] = [];

    familias.forEach((fam) => {
      fam.hijos.forEach((hijo) => {
        const config = horarios.find((h) => h.idAlumno === hijo.id && h.fecha === todayStr);
        if (!config) return;

        // Comprobar si viaja en este sentido y coincide el horario
        let viaja = false;
        if (sentido === 'SALIDA_BARRIO' && config.usaIda && config.horarioBarrio === selectedTime) {
          viaja = true;
        } else if (
          sentido === 'SALIDA_CIUDAD' &&
          config.usaVuelta &&
          config.horarioCiudad === selectedTime
        ) {
          viaja = true;
        }

        if (viaja) {
          const check = checkins.find(
            (c) =>
              c.idAlumno === hijo.id &&
              c.sentido === sentido &&
              c.horario === selectedTime &&
              c.fecha === todayStr
          );
          list.push({
            alumno: hijo,
            familia: fam,
            horarioConfig: config,
            checkedIn: !!check,
            checkinInfo: check
          });
        }
      });
    });

    return list;
  };

  const eligibleStudents = getEligibleStudents();
  const pendingStudents = eligibleStudents.filter((s) => !s.checkedIn);
  const checkedStudents = eligibleStudents.filter((s) => s.checkedIn);

  // Marcar subida (Check-in)
  const handleMarkSubida = (
    alumno: Hijo,
    parada: string
  ) => {
    const nuevoCheck = apiService.registrarCheckIn({
      fecha: todayStr,
      idAlumno: alumno.id,
      nombreAlumno: alumno.nombre,
      sentido,
      horario: selectedTime,
      parada,
      responsableControl: controllerName
    });

    setCheckins((prev) => [...prev, nuevoCheck]);

    // Comprobar si era el último pendiente de la mañana (13:40) para auto-cargar la tarde (16:00)
    if (selectedTime === '13:40' && pendingStudents.length === 1) {
      setTimeout(() => {
        if (sentido === 'SALIDA_BARRIO') {
          setSelectedTime('16:20');
        } else {
          setSelectedTime('16:00');
        }
      }, 800);
    }
  };

  // Marcar bajada (Descenso del transporte en destino)
  const handleMarkBajada = (idCheckIn: string) => {
    const updated = apiService.marcarBajada(idCheckIn);
    if (updated) {
      setCheckins((prev) => prev.map((c) => (c.id === idCheckIn ? updated : c)));
    }
  };

  const handleDismissAviso = (avisoId: string) => {
    const all = apiService.getAvisos().map((a) => (a.id === avisoId ? { ...a, leido: true } : a));
    localStorage.setItem('recorrido_avisos', JSON.stringify(all));
    setAvisos((prev) => prev.filter((a) => a.id !== avisoId));
  };

  // Agrupar alumnos pendientes por Parada
  const groupedByParada = TODAS_LAS_PARADAS.map((parada) => {
    const studentsInParada = pendingStudents.filter(
      (s) => s.familia.paradaFija === parada.nombre
    );
    return {
      parada,
      students: studentsInParada
    };
  }).filter((group) => group.students.length > 0);

  return (
    <div className={styles.panelEncargada}>
      {/* Alertas de Padres en tiempo real */}
      {avisos.length > 0 && (
        <div className={styles.panelEncargada__alertsContainer}>
          {avisos.map((aviso) => (
            <div key={aviso.id} className={styles.panelEncargada__alertCard}>
              <div className={styles.panelEncargada__alertContent}>
                <div className={styles.panelEncargada__alertIcon}>
                  <AlertTriangle size={24} />
                </div>
                <div className={styles.panelEncargada__alertText}>
                  <span className={styles.panelEncargada__alertTitle}>
                    ¡Alerta de {aviso.tipo === 'CANCELACION' ? 'Cancelación / Retiro' : 'Modificación'}!
                  </span>
                  <span className={styles.panelEncargada__alertDesc}>
                    {aviso.detalle} (Afecta: {aviso.horarioAfectado}) - Registrado a las {aviso.horaRegistro} hs
                  </span>
                </div>
              </div>
              <button
                type="button"
                className={styles.panelEncargada__alertDismissBtn}
                onClick={() => handleDismissAviso(aviso.id)}
              >
                Entendido / Ocultar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tarjeta de Control Principal */}
      <div className={styles.panelEncargada__controlCard}>
        <div className={styles.panelEncargada__controlHeader}>
          <div className={styles.panelEncargada__titleGroup}>
            <Bus size={26} color="var(--color-primary)" />
            <h2 className={styles.panelEncargada__title}>Panel de Auxiliar - Control de Abordaje</h2>
          </div>

          {/* Selector de Sentido */}
          <div className={styles.panelEncargada__senseSelector}>
            <button
              type="button"
              className={`${styles.panelEncargada__senseBtn} ${
                sentido === 'SALIDA_BARRIO' ? styles['panelEncargada__senseBtn--active'] : ''
              }`}
              onClick={() => setSentido('SALIDA_BARRIO')}
            >
              <Home size={16} />
              <span>Salida desde el Barrio (Ida)</span>
            </button>
            <button
              type="button"
              className={`${styles.panelEncargada__senseBtn} ${
                sentido === 'SALIDA_CIUDAD' ? styles['panelEncargada__senseBtn--active'] : ''
              }`}
              onClick={() => setSentido('SALIDA_CIUDAD')}
            >
              <School size={16} />
              <span>Salida de la Ciudad (Vuelta)</span>
            </button>
          </div>
        </div>

        {/* Barra de Horarios Fijos */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8
            }}
          >
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-light)' }}>
              Seleccionar Horario del Recorrido:
            </span>
            <span className={styles.panelEncargada__cycleIndicator}>
              {isMorningTime(selectedTime)
                ? '☀️ Turno Mañana (hasta 13:40 hs)'
                : '🌙 Turno Tarde (a partir de 16:00 hs)'}
            </span>
          </div>

          <div className={styles.panelEncargada__timeSelector}>
            {availableTimes.map((h) => (
              <button
                key={h}
                type="button"
                className={`${styles.panelEncargada__timeChip} ${
                  selectedTime === h ? styles['panelEncargada__timeChip--selected'] : ''
                }`}
                onClick={() => setSelectedTime(h)}
              >
                <Clock size={14} />
                <span>⏺️ {h} hs</span>
              </button>
            ))}
          </div>
        </div>

        {/* Barra de Estadísticas y Alternar Vista */}
        <div className={styles.panelEncargada__statsRow}>
          <div className={styles.panelEncargada__statGroup}>
            <div className={styles.panelEncargada__statItem}>
              <span>Pendientes por subir:</span>
              <span
                className={`${styles.panelEncargada__statCount} ${styles['panelEncargada__statCount--pending']}`}
              >
                {pendingStudents.length}
              </span>
            </div>

            <div className={styles.panelEncargada__statItem}>
              <span>Ya subieron (A bordo):</span>
              <span
                className={`${styles.panelEncargada__statCount} ${styles['panelEncargada__statCount--checked']}`}
              >
                {checkedStudents.length}
              </span>
            </div>
          </div>

          <button
            type="button"
            style={{
              fontSize: 'var(--font-size-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: 'var(--color-primary)',
              fontWeight: 600
            }}
            onClick={() => setViewCompleted(!viewCompleted)}
          >
            <Eye size={14} />
            <span>{viewCompleted ? 'Ocultar alumnos que ya subieron' : 'Ver alumnos a bordo'}</span>
          </button>
        </div>
      </div>

      {/* Lista de Alumnos agrupados por Parada */}
      {!viewCompleted ? (
        groupedByParada.length === 0 ? (
          <div className={styles.panelEncargada__emptyState}>
            <CheckCircle2 size={42} color="var(--color-success)" />
            <h3 style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>
              ¡Todo listo para las {selectedTime} hs!
            </h3>
            <p>
              {eligibleStudents.length === 0
                ? 'No hay alumnos registrados para viajar en este horario.'
                : 'Todos los alumnos de este horario ya han sido marcados como presentes a bordo.'}
            </p>
          </div>
        ) : (
          <div className={styles.panelEncargada__paradasList}>
            {groupedByParada.map(({ parada, students }) => (
              <div key={parada.id} className={styles.panelEncargada__paradaCard}>
                <div className={styles.panelEncargada__paradaHeader}>
                  <div className={styles.panelEncargada__paradaTitle}>
                    <MapPin size={18} />
                    <span>{parada.nombre}</span>
                  </div>
                  <span className={styles.panelEncargada__paradaBadge}>
                    {parada.barrio} • {students.length} esperando
                  </span>
                </div>

                <div className={styles.panelEncargada__studentsGrid}>
                  {students.map(({ alumno, familia }) => (
                    <div key={alumno.id} className={styles.panelEncargada__studentCard}>
                      <div>
                        <div className={styles.panelEncargada__studentName}>
                          {alumno.nombre}
                        </div>
                        <div className={styles.panelEncargada__studentSchool}>
                          <School size={13} />
                          <span>{alumno.escuela}</span>
                        </div>
                      </div>

                      <div className={styles.panelEncargada__tutorInfo}>
                        <span>
                          <strong>Responsable:</strong> {familia.nombreTutor} ({familia.jerarquia})
                        </span>
                        <span>
                          <strong>Casa:</strong> {familia.numeroCasa || 'Sin especificar'}
                        </span>
                        <a
                          href={`https://wa.me/${familia.celular.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: 'var(--color-success)',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            marginTop: 2
                          }}
                        >
                          <Phone size={12} />
                          <span>WhatsApp: {familia.celular}</span>
                        </a>
                      </div>

                      <button
                        type="button"
                        className={styles.panelEncargada__btnCheckIn}
                        onClick={() => handleMarkSubida(alumno, parada.nombre)}
                      >
                        <Check size={16} />
                        <span>✅ SUBIÓ AL TRANSPORTE</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Vista de Alumnos que ya subieron (Historial a bordo) */
        <div className={styles.panelEncargada__paradaCard}>
          <div className={styles.panelEncargada__paradaHeader}>
            <div className={styles.panelEncargada__paradaTitle}>
              <CheckCircle2 size={18} color="var(--color-success)" />
              <span>Alumnos a Bordo en las {selectedTime} hs ({checkedStudents.length})</span>
            </div>
          </div>

          {checkedStudents.length === 0 ? (
            <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Aún no ha subido ningún alumno en este horario.
            </div>
          ) : (
            <div className={styles.panelEncargada__studentsGrid}>
              {checkedStudents.map(({ alumno, familia, checkinInfo }) => {
                const isBajado = checkinInfo?.estado === 'BAJO' || !!checkinInfo?.horaBajada;
                return (
                  <div
                    key={alumno.id}
                    className={styles.panelEncargada__studentCard}
                    style={{
                      borderLeft: `4px solid ${isBajado ? 'var(--color-text-muted)' : 'var(--color-success)'}`
                    }}
                  >
                    <div>
                      <div className={styles.panelEncargada__studentName}>{alumno.nombre}</div>
                      <div className={styles.panelEncargada__studentSchool}>
                        <School size={13} />
                        <span>{alumno.escuela}</span>
                      </div>
                    </div>

                    <div className={styles.panelEncargada__tutorInfo}>
                      <span>
                        <strong>Parada:</strong> {checkinInfo?.parada || familia.paradaFija}
                      </span>
                      <span>
                        <strong>Hora de Subida:</strong> {checkinInfo?.horaMarcado} hs
                      </span>
                      {checkinInfo?.horaBajada && (
                        <span>
                          <strong>Hora de Bajada:</strong> {checkinInfo.horaBajada} hs
                        </span>
                      )}
                      <span>
                        <strong>Tutor:</strong> {familia.nombreTutor}
                      </span>
                    </div>

                    {isBajado ? (
                      <div className={styles.panelEncargada__statusBajadoBox}>
                        <CheckCircle2 size={16} color="var(--color-success)" />
                        <span>Descendió del transporte ({checkinInfo?.horaBajada} hs)</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={styles.panelEncargada__btnBajada}
                        onClick={() => checkinInfo && handleMarkBajada(checkinInfo.id)}
                      >
                        <ArrowDownCircle size={16} />
                        <span>⬇️ MARCAR BAJADA (Bajó del micro)</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
