if (!api.getToken()) {
    const next = 'write.html' + window.location.search;
    window.location.href = 'login.html?next=' + encodeURIComponent(next);
}

const writeState = {
    tags: [],
    selectedTags: [],
    coverImage: '',
    previewing: false,
    postId: null
};

document.addEventListener('DOMContentLoaded', async () => {
    document.title = `写文章 - ${SITE.name}`;
    document.getElementById('brandLink').textContent = `← ${SITE.name}`;
    document.querySelector('[data-theme-toggle]').addEventListener('click', toggleTheme);

    document.getElementById('editor').addEventListener('input', updateStats);
    document.getElementById('previewToggle').addEventListener('click', togglePreview);
    document.getElementById('publishBtn').addEventListener('click', () => savePost('published'));
    document.getElementById('saveDraft').addEventListener('click', () => savePost('draft'));
    document.getElementById('editorTools').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (btn) handleToolbar(btn.dataset.action);
    });
    document.getElementById('coverUpload').addEventListener('click', () => {
        document.getElementById('coverInput').click();
    });
    document.getElementById('coverInput').addEventListener('change', (e) => uploadCover(e.target.files[0]));
    document.getElementById('imageInput').addEventListener('change', (e) => insertUploadedImage(e.target.files[0]));
    document.getElementById('tagInput').addEventListener('keydown', onTagKeydown);
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            savePost('published');
        }
    });

    await Promise.all([loadCategories(), loadTags()]);
    await loadForEdit();
    updateStats();
});

function updateStats() {
    const content = document.getElementById('editor').value;
    const count = content.replace(/\s/g, '').length;
    document.getElementById('wordCount').textContent = `${count} 字`;
    document.getElementById('readTime').textContent = `约 ${Math.max(1, Math.ceil(count / 400))} 分钟`;
    if (writeState.previewing) {
        document.getElementById('preview').innerHTML = parseMarkdown(content);
        renderMath(document.getElementById('preview'));
    }
}

function togglePreview() {
    writeState.previewing = !writeState.previewing;
    document.getElementById('editorWrap').classList.toggle('show-preview', writeState.previewing);
    document.getElementById('previewToggle').textContent = writeState.previewing ? '编辑' : '预览';
    updateStats();
}

function handleToolbar(action) {
    if (action === 'image') {
        document.getElementById('imageInput').click();
        return;
    }

    const editor = document.getElementById('editor');
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = editor.value.slice(start, end);
    let insert = '';

    switch (action) {
        case 'bold': insert = `**${selected || '粗体'}**`; break;
        case 'italic': insert = `*${selected || '斜体'}*`; break;
        case 'heading': insert = `\n## ${selected || '小标题'}\n`; break;
        case 'quote': insert = `\n> ${selected || '引用'}\n`; break;
        case 'code':
            insert = selected.includes('\n') ? `\n\`\`\`\n${selected}\n\`\`\`\n` : `\`${selected || '代码'}\``;
            break;
        case 'link': insert = `[${selected || '链接文字'}](https://)`; break;
        case 'ul': insert = `\n- ${selected || '条目'}\n`; break;
        default: return;
    }

    editor.setRangeText(insert, start, end, 'end');
    editor.focus();
    updateStats();
}

async function loadCategories() {
    const res = await categoryAPI.getAll();
    if (res.code !== 200 || !Array.isArray(res.data)) return;
    const select = document.getElementById('categorySelect');
    select.innerHTML = `<option value="">选择分类</option>` + res.data.map((cat) => (
        `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`
    )).join('');
}

async function loadTags() {
    const res = await tagAPI.getAll();
    if (res.code !== 200 || !Array.isArray(res.data)) return;
    writeState.tags = res.data;
    const box = document.getElementById('tagSuggestions');
    box.innerHTML = res.data.slice(0, 12).map((tag) => (
        `<button type="button" class="pill" data-id="${tag.id}">${escapeHtml(tag.name)}</button>`
    )).join('');
    box.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', () => addTag(btn.dataset.id, btn.textContent));
    });
}

async function onTagKeydown(e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const input = document.getElementById('tagInput');
    const value = input.value.trim();
    if (!value) return;

    const existing = writeState.tags.find((tag) => tag.name === value);
    if (existing) {
        addTag(existing.id, existing.name);
    } else {
        const res = await tagAPI.create({ name: value, slug: value.toLowerCase().replace(/\s+/g, '-') });
        if (res.code === 200) {
            await loadTags();
            const created = writeState.tags.find((tag) => tag.name === value);
            if (created) addTag(created.id, created.name);
        }
    }
    input.value = '';
}

