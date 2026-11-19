/**
 * ==========================================================================
 * SISTEMA DE GESTIÓN DE RECORRIDO ESCOLAR - BACKEND GOOGLE APPS SCRIPT
 * ==========================================================================
 * Este script se vincula a una hoja de cálculo de Google Sheets.
 * Proporciona una API REST JSON para:
 * 1. Health check (Botón de comprobación en la app)
 * 2. Registro de Familias, Tutores e Hijos
 * 3. Selección y Modificación de Horarios Diarios
 * 4. Control de Abordaje (Check-in de Subida) en tiempo real
 * 5. Registro de Alertas y Notificaciones de Cancelación
 * 6. Historial de Pagos y Recordatorios de Cuota
 * ==========================================================================
 */

const SHEET_NAMES = {
  HEALTH: 'Sistema',
  FAMILIAS: 'Familias',
  ALUMNOS: 'Alumnos',
  DIARIO: 'Horarios_Diarios',
  CHECKIN: 'Subidas_CheckIn',
  AVISOS: 'Avisos_Alertas',
  CONFIG: 'Configuracion'
};

/**
 * Inicializa las pestañas de la hoja de cálculo si no existen
 */
function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Familias
  getOrCreateSheet(ss, SHEET_NAMES.FAMILIAS, [
    'ID_Familia', 'Nombre_Tutor', 'DNI', 'Jerarquia', 'Celular', 'Numero_Casa', 'Parada_Fija', 'Fecha_Registro'
  ]);
  
  // 2. Alumnos
  getOrCreateSheet(ss, SHEET_NAMES.ALUMNOS, [
    'ID_Alumno', 'ID_Familia', 'Nombre_Alumno', 'DNI_Alumno', 'Escuela', 'Turno', 'Fecha_Alta'
  ]);
  
  // 3. Diario
  getOrCreateSheet(ss, SHEET_NAMES.DIARIO, [
    'ID_Diario', 'Fecha', 'ID_Alumno', 'Nombre_Alumno', 'Parada', 'Horario_Barrio', 'Horario_Ciudad', 'Usa_Ida', 'Usa_Vuelta', 'Ultima_Modificacion'
  ]);
  
  // 4. CheckIn
  getOrCreateSheet(ss, SHEET_NAMES.CHECKIN, [
    'ID_CheckIn', 'Fecha', 'ID_Alumno', 'Nombre_Alumno', 'Sentido', 'Horario', 'Parada', 'Hora_Marcado', 'Responsable_Control'
  ]);
  
  // 5. Avisos / Alertas
  getOrCreateSheet(ss, SHEET_NAMES.AVISOS, [
    'ID_Aviso', 'Fecha', 'ID_Alumno', 'Nombre_Alumno', 'Tipo', 'Detalle', 'Hora_Registro', 'Leido'
  ]);
}

function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#2d3748').setFontColor('#ffffff');
  }
  return sheet;
}

