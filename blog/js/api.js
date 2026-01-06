/**
 * API 请求封装
 */
const API_BASE_URL = 'http://localhost:11123/api';

// 创建请求实例
const api = {
    baseURL: API_BASE_URL,
    
    // 获取 Token
    getToken() {
        return localStorage.getItem('token');
    },
    
    // 设置 Token
    setToken(token) {
        localStorage.setItem('token', token);
    },
    
    // 清除 Token
    clearToken() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
    
    // 获取用户信息
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    
    // 设置用户信息
    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },
    
    // 通用请求方法
    async request(url, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        try {
            const response = await fetch(`${this.baseURL}${url}`, {
                ...options,
                headers
            });
            
            const data = await response.json();
            
            // Token 过期处理
            if (data.code === 401) {
                this.clearToken();
                window.location.href = '/login.html';
                return null;
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // GET 请求
    get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
    },
    
    // POST 请求
    post(url, data = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    // PUT 请求
    put(url, data = {}) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    // DELETE 请求
    delete(url) {
        return this.request(url, { method: 'DELETE' });
    },
    
    // 文件上传
    async upload(url, file) {
        const token = this.getToken();
        const formData = new FormData();
        formData.append('file', file);
        
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${this.baseURL}${url}`, {
            method: 'POST',
            headers,
            body: formData
        });
        
        return response.json();
    }
};

// ========== 认证相关 API ==========
const authAPI = {
    // 注册
    register(data) {
        return api.post('/auth/register', data);
    },
    
    // 登录
    login(data) {
        return api.post('/auth/login', data);
    },
    
    // 获取当前用户信息
    getCurrentUser() {
        return api.get('/auth/user');
    },
    
    // 退出登录
    logout() {
        api.clearToken();
        window.location.href = '/index.html';
    }
};

// ========== 用户相关 API ==========
const userAPI = {
    // 更新用户资料
    updateProfile(data) {
        return api.put('/users/profile', data);
    },
    
    // 修改密码
    changePassword(data) {
        return api.put('/users/password', data);
    },
    
    // 获取用户已点赞的评论ID列表
    getLikedComments(commentIds) {
        return api.get('/users/likes', { commentIds: commentIds.join(',') });
    }
};

// ========== 文章相关 API ==========
const postAPI = {
    // 获取文章列表
    getList(params = {}) {
        return api.get('/posts', params);
    },
    
    // 获取文章详情
    getDetail(slug) {
        return api.get(`/posts/${slug}`);
    },
    
    // 创建文章
    create(data) {
        return api.post('/posts/insert', data);
    },
    
    // 更新文章
    update(id, data) {
        return api.put(`/posts/${id}`, data);
    },
    
    // 删除文章
    delete(id) {
        return api.delete(`/posts/${id}`);
    },
    
    // 获取用户对文章的操作状态
    getUserActions(id) {
        return api.get(`/posts/${id}/user-actions`);
    },
    
    // 点赞文章
    like(id) {
        return api.post(`/posts/${id}/like`);
    },
    
    // 取消点赞
    unlike(id) {
        return api.delete(`/posts/${id}/like`);
    }
};

// ========== 分类相关 API ==========
const categoryAPI = {
    // 获取所有分类
    getAll() {
        return api.get('/categories');
    }
};

// ========== 标签相关 API ==========
const tagAPI = {
    // 获取所有标签
    getAll() {
        return api.get('/tags');
    },
    
    // 新增标签
    create(data) {
        return api.post('/tags/insert', data);
    }
};

// ========== 评论相关 API ==========
const commentAPI = {
    // 获取文章评论列表
    getByPost(postId, params = {}) {
        return api.get(`/posts/${postId}/comments`, params);
    },
    
    // 发表评论
    create(postId, data) {
        return api.post(`/posts/${postId}/comments`, data);
    },
    
    // 删除评论
    delete(id) {
        return api.delete(`/comments/${id}`);
    },
    
    // 评论点赞
    like(commentId) {
        return api.post(`/comments/${commentId}/like`);
    },
    
    // 举报评论
    report(commentId, data) {
        return api.post(`/comments/${commentId}/report`, data);
    },
    
    // 获取评论列表（管理）
    getList(params = {}) {
        return api.get('/comments', params);
    }
};

// ========== 收藏相关 API ==========
const favoriteAPI = {
    // 获取收藏列表
    getList(params = {}) {
        return api.get('/favorites', params);
    },
    
    // 添加收藏
    add(postId) {
        return api.post('/favorites', { postId });
    },
    
    // 取消收藏
    remove(id) {
        return api.delete(`/favorites/${id}`);
    },
    
    // 检查收藏状态
    check(id) {
        return api.get(`/favorites/check/${id}`);
    }
};

// ========== 关注相关 API ==========
const followAPI = {
    // 获取关注列表
    getList(params = {}) {
        return api.get('/following', params);
    },
    
    // 添加关注
    add(authorId) {
        return api.post('/following', { authorId });
    },
    
    // 取消关注
    remove(id) {
        return api.delete(`/following/${id}`);
    },
    
    // 检查关注状态
    check(id) {
        return api.get(`/following/check/${id}`);
    }
};

// ========== 文件上传 API ==========
const uploadAPI = {
    // 上传图片
    image(file) {
        return api.upload('/upload/image', file);
    }
};
