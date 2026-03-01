import { useState } from 'react';

type ModalState = {
  visible: boolean;
  title: string;
  message: string;
  variant: 'error' | 'info';
  onAfterDismiss?: () => void;
};

const HIDDEN: ModalState = { visible: false, title: '', message: '', variant: 'error' };

export function useErrorModal() {
  const [modal, setModal] = useState<ModalState>(HIDDEN);

  function showError(title: string, message: string, onAfterDismiss?: () => void) {
    setModal({ visible: true, title, message, variant: 'error', onAfterDismiss });
  }

  function showInfo(title: string, message: string, onAfterDismiss?: () => void) {
    setModal({ visible: true, title, message, variant: 'info', onAfterDismiss });
  }

  function hideModal() {
    const afterDismiss = modal.onAfterDismiss;
    setModal(prev => ({ ...prev, visible: false, onAfterDismiss: undefined }));
    afterDismiss?.();
  }

  return { modal, showError, showInfo, hideModal };
}
