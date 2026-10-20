/**
 * API 请求封装
 * 部署时修改为实际服务器地址，例如：
 * - 同域部署: '/api'
 * - 当前静态页配合反代: '/blog/api'
 */
const API_BASE_URL = '/blog/api';

const api = {
    baseURL: API_BASE_URL,

    getToken() {
        return localStorage.getItem('token');
    },

    setToken(token) {
        localStorage.setItem('token', token);
    },

    clearToken() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },

    toast(message, type = 'info') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        }
    },

    async request(url, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const quiet = options.quiet;
        const requestOptions = { ...options };
        delete requestOptions.quiet;

        try {
            const response = await fetch(`${this.baseURL}${url}`, {
                ...requestOptions,
                headers
            });

            const data = await response.json();

            if (!quiet && data.code !== 200) {
                const msg = data.message || '操作失败';
                if (data.code === 401) {
                    this.toast(msg || '请先登录', 'warning');
                    this.clearToken();
                    if (!location.pathname.endsWith('login.html')) {
                        const next = location.pathname.split('/').pop() + location.search;
                        setTimeout(() => {
                            window.location.href = `login.html?next=${encodeURIComponent(next)}`;
                        }, 600);
                    }
                } else {
                    this.toast(msg, data.code === 400 ? 'warning' : 'error');
                }
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            if (!quiet) this.toast('网络请求失败', 'error');
            throw error;
        }
    },

    get(url, params = {}, options = {}) {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                query.set(key, value);
            }
        });
        const qs = query.toString();
        return this.request(qs ? `${url}?${qs}` : url, { method: 'GET', ...options });
    },

    post(url, data = {}, options = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options
        });
    },

    put(url, data = {}) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    delete(url) {
        return this.request(url, { method: 'DELETE' });
    },

    async upload(url, file) {
        const token = this.getToken();
        const formData = new FormData();
        formData.append('file', file);
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(`${this.baseURL}${url}`, {
            method: 'POST',
            headers,
            body: formData
        });
        return response.json();
    }
};

const authAPI = {
    login(data) {
        return api.post('/auth/login', data, { quiet: true });
    }
};

const postAPI = {
    getList(params = {}) {
        return api.get('/posts', params);
    },

    getDetail(slug) {
        return api.get(`/posts/${encodeURIComponent(slug)}`);
    },

    create(data) {
        return api.post('/posts/insert', data);
    },

    update(id, data) {
        return api.put(`/posts/${id}`, data);
    },

    delete(id) {
        return api.delete(`/posts/${id}`);
    }
};

const categoryAPI = {
    getAll() {
        return api.get('/categories');
    }
};

const tagAPI = {
    getAll() {
        return api.get('/tags');
    },

    create(data) {
        return api.post('/tags/insert', data);
    }
};

const uploadAPI = {
    image(file) {
        return api.upload('/upload/image', file);
    }
};
