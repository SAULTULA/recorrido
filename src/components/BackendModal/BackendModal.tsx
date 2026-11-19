import React, { useState } from 'react';
import { Server, CheckCircle2, AlertTriangle, XCircle, RefreshCw, X } from 'lucide-react';
import styles from './BackendModal.module.css';
import { BackendStatus } from '../../types';
import { apiService } from '../../services/api';

interface BackendModalProps {
  status: BackendStatus;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (status: BackendStatus) => void;
}

export const BackendModal: React.FC<BackendModalProps> = ({
  status,
  isOpen,
  onClose,
  onStatusUpdate
}) => {
  const [urlInput, setUrlInput] = useState(apiService.getBackendUrl());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<BackendStatus | null>(null);

  if (!isOpen) return null;

  const currentStatus = testResult || status;

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const result = await apiService.checkHealth(urlInput.trim());
      setTestResult(result);
      onStatusUpdate(result);
      if (urlInput.trim()) {
        apiService.setBackendUrl(urlInput.trim());
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSaveUrl = () => {
    apiService.setBackendUrl(urlInput.trim());
    handleTestConnection();
  };

  return (
    <div className={styles.backendModal} onClick={onClose}>
      <div className={styles.backendModal__card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.backendModal__header}>
          <div className={styles.backendModal__titleGroup}>
            <div className={styles.backendModal__icon}>
              <Server size={20} />
            </div>
            <h2 className={styles.backendModal__title}>Control del Backend</h2>
          </div>
          <button className={styles.backendModal__closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.backendModal__body}>
          {/* Status Box */}
          <div
            className={`${styles.backendModal__statusBox} ${
              !currentStatus.online
                ? styles['backendModal__statusBox--error']
                : currentStatus.mode === 'APPS_SCRIPT'
                ? styles['backendModal__statusBox--success']
                : styles['backendModal__statusBox--warning']
            }`}
          >
            {!currentStatus.online ? (
              <XCircle size={28} />
            ) : currentStatus.mode === 'APPS_SCRIPT' ? (
              <CheckCircle2 size={28} />
            ) : (
              <AlertTriangle size={28} />
            )}

            <div className={styles.backendModal__statusText}>
              <div className={styles.backendModal__statusTitle}>
                {!currentStatus.online
                  ? 'Sin conexión con el Backend'
                  : currentStatus.mode === 'APPS_SCRIPT'
                  ? 'Google Apps Script Conectado y Operativo'
                  : 'Modo Local Persistente Activo'}
              </div>
              <div className={styles.backendModal__statusDesc}>
                {currentStatus.message}
              </div>
              {currentStatus.latencyMs !== undefined && (
                <div className={styles.backendModal__statusDesc}>
                  Latencia de respuesta: <strong>{currentStatus.latencyMs} ms</strong>
                </div>
              )}
            </div>
          </div>

          {/* URL Input */}
          <div className={styles.backendModal__formGroup}>
            <label className={styles.backendModal__label}>
              URL de la Aplicación Web (Google Apps Script)
            </label>
            <input
              type="text"
              className={styles.backendModal__input}
              placeholder="https://script.google.com/macros/s/.../exec"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
            <p className={styles.backendModal__hint}>
              Si dejas este campo vacío, la aplicación funcionará de manera 100% local en tu navegador con datos persistentes de demostración. Al colocar la URL de tu Google Apps Script publicado con acceso público, sincronizará directamente con tu planilla de Google Sheets.
            </p>
          </div>
        </div>

        <div className={styles.backendModal__footer}>
          <button
            className={`${styles.backendModal__btn} ${styles['backendModal__btn--secondary']}`}
            onClick={onClose}
          >
            Cerrar
          </button>
          <button
            className={`${styles.backendModal__btn} ${styles['backendModal__btn--primary']}`}
            onClick={handleSaveUrl}
            disabled={testing}
          >
            <RefreshCw size={16} className={testing ? 'spin' : ''} />
            <span>{testing ? 'Verificando...' : 'Probar y Guardar Conexión'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
