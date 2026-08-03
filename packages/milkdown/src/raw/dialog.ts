import type { CherryRawEditRequest } from './types.js';

export interface CherryRawDialog {
  open(request: CherryRawEditRequest): void;
  destroy(): void;
}

export function createCherryRawDialog(owner: HTMLElement): CherryRawDialog {
  const dialog = document.createElement('dialog');
  dialog.className = 'cherry-milkdown-raw-dialog';
  dialog.innerHTML = `
    <form method="dialog" class="cherry-milkdown-raw-dialog__form">
      <header class="cherry-milkdown-raw-dialog__header">
        <strong class="cherry-milkdown-raw-dialog__title"></strong>
        <button type="button" data-action="cancel" aria-label="Close">×</button>
      </header>
      <textarea class="cherry-milkdown-raw-dialog__source" spellcheck="false"></textarea>
      <footer class="cherry-milkdown-raw-dialog__footer">
        <button type="button" data-action="cancel">Cancel</button>
        <button type="submit" data-action="save">Save</button>
      </footer>
    </form>`;
  owner.appendChild(dialog);
  const title = dialog.querySelector<HTMLElement>('.cherry-milkdown-raw-dialog__title');
  const textarea = dialog.querySelector<HTMLTextAreaElement>('textarea');
  const form = dialog.querySelector<HTMLFormElement>('form');
  let request: CherryRawEditRequest | null = null;

  const close = () => {
    request = null;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  };
  const cancel = () => close();
  dialog.querySelectorAll<HTMLElement>('[data-action="cancel"]').forEach((button) => {
    button.addEventListener('click', cancel);
  });
  dialog.addEventListener('cancel', () => {
    request = null;
  });
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (request && textarea) request.save(textarea.value);
    close();
  });

  return {
    open(nextRequest) {
      request = nextRequest;
      if (title) title.textContent = nextRequest.syntax;
      if (textarea) textarea.value = nextRequest.source;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      textarea?.focus();
      textarea?.select();
    },
    destroy() {
      dialog.remove();
      request = null;
    },
  };
}
