const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = {
    get: <T>(endpoint: string, options?: RequestInit) =>
        apiRequest<T>(endpoint, { ...options, method: 'GET' }),

    post: <T>(endpoint: string, body: unknown, options?: RequestInit) =>
        apiRequest<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) })

};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<T>;
}   