/**
 * 文章详情页逻辑
 */

// 状态
const postState = {
    post: null,
    comments: [],
    commentPage: 1,
    commentPages: 1,
    liked: false,
    favorited: false,
    replyTo: null
};

// DOM 元素
const postElements = {
    postArticle: document.getElementById('postArticle'),
    commentsList: document.getElementById('commentsList'),
    commentInput: document.getElementById('commentInput'),
    commentAvatar: document.getElementById('commentAvatar'),
    submitComment: document.getElementById('submitComment'),
    charCount: document.getElementById('charCount'),
    commentCount: document.getElementById('commentCount'),
    likeBtn: document.getElementById('likeBtn'),
    likeCount: document.getElementById('likeCount'),
    favoriteBtn: document.getElementById('favoriteBtn'),
    shareBtn: document.getElementById('shareBtn'),
    commentBtn: document.getElementById('commentBtn'),
    backToTopBtn: document.getElementById('backToTopBtn'),
    loadMoreCommentsBtn: document.getElementById('loadMoreCommentsBtn'),
    themeToggle: document.getElementById('themeToggle'),
    authButtons: document.getElementById('authButtons'),
    userMenu: document.getElementById('userMenu'),
    userAvatar: document.getElementById('userAvatar'),
    logoutBtn: document.getElementById('logoutBtn')
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initAuth();
    initEventListeners();
    loadPost();
});

// 初始化主题
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
    const icon = postElements.themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line';
}

// 初始化认证状态
function initAuth() {
    const user = api.getUser();
    if (user) {
        postElements.authButtons.style.display = 'none';
        postElements.userMenu.style.display = 'block';
        postElements.userAvatar.src = user.avatar || getDefaultAvatar(user.name);
        postElements.commentAvatar.src = user.avatar || getDefaultAvatar(user.name);
    } else {
        postElements.authButtons.style.display = 'flex';
        postElements.userMenu.style.display = 'none';
        postElements.commentAvatar.src = getDefaultAvatar('游客');
    }
}

// 初始化事件监听
function initEventListeners() {
    // 主题切换
    postElements.themeToggle.addEventListener('click', toggleTheme);
    
    // 评论字数统计
    postElements.commentInput.addEventListener('input', updateCharCount);
    
    // 提交评论
    postElements.submitComment.addEventListener('click', submitComment);
    
    // 点赞
    postElements.likeBtn.addEventListener('click', toggleLike);
    
    // 收藏
    postElements.favoriteBtn.addEventListener('click', toggleFavorite);
    
    // 分享
    postElements.shareBtn.addEventListener('click', sharePost);
    
    // 跳转评论
    postElements.commentBtn.addEventListener('click', () => {
        document.getElementById('commentsSection').scrollIntoView({ behavior: 'smooth' });
    });
    
    // 回到顶部
    postElements.backToTopBtn.addEventListener('click', scrollToTop);
    
    // 加载更多评论
    if (postElements.loadMoreCommentsBtn) {
        postElements.loadMoreCommentsBtn.addEventListener('click', loadMoreComments);
    }
    
    // 退出登录
    if (postElements.logoutBtn) {
        postElements.logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            authAPI.logout();
        });
    }
}

// 切换主题
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

// 加载文章
async function loadPost() {
    const params = getUrlParams();
    const slug = params.slug;
    
    if (!slug) {
        postElements.postArticle.innerHTML = `
            <div class="empty-state">
                <i class="ri-error-warning-line"></i>
                <h3>文章不存在</h3>
                <p><a href="index.html">返回首页</a></p>
            </div>
        `;
        return;
    }
    
    postElements.postArticle.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const res = await postAPI.getDetail(slug);
        
        if (res.code === 200) {
            postState.post = res.data;
            renderPost(res.data);
            document.title = `${res.data.title} - MyBlog`;
            
            // 加载用户操作状态
            if (isLoggedIn()) {
                loadUserActions(res.data.id);
            }
            
            // 加载评论
            loadComments(res.data.id);
        } else {
            postElements.postArticle.innerHTML = `
                <div class="empty-state">
                    <i class="ri-error-warning-line"></i>
                    <h3>文章不存在</h3>
                    <p><a href="index.html">返回首页</a></p>
                </div>
            `;
        }
    } catch (error) {
        console.error('加载文章失败:', error);
        postElements.postArticle.innerHTML = `
            <div class="empty-state">
                <i class="ri-error-warning-line"></i>
                <h3>加载失败</h3>
                <p>请稍后重试</p>
            </div>
        `;
    }
}

