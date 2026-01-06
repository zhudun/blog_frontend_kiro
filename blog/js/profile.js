/**
 * 个人中心页面逻辑
 */

// 检查登录状态
if (!api.getToken()) {
    window.location.href = 'login.html';
}

// 状态
const profileState = {
    user: null,
    posts: [],
    currentPage: 1,
    totalPages: 1
};

// DOM 元素
const profileElements = {
    profileAvatar: document.getElementById('profileAvatar'),
    profileName: document.getElementById('profileName'),
    profileEmail: document.getElementById('profileEmail'),
    profileBio: document.getElementById('profileBio'),
    socialLinks: document.getElementById('socialLinks'),
    avatarInput: document.getElementById('avatarInput'),
    myPosts: document.getElementById('myPosts'),
    themeToggle: document.getElementById('themeToggle'),
    userAvatar: document.getElementById('userAvatar'),
    logoutBtn: document.getElementById('logoutBtn'),
    profileForm: document.getElementById('profileForm'),
    passwordForm: document.getElementById('passwordForm'),
    settingName: document.getElementById('settingName'),
    settingBio: document.getElementById('settingBio'),
    settingGithub: document.getElementById('settingGithub'),
    settingTwitter: document.getElementById('settingTwitter'),
    settingWebsite: document.getElementById('settingWebsite')
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initEventListeners();
    loadUserProfile();
    loadMyPosts();
});

// 初始化主题
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
    const icon = profileElements.themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line';
}

// 初始化事件监听
function initEventListeners() {
    // 主题切换
    profileElements.themeToggle.addEventListener('click', toggleTheme);
    
    // 退出登录
    profileElements.logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        authAPI.logout();
    });
    
    // 标签页切换
    document.querySelectorAll('.profile-nav .nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(item.dataset.tab);
        });
    });
    
    // 头像上传
    profileElements.avatarInput.addEventListener('change', handleAvatarUpload);
    
    // 资料表单提交
    profileElements.profileForm.addEventListener('submit', handleProfileSubmit);
    
    // 密码表单提交
    profileElements.passwordForm.addEventListener('submit', handlePasswordSubmit);
}

// 切换主题
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

// 切换标签页
function switchTab(tab) {
    // 更新导航
    document.querySelectorAll('.profile-nav .nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tab);
    });
    
    // 更新内容
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tab}Tab`).classList.add('active');
}

// 加载用户资料
async function loadUserProfile() {
    try {
        const res = await authAPI.getCurrentUser();
        
        if (res.code === 200) {
            profileState.user = res.data;
            renderUserProfile(res.data);
            
            // 更新本地存储
            api.setUser(res.data);
        }
    } catch (error) {
        console.error('加载用户资料失败:', error);
    }
}

// 渲染用户资料
function renderUserProfile(user) {
    const avatar = user.avatar || getDefaultAvatar(user.name);
    
    profileElements.profileAvatar.src = avatar;
    profileElements.userAvatar.src = avatar;
    profileElements.profileName.textContent = user.name;
    profileElements.profileEmail.textContent = user.email;
    profileElements.profileBio.textContent = user.bio || '这个人很懒，什么都没写';
    
    // 社交链接
    const social = user.social || {};
    let socialHtml = '';
    if (social.github) {
        socialHtml += `<a href="${social.github}" target="_blank"><i class="ri-github-fill"></i></a>`;
    }
    if (social.twitter) {
        socialHtml += `<a href="${social.twitter}" target="_blank"><i class="ri-twitter-x-fill"></i></a>`;
    }
    if (social.website) {
        socialHtml += `<a href="${social.website}" target="_blank"><i class="ri-global-line"></i></a>`;
    }
    profileElements.socialLinks.innerHTML = socialHtml;
    
    // 填充设置表单
    profileElements.settingName.value = user.name || '';
    profileElements.settingBio.value = user.bio || '';
    profileElements.settingGithub.value = social.github || '';
    profileElements.settingTwitter.value = social.twitter || '';
    profileElements.settingWebsite.value = social.website || '';
}

// 加载我的文章
async function loadMyPosts() {
    profileElements.myPosts.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const user = api.getUser();
        const res = await postAPI.getList({
            authorId: user.id,
            page: profileState.currentPage,
            limit: 10
        });
        
        if (res.code === 200) {
            profileState.posts = res.data.records;
            profileState.totalPages = res.data.pages;
            renderMyPosts(res.data.records);
        }
    } catch (error) {
        console.error('加载文章失败:', error);
        profileElements.myPosts.innerHTML = `
            <div class="empty-state">
                <i class="ri-error-warning-line"></i>
                <h3>加载失败</h3>
            </div>
        `;
    }
}

// 渲染我的文章
function renderMyPosts(posts) {
    if (posts.length === 0) {
        profileElements.myPosts.innerHTML = `
            <div class="empty-state">
                <i class="ri-article-line"></i>
                <h3>暂无文章</h3>
                <p>开始写你的第一篇文章吧</p>
            </div>
        `;
        return;
    }
    
    profileElements.myPosts.innerHTML = posts.map(post => {
        const cover = post.coverImage || getDefaultCover(post.title);
        return `
            <div class="my-post-card" data-id="${post.id}">
                <div class="cover">
                    <img src="${cover}" alt="${escapeHtml(post.title)}">
                </div>
                <div class="info">
                    <a href="post.html?slug=${post.slug}" class="title">${escapeHtml(post.title)}</a>
                    <div class="meta">
                        <span><i class="ri-eye-line"></i> ${formatNumber(post.views)}</span>
                        <span><i class="ri-heart-line"></i> ${formatNumber(post.likeCount || 0)}</span>
                        <span><i class="ri-calendar-line"></i> ${formatDate(post.createdAt)}</span>
                    </div>
                </div>
                <span class="status ${post.status}">${post.status === 'published' ? '已发布' : '草稿'}</span>
                <div class="actions">
                    <button onclick="editPost(${post.id})" title="编辑">
                        <i class="ri-edit-line"></i>
                    </button>
                    <button class="delete" onclick="deletePost(${post.id})" title="删除">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// 编辑文章
