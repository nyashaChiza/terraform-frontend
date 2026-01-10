import { Toast } from 'react-native-alert-notification';

type ToastOpts = { title?: string; message?: string };

export function showSuccess(titleOrMessage?: string, message?: string) {
  const title = message ? titleOrMessage : 'Success';
  const textBody = message ?? titleOrMessage ?? '';
  Toast.show({ type: 'SUCCESS', title: String(title), textBody: String(textBody) });
}

export function showError(titleOrMessage?: string, message?: string) {
  const title = message ? titleOrMessage : 'Error';
  const textBody = message ?? titleOrMessage ?? '';
  Toast.show({ type: 'DANGER', title: String(title), textBody: String(textBody) });
}

export function showInfo(titleOrMessage?: string, message?: string) {
  const title = message ? titleOrMessage : 'Info';
  const textBody = message ?? titleOrMessage ?? '';
  Toast.show({ type: 'NORMAL', title: String(title), textBody: String(textBody) });
}

export default { showSuccess, showError, showInfo };