// 渲染文章
function renderPost(post) {
    const authorAvatar = post.author?.avatar || getDefaultAvatar(post.author?.name || '匿名');
    const coverImage = post.coverImage || getDefaultCover(post.title);
    const tags = post.tags || [];
    
    postElements.postArticle.innerHTML = `
        <header class="post-header">
            <a href="categories.html?id=${post.categoryId}" class="category">
                <i class="ri-folder-line"></i> ${escapeHtml(post.category)}
            </a>
            <h1>${escapeHtml(post.title)}</h1>
            <div class="post-meta">
                <a href="author.html?id=${post.author?.id}" class="author">
                    <img src="${authorAvatar}" alt="${escapeHtml(post.author?.name || '匿名')}">
                    <span class="author-name">${escapeHtml(post.author?.name || '匿名')}</span>
                </a>
                <span class="meta-item">
                    <i class="ri-calendar-line"></i> ${formatDate(post.createdAt)}
                </span>
                <span class="meta-item">
                    <i class="ri-eye-line"></i> ${formatNumber(post.views)} 阅读
                </span>
                <span class="meta-item">
                    <i class="ri-time-line"></i> ${post.readTime} 分钟
                </span>
            </div>
            <div class="post-tags">
                ${tags.map(tag => `<a href="index.html?tag=${encodeURIComponent(tag)}">${escapeHtml(tag)}</a>`).join('')}
            </div>
        </header>
        
        <div class="post-cover">
            <img src="${coverImage}" alt="${escapeHtml(post.title)}">
        </div>
        
        <div class="post-content">
            ${parseMarkdown(post.content)}
        </div>
        
        <div class="author-card">
            <img src="${authorAvatar}" alt="${escapeHtml(post.author?.name || '匿名')}">
            <div class="info">
                <div class="name">${escapeHtml(post.author?.name || '匿名')}</div>
                <div class="bio">${escapeHtml(post.author?.bio || '这个人很懒，什么都没写')}</div>
                <button class="btn btn-primary follow-btn" onclick="followAuthor(${post.author?.id})">
                    <i class="ri-user-add-line"></i> 关注
                </button>
            </div>
        </div>
    `;
    
    // 更新点赞数
    postElements.likeCount.textContent = formatNumber(post.likeCount || 0);
}

// 加载用户操作状态
async function loadUserActions(postId) {
    try {
        const [actionsRes, favoriteRes] = await Promise.all([
            postAPI.getUserActions(postId),
            favoriteAPI.check(postId)
        ]);
        
        if (actionsRes.code === 200) {
            postState.liked = actionsRes.data.liked;
            postElements.likeCount.textContent = formatNumber(actionsRes.data.likeCount);
            if (postState.liked) {
                postElements.likeBtn.classList.add('active');
                postElements.likeBtn.querySelector('i').className = 'ri-heart-fill';
            }
        }
        
        if (favoriteRes.code === 200) {
            postState.favorited = favoriteRes.data.favorited;
            if (postState.favorited) {
                postElements.favoriteBtn.classList.add('active');
                postElements.favoriteBtn.querySelector('i').className = 'ri-bookmark-fill';
            }
        }
    } catch (error) {
        console.error('加载用户操作状态失败:', error);
    }
}

