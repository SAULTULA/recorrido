/**
 * ==========================================================================
 * SISTEMA DE GESTIÓN DE TRANSPORTE ESCOLAR TALA - GOOGLE APPS SCRIPT
 * ==========================================================================
 */

const SHEET_NAMES = {
  HEALTH: 'Sistema',
  FAMILIAS: 'Familias',
  ALUMNOS: 'Alumnos',
  PERSONAL: 'Personal',
  DIARIO: 'Horarios_Diarios',
  CHECKIN: 'Subidas_CheckIn',
  AVISOS: 'Avisos_Alertas'
};

function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  getOrCreateSheet(ss, SHEET_NAMES.FAMILIAS, [
    'ID_Familia', 'Nombre_Tutor', 'DNI', 'Jerarquia', 'Celular', 'Numero_Casa', 'Parada_Fija', 'Fecha_Registro'
  ]);
  
  getOrCreateSheet(ss, SHEET_NAMES.ALUMNOS, [
    'ID_Alumno', 'ID_Familia', 'Nombre_Alumno', 'DNI_Alumno', 'Escuela', 'Turno', 'Fecha_Alta'
  ]);

  getOrCreateSheet(ss, SHEET_NAMES.PERSONAL, [
    'ID_Personal', 'Nombre', 'DNI', 'Celular', 'Rol', 'Fecha_Alta'
  ]);
  
  getOrCreateSheet(ss, SHEET_NAMES.DIARIO, [
    'ID_Diario', 'Fecha', 'ID_Alumno', 'Nombre_Alumno', 'Parada', 'Horario_Barrio', 'Horario_Ciudad', 'Usa_Ida', 'Usa_Vuelta', 'Ultima_Modificacion'
  ]);
  
  getOrCreateSheet(ss, SHEET_NAMES.CHECKIN, [
    'ID_CheckIn', 'Fecha', 'ID_Alumno', 'Nombre_Alumno', 'Sentido', 'Horario', 'Parada', 'Hora_Marcado', 'Responsable_Control'
  ]);
  
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
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1e3a8a').setFontColor('#ffffff');
  }
  return sheet;
}

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'health';
    
    if (action === 'health') {
      return jsonResponse({
        status: 'ok',
        version: '1.2.0',
        timestamp: new Date().toISOString(),
        service: 'Transporte Escolar Tala API',
        serverTime: Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy HH:mm:ss')
      });
    }
    
    if (action === 'getAllData') {
      return jsonResponse(getAllData());
    }
    
    return jsonResponse({ error: 'Accion GET no reconocida' }, 400);
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    
    if (action === 'registrarFamilia') {
      return jsonResponse(registrarFamilia(postData.data));
    }
    
    if (action === 'registrarPersonal') {
      return jsonResponse(registrarPersonal(postData.data));
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

    if (action === 'eliminarFamilia') {
      return jsonResponse(eliminarFamilia(postData.idFamilia || postData.id));
    }

    if (action === 'eliminarPersonal') {
      return jsonResponse(eliminarPersonal(postData.idPersonal || postData.id));
    }
    
    return jsonResponse({ error: 'Accion POST no reconocida' }, 400);
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

function registrarFamilia(data) {
  initSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetFamilias = ss.getSheetByName(SHEET_NAMES.FAMILIAS);
  const sheetAlumnos = ss.getSheetByName(SHEET_NAMES.ALUMNOS);
  
  const idFamilia = data.id || ('FAM-' + new Date().getTime());
  const fecha = new Date().toISOString();
  
  sheetFamilias.appendRow([
    idFamilia,
    data.nombreTutor,
    "'" + String(data.dni).trim(),
    data.jerarquia || 'Suboficial',
    "'" + String(data.celular).trim(),
    data.numeroCasa || '',
    data.paradaFija,
    fecha
  ]);
  
  if (data.hijos && Array.isArray(data.hijos)) {
    data.hijos.forEach((hijo, idx) => {
      const idAlumno = hijo.id || ('ALU-' + new Date().getTime() + '-' + idx);
      sheetAlumnos.appendRow([
        idAlumno,
        idFamilia,
        hijo.nombre,
        hijo.dni ? ("'" + hijo.dni) : '',
        hijo.escuela,
        hijo.turno || 'Ambos',
        fecha
      ]);
    });
  }
  
  return { success: true, idFamilia: idFamilia };
}

function registrarPersonal(data) {
  initSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetPersonal = ss.getSheetByName(SHEET_NAMES.PERSONAL);
  const idPersonal = data.id || ('STAFF-' + new Date().getTime());
  
  sheetPersonal.appendRow([
    idPersonal,
    data.nombre,
    "'" + String(data.dni).trim(),
    "'" + String(data.celular).trim(),
    data.rol,
    new Date().toISOString()
  ]);
  
  return { success: true, idPersonal: idPersonal };
}

function guardarHorarioDiario(data) {
  initSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetDiario = ss.getSheetByName(SHEET_NAMES.DIARIO);
  const fecha = data.fecha || Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'yyyy-MM-dd');
  const idDiario = 'DIA-' + new Date().getTime();
  
  sheetDiario.appendRow([
    idDiario,
    fecha,
    data.idAlumno,
    data.nombreAlumno || '',
    data.parada || '',
    "'" + (data.horarioBarrio || ''),
    "'" + (data.horarioCiudad || ''),
    data.usaIda ? 'SI' : 'NO',
    data.usaVuelta ? 'SI' : 'NO',
    new Date().toISOString()
  ]);
  
  return { success: true, idDiario: idDiario };
}

