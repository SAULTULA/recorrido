import React, { useState, useEffect } from 'react';
import {
  Download,
  Send,
  Users,
  Bus,
  Clock,
  Phone,
  CheckCircle2,
  DollarSign,
  Copy,
  Check,
  MessageSquare
} from 'lucide-react';
import styles from './PanelEncargadoRecorrido.module.css';
import {
  Familia,
  HorarioDiarioHijo,
  CheckInSubida,
  SentidoRecorrido,
  HORARIOS_SALIDA_BARRIO,
  HORARIOS_SALIDA_CIUDAD
} from '../../types';
import { apiService, getTodayDateStr } from '../../services/api';

export const PanelEncargadoRecorrido: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MONITOREO' | 'FAMILIAS' | 'CUOTAS'>('MONITOREO');
  const [sentido, setSentido] = useState<SentidoRecorrido>('SALIDA_BARRIO');
  const [selectedTime, setSelectedTime] = useState<string>('06:25');

  const [familias, setFamilias] = useState<Familia[]>([]);
  const [horarios, setHorarios] = useState<HorarioDiarioHijo[]>([]);
  const [checkins, setCheckins] = useState<CheckInSubida[]>([]);

  // Configuración de Cuota / Alias
  const [aliasPago, setAliasPago] = useState<string>(apiService.getAliasPago());
  const [montoCuota, setMontoCuota] = useState<string>(apiService.getMontoCuota());
  const [mesCuota, setMesCuota] = useState<string>('Marzo');
  const [copiedFamilyId, setCopiedFamilyId] = useState<string | null>(null);

  const todayStr = getTodayDateStr();

  const loadData = () => {
    setFamilias(apiService.getFamilias());
    setHorarios(apiService.getHorariosDiarios(todayStr));
    setCheckins(apiService.getCheckIns(todayStr));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [todayStr]);

  const availableTimes =
    sentido === 'SALIDA_BARRIO' ? HORARIOS_SALIDA_BARRIO : HORARIOS_SALIDA_CIUDAD;

  useEffect(() => {
    if (!availableTimes.includes(selectedTime)) {
      setSelectedTime(availableTimes[0]);
    }
  }, [sentido, availableTimes, selectedTime]);

  const handleDownloadCSV = () => {
    apiService.exportarListaGeneralCSV();
  };

  const handleSaveAlias = (newAlias: string) => {
    setAliasPago(newAlias);
    apiService.setAliasPago(newAlias);
  };

  const handleSaveMonto = (newMonto: string) => {
    setMontoCuota(newMonto);
    apiService.setMontoCuota(newMonto);
  };

  /**
   * Genera el texto del mensaje formal y respetuoso para la cuota
   */
  const getFormalMessage = (familia: Familia) => {
    const nombresHijos = familia.hijos.map((h) => h.nombre).join(' y ');
    return `Estimado/a ${familia.jerarquia} ${familia.nombreTutor}:

Esperamos se encuentre muy bien. Nos comunicamos desde la Coordinación del Recorrido Escolar para hacerle llegar el recordatorio correspondiente al abono del servicio de transporte escolar del alumno/a ${nombresHijos} para el período de ${mesCuota}.

*Detalles para la transferencia:*
• Monto sugerido: $${montoCuota}
• Alias de transferencia: *${aliasPago}*
• Titular: Control de Transporte Escolar Tala

Una vez realizado el abono, le solicitamos tenga a bien enviarnos el comprobante por este mismo medio para asentar el registro.

Agradecemos desde ya su constante compromiso y colaboración con el servicio.

Atentamente,
*Coordinación del Recorrido Escolar*`;
  };

  const handleCopyMessage = (familia: Familia) => {
    const text = getFormalMessage(familia);
    navigator.clipboard.writeText(text);
    setCopiedFamilyId(familia.id);
    setTimeout(() => setCopiedFamilyId(null), 3000);
  };

  const getWaLink = (familia: Familia) => {
    const phone = familia.celular.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(getFormalMessage(familia));
    return `https://wa.me/${phone}?text=${text}`;
  };

  // Filtrado de monitoreo (idéntico a encargada pero de solo lectura)
  const getMonitoreoData = () => {
    const list: {
      alumnoNombre: string;
      escuela: string;
      parada: string;
      tutorNombre: string;
      jerarquia: string;
      casa: string;
      celular: string;
      checkedIn: boolean;
      horaMarcado?: string;
    }[] = [];

    familias.forEach((fam) => {
      fam.hijos.forEach((hijo) => {
        const config = horarios.find((h) => h.idAlumno === hijo.id && h.fecha === todayStr);
        if (!config) return;

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
            alumnoNombre: hijo.nombre,
            escuela: hijo.escuela,
            parada: fam.paradaFija,
            tutorNombre: fam.nombreTutor,
            jerarquia: fam.jerarquia,
            casa: fam.numeroCasa,
            celular: fam.celular,
            checkedIn: !!check,
            horaMarcado: check?.horaMarcado
          });
        }
      });
    });

    return list;
  };

  const monitoreoAlumnos = getMonitoreoData();
  const pendientesCount = monitoreoAlumnos.filter((a) => !a.checkedIn).length;
  const aBordoCount = monitoreoAlumnos.filter((a) => a.checkedIn).length;

  return (
    <div className={styles.panelCoordinador}>
      {/* Barra Superior con Acciones Principales */}
      <div className={styles.panelCoordinador__topBar}>
        <div className={styles.panelCoordinador__titleGroup}>
          <Bus size={28} color="var(--color-primary)" />
          <div>
            <h2 className={styles.panelCoordinador__title}>Panel de Coordinación del Recorrido</h2>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Supervisión de viajes, administración de registros y cobro de cuotas
            </p>
          </div>
        </div>

        <div className={styles.panelCoordinador__topActions}>
          <button
            type="button"
            className={styles.panelCoordinador__btnDownload}
            onClick={handleDownloadCSV}
            title="Descargar planilla completa en formato CSV para Excel"
          >
            <Download size={16} />
            <span>Descargar Lista General (Excel/CSV)</span>
          </button>

          <button
            type="button"
            className={styles.panelCoordinador__btnFeeReminder}
            onClick={() => setActiveTab('CUOTAS')}
          >
            <DollarSign size={16} />
            <span>Recordatorios de Cuota</span>
          </button>
        </div>
      </div>

      {/* Pestañas de Navegación del Encargado */}
      <div className={styles.panelCoordinador__navTabs}>
        <button
          type="button"
          className={`${styles.panelCoordinador__navTab} ${
            activeTab === 'MONITOREO' ? styles['panelCoordinador__navTab--active'] : ''
          }`}
          onClick={() => setActiveTab('MONITOREO')}
        >
          <Clock size={16} />
          <span>Monitoreo de Recorrido en Vivo</span>
        </button>

        <button
          type="button"
          className={`${styles.panelCoordinador__navTab} ${
            activeTab === 'FAMILIAS' ? styles['panelCoordinador__navTab--active'] : ''
          }`}
          onClick={() => setActiveTab('FAMILIAS')}
        >
          <Users size={16} />
          <span>Gestión de Familias y Alumnos ({familias.length})</span>
        </button>

        <button
          type="button"
          className={`${styles.panelCoordinador__navTab} ${
            activeTab === 'CUOTAS' ? styles['panelCoordinador__navTab--active'] : ''
          }`}
          onClick={() => setActiveTab('CUOTAS')}
        >
          <MessageSquare size={16} />
          <span>Avisos de Cuota y Cobranzas</span>
        </button>
      </div>

      {/* TAB 1: MONITOREO EN VIVO (SOLO LECTURA, SIN BOTONERA DE MARCADO) */}
      {activeTab === 'MONITOREO' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div
            style={{
              backgroundColor: 'var(--color-bg-card)',
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--spacing-md)'
            }}
          >
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
              <button
                type="button"
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor:
                    sentido === 'SALIDA_BARRIO' ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                  color: sentido === 'SALIDA_BARRIO' ? '#fff' : 'var(--color-text-main)',
                  fontWeight: 600,
                  fontSize: 'var(--font-size-xs)'
                }}
                onClick={() => setSentido('SALIDA_BARRIO')}
              >
                Salida desde Barrio (Ida)
              </button>
              <button
                type="button"
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor:
                    sentido === 'SALIDA_CIUDAD' ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                  color: sentido === 'SALIDA_CIUDAD' ? '#fff' : 'var(--color-text-main)',
                  fontWeight: 600,
                  fontSize: 'var(--font-size-xs)'
                }}
                onClick={() => setSentido('SALIDA_CIUDAD')}
              >
                Salida de Ciudad (Vuelta)
              </button>
            </div>

            <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
              {availableTimes.map((h) => (
                <button
                  key={h}
                  type="button"
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: selectedTime === h ? 'var(--color-primary)' : 'var(--color-bg-card)',
                    color: selectedTime === h ? '#fff' : 'var(--color-text-main)',
                    fontWeight: 600,
                    fontSize: 'var(--font-size-xs)'
                  }}
                  onClick={() => setSelectedTime(h)}
                >
                  ⏺️ {h} hs
                </button>
              ))}
            </div>

            <div style={{ fontSize: 'var(--font-size-xs)', display: 'flex', gap: 12 }}>
              <span>
                Pendientes: <strong>{pendientesCount}</strong>
              </span>
              <span style={{ color: 'var(--color-success-hover)' }}>
                A bordo: <strong>{aBordoCount}</strong>
              </span>
            </div>
          </div>

          {/* Tabla de Monitoreo */}
          <div className={styles.panelCoordinador__tableCard}>
            <div className={styles.panelCoordinador__tableWrap}>
              <table className={styles.panelCoordinador__table}>
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>Alumno</th>
                    <th>Establecimiento</th>
                    <th>Parada Asignada</th>
                    <th>Responsable</th>
                    <th>Casa</th>
                    <th>Contacto</th>
                  </tr>
                </thead>
                <tbody>
                  {monitoreoAlumnos.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                        No hay alumnos anotados para el horario de las {selectedTime} hs en este sentido.
                      </td>
                    </tr>
                  ) : (
                    monitoreoAlumnos.map((a, i) => (
                      <tr key={i}>
                        <td>
                          {a.checkedIn ? (
                            <span
                              style={{
                                color: 'var(--color-success)',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <CheckCircle2 size={14} /> Subió ({a.horaMarcado} hs)
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-accent-hover)', fontWeight: 600 }}>
                              ⏳ Pendiente
                            </span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>{a.alumnoNombre}</td>
                        <td>{a.escuela}</td>
                        <td>{a.parada}</td>
                        <td>
                          {a.tutorNombre} ({a.jerarquia})
                        </td>
                        <td>{a.casa}</td>
                        <td>
                          <a
                            href={`https://wa.me/${a.celular.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.panelCoordinador__btnWa}
                          >
                            <Phone size={12} />
                            <span>WhatsApp</span>
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GESTIÓN DE FAMILIAS Y ALUMNOS */}
      {activeTab === 'FAMILIAS' && (
        <div className={styles.panelCoordinador__tableCard}>
          <div className={styles.panelCoordinador__tableHeader}>
            <h3 style={{ fontWeight: 700, fontSize: 'var(--font-size-md)' }}>
              Padrón de Familias y Alumnos Registrados
            </h3>
            <button
              type="button"
              className={styles.panelCoordinador__btnDownload}
              onClick={handleDownloadCSV}
            >
              <Download size={14} />
              <span>Exportar Padrón Completo</span>
            </button>
          </div>

          <div className={styles.panelCoordinador__tableWrap}>
            <table className={styles.panelCoordinador__table}>
              <thead>
                <tr>
                  <th>Tutor / Responsable</th>
                  <th>Jerarquía</th>
                  <th>DNI</th>
                  <th>Celular</th>
                  <th>Casa</th>
                  <th>Parada Fija</th>
                  <th>Hijos Registrados</th>
                </tr>
              </thead>
              <tbody>
                {familias.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-muted)' }}>
                      Aún no hay familias registradas. Los tutores aparecerán aquí automáticamente tras registrarse.
                    </td>
                  </tr>
                ) : (
                  familias.map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 600 }}>{f.nombreTutor}</td>
                    <td>
                      <span
                        className={styles.panelCoordinador__badge}
                        style={{
                          backgroundColor:
                            f.jerarquia === 'Oficial' ? 'var(--color-primary-light)' : '#fef3c7',
                          color:
                            f.jerarquia === 'Oficial' ? 'var(--color-primary)' : '#92400e'
                        }}
                      >
                        {f.jerarquia}
                      </span>
                    </td>
                    <td>{f.dni}</td>
                    <td>{f.celular}</td>
                    <td>{f.numeroCasa || 'No especificada'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                      {f.paradaFija}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {f.hijos.map((h) => (
                          <span key={h.id} style={{ fontSize: 'var(--font-size-xs)' }}>
                            • <strong>{h.nombre}</strong> ({h.escuela})
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RECORDATORIOS DE CUOTA Y ALIAS */}
      {activeTab === 'CUOTAS' && (
        <div className={styles.panelCoordinador__feeBox}>
          <div className={styles.panelCoordinador__feeHeader}>
            <div className={styles.panelCoordinador__feeTitle}>
              <DollarSign size={20} />
              <span>Configuración y Envío de Recordatorio de Cuota</span>
            </div>
          </div>

          <div className={styles.panelCoordinador__feeGrid}>
            <div className={styles.panelCoordinador__feeGroup}>
              <label className={styles.panelCoordinador__feeLabel}>
                Alias de Transferencia (CBU / Billetera Virtual)
              </label>
              <input
                type="text"
                className={styles.panelCoordinador__feeInput}
                value={aliasPago}
                onChange={(e) => handleSaveAlias(e.target.value)}
                placeholder="Ej: recorrido.escolar.transporte"
              />
            </div>

            <div className={styles.panelCoordinador__feeGroup}>
              <label className={styles.panelCoordinador__feeLabel}>Monto de la Cuota ($)</label>
              <input
                type="text"
                className={styles.panelCoordinador__feeInput}
                value={montoCuota}
                onChange={(e) => handleSaveMonto(e.target.value)}
                placeholder="Ej: 35.000"
              />
            </div>

            <div className={styles.panelCoordinador__feeGroup}>
              <label className={styles.panelCoordinador__feeLabel}>Mes / Período a Notificar</label>
              <select
                className={styles.panelCoordinador__feeInput}
                value={mesCuota}
                onChange={(e) => setMesCuota(e.target.value)}
              >
                <option value="Marzo">Marzo</option>
                <option value="Abril">Abril</option>
                <option value="Mayo">Mayo</option>
                <option value="Junio">Junio</option>
                <option value="Julio">Julio</option>
                <option value="Agosto">Agosto</option>
                <option value="Septiembre">Septiembre</option>
                <option value="Octubre">Octubre</option>
                <option value="Noviembre">Noviembre</option>
                <option value="Diciembre">Diciembre</option>
              </select>
            </div>
          </div>

          {/* Vista previa del Mensaje Formal */}
          <div>
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                marginBottom: 4,
                display: 'block'
              }}
            >
              Plantilla de Mensaje Formal y Respetuoso (Se adapta a cada familia):
            </span>
            <div className={styles.panelCoordinador__feePreview}>
              {getFormalMessage(familias[0] || {
                id: 'demo',
                nombreTutor: 'Tutor',
                jerarquia: 'Suboficial',
                dni: '',
                celular: '',
                numeroCasa: '',
                paradaFija: '',
                fechaRegistro: '',
                hijos: [{ id: '1', idFamilia: 'demo', nombre: 'Alumno', escuela: '' }]
              })}
            </div>
          </div>

          {/* Lista de Envío Directo por WhatsApp por Familia */}
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <h4
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 700,
                marginBottom: 'var(--spacing-sm)'
              }}
            >
              Envío Rápido a Familias Registradas
            </h4>

            <div className={styles.panelCoordinador__tableWrap}>
              <table className={styles.panelCoordinador__table}>
                <thead>
                  <tr>
                    <th>Responsable</th>
                    <th>Alumnos</th>
                    <th>Celular</th>
                    <th style={{ textAlign: 'right' }}>Acciones de Envío</th>
                  </tr>
                </thead>
                <tbody>
                  {familias.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-muted)' }}>
                        No hay tutores registrados para enviar mensajes de cuota.
                      </td>
                    </tr>
                  ) : (
                    familias.map((fam) => (
                    <tr key={fam.id}>
                      <td style={{ fontWeight: 600 }}>{fam.nombreTutor} ({fam.jerarquia})</td>
                      <td>{fam.hijos.map((h) => h.nombre).join(', ')}</td>
                      <td>{fam.celular}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            gap: 8,
                            justifyContent: 'flex-end'
                          }}
                        >
                          <button
                            type="button"
                            style={{
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--color-border)',
                              backgroundColor: 'var(--color-bg-card)',
                              fontSize: 'var(--font-size-xs)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              cursor: 'pointer'
                            }}
                            onClick={() => handleCopyMessage(fam)}
                          >
                            {copiedFamilyId === fam.id ? (
                              <>
                                <Check size={12} color="var(--color-success)" />
                                <span style={{ color: 'var(--color-success)' }}>Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>

                          <a
                            href={getWaLink(fam)}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.panelCoordinador__btnWa}
                          >
                            <Send size={12} />
                            <span>Enviar por WhatsApp</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