// 点赞切换
async function toggleLike() {
    if (!requireLogin()) return;
    
    try {
        let res;
        if (postState.liked) {
            res = await postAPI.unlike(postState.post.id);
        } else {
            res = await postAPI.like(postState.post.id);
        }
        
        if (res.code === 200) {
            postState.liked = res.data.liked;
            postElements.likeCount.textContent = formatNumber(res.data.likeCount);
            
            if (postState.liked) {
                postElements.likeBtn.classList.add('active');
                postElements.likeBtn.querySelector('i').className = 'ri-heart-fill';
                showToast('点赞成功', 'success');
            } else {
                postElements.likeBtn.classList.remove('active');
                postElements.likeBtn.querySelector('i').className = 'ri-heart-line';
            }
        }
    } catch (error) {
        showToast('操作失败', 'error');
    }
}

// 收藏切换
async function toggleFavorite() {
    if (!requireLogin()) return;
    
    try {
        let res;
        if (postState.favorited) {
            res = await favoriteAPI.remove(postState.post.id);
        } else {
            res = await favoriteAPI.add(postState.post.id);
        }
        
        if (res.code === 200) {
            postState.favorited = !postState.favorited;
            
            if (postState.favorited) {
                postElements.favoriteBtn.classList.add('active');
                postElements.favoriteBtn.querySelector('i').className = 'ri-bookmark-fill';
                showToast('收藏成功', 'success');
            } else {
                postElements.favoriteBtn.classList.remove('active');
                postElements.favoriteBtn.querySelector('i').className = 'ri-bookmark-line';
                showToast('已取消收藏', 'info');
            }
        }
    } catch (error) {
        showToast('操作失败', 'error');
    }
}

// 分享文章
function sharePost() {
    const url = window.location.href;
    copyToClipboard(url);
    showToast('链接已复制到剪贴板', 'success');
}

// 关注作者
async function followAuthor(authorId) {
    if (!requireLogin()) return;
    
    try {
        const res = await followAPI.add(authorId);
        if (res.code === 200) {
            showToast('关注成功', 'success');
        }
    } catch (error) {
        showToast('操作失败', 'error');
    }
}

// ========== 评论相关 ==========