function editPost(id) {
    window.location.href = `write.html?id=${id}`;
}

// 删除文章
async function deletePost(id) {
    if (!confirm('确定要删除这篇文章吗？')) return;
    
    try {
        const res = await postAPI.delete(id);
        if (res.code === 200) {
            showToast('删除成功', 'success');
            loadMyPosts();
        } else {
            showToast(res.message || '删除失败', 'error');
        }
    } catch (error) {
        showToast('删除失败', 'error');
    }
}

// 处理头像上传
async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('请上传图片文件', 'warning');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('图片大小不能超过5MB', 'warning');
        return;
    }
    
    try {
        showToast('上传中...', 'info');
        const res = await uploadAPI.image(file);
        
        if (res.code === 200) {
            // 更新头像
            const updateRes = await userAPI.updateProfile({ avatar: res.data.url });
            if (updateRes.code === 200) {
                profileElements.profileAvatar.src = res.data.url;
                profileElements.userAvatar.src = res.data.url;
                
                const user = api.getUser();
                user.avatar = res.data.url;
                api.setUser(user);
                
                showToast('头像更新成功', 'success');
            }
        } else {
            showToast(res.message || '上传失败', 'error');
        }
    } catch (error) {
        showToast('上传失败', 'error');
    }
}

// 处理资料表单提交
async function handleProfileSubmit(e) {
    e.preventDefault();
    
    const data = {
        name: profileElements.settingName.value.trim(),
        bio: profileElements.settingBio.value.trim(),
        githubUrl: profileElements.settingGithub.value.trim(),
        twitterUrl: profileElements.settingTwitter.value.trim(),
        websiteUrl: profileElements.settingWebsite.value.trim()
    };
    
    if (!data.name) {
        showToast('请输入用户名', 'warning');
        return;
    }
    
    try {
        const res = await userAPI.updateProfile(data);
        if (res.code === 200) {
            showToast('保存成功', 'success');
            api.setUser(res.data);
            renderUserProfile(res.data);
        } else {
            showToast(res.message || '保存失败', 'error');
        }
    } catch (error) {
        showToast('保存失败', 'error');
    }
}

// 处理密码表单提交
async function handlePasswordSubmit(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    if (!currentPassword || !newPassword || !confirmNewPassword) {
        showToast('请填写完整信息', 'warning');
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        showToast('两次输入的新密码不一致', 'warning');
        return;
    }
    
    if (newPassword.length < 6 || newPassword.length > 20) {
        showToast('密码长度需要在6-20位之间', 'warning');
        return;
    }
    
    try {
        const res = await userAPI.changePassword({ currentPassword, newPassword });
        if (res.code === 200) {
            showToast('密码修改成功', 'success');
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmNewPassword').value = '';
        } else {
            showToast(res.message || '修改失败', 'error');
        }
    } catch (error) {
        showToast('修改失败', 'error');
    }
}
