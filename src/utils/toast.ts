import { toast } from 'sonner';

export function showError(message: string, error?: unknown) {
  const detail = error instanceof Error ? error.message : String(error || '');
  console.error(message, detail);
  toast.error(message, {
    description: detail || undefined,
    duration: 5000,
  });
}

export function showSuccess(message: string) {
  toast.success(message, { duration: 3000 });
}

export function showWarning(message: string) {
  toast.warning(message, { duration: 4000 });
}
