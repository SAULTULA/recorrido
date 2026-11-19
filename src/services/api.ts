import {
  Familia,
  HorarioDiarioHijo,
  CheckInSubida,
  AvisoAlerta,
  BackendStatus,
  PersonalStaff,
  Hijo
} from '../types';

const STORAGE_KEYS = {
  BACKEND_URL: 'recorrido_backend_url',
  FAMILIAS: 'recorrido_familias',
  PERSONAL: 'recorrido_personal',
  HORARIOS: 'recorrido_horarios',
  CHECKINS: 'recorrido_checkins',
  AVISOS: 'recorrido_avisos',
  USER_SESSION: 'recorrido_user_session',
  ALIAS_PAGO: 'recorrido_alias_pago',
  MONTO_CUOTA: 'recorrido_monto_cuota',
  ADMIN_PASSWORD: 'recorrido_admin_password'
};

export function getTodayDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTomorrowDateStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getCurrentTimeStr(): string {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Determina si faltan menos de 30 minutos o si la hora ya pasó para el día de HOY.
 * Retorna true si está bloqueado (no se puede cargar o cambiar con menos de 30 min de margen).
 */
export function isTimeLockedForToday(timeStr: string): boolean {
  if (!timeStr || timeStr === 'NO_USA') return false;
  const parts = timeStr.split(':');
  if (parts.length < 2) return false;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return false;

  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const targetMins = h * 60 + m;

  // Si ya pasó o faltan menos de 30 minutos (ej: a las 09:25 un horario de 07:20 o de 09:40)
  return (targetMins - currentMins) < 30;
}

/**
 * Determina si ya se habilitó la visualización/confirmación oficial de horarios para el día de mañana.
 * Habilitado a partir de las 18:30 hs.
 */
export function isTomorrowBookingAllowed(): boolean {
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  return currentMins >= (18 * 60 + 30); // 18:30 hs
}

/**
 * Normaliza horas que Google Sheets o Apps Script devuelven como fechas ISO (ej: 1899-12-30T10:41:48.000Z)
 */
export function normalizeTimeString(val: any): string {
  if (!val) return '';
  const str = String(val).trim();
  if (str === 'NO_USA') return 'NO_USA';
  if (str.includes('T') && (str.endsWith('Z') || str.includes('+') || str.includes('-'))) {
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'America/Argentina/Buenos_Aires'
        });
      }
    } catch {
      // Fallback
    }
  }
  return str.replace(/'/g, '').trim();
}

const DEFAULT_BACKEND_URL =
  'https://script.google.com/macros/s/AKfycbwr3R_NgYVaNyFFaNX2l9sfiQxwzwi_gvmSkXBjeATR-L5bEheLjucGZkLh6SXhWeAMaw/exec';

export const DEFAULT_PERSONAL: PersonalStaff[] = [
  {
    id: 'staff-01',
    nombre: 'Auxiliar Control 1',
    dni: '11111111',
    celular: '1166508379',
    rol: 'AUXILIAR',
    fechaRegistro: '2026-11-19'
  },
  {
    id: 'staff-02',
    nombre: 'Auxiliar Control 2',
    dni: '22222222',
    celular: '1166508379',
    rol: 'AUXILIAR',
    fechaRegistro: '2026-11-19'
  },
  {
    id: 'staff-03',
    nombre: 'Encargado de Recorrido',
    dni: '33333333',
    celular: '1166508379',
    rol: 'ENCARGADO_RECORRIDO',
    fechaRegistro: '2026-11-19'
  }
];

