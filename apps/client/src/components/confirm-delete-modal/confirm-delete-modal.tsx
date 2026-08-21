import { Button, Modal, Text } from '@gravity-ui/uikit';

import style from './confirm-delete-modal.module.css';

interface ConfirmDeleteModalProps {
  open: boolean;
  isLoading: boolean;
  title?: string;
  description?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDeleteModal({
  open,
  isLoading,
  title = 'Удалить заметку?',
  description = 'Это действие нельзя отменить.',
  onConfirm,
  onClose,
}: ConfirmDeleteModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}
    >
      <div
        className={style.container}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
      >
        <Text
          variant="header-1"
          id="confirm-delete-title"
        >
          {title}
        </Text>
        <Text>{description}</Text>
        <div className={style.actions}>
          <Button
            view="normal"
            size="m"
            onClick={onClose}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button
            view="outlined-danger"
            size="m"
            onClick={onConfirm}
            loading={isLoading}
          >
            Удалить
          </Button>
        </div>
      </div>
    </Modal>
  );
}
