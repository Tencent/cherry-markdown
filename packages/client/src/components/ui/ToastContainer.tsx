import { defineComponent, h, Teleport, TransitionGroup } from 'vue';
import { useToast, type ToastItem } from '../composables/useToast';
import './ui.css';

const getTypeClass = (type: ToastItem['type']): string => `toast-${type}`;

export default defineComponent({
  name: 'ToastContainer',
  setup() {
    const { toasts, removeToast } = useToast();

    return () =>
      h(Teleport, { to: 'body' }, [
        h('div', { class: 'toast-container' }, [
          h(
            TransitionGroup,
            { name: 'toast' },
            {
              default: () =>
                toasts.value.map((toast) =>
                  h(
                    'div',
                    {
                      key: toast.id,
                      class: ['toast-item', getTypeClass(toast.type)],
                      onClick: () => removeToast(toast.id),
                    },
                    [
                      h('span', { class: 'toast-message' }, toast.message),
                      h(
                        'button',
                        {
                          class: 'toast-close',
                          onClick: (event: MouseEvent) => {
                            event.stopPropagation();
                            removeToast(toast.id);
                          },
                        },
                        '×',
                      ),
                    ],
                  ),
                ),
            },
          ),
        ]),
      ]);
  },
});
