/**
 * 写文章页面逻辑
 */

// 检查登录状态
if (!api.getToken()) {
    window.location.href = 'login.html';
}

// 状态
const writeState = {
    categories: [],
    tags: [],
    selectedTags: [],
    coverImage: '',
    isPreview: false,
    postId: null // 编辑模式时使用
};

// DOM 元素
const writeElements = {
    postTitle: document.getElementById('postTitle'),
    editor: document.getElementById('editor'),
    preview: document.getElementById('preview'),
    wordCount: document.getElementById('wordCount'),
    readTime: document.getElementById('readTime'),
    previewToggle: document.getElementById('previewToggle'),
    publishBtn: document.getElementById('publishBtn'),
    saveDraft: document.getElementById('saveDraft'),
    publishPanel: document.getElementById('publishPanel'),
    overlay: document.getElementById('overlay'),
    closePanel: document.getElementById('closePanel'),
    cancelPublish: document.getElementById('cancelPublish'),
    confirmPublish: document.getElementById('confirmPublish'),
    coverUpload: document.getElementById('coverUpload'),
    coverInput: document.getElementById('coverInput'),
    coverPreview: document.getElementById('coverPreview'),
    uploadPlaceholder: document.getElementById('uploadPlaceholder'),
    categorySelect: document.getElementById('categorySelect'),
    tagInput: document.getElementById('tagInput'),
    selectedTags: document.getElementById('selectedTags'),
    tagSuggestions: document.getElementById('tagSuggestions'),
    excerpt: document.getElementById('excerpt'),
    featured: document.getElementById('featured')
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initEventListeners();
    loadCategories();
    loadTags();
    checkEditMode();
});

// 初始化主题
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// 初始化事件监听
function initEventListeners() {
    // 编辑器内容变化
    writeElements.editor.addEventListener('input', handleEditorChange);
    
    // 预览切换
    writeElements.previewToggle.addEventListener('click', togglePreview);
    
    // 工具栏按钮
    document.querySelectorAll('.editor-toolbar button').forEach(btn => {
        btn.addEventListener('click', () => handleToolbarAction(btn.dataset.action));
    });
    
    // 发布按钮
    writeElements.publishBtn.addEventListener('click', openPublishPanel);
    writeElements.saveDraft.addEventListener('click', saveDraft);
    
    // 发布面板
    writeElements.closePanel.addEventListener('click', closePublishPanel);
    writeElements.cancelPublish.addEventListener('click', closePublishPanel);
    writeElements.overlay.addEventListener('click', closePublishPanel);
    writeElements.confirmPublish.addEventListener('click', publishPost);
    
    // 封面上传
    writeElements.coverUpload.addEventListener('click', () => writeElements.coverInput.click());
    writeElements.coverInput.addEventListener('change', handleCoverUpload);
    
    // 标签输入
    writeElements.tagInput.addEventListener('keydown', handleTagInput);
}

// 处理编辑器内容变化
function handleEditorChange() {
    const content = writeElements.editor.value;
    
    // 更新字数统计
    const wordCount = content.length;
    writeElements.wordCount.textContent = `${wordCount} 字`;
    
    // 更新阅读时间（假设每分钟阅读300字）
    const readTime = Math.ceil(wordCount / 300);
    writeElements.readTime.textContent = `预计阅读 ${readTime} 分钟`;
    
    // 更新预览
    if (writeState.isPreview) {
        writeElements.preview.innerHTML = parseMarkdown(content);
    }
}

// 切换预览
function togglePreview() {
    writeState.isPreview = !writeState.isPreview;
    
    const wrapper = document.querySelector('.editor-wrapper');
    wrapper.classList.toggle('show-preview', writeState.isPreview);
    writeElements.previewToggle.classList.toggle('active', writeState.isPreview);
    
    if (writeState.isPreview) {
        writeElements.preview.innerHTML = parseMarkdown(writeElements.editor.value);
    }
}