// 加载评论
async function loadComments(postId, append = false) {
    try {
        const res = await commentAPI.getByPost(postId, {
            page: postState.commentPage,
            limit: 10
        });
        
        if (res.code === 200) {
            const { comments, pagination } = res.data;
            postState.commentPages = pagination.pages;
            
            postElements.commentCount.textContent = `(${pagination.total})`;
            
            if (append) {
                postState.comments = [...postState.comments, ...comments];
                appendComments(comments);
            } else {
                postState.comments = comments;
                renderComments(comments);
            }
            
            // 更新加载更多按钮
            const loadMoreDiv = document.getElementById('loadMoreComments');
            if (postState.commentPage >= postState.commentPages) {
                loadMoreDiv.style.display = 'none';
            } else {
                loadMoreDiv.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('加载评论失败:', error);
    }
}

// 渲染评论列表
function renderComments(comments) {
    if (comments.length === 0) {
        postElements.commentsList.innerHTML = `
            <div class="empty-state">
                <i class="ri-chat-3-line"></i>
                <h3>暂无评论</h3>
                <p>快来发表第一条评论吧</p>
            </div>
        `;
        return;
    }
    
    postElements.commentsList.innerHTML = comments.map(renderCommentItem).join('');
}

// 追加评论
function appendComments(comments) {
    postElements.commentsList.insertAdjacentHTML('beforeend', comments.map(renderCommentItem).join(''));
}

// 渲染单个评论
function renderCommentItem(comment) {
    const avatar = comment.user?.avatar || getDefaultAvatar(comment.user?.name || '匿名');
    const replies = comment.replies || [];
    
    return `
        <div class="comment-item" data-id="${comment.id}">
            <div class="comment-header">
                <img src="${avatar}" alt="${escapeHtml(comment.user?.name || '匿名')}">
                <div class="user-info">
                    <span class="username">${escapeHtml(comment.user?.name || '匿名')}</span>
                    <span class="time">${formatDate(comment.createdAt)}</span>
                </div>
            </div>
            <div class="comment-content">${escapeHtml(comment.content)}</div>
            <div class="comment-footer">
                <button class="like-comment-btn" data-id="${comment.id}" data-liked="false">
                    <i class="ri-heart-line"></i> <span>${comment.likes || 0}</span>
                </button>
                <button class="reply-btn" data-id="${comment.id}" data-name="${escapeHtml(comment.user?.name || '匿名')}">
                    <i class="ri-reply-line"></i> 回复
                </button>
            </div>
            ${replies.length > 0 ? `
                <div class="comment-replies">
                    ${replies.map(reply => renderReplyItem(reply)).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

// 渲染回复
function renderReplyItem(reply) {
    const avatar = reply.user?.avatar || getDefaultAvatar(reply.user?.name || '匿名');
    
    return `
        <div class="reply-item" data-id="${reply.id}">
            <div class="comment-header">
                <img src="${avatar}" alt="${escapeHtml(reply.user?.name || '匿名')}">
                <div class="user-info">
                    <span class="username">${escapeHtml(reply.user?.name || '匿名')}</span>
                    <span class="time">${formatDate(reply.createdAt)}</span>
                </div>
            </div>
            <div class="comment-content">${escapeHtml(reply.content)}</div>
            <div class="comment-footer">
                <button class="like-comment-btn" data-id="${reply.id}" data-liked="false">
                    <i class="ri-heart-line"></i> <span>${reply.likes || 0}</span>
                </button>
            </div>
        </div>
    `;
}

// 更新字数统计
function updateCharCount() {
    const count = postElements.commentInput.value.length;
    postElements.charCount.textContent = count;
    
    if (count > 500) {
        postElements.charCount.style.color = 'var(--danger)';
    } else {
        postElements.charCount.style.color = '';
    }
}

// 提交评论
async function submitComment() {
    if (!requireLogin()) return;
    
    const content = postElements.commentInput.value.trim();
    
    if (!content) {
        showToast('请输入评论内容', 'warning');
        return;
    }
    
    if (content.length > 500) {
        showToast('评论内容不能超过500字', 'warning');
        return;
    }
    
    try {
        const res = await commentAPI.create(postState.post.id, {
            content,
            parentId: postState.replyTo
        });
        
        if (res.code === 200) {
            showToast('评论发表成功', 'success');
            postElements.commentInput.value = '';
            postElements.charCount.textContent = '0';
            postState.replyTo = null;
            
            // 重新加载评论
            postState.commentPage = 1;
            loadComments(postState.post.id);
        } else {
            showToast(res.message || '评论失败', 'error');
        }
    } catch (error) {
        showToast('评论失败', 'error');
    }
}

// 加载更多评论
function loadMoreComments() {
    if (postState.commentPage < postState.commentPages) {
        postState.commentPage++;
        loadComments(postState.post.id, true);
    }
}

// 评论点赞（事件委托）
document.addEventListener('click', async (e) => {
    const likeBtn = e.target.closest('.like-comment-btn');
    if (likeBtn) {
        if (!requireLogin()) return;
        
        const commentId = likeBtn.dataset.id;
        try {
            const res = await commentAPI.like(commentId);
            if (res.code === 200) {
                const span = likeBtn.querySelector('span');
                span.textContent = res.data.likes;
                
                if (res.data.isLiked) {
                    likeBtn.classList.add('active');
                    likeBtn.querySelector('i').className = 'ri-heart-fill';
                } else {
                    likeBtn.classList.remove('active');
                    likeBtn.querySelector('i').className = 'ri-heart-line';
                }
            }
        } catch (error) {
            showToast('操作失败', 'error');
        }
    }
    
    // 回复按钮
    const replyBtn = e.target.closest('.reply-btn');
    if (replyBtn) {
        if (!requireLogin()) return;
        
        const commentId = replyBtn.dataset.id;
        const userName = replyBtn.dataset.name;
        
        postState.replyTo = commentId;
        postElements.commentInput.placeholder = `回复 @${userName}...`;
        postElements.commentInput.focus();
    }
});