export const apiService = {
  getBackendUrl(): string {
    const stored = localStorage.getItem(STORAGE_KEYS.BACKEND_URL);
    if (
      !stored ||
      stored.includes('AKfycbyaRBe41sqNP7MtSyjnSar2XSTUODSYiS4QqaxxMH8F6DXjWnM_heRWh52rLRrqjcaQzA')
    ) {
      localStorage.setItem(STORAGE_KEYS.BACKEND_URL, DEFAULT_BACKEND_URL);
      return DEFAULT_BACKEND_URL;
    }
    return stored;
  },

  setBackendUrl(url: string): void {
    localStorage.setItem(STORAGE_KEYS.BACKEND_URL, url.trim());
  },

  getAliasPago(): string {
    return localStorage.getItem(STORAGE_KEYS.ALIAS_PAGO) || 'recorrido.escolar.transporte';
  },

  setAliasPago(alias: string): void {
    localStorage.setItem(STORAGE_KEYS.ALIAS_PAGO, alias.trim());
    this.sendToBackend({
      action: 'guardarConfig',
      data: { alias_pago: alias.trim() }
    });
  },

  getMontoCuota(): string {
    return localStorage.getItem(STORAGE_KEYS.MONTO_CUOTA) || '35.000';
  },

  setMontoCuota(monto: string): void {
    localStorage.setItem(STORAGE_KEYS.MONTO_CUOTA, monto.trim());
    this.sendToBackend({
      action: 'guardarConfig',
      data: { monto_cuota: monto.trim() }
    });
  },

  async sendToBackend(payload: any): Promise<boolean> {
    const url = this.getBackendUrl();
    if (!url) return false;
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });
      return true;
    } catch (e) {
      console.warn('Error syncing with Apps Script:', e);
      return false;
    }
  },

  async checkHealth(targetUrl?: string): Promise<BackendStatus> {
    const url = targetUrl ?? this.getBackendUrl();
    const startTime = performance.now();

    if (!url) {
      return {
        online: true,
        mode: 'LOCAL_MOCK',
        timestamp: new Date().toISOString(),
        latencyMs: 10,
        message: 'Modo local activo.'
      };
    }

    try {
      const endpoint = url.includes('?') ? `${url}&action=health` : `${url}?action=health`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        mode: 'cors'
      });
      const latencyMs = Math.round(performance.now() - startTime);

      if (res.ok) {
        const data = await res.json();
        return {
          online: true,
          mode: 'APPS_SCRIPT',
          url,
          timestamp: data.timestamp || new Date().toISOString(),
          latencyMs,
          message: `Conectado a Google Apps Script (${latencyMs}ms)`
        };
      } else {
        return {
          online: false,
          mode: 'APPS_SCRIPT',
          url,
          latencyMs,
          message: `Error de servidor HTTP ${res.status}`
        };
      }
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        online: false,
        mode: 'APPS_SCRIPT',
        url,
        latencyMs,
        message: `Fallo de conexión: ${err.message || 'Verifique conexión'}`
      };
    }
  },

  /**
   * Sincroniza todos los datos desde Google Sheets hacia el navegador
   */
  async syncWithBackend(): Promise<boolean> {
    const url = this.getBackendUrl();
    if (!url) return false;

    try {
      const endpoint = url.includes('?') ? `${url}&action=getAllData` : `${url}?action=getAllData`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        mode: 'cors'
      });

      if (!res.ok) return false;

      const data = await res.json();

      // 1. Reconstruir familias y alumnos
      if (data.familias && Array.isArray(data.familias)) {
        const alumnosRaw = Array.isArray(data.alumnos) ? data.alumnos : [];
        const reconstructedFamilias: Familia[] = data.familias.map((f: any) => {
          const hijosFam: Hijo[] = alumnosRaw
            .filter((a: any) => String(a.ID_Familia || a.idFamilia).trim() === String(f.ID_Familia || f.id).trim())
            .map((a: any) => ({
              id: a.ID_Alumno || a.id,
              idFamilia: f.ID_Familia || f.id,
              nombre: a.Nombre_Alumno || a.nombre,
              dni: a.DNI_Alumno || a.dni || '',
              escuela: a.Escuela || a.escuela,
              grado: a.Grado || a.grado || '',
              turno: a.Turno || a.turno || 'Ambos'
            }));

          return {
            id: f.ID_Familia || f.id,
            nombreTutor: f.Nombre_Tutor || f.nombreTutor,
            dni: String(f.DNI || f.dni).trim(),
            jerarquia: f.Jerarquia || f.jerarquia || 'Suboficial',
            celular: String(f.Celular || f.celular).trim(),
            numeroCasa: String(f.Numero_Casa || f.numeroCasa || '').trim(),
            paradaFija: f.Parada_Fija || f.paradaFija,
            fechaRegistro: f.Fecha_Registro || f.fechaRegistro || getTodayDateStr(),
            hijos: hijosFam
          };
        });

        localStorage.setItem(STORAGE_KEYS.FAMILIAS, JSON.stringify(reconstructedFamilias));
      }

      // 2. Personal
      if (data.personal && Array.isArray(data.personal) && data.personal.length > 0) {
        const mappedPersonal: PersonalStaff[] = data.personal.map((p: any) => ({
          id: p.ID_Personal || p.id,
          nombre: p.Nombre || p.nombre,
          dni: String(p.DNI || p.dni).trim(),
          celular: String(p.Celular || p.celular).trim(),
          rol: p.Rol || p.rol || 'AUXILIAR',
          fechaRegistro: p.Fecha_Alta || p.fechaRegistro || getTodayDateStr()
        }));
        localStorage.setItem(STORAGE_KEYS.PERSONAL, JSON.stringify(mappedPersonal));
      } else {
        // Si el backend aún no tiene personal pero en local sí hay, empujarlos a Google Sheets
        const localPersonal = this.getPersonal();
        if (localPersonal.length > 0) {
          localPersonal.forEach((staff) => {
            this.sendToBackend({
              action: 'registrarPersonal',
              data: staff
            });
          });
        }
      }

      // 6. Configuración del sistema (SuperAdmin, Alias, Monto)
      if (data.config) {
        if (data.config.admin_password) {
          localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, String(data.config.admin_password).trim());
        }
        if (data.config.alias_pago) {
          localStorage.setItem(STORAGE_KEYS.ALIAS_PAGO, String(data.config.alias_pago).trim());
        }
        if (data.config.monto_cuota) {
          localStorage.setItem(STORAGE_KEYS.MONTO_CUOTA, String(data.config.monto_cuota).trim());
        }
      }

      // 3. Horarios diarios
      if (data.diario && Array.isArray(data.diario)) {
        const mappedDiario: HorarioDiarioHijo[] = data.diario.map((d: any) => ({
          idAlumno: d.ID_Alumno || d.idAlumno,
          fecha: d.Fecha ? String(d.Fecha).split('T')[0] : getTodayDateStr(),
          horarioBarrio: normalizeTimeString(d.Horario_Barrio || d.horarioBarrio),
          horarioCiudad: normalizeTimeString(d.Horario_Ciudad || d.horarioCiudad),
          usaIda: d.Usa_Ida === 'SI' || d.usaIda === true,
          usaVuelta: d.Usa_Vuelta === 'SI' || d.usaVuelta === true,
          ultimaModificacion: d.Ultima_Modificacion || d.ultimaModificacion
        }));
        localStorage.setItem(STORAGE_KEYS.HORARIOS, JSON.stringify(mappedDiario));
      }

      // 4. CheckIns
      if (data.checkins && Array.isArray(data.checkins)) {
        const mappedCheckins: CheckInSubida[] = data.checkins.map((c: any) => ({
          id: c.ID_CheckIn || c.id,
          fecha: c.Fecha ? String(c.Fecha).split('T')[0] : getTodayDateStr(),
          idAlumno: c.ID_Alumno || c.idAlumno,
          nombreAlumno: c.Nombre_Alumno || c.nombreAlumno,
          sentido: c.Sentido || c.sentido,
          horario: normalizeTimeString(c.Horario || c.horario),
          parada: c.Parada || c.parada,
          horaMarcado: normalizeTimeString(c.Hora_Marcado || c.horaMarcado),
          horaBajada: normalizeTimeString(c.Hora_Bajada || c.horaBajada || ''),
          estado: c.Estado || c.estado || (c.Hora_Bajada ? 'BAJO' : 'A_BORDO'),
          responsableControl: c.Responsable_Control || c.responsableControl
        }));
        localStorage.setItem(STORAGE_KEYS.CHECKINS, JSON.stringify(mappedCheckins));
      }

      // 5. Avisos
      if (data.avisos && Array.isArray(data.avisos)) {
        const mappedAvisos: AvisoAlerta[] = data.avisos.map((a: any) => ({
          id: a.ID_Aviso || a.id,
          fecha: a.Fecha ? String(a.Fecha).split('T')[0] : getTodayDateStr(),
          idAlumno: a.ID_Alumno || a.idAlumno,
          nombreAlumno: a.Nombre_Alumno || a.nombreAlumno,
          tipo: a.Tipo || a.tipo,
          detalle: a.Detalle || a.detalle,
          horarioAfectado: a.Horario_Afectado || a.horarioAfectado || '',
          horaRegistro: normalizeTimeString(a.Hora_Registro || a.horaRegistro),
          leido: a.Leido === 'SI' || a.leido === true
        }));
        localStorage.setItem(STORAGE_KEYS.AVISOS, JSON.stringify(mappedAvisos));
      }

      return true;
    } catch (e) {
      console.warn('Error sincronizando con Google Apps Script:', e);
      return false;
    }
  },

  getFamilias(): Familia[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FAMILIAS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveFamilia(familia: Familia): void {
    const familias = this.getFamilias();
    const index = familias.findIndex((f) => f.id === familia.id || f.dni === familia.dni);
    if (index >= 0) {
      familias[index] = familia;
    } else {
      familias.push(familia);
    }
    localStorage.setItem(STORAGE_KEYS.FAMILIAS, JSON.stringify(familias));

    this.sendToBackend({
      action: 'registrarFamilia',
      data: familia
    });
  },

  deleteFamilia(id: string): void {
    const familias = this.getFamilias().filter((f) => f.id !== id);
    localStorage.setItem(STORAGE_KEYS.FAMILIAS, JSON.stringify(familias));

    this.sendToBackend({
      action: 'eliminarFamilia',
      idFamilia: id
    });
  },

  getPersonal(): PersonalStaff[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PERSONAL);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PERSONAL, JSON.stringify(DEFAULT_PERSONAL));
      return DEFAULT_PERSONAL;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      localStorage.setItem(STORAGE_KEYS.PERSONAL, JSON.stringify(DEFAULT_PERSONAL));
      return DEFAULT_PERSONAL;
    } catch {
      return DEFAULT_PERSONAL;
    }
  },

  savePersonal(staff: PersonalStaff): void {
    const list = this.getPersonal();
    const index = list.findIndex((s) => s.id === staff.id || s.dni === staff.dni);
    if (index >= 0) {
      list[index] = staff;
    } else {
      list.push(staff);
    }
    localStorage.setItem(STORAGE_KEYS.PERSONAL, JSON.stringify(list));

    this.sendToBackend({
      action: 'registrarPersonal',
      data: staff
    });
  },

  deletePersonal(id: string): void {
    const list = this.getPersonal().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.PERSONAL, JSON.stringify(list));

    this.sendToBackend({
      action: 'eliminarPersonal',
      idPersonal: id
    });
  },

  checkAdminPassword(pass: string): boolean {
    const stored = localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD) || 'admin123';
    return pass.trim() === stored;
  },

  setAdminPassword(newPass: string): void {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, newPass.trim());
    this.sendToBackend({
      action: 'guardarConfig',
      data: { admin_password: newPass.trim() }
    });
  },

  getHorariosDiarios(fecha: string = getTodayDateStr()): HorarioDiarioHijo[] {
    const raw = localStorage.getItem(STORAGE_KEYS.HORARIOS);
    const list: HorarioDiarioHijo[] = raw ? JSON.parse(raw) : [];
    // Retornar los del día actual normalizados
    return list
      .filter((h) => h.fecha === fecha)
      .map((h) => ({
        ...h,
        horarioBarrio: normalizeTimeString(h.horarioBarrio),
        horarioCiudad: normalizeTimeString(h.horarioCiudad)
      }));
  },

  /**
   * Obtiene el último horario confirmado para un alumno independientemente de la fecha
   */
  getUltimoHorarioConfirmado(idAlumno: string, nombreAlumno?: string): HorarioDiarioHijo | undefined {
    const raw = localStorage.getItem(STORAGE_KEYS.HORARIOS);
    const list: HorarioDiarioHijo[] = raw ? JSON.parse(raw) : [];
    const cleanName = (nombreAlumno || '').trim().toLowerCase();

    const delAlumno = list.filter(
      (h: any) =>
        h.idAlumno === idAlumno ||
        (cleanName && h.nombreAlumno && String(h.nombreAlumno).trim().toLowerCase() === cleanName)
    );
    if (delAlumno.length === 0) return undefined;
    const ultimo = delAlumno[delAlumno.length - 1];
    return {
      ...ultimo,
      horarioBarrio: normalizeTimeString(ultimo.horarioBarrio),
      horarioCiudad: normalizeTimeString(ultimo.horarioCiudad)
    };
  },

  saveHorarioDiario(horario: HorarioDiarioHijo): void {
    const raw = localStorage.getItem(STORAGE_KEYS.HORARIOS);
    const list: HorarioDiarioHijo[] = raw ? JSON.parse(raw) : [];
    const index = list.findIndex(
      (h) => h.idAlumno === horario.idAlumno && h.fecha === horario.fecha
    );
    if (index >= 0) {
      list[index] = { ...horario, ultimaModificacion: new Date().toISOString() };
    } else {
      list.push({ ...horario, ultimaModificacion: new Date().toISOString() });
    }
    localStorage.setItem(STORAGE_KEYS.HORARIOS, JSON.stringify(list));

    this.sendToBackend({
      action: 'guardarHorario',
      data: horario
    });
  },

  getCheckIns(fecha: string = getTodayDateStr()): CheckInSubida[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CHECKINS);
    if (!raw) return [];
    try {
      const list: CheckInSubida[] = JSON.parse(raw);
      return list.filter((c) => c.fecha === fecha);
    } catch {
      return [];
    }
  },

  registrarCheckIn(checkin: Omit<CheckInSubida, 'id' | 'horaMarcado'>): CheckInSubida {
    const raw = localStorage.getItem(STORAGE_KEYS.CHECKINS);
    const list: CheckInSubida[] = raw ? JSON.parse(raw) : [];
    const nuevo: CheckInSubida = {
      ...checkin,
      id: 'chk-' + Date.now(),
      horaMarcado: getCurrentTimeStr(),
      estado: 'A_BORDO'
    };
    list.push(nuevo);
    localStorage.setItem(STORAGE_KEYS.CHECKINS, JSON.stringify(list));

    this.sendToBackend({
      action: 'marcarSubida',
      data: nuevo
    });

    return nuevo;
  },

  marcarBajada(idCheckIn: string): CheckInSubida | undefined {
    const raw = localStorage.getItem(STORAGE_KEYS.CHECKINS);
    const list: CheckInSubida[] = raw ? JSON.parse(raw) : [];
    const index = list.findIndex((c) => c.id === idCheckIn);
    if (index === -1) return undefined;

    const horaBajada = getCurrentTimeStr();
    list[index] = {
      ...list[index],
      horaBajada,
      estado: 'BAJO'
    };

    localStorage.setItem(STORAGE_KEYS.CHECKINS, JSON.stringify(list));

    this.sendToBackend({
      action: 'marcarBajada',
      data: {
        idCheckIn: idCheckIn,
        horaBajada: horaBajada
      }
    });

    return list[index];
  },

  getAvisos(): AvisoAlerta[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AVISOS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  crearAviso(aviso: Omit<AvisoAlerta, 'id' | 'horaRegistro' | 'leido'>): AvisoAlerta {
    const raw = localStorage.getItem(STORAGE_KEYS.AVISOS);
    const list: AvisoAlerta[] = raw ? JSON.parse(raw) : [];
    const nuevo: AvisoAlerta = {
      ...aviso,
      id: 'avi-' + Date.now(),
      horaRegistro: getCurrentTimeStr(),
      leido: false
    };
    list.unshift(nuevo);
    localStorage.setItem(STORAGE_KEYS.AVISOS, JSON.stringify(list));

    this.sendToBackend({
      action: 'guardarAviso',
      data: nuevo
    });

    return nuevo;
  },

  exportarListaGeneralCSV(): void {
    const familias = this.getFamilias();
    const headers = [
      'ID Familia',
      'Responsable / Tutor',
      'DNI Tutor',
      'Jerarquia',
      'Celular',
      'Numero de Casa',
      'Parada Fija Asignada',
      'ID Alumno',
      'Nombre del Alumno',
      'Establecimiento Escolar',
      'Grado / Año',
      'Turno'
    ];

    const rows: string[][] = [];

    familias.forEach((f) => {
      if (f.hijos.length === 0) {
        rows.push([
          f.id,
          f.nombreTutor,
          f.dni,
          f.jerarquia,
          f.celular,
          f.numeroCasa,
          f.paradaFija,
          '',
          '',
          '',
          '',
          ''
        ]);
      } else {
        f.hijos.forEach((h) => {
          rows.push([
            f.id,
            f.nombreTutor,
            f.dni,
            f.jerarquia,
            f.celular,
            f.numeroCasa,
            f.paradaFija,
            h.id,
            h.nombre,
            h.escuela,
            h.grado || 'No especificado',
            h.turno || 'Ambos'
          ]);
        });
      }
    });

    const csvContent =
      '\uFEFF' +
      [
        headers.map((h) => `"${h}"`).join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Lista_General_Recorrido_Tala_${getTodayDateStr()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
