import React, { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';
import styles from './InstallBanner.module.css';

export const InstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if ((window as any).__pwaPrompt) {
      setDeferredPrompt((window as any).__pwaPrompt);
    }

    const onPromptReady = () => {
      setDeferredPrompt((window as any).__pwaPrompt);
    };

    window.addEventListener('pwa-prompt-ready', onPromptReady);
    return () => {
      window.removeEventListener('pwa-prompt-ready', onPromptReady);
    };
  }, []);

  if (isStandalone) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      alert(
        'Para instalar en tu iPhone o iPad:\n1. Toca el botón "Compartir" de Safari (el ícono del cuadrado con flecha hacia arriba en la barra inferior)\n2. Desliza hacia abajo y elige "Agregar a pantalla de inicio" 📲'
      );
    } else {
      alert(
        'Para instalar en este dispositivo:\nToca el menú de opciones de tu navegador (los 3 puntos arriba a la derecha) y presiona "Instalar aplicación" o "Agregar a pantalla de inicio".'
      );
    }
  };

  return (
    <div className={styles.installBanner}>
      <div className={styles.installBanner__content}>
        <div className={styles.installBanner__icon}>
          <Smartphone size={20} />
        </div>
        <div className={styles.installBanner__text}>
          <span className={styles.installBanner__title}>Instalar App en tu Celular o PC</span>
          <span className={styles.installBanner__desc}>
            Úsala sin abrir el navegador, más rápido y con acceso directo en tu pantalla
          </span>
        </div>
      </div>

      <button
        type="button"
        className={styles.installBanner__btn}
        onClick={handleInstallClick}
      >
        <Download size={14} />
        <span>Instalar Ahora</span>
      </button>
    </div>
  );
};

