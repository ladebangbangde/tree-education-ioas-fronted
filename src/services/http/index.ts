const mockHttp = {
  get: <T = unknown>(url: string) => Promise.resolve({ data: { url, mock: true } as T }),
  post: <T = unknown>(url: string, body?: unknown) => Promise.resolve({ data: { url, body, mock: true } as T }),
  put: <T = unknown>(url: string, body?: unknown) => Promise.resolve({ data: { url, body, mock: true } as T }),
  patch: <T = unknown>(url: string, body?: unknown) => Promise.resolve({ data: { url, body, mock: true } as T }),
  delete: <T = unknown>(url: string) => Promise.resolve({ data: { url, mock: true } as T })
};

export default mockHttp;
