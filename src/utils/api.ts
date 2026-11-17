export interface ApiResult<T = unknown> {
  ok: boolean;
  status: number;
  message: string;
  data?: T;
  code?: string;
  fieldErrors?: Record<string, string>;
}

let inMemoryCsrfToken = '';

export function setCsrfToken(token: string | undefined | null): void {
  inMemoryCsrfToken = token || '';
}

export function getCsrfToken(): string {
  return inMemoryCsrfToken;
}

export async function apiRequest<T = unknown>(
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    body?: unknown;
  } = {}
): Promise<ApiResult<T>> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = {};

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method) && inMemoryCsrfToken) {
    headers['X-CSRF-Token'] = inMemoryCsrfToken;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      credentials: 'include',
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const json = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      message?: string;
      data?: T;
      code?: string;
      fieldErrors?: Record<string, string>;
    };

    return {
      ok: response.ok && json.success !== false,
      status: response.status,
      message:
        json.message ||
        (response.ok
          ? 'Operación realizada.'
          : 'No fue posible completar la operación. Intente nuevamente.'),
      data: json.data,
      code: json.code,
      fieldErrors: json.fieldErrors,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      message: 'No hay conexión con el servidor de USAE Helpdesk. Verifica que el servicio esté activo.',
      code: 'NETWORK_ERROR',
    };
  }
}
