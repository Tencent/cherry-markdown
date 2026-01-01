const canNotify = typeof window !== 'undefined' && typeof window.alert === 'function';

export const notifyError = (message: string): void => {
  console.error(message);
  if (canNotify) {
    window.alert(message);
  }
};

export const notifyInfo = (message: string): void => {
  if (canNotify) {
    window.alert(message);
  } else {
    console.info(message);
  }
};