function marcarSubida(data) {
  initSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetCheckIn = ss.getSheetByName(SHEET_NAMES.CHECKIN);
  const idCheckIn = 'CHK-' + new Date().getTime();
  
  sheetCheckIn.appendRow([
    idCheckIn,
    data.fecha || Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'yyyy-MM-dd'),
    data.idAlumno,
    data.nombreAlumno,
    data.sentido,
    "'" + data.horario,
    data.parada,
    new Date().toISOString(),
    data.responsableControl || 'Encargada'
  ]);
  
  return { success: true, idCheckIn: idCheckIn };
}

function guardarAviso(data) {
  initSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetAvisos = ss.getSheetByName(SHEET_NAMES.AVISOS);
  const idAviso = 'AVI-' + new Date().getTime();
  
  sheetAvisos.appendRow([
    idAviso,
    data.fecha || Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'yyyy-MM-dd'),
    data.idAlumno,
    data.nombreAlumno,
    data.tipo || 'CAMBIO_HORARIO',
    data.detalle,
    new Date().toISOString(),
    'NO'
  ]);
  
  return { success: true, idAviso: idAviso };
}

function eliminarFamilia(idFamilia) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  deleteRowByColumnValue(ss.getSheetByName(SHEET_NAMES.FAMILIAS), 0, idFamilia);
  deleteRowByColumnValue(ss.getSheetByName(SHEET_NAMES.ALUMNOS), 1, idFamilia);
  return { success: true };
}

function eliminarPersonal(idPersonal) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  deleteRowByColumnValue(ss.getSheetByName(SHEET_NAMES.PERSONAL), 0, idPersonal);
  return { success: true };
}

function deleteRowByColumnValue(sheet, colIndex, value) {
  if (!sheet) return;
  const values = sheet.getDataRange().getValues();
  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][colIndex]).trim() === String(value).trim()) {
      sheet.deleteRow(i + 1);
    }
  }
}

function getAllData() {
  initSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    familias: sheetToObjects(ss.getSheetByName(SHEET_NAMES.FAMILIAS)),
    alumnos: sheetToObjects(ss.getSheetByName(SHEET_NAMES.ALUMNOS)),
    personal: sheetToObjects(ss.getSheetByName(SHEET_NAMES.PERSONAL)),
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
      let val = rows[i][j];
      if (val instanceof Date) {
        val = val.toISOString();
      }
      obj[headers[j]] = val;
    }
    results.push(obj);
  }
  return results;
}

function jsonResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
