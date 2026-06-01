const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

async function request(url, options = {}) {
    const headers = options.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' };

    let res;
    try {
        res = await fetch(`${API_BASE}${url}`, {
            headers,
            ...options
        });
    } catch {
        throw new Error('Could not reach the backend. Make sure the API is running on http://localhost:3001.');
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Request failed');
    }

    return res.json();
}

export function getBooks() {
    return request('/books');
}

export function getBook(id) {
    return request(`/books/${id}`);
}

export function getBuilds(bookId, version) {
    const qs = version ? `?version=${version}` : '';
    return request(`/books/${bookId}/builds${qs}`);
}

export function createBook(formData) {
    return request('/books', {
        method: 'POST',
        body: formData
    });
}

export function updateBook(id, formData) {
    return request(`/books/${id}`, {
        method: 'PUT',
        body: formData
    });
}

export function deleteBook(id) {
    return request(`/books/${id}`, {
        method: 'DELETE'
    });
}

export function createQuoteRequest(data) {
    return request('/quote-requests', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}
