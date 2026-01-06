/**
 * 主应用逻辑
 */

// 全局状态
const state = {
    posts: [],
    categories: [],
    tags: [],
    currentPage: 1,
    totalPages: 1,
    sortBy: 'createdAt',
    order: 'desc',
    keyword: '',
    categoryId: null,
    tagId: null,
    loading: false
};

// DOM 元素
const elements = {
    featuredPosts: document.getElementById('featuredPosts'),
    postsList: document.getElementById('postsList'),
    categoryList: document.getElementById('categoryList'),
    tagCloud: document.getElementById('tagCloud'),
    hotPosts: document.getElementById('hotPosts'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    searchInput: document.getElementById('searchInput'),
    themeToggle: document.getElementById('themeToggle'),
    backToTop: document.getElementById('backToTop'),
    authButtons: document.getElementById('authButtons'),
    userMenu: document.getElementById('userMenu'),
    userAvatar: document.getElementById('userAvatar'),
    logoutBtn: document.getElementById('logoutBtn')
};

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initAuth();
    initEventListeners();
    loadInitialData();
});

// 初始化主题
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

// 更新主题图标
function updateThemeIcon(theme) {
    const icon = elements.themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line';
}

// 初始化认证状态
function initAuth() {
    const user = api.getUser();
    if (user) {
        elements.authButtons.style.display = 'none';
        elements.userMenu.style.display = 'block';
        elements.userAvatar.src = user.avatar || getDefaultAvatar(user.name);
    } else {
        elements.authButtons.style.display = 'flex';
        elements.userMenu.style.display = 'none';
    }
}

// 初始化事件监听
function initEventListeners() {
    // 主题切换
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // 搜索
    elements.searchInput.addEventListener('input', debounce(handleSearch, 500));
    
    // 加载更多
    elements.loadMoreBtn.addEventListener('click', loadMorePosts);
    
    // 筛选标签
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', handleFilterChange);
    });
    
    // 回到顶部
    window.addEventListener('scroll', throttle(handleScroll, 100));
    elements.backToTop.addEventListener('click', scrollToTop);
    
    // 退出登录
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            authAPI.logout();
        });
    }
}

// 加载初始数据
async function loadInitialData() {
    // 获取 URL 参数
    const params = getUrlParams();
    if (params.category) state.categoryId = params.category;
    if (params.tag) state.tagId = params.tag;
    if (params.keyword) {
        state.keyword = params.keyword;
        elements.searchInput.value = params.keyword;
    }
    
    // 并行加载数据
    await Promise.all([
        loadFeaturedPosts(),
        loadPosts(),
        loadCategories(),
        loadTags(),
        loadHotPosts()
    ]);
}

// ========== 文章相关 ==========

// 加载精选文章
async function loadFeaturedPosts() {
    try {
        const res = await postAPI.getList({ featured: true, limit: 3, status: 'published' });
        if (res.code === 200 && res.data.records.length > 0) {
            renderFeaturedPosts(res.data.records);
        } else {
            document.getElementById('featuredSection').style.display = 'none';
        }
    } catch (error) {
        console.error('加载精选文章失败:', error);
    }
}

// 渲染精选文章
function renderFeaturedPosts(posts) {
    elements.featuredPosts.innerHTML = posts.map(post => `
        <a href="post.html?slug=${post.slug}" class="featured-card">
            <img src="${post.coverImage || getDefaultCover(post.title)}" alt="${escapeHtml(post.title)}">
            <div class="overlay">
                <span class="category-badge">${escapeHtml(post.category)}</span>
                <h3>${escapeHtml(post.title)}</h3>
                <div class="meta">
                    <span><i class="ri-eye-line"></i> ${formatNumber(post.views)}</span>
                    <span><i class="ri-time-line"></i> ${post.readTime}分钟</span>
                    <span><i class="ri-calendar-line"></i> ${formatDate(post.createdAt)}</span>
                </div>
            </div>
        </a>
    `).join('');
}

// 加载文章列表
async function loadPosts(append = false) {
    if (state.loading) return;
    state.loading = true;
    
    if (!append) {
        elements.postsList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    }
    
    try {
        const params = {
            page: state.currentPage,
            limit: 10,
            sortBy: state.sortBy,
            order: state.order,
            status: 'published'
        };
        
        if (state.keyword) params.keyword = state.keyword;
        if (state.categoryId) params.categoryId = state.categoryId;
        if (state.tagId) params.tagId = state.tagId;
        
        const res = await postAPI.getList(params);
        
        if (res.code === 200) {
            state.totalPages = res.data.pages;
            
            if (append) {
                state.posts = [...state.posts, ...res.data.records];
                appendPosts(res.data.records);
            } else {
                state.posts = res.data.records;
                renderPosts(res.data.records);
            }
            
            // 更新加载更多按钮状态
            updateLoadMoreButton();
        }
    } catch (error) {
        console.error('加载文章失败:', error);
        elements.postsList.innerHTML = `
            <div class="empty-state">
                <i class="ri-error-warning-line"></i>
                <h3>加载失败</h3>
                <p>请稍后重试</p>
            </div>
        `;
    } finally {
        state.loading = false;
    }
}

// 渲染文章列表
function renderPosts(posts) {
    if (posts.length === 0) {
        elements.postsList.innerHTML = `
            <div class="empty-state">
                <i class="ri-article-line"></i>
                <h3>暂无文章</h3>
                <p>还没有发布任何文章</p>
            </div>
        `;
        return;
    }
    
    elements.postsList.innerHTML = posts.map(renderPostCard).join('');
}