/**
 * Manejador de peticiones GET (Lectura y Health Check)
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'health';
    
    if (action === 'health') {
      return jsonResponse({
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        service: 'Recorrido Escolar API - Google Apps Script',
        serverTime: Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy HH:mm:ss')
      });
    }
    
    if (action === 'getAllData') {
      return jsonResponse(getAllData());
    }
    
    if (action === 'getDiario') {
      const fecha = e.parameter.fecha || getTodayStr();
      return jsonResponse(getDiarioData(fecha));
    }
    
    return jsonResponse({ error: 'Acción GET no reconocida' }, 400);
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

/**
 * Manejador de peticiones POST (Creación, modificación y CheckIn)
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    
    if (action === 'registrarFamilia') {
      return jsonResponse(registrarFamilia(postData.data));
    }
    
    if (action === 'guardarHorario') {
      return jsonResponse(guardarHorarioDiario(postData.data));
    }
    
    if (action === 'marcarSubida') {
      return jsonResponse(marcarSubida(postData.data));
    }
    
    if (action === 'guardarAviso') {
      return jsonResponse(guardarAviso(postData.data));
    }
    
    return jsonResponse({ error: 'Acción POST no reconocida' }, 400);
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

function registrarFamilia(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetFamilias = ss.getSheetByName(SHEET_NAMES.FAMILIAS);
  const sheetAlumnos = ss.getSheetByName(SHEET_NAMES.ALUMNOS);
  
  const idFamilia = 'FAM-' + new Date().getTime();
  const fecha = new Date().toISOString();
  
  sheetFamilias.appendRow([
    idFamilia,
    data.nombreTutor,
    data.dni,
    data.jerarquia || 'Oficial/Suboficial',
    data.celular,
    data.numeroCasa,
    data.paradaFija,
    fecha
  ]);
  
  const alumnosIds = [];
  if (data.hijos && Array.isArray(data.hijos)) {
    data.hijos.forEach((hijo, idx) => {
      const idAlumno = 'ALU-' + new Date().getTime() + '-' + idx;
      sheetAlumnos.appendRow([
        idAlumno,
        idFamilia,
        hijo.nombre,
        hijo.dni || '',
        hijo.escuela,
        hijo.turno || 'Ambos',
        fecha
      ]);
      alumnosIds.push(idAlumno);
    });
  }
  
  return { success: true, idFamilia: idFamilia, alumnosCount: alumnosIds.length };
}

function guardarHorarioDiario(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetDiario = ss.getSheetByName(SHEET_NAMES.DIARIO);
  const fecha = data.fecha || getTodayStr();
  const idDiario = 'DIA-' + new Date().getTime();
  
  sheetDiario.appendRow([
    idDiario,
    fecha,
    data.idAlumno,
    data.nombreAlumno,
    data.parada,
    data.horarioBarrio || '',
    data.horarioCiudad || '',
    data.usaIda ? 'SI' : 'NO',
    data.usaVuelta ? 'SI' : 'NO',
    new Date().toISOString()
  ]);
  
  return { success: true, idDiario: idDiario };
}

function marcarSubida(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetCheckIn = ss.getSheetByName(SHEET_NAMES.CHECKIN);
  const idCheckIn = 'CHK-' + new Date().getTime();
  
  sheetCheckIn.appendRow([
    idCheckIn,
    data.fecha || getTodayStr(),
    data.idAlumno,
    data.nombreAlumno,
    data.sentido, // 'BARRIO_A_CIUDAD' o 'CIUDAD_A_BARRIO'
    data.horario,
    data.parada,
    new Date().toISOString(),
    data.responsableControl || 'Encargada'
  ]);
  
  return { success: true, idCheckIn: idCheckIn };
}

function guardarAviso(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetAvisos = ss.getSheetByName(SHEET_NAMES.AVISOS);
  const idAviso = 'AVI-' + new Date().getTime();
  
  sheetAvisos.appendRow([
    idAviso,
    data.fecha || getTodayStr(),
    data.idAlumno,
    data.nombreAlumno,
    data.tipo || 'SUSPENSION_O_CAMBIO',
    data.detalle,
    new Date().toISOString(),
    'NO'
  ]);
  
  return { success: true, idAviso: idAviso };
}

function getAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    familias: sheetToObjects(ss.getSheetByName(SHEET_NAMES.FAMILIAS)),
    alumnos: sheetToObjects(ss.getSheetByName(SHEET_NAMES.ALUMNOS)),
    diario: sheetToObjects(ss.getSheetByName(SHEET_NAMES.DIARIO)),
    checkins: sheetToObjects(ss.getSheetByName(SHEET_NAMES.CHECKIN)),
    avisos: sheetToObjects(ss.getSheetByName(SHEET_NAMES.AVISOS))
  };
}

function sheetToObjects(sheet) {
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  const headers = rows[0];
  const results = [];
  for (let i = 1; i < rows.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = rows[i][j];
    }
    results.push(obj);
  }
  return results;
}

function getTodayStr() {
  return Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'yyyy-MM-dd');
}

function jsonResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

