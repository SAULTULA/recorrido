import React, { useState, useEffect } from 'react';
import styles from './App.module.css';
import { UserRole, Familia, BackendStatus } from './types';
import { apiService } from './services/api';
import { Navbar } from './components/Navbar/Navbar';
import { LoginModal } from './components/LoginModal/LoginModal';
import { RegistroPadre } from './components/RegistroPadre/RegistroPadre';
import { PanelPadre } from './components/PanelPadre/PanelPadre';
import { PanelEncargada } from './components/PanelEncargada/PanelEncargada';
import { PanelEncargadoRecorrido } from './components/PanelEncargadoRecorrido/PanelEncargadoRecorrido';
import { BackendModal } from './components/BackendModal/BackendModal';

export const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userDni, setUserDni] = useState<string>('');
  const [currentFamilia, setCurrentFamilia] = useState<Familia | null>(null);

  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState<boolean>(false);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    online: true,
    mode: 'LOCAL_MOCK',
    latencyMs: 15,
    message: 'Modo local activo. Conexión lista.'
  });

  // Determinar si son las 20:00 hs o posterior
  const [isNightTime, setIsNightTime] = useState<boolean>(false);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hour = now.getHours();
      // Recordatorio activo desde las 20:00 hs en adelante
      setIsNightTime(hour >= 20 || hour < 6);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Verificar backend al iniciar
  useEffect(() => {
    apiService.checkHealth().then((status) => {
      setBackendStatus(status);
    });
  }, []);

  const handleLogin = (
    role: UserRole,
    nombre: string,
    dni: string,
    familia?: Familia
  ) => {
    setCurrentRole(role);
    setUserName(nombre);
    setUserDni(dni);

    if (role === 'PADRE') {
      if (familia) {
        setCurrentFamilia(familia);
      } else {
        // No tiene registro, abrir formulario de registro
        setIsRegistering(true);
      }
    }
  };

  const handleLogout = () => {
    setCurrentRole(null);
    setUserName('');
    setUserDni('');
    setCurrentFamilia(null);
    setIsRegistering(false);
  };

  const handleRegisterSuccess = (familia: Familia) => {
    setCurrentFamilia(familia);
    setCurrentRole('PADRE');
    setUserName(familia.nombreTutor);
    setUserDni(familia.dni);
    setIsRegistering(false);
  };

  return (
    <div className={styles.app}>
      <Navbar
        currentRole={currentRole}
        userName={userName}
        backendStatus={backendStatus}
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
        onLogout={handleLogout}
        isNightTime={isNightTime}
      />

      <main className={styles.app__main}>
        {/* Caso 1: Pantalla de Registro de Padre */}
        {isRegistering ? (
          <RegistroPadre
            initialDni={userDni}
            initialNombre={userName}
            onSuccess={handleRegisterSuccess}
            onCancel={() => setIsRegistering(false)}
          />
        ) : !currentRole ? (
          /* Caso 2: Login con Nombre + DNI + Rol */
          <LoginModal
            onLogin={handleLogin}
            onGoToRegister={() => setIsRegistering(true)}
          />
        ) : currentRole === 'PADRE' && currentFamilia ? (
          /* Caso 3: Panel del Padre */
          <PanelPadre familia={currentFamilia} isNightTime={isNightTime} />
        ) : currentRole === 'ENCARGADA_CONTROL' ? (
          /* Caso 4: Panel de la Encargada de Control */
          <PanelEncargada controllerName={userName} />
        ) : currentRole === 'ENCARGADO_RECORRIDO' ? (
          /* Caso 5: Panel del Encargado de Recorrido */
          <PanelEncargadoRecorrido />
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
            Error al cargar vista. Por favor vuelva a iniciar sesión.
            <button
              onClick={handleLogout}
              style={{ display: 'block', margin: '16px auto', color: 'var(--color-primary)' }}
            >
              Reiniciar sesión
            </button>
          </div>
        )}
      </main>

      <footer className={styles.app__footer}>
        <div className={styles.app__footerContainer}>
          <span>
            Recorrido Escolar • Control de Transporte Escolar Tala
          </span>
          <span>
            Desarrollado con Google Apps Script & Sheets • Seguro, gratuito y sin servidores
          </span>
        </div>
      </footer>

      {/* Modal de Control y Salud del Backend */}
      <BackendModal
        isOpen={isBackendModalOpen}
        status={backendStatus}
        onClose={() => setIsBackendModalOpen(false)}
        onStatusUpdate={(newStatus) => setBackendStatus(newStatus)}
      />
    </div>
  );
};
export default App;
