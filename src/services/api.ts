import {
  Familia,
  HorarioDiarioHijo,
  CheckInSubida,
  AvisoAlerta,
  BackendStatus,
  PersonalStaff
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

export function getCurrentTimeStr(): string {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

const DEFAULT_BACKEND_URL =
  'https://script.google.com/macros/s/AKfycbyaRBe41sqNP7MtSyjnSar2XSTUODSYiS4QqaxxMH8F6DXjWnM_heRWh52rLRrqjcaQzA/exec';

export const apiService = {
  getBackendUrl(): string {
    return localStorage.getItem(STORAGE_KEYS.BACKEND_URL) || DEFAULT_BACKEND_URL;
  },

  setBackendUrl(url: string): void {
    localStorage.setItem(STORAGE_KEYS.BACKEND_URL, url.trim());
  },

  getAliasPago(): string {
    return localStorage.getItem(STORAGE_KEYS.ALIAS_PAGO) || 'recorrido.escolar.transporte';
  },

  setAliasPago(alias: string): void {
    localStorage.setItem(STORAGE_KEYS.ALIAS_PAGO, alias.trim());
  },

  getMontoCuota(): string {
    return localStorage.getItem(STORAGE_KEYS.MONTO_CUOTA) || '35.000';
  },

  setMontoCuota(monto: string): void {
    localStorage.setItem(STORAGE_KEYS.MONTO_CUOTA, monto.trim());
  },

  async checkHealth(targetUrl?: string): Promise<BackendStatus> {
    const url = targetUrl ?? this.getBackendUrl();
    const startTime = performance.now();

    if (!url) {
      return {
        online: true,
        mode: 'LOCAL_MOCK',
        timestamp: new Date().toISOString(),
        latencyMs: 12,
        message: 'Modo local activo (persistente en almacenamiento de navegador). Configura Google Apps Script para sincronizar en la nube.'
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
        message: `Fallo de conexión: ${err.message || 'Verifique los permisos de "Anyone" en Apps Script'}`
      };
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

    // Si hay Apps Script configurado, enviarlo en background
    const url = this.getBackendUrl();
    if (url) {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'registrarFamilia',
          data: familia
        }),
        mode: 'no-cors'
      }).catch((e) => console.warn('Error syncing with Apps Script:', e));
    }
  },

  deleteFamilia(id: string): void {
    const familias = this.getFamilias().filter((f) => f.id !== id);
    localStorage.setItem(STORAGE_KEYS.FAMILIAS, JSON.stringify(familias));
  },

  getPersonal(): PersonalStaff[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PERSONAL);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
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
  },

  deletePersonal(id: string): void {
    const list = this.getPersonal().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.PERSONAL, JSON.stringify(list));
  },

  checkAdminPassword(pass: string): boolean {
    const stored = localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD) || 'admin123';
    return pass.trim() === stored;
  },

  setAdminPassword(newPass: string): void {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, newPass.trim());
  },

  getHorariosDiarios(fecha: string = getTodayDateStr()): HorarioDiarioHijo[] {
    const raw = localStorage.getItem(STORAGE_KEYS.HORARIOS);
    const list: HorarioDiarioHijo[] = raw ? JSON.parse(raw) : [];
    return list.filter((h) => h.fecha === fecha);
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

    // Sync con Google Apps Script si está disponible
    const url = this.getBackendUrl();
    if (url) {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'guardarHorario',
          data: horario
        }),
        mode: 'no-cors'
      }).catch((e) => console.warn('Error syncing with Apps Script:', e));
    }
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
      horaMarcado: getCurrentTimeStr()
    };
    list.push(nuevo);
    localStorage.setItem(STORAGE_KEYS.CHECKINS, JSON.stringify(list));

    const url = this.getBackendUrl();
    if (url) {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'marcarSubida',
          data: nuevo
        }),
        mode: 'no-cors'
      }).catch((e) => console.warn('Error syncing with Apps Script:', e));
    }

    return nuevo;
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

    const url = this.getBackendUrl();
    if (url) {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'guardarAviso',
          data: nuevo
        }),
        mode: 'no-cors'
      }).catch((e) => console.warn('Error syncing with Apps Script:', e));
    }

    return nuevo;
  },

  marcarAvisosLeidos(): void {
    const avisos = this.getAvisos().map((a) => ({ ...a, leido: true }));
    localStorage.setItem(STORAGE_KEYS.AVISOS, JSON.stringify(avisos));
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
      `Lista_General_Recorrido_Escolar_${getTodayDateStr()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
