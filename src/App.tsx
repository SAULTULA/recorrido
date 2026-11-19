import React, { useState, useEffect } from 'react';
import styles from './App.module.css';
import { UserRole, Familia, BackendStatus, PersonalStaff } from './types';
import { apiService } from './services/api';
import { Navbar } from './components/Navbar/Navbar';
import { LoginModal } from './components/LoginModal/LoginModal';
import { RegistroPadre } from './components/RegistroPadre/RegistroPadre';
import { RegistroPersonal } from './components/RegistroPersonal/RegistroPersonal';
import { PanelPadre } from './components/PanelPadre/PanelPadre';
import { PanelEncargada } from './components/PanelEncargada/PanelEncargada';
import { PanelEncargadoRecorrido } from './components/PanelEncargadoRecorrido/PanelEncargadoRecorrido';
import { BackendModal } from './components/BackendModal/BackendModal';

export const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userDni, setUserDni] = useState<string>('');
  const [currentFamilia, setCurrentFamilia] = useState<Familia | null>(null);

  const [isRegisteringPadre, setIsRegisteringPadre] = useState<boolean>(false);
  const [isRegisteringPersonal, setIsRegisteringPersonal] = useState<boolean>(false);
  const [defaultPersonalRole, setDefaultPersonalRole] = useState<
    'ENCARGADA_CONTROL' | 'ENCARGADO_RECORRIDO'
  >('ENCARGADA_CONTROL');

  const [isBackendModalOpen, setIsBackendModalOpen] = useState<boolean>(false);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    online: true,
    mode: 'APPS_SCRIPT',
    latencyMs: 15,
    message: 'Google Apps Script conectado.'
  });

  const [isNightTime, setIsNightTime] = useState<boolean>(false);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hour = now.getHours();
      setIsNightTime(hour >= 20 || hour < 6);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

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

    if (role === 'PADRE' && familia) {
      setCurrentFamilia(familia);
    }
  };

  const handleLogout = () => {
    setCurrentRole(null);
    setUserName('');
    setUserDni('');
    setCurrentFamilia(null);
    setIsRegisteringPadre(false);
    setIsRegisteringPersonal(false);
  };

  const handleRegisterPadreSuccess = (familia: Familia) => {
    setCurrentFamilia(familia);
    setCurrentRole('PADRE');
    setUserName(familia.nombreTutor);
    setUserDni(familia.dni);
    setIsRegisteringPadre(false);
  };

  const handleRegisterPersonalSuccess = (staff: PersonalStaff) => {
    setCurrentRole(staff.rol);
    setUserName(staff.nombre);
    setUserDni(staff.dni);
    setIsRegisteringPersonal(false);
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
        {isRegisteringPadre ? (
          <RegistroPadre
            initialDni={userDni}
            initialNombre={userName}
            onSuccess={handleRegisterPadreSuccess}
            onCancel={() => setIsRegisteringPadre(false)}
          />
        ) : isRegisteringPersonal ? (
          /* Caso 2: Pantalla de Registro de Personal (Encargada / Encargado) */
          <RegistroPersonal
            defaultRole={defaultPersonalRole}
            onSuccess={handleRegisterPersonalSuccess}
            onCancel={() => setIsRegisteringPersonal(false)}
          />
        ) : !currentRole ? (
          /* Caso 3: Login con Validación Estricta de Registro Previo */
          <LoginModal
            onLogin={handleLogin}
            onGoToRegisterPadre={() => setIsRegisteringPadre(true)}
            onGoToRegisterPersonal={(role) => {
              setDefaultPersonalRole(role);
              setIsRegisteringPersonal(true);
            }}
          />
        ) : currentRole === 'PADRE' && currentFamilia ? (
          /* Caso 4: Panel del Padre con Botonera, Envío de Horarios y Estado de Subida */
          <PanelPadre familia={currentFamilia} isNightTime={isNightTime} />
        ) : currentRole === 'ENCARGADA_CONTROL' ? (
          /* Caso 5: Panel de la Encargada de Control */
          <PanelEncargada controllerName={userName} />
        ) : currentRole === 'ENCARGADO_RECORRIDO' ? (
          /* Caso 6: Panel del Encargado de Recorrido (con bajas de usuarios y encargadas) */
          <PanelEncargadoRecorrido
            isSuperAdmin={false}
            onOpenRegisterPersonal={() => {
              setDefaultPersonalRole('ENCARGADA_CONTROL');
              setIsRegisteringPersonal(true);
            }}
          />
        ) : currentRole === 'SUPERADMIN' ? (
          /* Caso 7: Panel del SuperAdmin (control y eliminación total) */
          <PanelEncargadoRecorrido
            isSuperAdmin={true}
            onOpenRegisterPersonal={() => {
              setDefaultPersonalRole('ENCARGADA_CONTROL');
              setIsRegisteringPersonal(true);
            }}
          />
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