// 处理工具栏操作
function handleToolbarAction(action) {
    const editor = writeElements.editor;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);
    
    let insertText = '';
    let cursorOffset = 0;
    
    switch (action) {
        case 'bold':
            insertText = `**${selectedText || '粗体文本'}**`;
            cursorOffset = selectedText ? 0 : -2;
            break;
        case 'italic':
            insertText = `*${selectedText || '斜体文本'}*`;
            cursorOffset = selectedText ? 0 : -1;
            break;
        case 'heading':
            insertText = `\n## ${selectedText || '标题'}\n`;
            break;
        case 'quote':
            insertText = `\n> ${selectedText || '引用文本'}\n`;
            break;
        case 'code':
            if (selectedText.includes('\n')) {
                insertText = `\n\`\`\`\n${selectedText}\n\`\`\`\n`;
            } else {
                insertText = `\`${selectedText || '代码'}\``;
            }
            break;
        case 'link':
            insertText = `[${selectedText || '链接文本'}](url)`;
            break;
        case 'image':
            insertText = `![${selectedText || '图片描述'}](url)`;
            break;
        case 'ul':
            insertText = `\n- ${selectedText || '列表项'}\n`;
            break;
        case 'ol':
            insertText = `\n1. ${selectedText || '列表项'}\n`;
            break;
    }
    
    editor.value = editor.value.substring(0, start) + insertText + editor.value.substring(end);
    editor.focus();
    
    const newPos = start + insertText.length + cursorOffset;
    editor.setSelectionRange(newPos, newPos);
    
    handleEditorChange();
}

// 加载分类
async function loadCategories() {
    try {
        const res = await categoryAPI.getAll();
        if (res.code === 200) {
            writeState.categories = res.data;
            renderCategories(res.data);
        }
    } catch (error) {
        console.error('加载分类失败:', error);
    }
}

