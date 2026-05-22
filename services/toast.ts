import { Toast } from 'react-native-alert-notification';

/**
 * Toast convention (use these titles consistently across the app):
 *   - "Validation"    → user input is bad (missing fields, out-of-range, etc.)
 *   - "Error"         → unexpected failure, network, or server-side issue
 *   - Action-specific → "Update failed", "Upload failed", etc. when the action
 *                       context is helpful for the user
 * Avoid creative variations like "Network error", "Couldn't load X" — pick
 * one of the three above for consistency.
 */

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

// Semantic helpers — preferred over showError(specific_title, ...) so titles
// stay consistent across the app.
export const showValidationError = (msg: string) => showError('Validation', msg);
export const showNetworkError = (msg = 'Please check your connection and try again.') =>
  showError('Error', msg);

export default { showSuccess, showError, showInfo, showValidationError, showNetworkError };
