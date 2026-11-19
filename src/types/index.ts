export type UserRole =
  | 'PADRE'
  | 'AUXILIAR'
  | 'ENCARGADA_CONTROL'
  | 'ENCARGADO_RECORRIDO'
  | 'SUPERADMIN';

export type Jerarquia = 'Oficial' | 'Suboficial';

export type BarrioTipo = 'Barrio de Suboficiales' | 'Barrio de Oficiales';

export interface ParadaInfo {
  id: string;
  nombre: string;
  barrio: BarrioTipo;
  numero: number;
}

export const PARADAS_SUBOFICIALES: ParadaInfo[] = [
  { id: 'sub-1', nombre: '1ra: Flia Ávalos', barrio: 'Barrio de Suboficiales', numero: 1 },
  { id: 'sub-2', nombre: '2da: Flia Juárez', barrio: 'Barrio de Suboficiales', numero: 2 },
  { id: 'sub-3', nombre: '3ra: Flia Franco', barrio: 'Barrio de Suboficiales', numero: 3 },
  { id: 'sub-4', nombre: '4ta: Flia González', barrio: 'Barrio de Suboficiales', numero: 4 },
];

export const PARADAS_OFICIALES: ParadaInfo[] = [
  { id: 'ofi-1', nombre: '1ra: Flia Bruzzo', barrio: 'Barrio de Oficiales', numero: 1 },
  { id: 'ofi-2', nombre: '2da: Flia Gallo', barrio: 'Barrio de Oficiales', numero: 2 },
];

export const TODAS_LAS_PARADAS: ParadaInfo[] = [
  ...PARADAS_SUBOFICIALES,
  ...PARADAS_OFICIALES,
];

export const HORARIOS_SALIDA_BARRIO: string[] = [
  '06:25',
  '07:20',
  '08:30',
  '11:40',
  '12:40',
  '13:40',
  '16:20',
  '17:20',
];

export const HORARIOS_SALIDA_CIUDAD: string[] = [
  '06:50',
  '07:45',
  '09:10',
  '12:10',
  '13:15',
  '16:00',
  '17:10',
  '18:20',
];

export interface Hijo {
  id: string;
  idFamilia: string;
  nombre: string;
  dni?: string;
  escuela: string;
  grado?: string;
  turno?: 'Mañana' | 'Tarde' | 'Doble';
}

export interface Familia {
  id: string;
  nombreTutor: string;
  dni: string;
  jerarquia: Jerarquia;
  celular: string;
  numeroCasa: string;
  paradaFija: string;
  fechaRegistro: string;
  hijos: Hijo[];
}

export interface PersonalStaff {
  id: string;
  nombre: string;
  dni: string;
  celular: string;
  rol: 'AUXILIAR' | 'ENCARGADA_CONTROL' | 'ENCARGADO_RECORRIDO';
  fechaRegistro: string;
}

export type SentidoRecorrido = 'SALIDA_BARRIO' | 'SALIDA_CIUDAD';

export interface HorarioDiarioHijo {
  idAlumno: string;
  nombreAlumno?: string;
  parada?: string;
  fecha: string; // YYYY-MM-DD
  horarioBarrio: string | 'NO_USA'; // Salida desde Barrio (Ida)
  horarioCiudad: string | 'NO_USA'; // Salida de la Ciudad (Vuelta)
  usaIda: boolean;
  usaVuelta: boolean;
  ultimaModificacion?: string;
}

export interface CheckInSubida {
  id: string;
  fecha: string;
  idAlumno: string;
  nombreAlumno: string;
  sentido: SentidoRecorrido;
  horario: string;
  parada: string;
  horaMarcado: string;
  horaBajada?: string;
  estado?: 'A_BORDO' | 'BAJO';
  responsableControl: string;
}

export interface AvisoAlerta {
  id: string;
  fecha: string;
  idAlumno: string;
  nombreAlumno: string;
  tipo: 'CANCELACION' | 'CAMBIO_HORARIO' | 'RETIRADO_ANTES';
  detalle: string;
  horarioAfectado: string;
  horaRegistro: string;
  leido: boolean;
}

export interface BackendStatus {
  online: boolean;
  mode: 'APPS_SCRIPT' | 'LOCAL_MOCK';
  timestamp?: string;
  latencyMs?: number;
  url?: string;
  message?: string;
}
