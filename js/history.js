// ==================== 搜索历史管理 ====================

// ==================== DOM 元素 ====================
const historyList = document.getElementById('historyList');
const emptyState = document.getElementById('emptyState');
const clearAllBtn = document.getElementById('clearAllBtn');
const toast = document.getElementById('toast');

// ==================== 初始化 ====================
function init() {
    renderHistory();
    bindEvents();
}

// ==================== 事件绑定 ====================
function bindEvents() {
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', handleClearAll);
    }
}

// ==================== 渲染历史记录 ====================
function renderHistory() {
    const history = getSearchHistory();
    
    if (history.length === 0) {
        showEmptyState();
        return;
    }
    
    hideEmptyState();
    
    historyList.innerHTML = history.map(item => {
        // 优先使用 iconSvg，如果没有则使用 icon emoji
        const iconHtml = item.platformIconSvg || item.platformIcon || '🔍';
        
        return `
            <div class="history-item" data-id="${item.id}">
                <div class="history-header">
                    <span class="history-platform-icon">${iconHtml}</span>
                    <span class="history-query">${escapeHtml(item.query)}</span>
                </div>
                <div class="history-meta">
                    <span class="history-platform-name">
                        ${item.categoryName ? `${item.categoryName} · ` : ''}${item.platformName}
                    </span>
                    <span class="history-time">${formatTime(item.timestamp)}</span>
                </div>
                <div class="history-actions">
                    <button class="history-btn copy-btn" data-action="copy" data-query="${escapeHtml(item.query)}" title="复制">
                        📋 复制
                    </button>
                    <button class="history-btn search-btn" data-action="search" data-platform="${item.platform}" data-query="${escapeHtml(item.query)}" data-category="${item.category}" title="再次搜索">
                        🔍 再搜
                    </button>
                    <button class="history-btn delete-btn" data-action="delete" data-id="${item.id}" title="删除">
                        🗑️ 删除
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // 绑定操作按钮事件
    document.querySelectorAll('.history-btn').forEach(btn => {
        btn.addEventListener('click', handleAction);
    });
}

// ==================== 处理操作 ====================
function handleAction(e) {
    const btn = e.currentTarget;
    const action = btn.dataset.action;
    
    switch (action) {
        case 'copy':
            handleCopy(btn.dataset.query);
            break;
        case 'search':
            handleSearch(btn.dataset.query, btn.dataset.platform, btn.dataset.category);
            break;
        case 'delete':
            handleDelete(btn.dataset.id);
            break;
    }
}

// ==================== 复制搜索词 ====================
async function handleCopy(query) {
    try {
        await navigator.clipboard.writeText(query);
        showToast('✅ 已复制到剪贴板');
    } catch (error) {
        // 降级方案
        const textarea = document.createElement('textarea');
        textarea.value = query;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showToast('✅ 已复制到剪贴板');
        } catch (e) {
            showToast('❌ 复制失败，请手动复制');
        }
        document.body.removeChild(textarea);
    }
}

// ==================== 再次搜索 ====================
function handleSearch(query, platformId, categoryId) {
    // 构建跳转URL
    const params = new URLSearchParams();
    params.set('q', query);
    if (categoryId) {
        params.set('category', categoryId);
    }
    
    window.location.href = `index.html?${params.toString()}`;
}

// ==================== 删除单条记录 ====================
function handleDelete(id) {
    if (!confirm('确定要删除这条搜索记录吗？')) {
        return;
    }
    
    try {
        let history = getSearchHistory();
        history = history.filter(item => item.id !== id);
        localStorage.setItem('searchHistory', JSON.stringify(history));
        
        showToast('✅ 已删除');
        renderHistory();
    } catch (error) {
        console.error('删除失败:', error);
        showToast('❌ 删除失败');
    }
}

// ==================== 清空所有记录 ====================
function handleClearAll() {
    if (!confirm('确定要清空所有搜索历史吗？此操作不可恢复！')) {
        return;
    }
    
    try {
        localStorage.setItem('searchHistory', JSON.stringify([]));
        showToast('✅ 已清空所有历史');
        renderHistory();
    } catch (error) {
        console.error('清空失败:', error);
        showToast('❌ 清空失败');
    }
}

// ==================== 获取搜索历史 ====================
function getSearchHistory() {
    try {
        const history = localStorage.getItem('searchHistory');
        return history ? JSON.parse(history) : [];
    } catch (error) {
        console.error('读取历史记录失败:', error);
        return [];
    }
}

// ==================== 显示/隐藏空状态 ====================
function showEmptyState() {
    if (historyList) historyList.style.display = 'none';
    if (emptyState) emptyState.classList.add('show');
    if (clearAllBtn) clearAllBtn.style.display = 'none';
}

function hideEmptyState() {
    if (historyList) historyList.style.display = 'flex';
    if (emptyState) emptyState.classList.remove('show');
    if (clearAllBtn) clearAllBtn.style.display = 'block';
}

// ==================== 时间格式化 ====================
function formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    
    if (diff < minute) {
        return '刚刚';
    } else if (diff < hour) {
        return Math.floor(diff / minute) + '分钟前';
    } else if (diff < day) {
        return Math.floor(diff / hour) + '小时前';
    } else if (diff < week) {
        return Math.floor(diff / day) + '天前';
    } else {
        const date = new Date(timestamp);
        return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
}

// ==================== HTML转义 ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== Toast 通知 ====================
function showToast(message, duration = 2000) {
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// ==================== 启动应用 ====================
// 确保 DOM 完全加载后再初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