// 追加文章
function appendPosts(posts) {
    elements.postsList.insertAdjacentHTML('beforeend', posts.map(renderPostCard).join(''));
}

// 渲染单个文章卡片
function renderPostCard(post) {
    const authorAvatar = post.author?.avatar || getDefaultAvatar(post.author?.name || '匿名');
    const coverImage = post.coverImage || getDefaultCover(post.title);
    const tags = post.tags || [];
    
    return `
        <article class="post-card">
            <div class="cover">
                <a href="post.html?slug=${post.slug}">
                    <img src="${coverImage}" alt="${escapeHtml(post.title)}">
                </a>
            </div>
            <div class="content">
                <a href="categories.html?id=${post.categoryId}" class="category">
                    <i class="ri-folder-line"></i> ${escapeHtml(post.category)}
                </a>
                <a href="post.html?slug=${post.slug}">
                    <h3>${escapeHtml(post.title)}</h3>
                </a>
                <p class="excerpt">${escapeHtml(post.excerpt || '')}</p>
                <div class="tags">
                    ${tags.slice(0, 3).map(tag => `
                        <a href="index.html?tag=${encodeURIComponent(tag)}" class="tag">${escapeHtml(tag)}</a>
                    `).join('')}
                </div>
                <div class="footer">
                    <a href="author.html?id=${post.author?.id}" class="author">
                        <img src="${authorAvatar}" alt="${escapeHtml(post.author?.name || '匿名')}">
                        <div class="author-info">
                            <span class="author-name">${escapeHtml(post.author?.name || '匿名')}</span>
                            <span class="post-date">${formatDate(post.createdAt)}</span>
                        </div>
                    </a>
                    <div class="stats">
                        <span class="stat"><i class="ri-eye-line"></i> ${formatNumber(post.views)}</span>
                        <span class="stat"><i class="ri-heart-line"></i> ${formatNumber(post.likeCount || 0)}</span>
                        <span class="stat"><i class="ri-time-line"></i> ${post.readTime}分钟</span>
                    </div>
                </div>
            </div>
        </article>
    `;
}

// 更新加载更多按钮
function updateLoadMoreButton() {
    if (state.currentPage >= state.totalPages) {
        elements.loadMoreBtn.textContent = '没有更多了';
        elements.loadMoreBtn.disabled = true;
    } else {
        elements.loadMoreBtn.innerHTML = '<i class="ri-refresh-line"></i> 加载更多';
        elements.loadMoreBtn.disabled = false;
    }
}

// 加载更多文章
function loadMorePosts() {
    if (state.currentPage < state.totalPages) {
        state.currentPage++;
        loadPosts(true);
    }
}

// ========== 分类和标签 ==========

// 加载分类
async function loadCategories() {
    try {
        const res = await categoryAPI.getAll();
        if (res.code === 200) {
            state.categories = res.data;
            renderCategories(res.data);
        }
    } catch (error) {
        console.error('加载分类失败:', error);
    }
}

// 渲染分类
function renderCategories(categories) {
    elements.categoryList.innerHTML = categories.map(cat => `
        <li>
            <a href="index.html?category=${cat.id}" class="${state.categoryId == cat.id ? 'active' : ''}">
                <span>${escapeHtml(cat.name)}</span>
                <span class="count">${cat.count || 0}</span>
            </a>
        </li>
    `).join('');
}

// 加载标签
async function loadTags() {
    try {
        const res = await tagAPI.getAll();
        if (res.code === 200) {
            state.tags = res.data;
            renderTags(res.data.slice(0, 15)); // 只显示前15个
        }
    } catch (error) {
        console.error('加载标签失败:', error);
    }
}

// 渲染标签云
function renderTags(tags) {
    elements.tagCloud.innerHTML = tags.map(tag => `
        <a href="index.html?tag=${tag.id}">${escapeHtml(tag.name)}</a>
    `).join('');
}

// 加载热门文章
async function loadHotPosts() {
    try {
        const res = await postAPI.getList({ sortBy: 'views', order: 'desc', limit: 5, status: 'published' });
        if (res.code === 200) {
            renderHotPosts(res.data.records);
        }
    } catch (error) {
        console.error('加载热门文章失败:', error);
    }
}

// 渲染热门文章
function renderHotPosts(posts) {
    elements.hotPosts.innerHTML = posts.map((post, index) => `
        <li>
            <a href="post.html?slug=${post.slug}">
                <span class="rank">${index + 1}</span>
                <span class="title">${escapeHtml(post.title)}</span>
            </a>
        </li>
    `).join('');
}

// ========== 事件处理 ==========

// 切换主题
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

// 处理搜索
function handleSearch(e) {
    state.keyword = e.target.value.trim();
    state.currentPage = 1;
    updateUrlParams({ keyword: state.keyword });
    loadPosts();
}

// 处理筛选变化
function handleFilterChange(e) {
    const tab = e.target;
    const sortBy = tab.dataset.sort;
    
    // 更新激活状态
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // 更新状态并重新加载
    state.sortBy = sortBy;
    state.currentPage = 1;
    loadPosts();
}

// 处理滚动
function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // 回到顶部按钮
    if (scrollTop > 300) {
        elements.backToTop.classList.add('visible');
    } else {
        elements.backToTop.classList.remove('visible');
    }
}
