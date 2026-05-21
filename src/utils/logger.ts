import notify from './notify';

export function logError(err: any, userMessage?: string) {
  // keep console for diagnostics
  console.error(err);
  try {
    const msg = userMessage || (err && err.message) || String(err) || 'An error occurred';
    notify.error(msg);
  } catch (e) {
    // swallow
  }
}

export default logError;
