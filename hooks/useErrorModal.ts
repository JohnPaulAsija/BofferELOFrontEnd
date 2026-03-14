import { useState } from 'react';

type ModalAction = {
  actionLabel: string;
  onAction: () => void;
};

type ModalState = {
  visible: boolean;
  title: string;
  message: string;
  variant: 'error' | 'info';
  action?: ModalAction;
  onAfterDismiss?: () => void;
};

const HIDDEN: ModalState = { visible: false, title: '', message: '', variant: 'error' };

export function useErrorModal() {
  const [modal, setModal] = useState<ModalState>(HIDDEN);

  function showError(title: string, message: string, action?: ModalAction, onAfterDismiss?: () => void) {
    setModal({ visible: true, title, message, variant: 'error', action, onAfterDismiss });
  }

  function showInfo(title: string, message: string, onAfterDismiss?: () => void) {
    setModal({ visible: true, title, message, variant: 'info', onAfterDismiss });
  }

  function hideModal() {
    const afterDismiss = modal.onAfterDismiss;
    setModal(prev => ({ ...prev, visible: false, action: undefined, onAfterDismiss: undefined }));
    afterDismiss?.();
  }

  return { modal, showError, showInfo, hideModal };
}
