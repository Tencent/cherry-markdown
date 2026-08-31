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
                      // 存在 action 时不再让整个 toast 变成“点击即关闭”的大按钮，
                      // 避免误触；用户需要点右侧关闭按钮或等待自动消失
                      onClick: toast.action ? undefined : () => removeToast(toast.id),
                    },
                    [
                      h('span', { class: 'toast-message' }, toast.message),
                      toast.action
                        ? h(
                            'button',
                            {
                              class: 'toast-action',
                              onClick: (event: MouseEvent) => {
                                event.stopPropagation();
                                const keepOpen = toast.action?.onClick();
                                // onClick 返回 false 表示保留 toast，否则关闭
                                if (keepOpen !== false) removeToast(toast.id);
                              },
                            },
                            toast.action.label,
                          )
                        : null,
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