function addTag(id, name) {
    if (writeState.selectedTags.some((tag) => tag.name === name)) return;
    if (writeState.selectedTags.length >= 5) {
        showToast('最多五个标签', 'warning');
        return;
    }
    writeState.selectedTags.push({ id, name });
    renderSelectedTags();
}

function renderSelectedTags() {
    const box = document.getElementById('selectedTags');
    box.innerHTML = writeState.selectedTags.map((tag) => `
        <span class="pill">${escapeHtml(tag.name)}<button type="button" data-name="${escapeHtml(tag.name)}" aria-label="移除">×</button></span>
    `).join('');
    box.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', () => {
            writeState.selectedTags = writeState.selectedTags.filter((tag) => tag.name !== btn.dataset.name);
            renderSelectedTags();
        });
    });
}

async function uploadCover(file) {
    const url = await uploadImage(file);
    if (!url) return;
    writeState.coverImage = url;
    const preview = document.getElementById('coverPreview');
    preview.src = url;
    preview.hidden = false;
    document.getElementById('uploadPlaceholder').textContent = '更换封面';
}

async function insertUploadedImage(file) {
    const url = await uploadImage(file);
    if (!url) return;
    const editor = document.getElementById('editor');
    const snippet = `\n![图片](${url})\n`;
    editor.setRangeText(snippet, editor.selectionStart, editor.selectionEnd, 'end');
    updateStats();
}

async function uploadImage(file) {
    if (!file) return '';
    if (!file.type.startsWith('image/')) {
        showToast('请选择图片', 'warning');
        return '';
    }
    if (file.size > 5 * 1024 * 1024) {
        showToast('图片需要小于 5MB', 'warning');
        return '';
    }
    try {
        const res = await uploadAPI.image(file);
        if (res.code === 200 && res.data?.url) return res.data.url;
        showToast(res.message || '上传失败', 'error');
    } catch (error) {
        showToast('上传失败', 'error');
    }
    return '';
}

async function savePost(status) {
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('editor').value.trim();
    const categoryId = document.getElementById('categorySelect').value;
    const excerpt = document.getElementById('excerpt').value.trim();

    if (!title || !content) {
        showToast('先写标题和正文', 'warning');
        return;
    }
    if (!categoryId) {
        showToast('选一个分类', 'warning');
        return;
    }

    const payload = {
        title,
        content,
        excerpt: excerpt || toPlain(content).slice(0, 140),
        coverImage: writeState.coverImage,
        categoryId: Number(categoryId),
        tags: writeState.selectedTags.map((tag) => Number(tag.id)),
        featured: false,
        status
    };

    const btn = status === 'published' ? document.getElementById('publishBtn') : document.getElementById('saveDraft');
    btn.disabled = true;
    try {
        const res = writeState.postId
            ? await postAPI.update(writeState.postId, payload)
            : await postAPI.create(payload);
        if (res.code === 200) {
            writeState.postId = res.data.id;
            showToast(status === 'published' ? '已发布' : '草稿已保存');
            if (status === 'published' && res.data.slug) {
                setTimeout(() => {
                    window.location.href = `post.html?slug=${encodeURIComponent(res.data.slug)}`;
                }, 500);
            }
        }
    } catch (error) {
        showToast('保存失败', 'error');
    } finally {
        btn.disabled = false;
    }
}

async function loadForEdit() {
    const slug = getUrlParams().slug;
    if (!slug) return;
    const res = await postAPI.getDetail(slug);
    if (res.code !== 200 || !res.data) return;
    const post = res.data;
    const user = api.getUser();
    if (!user || !post.author || String(user.id) !== String(post.author.id)) {
        showToast('只能编辑自己的文章', 'warning');
        setTimeout(() => { window.location.href = 'index.html'; }, 700);
        return;
    }

    writeState.postId = post.id;
    document.getElementById('postTitle').value = post.title || '';
    document.getElementById('editor').value = post.content || '';
    document.getElementById('excerpt').value = post.excerpt || '';
    if (post.categoryId) document.getElementById('categorySelect').value = post.categoryId;
    if (post.coverImage) {
        writeState.coverImage = post.coverImage;
        const preview = document.getElementById('coverPreview');
        preview.src = post.coverImage;
        preview.hidden = false;
        document.getElementById('uploadPlaceholder').textContent = '更换封面';
    }
    (post.tags || []).forEach((name) => {
        const tag = writeState.tags.find((item) => item.name === name);
        if (tag) writeState.selectedTags.push({ id: tag.id, name: tag.name });
    });
    renderSelectedTags();
}
