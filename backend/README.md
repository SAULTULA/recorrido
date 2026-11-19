# Configuración de Backend Gratuito con Google Apps Script y Google Sheets

Este sistema utiliza **Google Sheets** como base de datos en la nube y **Google Apps Script** como servidor API REST, sin costo alguno y sin necesidad de servidores locales ni Firebase.

## Pasos para conectar en 2 minutos:

1. Ingresa a [Google Sheets](https://sheets.new) y crea una nueva hoja de cálculo llamada **"Recorrido Escolar - DB"**.
2. En el menú superior de la hoja, haz clic en **Extensiones** > **Apps Script**.
3. Borra el código existente en el archivo `Código.gs` y pega el contenido completo del archivo `backend/Code.gs`.
4. Arriba en la barra de herramientas de Apps Script, selecciona la función `initSheets` y haz clic en **Ejecutar** (te pedirá permisos de tu cuenta de Google la primera vez). Esto creará automáticamente todas las pestañas: *Familias*, *Alumnos*, *Horarios_Diarios*, *Subidas_CheckIn*, *Avisos_Alertas*.
5. Haz clic en el botón azul **Implementar** (arriba a la derecha) > **Nueva implementación**.
6. Selecciona tipo: **Aplicación web**.
   - **Descripción**: API Recorrido Escolar
   - **Ejecutar como**: Yo (tu correo)
   - **Quién tiene acceso**: **Cualquier usuario (Anyone)** *(Importante para que la app web pueda consultar y enviar datos sin pedir login de Google)*.
7. Haz clic en **Implementar** y copia la **URL de la aplicación web** (termina en `/exec`).
8. Pega esa URL en el botón de **Configuración / Estado del Backend** de la aplicación web. ¡Listo! El botón de "Verificar Backend" se pondrá en verde.

> **Nota**: La app incluye un modo dual inteligente: si aún no has cargado la URL de Google Sheets, funciona inmediatamente con almacenamiento local persistente y datos precargados para que puedas probar todas las funciones al instante.

