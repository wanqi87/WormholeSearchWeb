// ==================== 设置管理 ====================

// ==================== DOM 元素 ====================
const statsGrid = document.getElementById('statsGrid');
const totalSearches = document.getElementById('totalSearches');
const totalPlatforms = document.getElementById('totalPlatforms');
const totalCategories = document.getElementById('totalCategories');
const topPlatforms = document.getElementById('topPlatforms');
const exportDataBtn = document.getElementById('exportDataBtn');
const importDataBtn = document.getElementById('importDataBtn');
const clearDataBtn = document.getElementById('clearDataBtn');
const importFileInput = document.getElementById('importFileInput');
const toast = document.getElementById('toast');

// ==================== 初始化 ====================
function init() {
    loadStatistics();
    bindEvents();
}

// ==================== 加载统计信息 ====================
function loadStatistics() {
    // 获取搜索历史
    const history = getSearchHistory();
    totalSearches.textContent = history.length;
    
    // 获取平台统计
    const stats = getPlatformStats();
    totalPlatforms.textContent = getAllPlatforms().length;
    totalCategories.textContent = getAllCategories().length;
    
    // 渲染最常使用的平台
    renderTopPlatforms(stats);
}

// ==================== 渲染最常使用的平台 ====================
function renderTopPlatforms(stats) {
    // 转换为数组并排序
    const platforms = Object.entries(stats)
        .map(([id, data]) => ({
            id,
            ...data,
            platform: getPlatformById(id)
        }))
        .filter(item => item.platform) // 过滤掉无效的平台
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // 只显示前5个
    
    if (platforms.length === 0) {
        topPlatforms.innerHTML = '<p class="empty-hint">暂无数据</p>';
        return;
    }
    
    topPlatforms.innerHTML = platforms.map((item, index) => {
        // 优先使用 iconSvg，如果没有则使用 icon emoji
        const iconHtml = item.platform.iconSvg || item.platform.icon;
        
        return `
            <div class="top-platform-item">
                <div class="top-platform-rank">${index + 1}</div>
                <div class="top-platform-icon">${iconHtml}</div>
                <div class="top-platform-info">
                    <div class="top-platform-name">${item.platform.name}</div>
                    <div class="top-platform-category">${getCategoryById(item.platform.category)?.name || ''}</div>
                </div>
                <div class="top-platform-count">${item.count} 次</div>
            </div>
        `;
    }).join('');
}

// ==================== 事件绑定 ====================
function bindEvents() {
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', handleExportData);
    }
    
    if (importDataBtn) {
        importDataBtn.addEventListener('click', () => {
            importFileInput.click();
        });
    }
    
    if (importFileInput) {
        importFileInput.addEventListener('change', handleImportData);
    }
    
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', handleClearData);
    }
}

// ==================== 导出数据 ====================
function handleExportData() {
    try {
        const data = {
            version: '2.0.0',
            exportTime: new Date().toISOString(),
            searchHistory: getSearchHistory(),
            platformStats: getPlatformStats(),
            settings: getSettings()
        };
        
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `虫洞搜索_数据备份_${formatDate(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('✅ 数据已导出');
    } catch (error) {
        console.error('导出失败:', error);
        showToast('❌ 导出失败');
    }
}

// ==================== 导入数据 ====================
function handleImportData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            
            // 验证数据格式
            if (!data.version || !data.searchHistory) {
                throw new Error('数据格式不正确');
            }
            
            // 确认导入
            if (!confirm(`确定要导入数据吗？\n\n这将覆盖当前的搜索历史（${getSearchHistory().length}条）。\n导入文件包含${data.searchHistory.length}条记录。`)) {
                return;
            }
            
            // 导入数据
            if (data.searchHistory) {
                localStorage.setItem('searchHistory', JSON.stringify(data.searchHistory));
            }
            if (data.platformStats) {
                localStorage.setItem('platformStats', JSON.stringify(data.platformStats));
            }
            if (data.settings) {
                localStorage.setItem('settings', JSON.stringify(data.settings));
            }
            
            showToast('✅ 数据已导入');
            
            // 重新加载统计
            setTimeout(() => {
                loadStatistics();
            }, 500);
            
        } catch (error) {
            console.error('导入失败:', error);
            showToast('❌ 导入失败，请检查文件格式');
        }
    };
    
    reader.readAsText(file);
    
    // 清空input，允许重复选择同一文件
    e.target.value = '';
}

// ==================== 清除所有数据 ====================
function handleClearData() {
    const history = getSearchHistory();
    
    if (history.length === 0) {
        showToast('⚠️ 没有数据可清除');
        return;
    }
    
    if (!confirm(`确定要清除所有数据吗？\n\n这将删除：\n• ${history.length}条搜索历史\n• 平台使用统计\n• 个人设置\n\n此操作不可恢复！`)) {
        return;
    }
    
    try {
        localStorage.removeItem('searchHistory');
        localStorage.removeItem('platformStats');
        localStorage.removeItem('settings');
        
        showToast('✅ 所有数据已清除');
        
        // 重新加载统计
        setTimeout(() => {
            loadStatistics();
        }, 500);
    } catch (error) {
        console.error('清除失败:', error);
        showToast('❌ 清除失败');
    }
}

// ==================== 工具函数 ====================

function getSearchHistory() {
    try {
        const history = localStorage.getItem('searchHistory');
        return history ? JSON.parse(history) : [];
    } catch (error) {
        console.error('读取历史失败:', error);
        return [];
    }
}

function getPlatformStats() {
    try {
        const stats = localStorage.getItem('platformStats');
        return stats ? JSON.parse(stats) : {};
    } catch (error) {
        console.error('读取统计失败:', error);
        return {};
    }
}

function getSettings() {
    try {
        const settings = localStorage.getItem('settings');
        return settings ? JSON.parse(settings) : {};
    } catch (error) {
        console.error('读取设置失败:', error);
        return {};
    }
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}_${hour}${minute}`;
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
init();

