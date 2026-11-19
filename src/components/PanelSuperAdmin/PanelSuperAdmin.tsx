import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Trash2,
  RefreshCw,
  Download,
  KeyRound,
  UserCheck,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import styles from './PanelSuperAdmin.module.css';
import { Familia, PersonalStaff } from '../../types';
import { apiService } from '../../services/api';

interface PanelSuperAdminProps {
  onOpenRegisterPersonal: () => void;
}

export const PanelSuperAdmin: React.FC<PanelSuperAdminProps> = ({
  onOpenRegisterPersonal
}) => {
  const [activeTab, setActiveTab] = useState<'FAMILIAS' | 'ENCARGADAS' | 'ENCARGADOS' | 'AJUSTES'>(
    'FAMILIAS'
  );
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [personal, setPersonal] = useState<PersonalStaff[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = () => {
    setFamilias(apiService.getFamilias());
    setPersonal(apiService.getPersonal());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    const success = await apiService.syncWithBackend();
    loadData();
    setIsSyncing(false);
    showNotice(
      success
        ? '¡Datos sincronizados con Google Sheets correctamente!'
        : 'Sincronizado con base local.'
    );
  };

  const showNotice = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleDeleteFamilia = (id: string, nombre: string) => {
    if (
      window.confirm(
        `[SUPERADMIN] ¿Confirmas la eliminación permanente de la familia de ${nombre} y todos sus niños del sistema?`
      )
    ) {
      apiService.deleteFamilia(id);
      loadData();
      showNotice(`Familia de ${nombre} eliminada del sistema.`);
    }
  };

  const handleDeletePersonal = (id: string, nombre: string, rol: string) => {
    if (
      window.confirm(
        `[SUPERADMIN] ¿Confirmas la baja y eliminación de la encargada/personal ${nombre} (${rol})?`
      )
    ) {
      apiService.deletePersonal(id);
      loadData();
      showNotice(`${nombre} eliminada del padrón de personal.`);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    apiService.setAdminPassword(newPassword.trim());
    setNewPassword('');
    showNotice('Clave de SuperAdmin actualizada con éxito.');
  };

  const encargadas = personal.filter((p) => p.rol === 'ENCARGADA_CONTROL');
  const coordinadores = personal.filter((p) => p.rol === 'ENCARGADO_RECORRIDO');

  return (
    <div className={styles.superAdmin}>
      {/* Header SuperAdmin */}
      <div className={styles.superAdmin__header}>
        <div className={styles.superAdmin__titleGroup}>
          <div className={styles.superAdmin__icon}>
            <ShieldAlert size={26} />
          </div>
          <div>
            <h2 className={styles.superAdmin__title}>Panel de Control SuperAdmin</h2>
            <p className={styles.superAdmin__subtitle}>
              Administración central: eliminación de padres, reseteos y control de las encargadas
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            className={styles.superAdmin__btnAction}
            style={{ backgroundColor: '#2563eb', color: '#fff' }}
            onClick={handleSyncNow}
            disabled={isSyncing}
          >
            <RefreshCw size={14} className={isSyncing ? 'spin' : ''} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar con Google Sheets'}</span>
          </button>

          <button
            type="button"
            className={styles.superAdmin__btnAction}
            style={{ backgroundColor: '#059669', color: '#fff' }}
            onClick={() => apiService.exportarListaGeneralCSV()}
          >
            <Download size={14} />
            <span>Descargar Padrón CSV</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          style={{
            backgroundColor: '#dcfce7',
            border: '1px solid #86efac',
            color: '#15803d',
            padding: '10px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          <CheckCircle2 size={16} />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.superAdmin__navTabs}>
        <button
          type="button"
          className={`${styles.superAdmin__navTab} ${
            activeTab === 'FAMILIAS' ? styles['superAdmin__navTab--active'] : ''
          }`}
          onClick={() => setActiveTab('FAMILIAS')}
        >
          <Users size={16} />
          <span>Padres y Alumnos ({familias.length})</span>
        </button>

        <button
          type="button"
          className={`${styles.superAdmin__navTab} ${
            activeTab === 'ENCARGADAS' ? styles['superAdmin__navTab--active'] : ''
          }`}
          onClick={() => setActiveTab('ENCARGADAS')}
        >
          <UserCheck size={16} />
          <span>Encargadas de Control ({encargadas.length}/2)</span>
        </button>

        <button
          type="button"
          className={`${styles.superAdmin__navTab} ${
            activeTab === 'ENCARGADOS' ? styles['superAdmin__navTab--active'] : ''
          }`}
          onClick={() => setActiveTab('ENCARGADOS')}
        >
          <ShieldCheck size={16} />
          <span>Encargados de Recorrido ({coordinadores.length})</span>
        </button>

        <button
          type="button"
          className={`${styles.superAdmin__navTab} ${
            activeTab === 'AJUSTES' ? styles['superAdmin__navTab--active'] : ''
          }`}
          onClick={() => setActiveTab('AJUSTES')}
        >
          <KeyRound size={16} />
          <span>Seguridad y Clave Admin</span>
        </button>
      </div>

      {/* TAB 1: PADRES Y ALUMNOS */}
      {activeTab === 'FAMILIAS' && (
        <div className={styles.superAdmin__card}>
          <div className={styles.superAdmin__cardHeader}>
            <span style={{ fontWeight: 700 }}>Padrón Completo de Familias y Alumnos</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Total: {familias.length} familias
            </span>
          </div>

          <div className={styles.superAdmin__tableWrap}>
            <table className={styles.superAdmin__table}>
              <thead>
                <tr>
                  <th>Padre / Tutor</th>
                  <th>DNI</th>
                  <th>Celular</th>
                  <th>Casa</th>
                  <th>Parada Asignada</th>
                  <th>Hijos Registrados</th>
                  <th style={{ textAlign: 'right' }}>Eliminación</th>
                </tr>
              </thead>
              <tbody>
                {familias.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                      No hay familias registradas en el sistema.
                    </td>
                  </tr>
                ) : (
                  familias.map((f) => (
                    <tr key={f.id}>
                      <td style={{ fontWeight: 700 }}>
                        {f.nombreTutor} ({f.jerarquia})
                      </td>
                      <td>{f.dni}</td>
                      <td>{f.celular}</td>
                      <td>{f.numeroCasa || 'S/N'}</td>
                      <td style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{f.paradaFija}</td>
                      <td>
                        {f.hijos.map((h) => (
                          <div key={h.id} style={{ fontSize: '12px' }}>
                            • <strong>{h.nombre}</strong> ({h.escuela})
                          </div>
                        ))}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className={styles.superAdmin__btnDelete}
                          onClick={() => handleDeleteFamilia(f.id, f.nombreTutor)}
                          title="Eliminar familia y niños definitivamente"
                        >
                          <Trash2 size={13} />
                          <span>Eliminar Padre</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ENCARGADAS DE CONTROL */}
      {activeTab === 'ENCARGADAS' && (
        <div className={styles.superAdmin__card}>
          <div className={styles.superAdmin__cardHeader}>
            <div>
              <span style={{ fontWeight: 700 }}>Encargadas de Control en Colectivo (2 asignadas)</span>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
                Personal autorizado para marcar las subidas en viaje
              </p>
            </div>
            <button
              type="button"
              className={styles.superAdmin__btnAction}
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
              onClick={onOpenRegisterPersonal}
            >
              + Alta de Encargada
            </button>
          </div>

          <div className={styles.superAdmin__tableWrap}>
            <table className={styles.superAdmin__table}>
              <thead>
                <tr>
                  <th>Nombre y Apellido</th>
                  <th>DNI</th>
                  <th>Celular</th>
                  <th>Fecha de Registro</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {encargadas.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                      No hay encargadas de control registradas. Puedes registrar a las 2 encargadas con el botón de arriba.
                    </td>
                  </tr>
                ) : (
                  encargadas.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700 }}>{p.nombre}</td>
                      <td>{p.dni}</td>
                      <td>{p.celular}</td>
                      <td>{p.fechaRegistro}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className={styles.superAdmin__btnDelete}
                          onClick={() => handleDeletePersonal(p.id, p.nombre, 'Encargada de Control')}
                          title="Eliminar y dar de baja a la encargada"
                        >
                          <Trash2 size={13} />
                          <span>Eliminar Encargada</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ENCARGADOS DE RECORRIDO */}
      {activeTab === 'ENCARGADOS' && (
        <div className={styles.superAdmin__card}>
          <div className={styles.superAdmin__cardHeader}>
            <span style={{ fontWeight: 700 }}>Encargados de Recorrido / Choferes</span>
            <button
              type="button"
              className={styles.superAdmin__btnAction}
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
              onClick={onOpenRegisterPersonal}
            >
              + Alta de Encargado
            </button>
          </div>

          <div className={styles.superAdmin__tableWrap}>
            <table className={styles.superAdmin__table}>
              <thead>
                <tr>
                  <th>Nombre y Apellido</th>
                  <th>DNI</th>
                  <th>Celular</th>
                  <th>Fecha de Registro</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {coordinadores.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                      No hay encargados de recorrido registrados.
                    </td>
                  </tr>
                ) : (
                  coordinadores.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700 }}>{p.nombre}</td>
                      <td>{p.dni}</td>
                      <td>{p.celular}</td>
                      <td>{p.fechaRegistro}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className={styles.superAdmin__btnDelete}
                          onClick={() => handleDeletePersonal(p.id, p.nombre, 'Encargado de Recorrido')}
                        >
                          <Trash2 size={13} />
                          <span>Eliminar</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AJUSTES Y SEGURIDAD */}
      {activeTab === 'AJUSTES' && (
        <div className={styles.superAdmin__card} style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
            Cambiar Clave de Acceso SuperAdmin
          </h3>
          <form
            onSubmit={handleChangePassword}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '380px' }}
          >
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Nueva Clave Maestra</label>
            <input
              type="password"
              placeholder="Ingresa la nueva clave"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                padding: '10px',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              required
            />
            <button
              type="submit"
              className={styles.superAdmin__btnAction}
              style={{ backgroundColor: '#0f172a', color: '#fff', padding: '10px' }}
            >
              Guardar Nueva Clave
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