// 渲染分类选项
function renderCategories(categories) {
    writeElements.categorySelect.innerHTML = `
        <option value="">请选择分类</option>
        ${categories.map(cat => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`).join('')}
    `;
}

// 加载标签
async function loadTags() {
    try {
        const res = await tagAPI.getAll();
        if (res.code === 200) {
            writeState.tags = res.data;
            renderTagSuggestions(res.data.slice(0, 10));
        }
    } catch (error) {
        console.error('加载标签失败:', error);
    }
}

// 渲染标签建议
function renderTagSuggestions(tags) {
    writeElements.tagSuggestions.innerHTML = tags.map(tag => `
        <span class="tag" data-id="${tag.id}" data-name="${escapeHtml(tag.name)}">${escapeHtml(tag.name)}</span>
    `).join('');
    
    // 绑定点击事件
    writeElements.tagSuggestions.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => {
            addTag(tag.dataset.id, tag.dataset.name);
        });
    });
}

// 处理标签输入
function handleTagInput(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const value = writeElements.tagInput.value.trim();
        if (value) {
            // 查找是否存在该标签
            const existingTag = writeState.tags.find(t => t.name === value);
            if (existingTag) {
                addTag(existingTag.id, existingTag.name);
            } else {
                // 创建新标签（使用临时ID）
                addTag(`new_${Date.now()}`, value);
            }
            writeElements.tagInput.value = '';
        }
    }
}

// 添加标签
function addTag(id, name) {
    // 检查是否已添加
    if (writeState.selectedTags.find(t => t.name === name)) {
        showToast('标签已添加', 'warning');
        return;
    }
    
    if (writeState.selectedTags.length >= 5) {
        showToast('最多添加5个标签', 'warning');
        return;
    }
    
    writeState.selectedTags.push({ id, name });
    renderSelectedTags();
}

// 移除标签
function removeTag(name) {
    writeState.selectedTags = writeState.selectedTags.filter(t => t.name !== name);
    renderSelectedTags();
}

// 渲染已选标签
function renderSelectedTags() {
    writeElements.selectedTags.innerHTML = writeState.selectedTags.map(tag => `
        <span class="tag">
            ${escapeHtml(tag.name)}
            <button type="button" onclick="removeTag('${escapeHtml(tag.name)}')">
                <i class="ri-close-line"></i>
            </button>
        </span>
    `).join('');
}

// 处理封面上传
async function handleCoverUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
        showToast('请上传图片文件', 'warning');
        return;
    }
    
    // 检查文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
        showToast('图片大小不能超过5MB', 'warning');
        return;
    }
    
    try {
        showToast('上传中...', 'info');
        const res = await uploadAPI.image(file);
        
        if (res.code === 200) {
            writeState.coverImage = res.data.url;
            writeElements.coverPreview.src = res.data.url;
            writeElements.coverPreview.style.display = 'block';
            writeElements.uploadPlaceholder.style.display = 'none';
            showToast('上传成功', 'success');
        } else {
            showToast(res.message || '上传失败', 'error');
        }
    } catch (error) {
        showToast('上传失败', 'error');
    }
}

// 打开发布面板
function openPublishPanel() {
    const title = writeElements.postTitle.value.trim();
    const content = writeElements.editor.value.trim();
    
    if (!title) {
        showToast('请输入文章标题', 'warning');
        writeElements.postTitle.focus();
        return;
    }
    
    if (!content) {
        showToast('请输入文章内容', 'warning');
        writeElements.editor.focus();
        return;
    }
    
    writeElements.publishPanel.classList.add('open');
    writeElements.overlay.classList.add('show');
}

// 关闭发布面板
function closePublishPanel() {
    writeElements.publishPanel.classList.remove('open');
    writeElements.overlay.classList.remove('show');
}

// 保存草稿
async function saveDraft() {
    await savePost('draft');
}

// 发布文章
async function publishPost() {
    await savePost('published');
}

// 保存文章
async function savePost(status) {
    const title = writeElements.postTitle.value.trim();
    const content = writeElements.editor.value.trim();
    const categoryId = writeElements.categorySelect.value;
    const excerpt = writeElements.excerpt.value.trim();
    const featured = writeElements.featured.checked;
    
    if (!title) {
        showToast('请输入文章标题', 'warning');
        return;
    }
    
    if (!content) {
        showToast('请输入文章内容', 'warning');
        return;
    }
    
    if (status === 'published' && !categoryId) {
        showToast('请选择分类', 'warning');
        return;
    }
    
    const postData = {
        title,
        content,
        excerpt: excerpt || content.substring(0, 200),
        coverImage: writeState.coverImage,
        categoryId: categoryId ? parseInt(categoryId) : null,
        tags: writeState.selectedTags.filter(t => !String(t.id).startsWith('new_')).map(t => parseInt(t.id)),
        featured,
        status
    };
    
    const btn = status === 'published' ? writeElements.confirmPublish : writeElements.saveDraft;
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line"></i> 保存中...';
    
    try {
        let res;
        if (writeState.postId) {
            res = await postAPI.update(writeState.postId, postData);
        } else {
            res = await postAPI.create(postData);
        }
        
        if (res.code === 200) {
            showToast(status === 'published' ? '发布成功' : '草稿已保存', 'success');
            
            if (status === 'published') {
                setTimeout(() => {
                    window.location.href = `post.html?slug=${res.data.slug}`;
                }, 1000);
            } else {
                writeState.postId = res.data.id;
            }
        } else {
            showToast(res.message || '保存失败', 'error');
        }
    } catch (error) {
        showToast('保存失败', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = status === 'published' 
            ? '<i class="ri-send-plane-line"></i> 确认发布'
            : '<i class="ri-draft-line"></i> 存草稿';
    }
}

// 检查编辑模式
function checkEditMode() {
    const params = getUrlParams();
    if (params.slug) {
        loadPostForEdit(params.slug);
    }
}

// 加载文章进行编辑
async function loadPostForEdit(slug) {
    try {
        showToast('加载文章中...', 'info');
        const res = await postAPI.getDetail(slug);
        
        if (res.code === 200) {
            const post = res.data;
            writeState.postId = post.id;
            
            // 填充表单
            writeElements.postTitle.value = post.title || '';
            writeElements.editor.value = post.content || '';
            writeElements.excerpt.value = post.excerpt || '';
            writeElements.featured.checked = post.featured || false;
            
            // 封面图
            if (post.coverImage) {
                writeState.coverImage = post.coverImage;
                writeElements.coverPreview.src = post.coverImage;
                writeElements.coverPreview.style.display = 'block';
                writeElements.uploadPlaceholder.style.display = 'none';
            }
            
            // 分类
            if (post.categoryId) {
                writeElements.categorySelect.value = post.categoryId;
            }
            
            // 标签
            if (post.tags && post.tags.length > 0) {
                post.tags.forEach(tagName => {
                    const tag = writeState.tags.find(t => t.name === tagName);
                    if (tag) {
                        writeState.selectedTags.push({ id: tag.id, name: tag.name });
                    }
                });
                renderSelectedTags();
            }
            
            // 更新字数统计
            handleEditorChange();
            showToast('文章加载成功', 'success');
        }
    } catch (error) {
        console.error('加载文章失败:', error);
        showToast('加载失败', 'error');
    }
}
