// ==================== 虫洞搜索 - 主应用逻辑 ====================

// ==================== 全局状态 ====================
let currentCategory = 'featured'; // 当前选中的分类（默认为精选）
let currentQuery = ''; // 当前搜索词

// ==================== DOM 元素 ====================
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const frequentPlatforms = document.getElementById('frequentPlatforms');
const frequentIcons = document.getElementById('frequentIcons');
const categoryTabs = document.getElementById('categoryTabs');
const platformsGrid = document.getElementById('platformsGrid');
const toast = document.getElementById('toast');
const welcomeCard = document.getElementById('welcomeCard');
const welcomeClose = document.getElementById('welcomeClose');

// ==================== 初始化 ====================
function init() {
    // 加载用户设置
    loadSettings();
    
    // 渲染分类标签
    renderCategories();
    
    // 渲染平台卡片
    renderPlatforms(currentCategory);
    
    // 绑定事件
    bindEvents();
    
    // 检查URL参数
    checkUrlParams();
    
    // 初始化 xAI 风格粒子效果
    initParticles();
    
    // 检查是否首次访问，显示欢迎卡片
    checkFirstVisit();
}

// ==================== xAI 风格粒子效果 ====================
function initParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    const particleCount = 30; // 粒子数量
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // 随机位置
        particle.style.left = Math.random() * 100 + '%';
        particle.style.bottom = '-10px';
        
        // 随机延迟
        particle.style.animationDelay = Math.random() * 10 + 's';
        
        // 随机持续时间（8-12秒）
        particle.style.animationDuration = (Math.random() * 4 + 8) + 's';
        
        // 随机大小（1-3px）
        const size = Math.random() * 2 + 1;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        particlesContainer.appendChild(particle);
    }
}

// ==================== 加载用户设置 ====================
function loadSettings() {
    try {
        const settings = localStorage.getItem('settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            currentCategory = parsed.lastCategory || 'featured';
            
            // 恢复上次的搜索框内容
            if (parsed.lastSearchQuery) {
                searchInput.value = parsed.lastSearchQuery;
                currentQuery = parsed.lastSearchQuery;
                
                // 显示清空按钮
                clearBtn.classList.add('show');
                
                // 显示常用平台（如果有数据）
                renderFrequentPlatforms();
                
                // 更新平台卡片状态
                updatePlatformCards(currentQuery);
            }
        }
    } catch (error) {
        console.error('加载设置失败:', error);
    }
}

// ==================== 保存用户设置 ====================
function saveSettings() {
    try {
        const settings = {
            lastCategory: currentCategory,
            lastSearchQuery: currentQuery,
            timestamp: Date.now()
        };
        localStorage.setItem('settings', JSON.stringify(settings));
    } catch (error) {
        console.error('保存设置失败:', error);
    }
}

// ==================== 渲染分类标签 ====================
function renderCategories() {
    const categories = getAllCategories();
    
    categoryTabs.innerHTML = categories.map(category => `
        <button 
            class="category-tab ${category.id === currentCategory ? 'active' : ''}" 
            data-category="${category.id}"
            title="${category.description}"
        >
            <span class="category-icon">${category.icon}</span>
            <span class="category-name">${category.name}</span>
        </button>
    `).join('');
}

// ==================== 根据使用统计排序平台 ====================
function sortPlatformsByUsage(platforms) {
    try {
        const stats = JSON.parse(localStorage.getItem('platformStats') || '{}');
        
        // 将平台分为两组：有使用记录的和没有使用记录的
        const withStats = [];
        const withoutStats = [];
        
        platforms.forEach(platform => {
            if (stats[platform.id] && stats[platform.id].count > 0) {
                withStats.push({
                    ...platform,
                    _count: stats[platform.id].count,
                    _lastUsed: stats[platform.id].lastUsed
                });
            } else {
                withoutStats.push(platform);
            }
        });
        
        // 有使用记录的按使用次数降序排序，次数相同按最后使用时间降序
        withStats.sort((a, b) => {
            if (b._count !== a._count) {
                return b._count - a._count;
            }
            return b._lastUsed - a._lastUsed;
        });
        
        // 没有使用记录的按原order排序
        withoutStats.sort((a, b) => a.order - b.order);
        
        // 合并两组：有使用记录的在前，没有使用记录的在后
        return [...withStats, ...withoutStats];
    } catch (error) {
        console.error('排序平台失败:', error);
        return platforms.sort((a, b) => a.order - b.order);
    }
}

// ==================== 渲染平台卡片 ====================
function renderPlatforms(categoryId) {
    let platforms = getPlatformsByCategory(categoryId);
    
    // 如果是精选分类，根据使用统计动态排序
    if (categoryId === 'featured') {
        platforms = sortPlatformsByUsage(platforms);
    }
    
    const hasQuery = searchInput.value.trim().length > 0;
    
    platformsGrid.innerHTML = platforms.map(platform => {
        // 优先使用 SVG 图标，如果没有则使用 Emoji
        const iconHtml = platform.iconSvg 
            ? platform.iconSvg  // SVG 图标
            : platform.icon;    // Emoji 回退
        
        // 为中心光晕渐变创建主题色变量
        const glowCenter = hexToRgba(platform.brandColor, 0.18); // 中心最亮
        const glowMid = hexToRgba(platform.brandColor, 0.12);    // 中间稍淡
        const shadowColor = hexToRgba(platform.brandColor, 0.35); // 悬停阴影
        
        return `
            <button 
                class="platform-card ${!hasQuery ? 'disabled' : ''}" 
                data-platform="${platform.id}"
                data-name="${platform.name}"
                data-category="${platform.category}"
                style="--brand-color: ${platform.brandColor}; --brand-color-glow-center: ${glowCenter}; --brand-color-glow-mid: ${glowMid}; --brand-shadow: ${shadowColor}"
            >
                <div class="platform-icon">
                    ${iconHtml}
                </div>
                <div class="platform-name">${platform.name}</div>
            </button>
        `;
    }).join('');
    
    // 添加平台卡片点击事件
    document.querySelectorAll('.platform-card').forEach(card => {
        card.addEventListener('click', handlePlatformClick);
    });
}

// ==================== 颜色转换辅助函数 ====================
function hexToRgba(hex, alpha = 1) {
    // 移除 # 符号
    hex = hex.replace('#', '');
    
    // 处理简写格式 (如 #fff)
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }
    
    // 转换为 RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ==================== 切换分类 ====================
function switchCategory(categoryId) {
    if (categoryId === currentCategory) return;
    
    currentCategory = categoryId;
    
    // 更新分类标签状态
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.category === categoryId);
    });
    
    // 重新渲染平台卡片（带动画）
    platformsGrid.style.animation = 'none';
    setTimeout(() => {
        renderPlatforms(categoryId);
        platformsGrid.style.animation = '';
    }, 10);
    
    // 保存设置
    saveSettings();
    
    // 滚动分类标签到可见位置
    const activeTab = document.querySelector('.category-tab.active');
    if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

// ==================== 事件绑定 ====================
function bindEvents() {
    // 搜索框输入事件
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('keypress', handleKeyPress);
    
    // 清空按钮
    clearBtn.addEventListener('click', clearSearchInput);
    
    // 分类标签点击事件
    categoryTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.category-tab');
        if (tab) {
            switchCategory(tab.dataset.category);
        }
    });
    
    // 欢迎卡片事件
    if (welcomeClose) {
        welcomeClose.addEventListener('click', hideWelcomeCard);
    }
}

// ==================== 搜索框处理 ====================
function handleSearchInput(e) {
    currentQuery = e.target.value.trim();
    
    // 显示/隐藏清空按钮
    if (currentQuery) {
        clearBtn.classList.add('show');
        // 显示常用平台（如果有数据）
        renderFrequentPlatforms();
    } else {
        clearBtn.classList.remove('show');
        // 隐藏常用平台
        frequentPlatforms.style.display = 'none';
    }
    
    // 更新平台卡片状态
    updatePlatformCards(currentQuery);
    
    // 实时保存搜索框内容到 localStorage
    saveSettings();
}

function handleKeyPress(e) {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            // 自动选择平台进行搜索
            const targetPlatform = getMostUsedPlatform();
            if (targetPlatform) {
                // 模拟点击该平台
                const platform = getPlatformById(targetPlatform);
                if (platform) {
                    // 处理特殊平台（如微信）
                    if (platform.isSpecial) {
                        showToast('💬 请在微信App内搜索：' + query, 3000);
                        saveSearchHistory(query, targetPlatform, platform.name, platform.category);
                        return;
                    }
                    
                    // 保存搜索历史
                    saveSearchHistory(query, targetPlatform, platform.name, platform.category);
                    
                    // 显示跳转提示
                    showToast(`🚀 正在打开${platform.name}...`);
                    
                    // 打开平台
                    openPlatform(platform, query, platform.name);
                }
            }
        }
    }
}

function clearSearchInput() {
    searchInput.value = '';
    currentQuery = '';
    clearBtn.classList.remove('show');
    frequentPlatforms.style.display = 'none';
    updatePlatformCards('');
    searchInput.focus();
    
    // 清空时也保存设置
    saveSettings();
}

function updatePlatformCards(query) {
    const platformCards = document.querySelectorAll('.platform-card');
    platformCards.forEach(card => {
        if (query) {
            card.classList.remove('disabled');
        } else {
            card.classList.add('disabled');
        }
    });
}

// ==================== 搜索框脉冲动画 ====================
function triggerSearchInputPulse() {
    console.log('🎬 触发脉冲动画'); // 调试日志
    
    // 移除动画类（如果存在）
    searchInput.classList.remove('pulse-animation');
    
    // 触发重排，确保动画可以重新播放
    void searchInput.offsetWidth;
    
    // 添加动画类
    searchInput.classList.add('pulse-animation');
    console.log('✅ 动画类已添加'); // 调试日志
    
    // 动画结束后移除类，以便下次可以再次触发
    setTimeout(() => {
        searchInput.classList.remove('pulse-animation');
        console.log('⏹️ 动画类已移除'); // 调试日志
    }, 1500);
}

// ==================== 平台点击处理 ====================
function handlePlatformClick(e) {
    const card = e.currentTarget;
    const platformId = card.dataset.platform;
    const platformName = card.dataset.name;
    const categoryId = card.dataset.category;
    const query = searchInput.value.trim();
    
    // 检查是否有搜索内容
    if (!query) {
        showToast('⚠️ 请先输入搜索内容');
        // 触发搜索框脉冲动画
        triggerSearchInputPulse();
        searchInput.focus();
        return;
    }
    
    const platform = getPlatformById(platformId);
    
    if (!platform) {
        showToast('❌ 平台配置错误');
        return;
    }
    
    // 处理特殊平台（如微信）
    if (platform.isSpecial) {
        showToast('💬 请在微信App内搜索：' + query, 3000);
        saveSearchHistory(query, platformId, platformName, categoryId);
        return;
    }
    
    // 保存搜索历史
    saveSearchHistory(query, platformId, platformName, categoryId);
    
    // 显示跳转提示
    showToast(`🚀 正在打开${platformName}...`);
    
    // 尝试打开App（移动端优先）或网页
    openPlatform(platform, query, platformName);
}

// ==================== 检测是否在微信环境 ====================
function isWeChat() {
    const ua = navigator.userAgent.toLowerCase();
    return ua.indexOf('micromessenger') !== -1;
}

// ==================== 打开平台（App或网页）====================
function openPlatform(platform, query, platformName) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const inWeChat = isWeChat();
    
    // 桌面端直接打开网页
    if (!isMobile || !platform.appScheme) {
        const webUrl = platform.url.replace('{query}', encodeURIComponent(query));
        setTimeout(() => {
            window.open(webUrl, '_blank');
        }, 300);
        return;
    }
    
    // 移动端：判断是否在微信中
    if (inWeChat) {
        // 在微信中，iOS无法唤起第三方app，直接打开网页版
        const webUrl = platform.url.replace('{query}', encodeURIComponent(query));
        showToast(`💡 微信中将打开网页版`, 2000);
        setTimeout(() => {
            window.location.href = webUrl;
        }, 500);
        return;
    }
    
    // 移动端非微信环境：尝试打开App
    const appUrl = platform.appScheme.replace('{query}', encodeURIComponent(query));
    const webUrl = platform.url.replace('{query}', encodeURIComponent(query));
    
    // 尝试唤起App
    tryOpenApp(appUrl, webUrl, platformName);
}

// ==================== 尝试唤起App ====================
function tryOpenApp(appUrl, webUrl, platformName) {
    let appOpened = false;
    
    // 记录开始时间
    const startTime = Date.now();
    
    // 监听页面可见性变化
    const visibilityChangeHandler = () => {
        if (document.hidden) {
            // 页面被隐藏，说明App被打开了
            appOpened = true;
        }
    };
    
    // 监听页面失焦（用户切换到其他应用）
    const blurHandler = () => {
        appOpened = true;
    };
    
    document.addEventListener('visibilitychange', visibilityChangeHandler);
    window.addEventListener('blur', blurHandler);
    window.addEventListener('pagehide', blurHandler);
    
    // 优化方案：直接使用window.location，减少弹窗次数
    try {
        window.location.href = appUrl;
    } catch (e) {
        console.error('打开App失败:', e);
    }
    
    // 设置超时检测 - 缩短到600ms提高响应速度
    const timeout = setTimeout(() => {
        // 清理事件监听
        document.removeEventListener('visibilitychange', visibilityChangeHandler);
        window.removeEventListener('blur', blurHandler);
        window.removeEventListener('pagehide', blurHandler);
        
        // 检查是否打开了App
        const elapsed = Date.now() - startTime;
        
        // 如果页面没有被隐藏，且时间差小于800ms，说明App可能没安装
        if (!appOpened && elapsed < 800) {
            // Fallback到网页版
            window.location.href = webUrl;
        }
    }, 600);
}

// ==================== 搜索历史管理 ====================
function saveSearchHistory(query, platformId, platformName, categoryId) {
    try {
        // 获取现有历史
        const history = getSearchHistory();
        
        // 创建新记录
        const platform = getPlatformById(platformId);
        const newRecord = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            query: query,
            platform: platformId,
            platformName: platformName,
            category: categoryId,
            categoryName: getCategoryById(categoryId)?.name || '',
            platformIcon: platform?.icon || '🔍',
            platformIconSvg: platform?.iconSvg || '',
            timestamp: Date.now()
        };
        
        // 检查是否有重复记录（相同搜索词和平台）
        const duplicateIndex = history.findIndex(
            item => item.query === query && item.platform === platformId
        );
        
        if (duplicateIndex !== -1) {
            // 如果有重复，删除旧记录
            history.splice(duplicateIndex, 1);
        }
        
        // 添加到历史记录开头
        history.unshift(newRecord);
        
        // 限制历史记录数量（最多保存100条）
        if (history.length > 100) {
            history.splice(100);
        }
        
        // 保存到LocalStorage
        localStorage.setItem('searchHistory', JSON.stringify(history));
        
        // 更新平台使用统计
        updatePlatformStats(platformId);
    } catch (error) {
        console.error('保存搜索历史失败:', error);
        showToast('⚠️ 保存历史记录失败');
    }
}

function getSearchHistory() {
    try {
        const history = localStorage.getItem('searchHistory');
        return history ? JSON.parse(history) : [];
    } catch (error) {
        console.error('读取搜索历史失败:', error);
        return [];
    }
}

// ==================== 平台使用统计 ====================
function updatePlatformStats(platformId) {
    try {
        const stats = JSON.parse(localStorage.getItem('platformStats') || '{}');
        
        if (!stats[platformId]) {
            stats[platformId] = { count: 0, lastUsed: 0 };
        }
        
        stats[platformId].count++;
        stats[platformId].lastUsed = Date.now();
        
        localStorage.setItem('platformStats', JSON.stringify(stats));
    } catch (error) {
        console.error('更新统计失败:', error);
    }
}

// ==================== 获取常用平台 ====================
function getTopFrequentPlatforms(limit = 5) {
    try {
        const stats = JSON.parse(localStorage.getItem('platformStats') || '{}');
        if (Object.keys(stats).length === 0) return [];
        
        // 按搜索次数倒序排序
        const sorted = Object.entries(stats)
            .map(([platformId, data]) => ({
                platformId,
                count: data.count,
                lastUsed: data.lastUsed
            }))
            .sort((a, b) => b.count - a.count);
        
        // 过滤出有SVG图标的平台，取前limit个
        const result = [];
        for (const item of sorted) {
            const platform = getPlatformById(item.platformId);
            if (platform && platform.iconSvg) {
                result.push(platform);
                if (result.length >= limit) break;
            }
        }
        
        return result;
    } catch (error) {
        console.error('获取常用平台失败:', error);
        return [];
    }
}

// ==================== 获取最常用的平台ID（用于回车键快捷搜索）====================
function getMostUsedPlatform() {
    try {
        const stats = JSON.parse(localStorage.getItem('platformStats') || '{}');
        
        // 如果有使用记录，返回使用次数最多的平台
        if (Object.keys(stats).length > 0) {
            const sorted = Object.entries(stats)
                .map(([platformId, data]) => ({
                    platformId,
                    count: data.count,
                    lastUsed: data.lastUsed
                }))
                .sort((a, b) => {
                    // 按使用次数降序，次数相同按最后使用时间降序
                    if (b.count !== a.count) {
                        return b.count - a.count;
                    }
                    return b.lastUsed - a.lastUsed;
                });
            
            return sorted[0].platformId;
        }
        
        // 如果没有使用记录，返回精选分类的第一个平台
        const featuredPlatforms = getPlatformsByCategory('featured');
        if (featuredPlatforms && featuredPlatforms.length > 0) {
            return featuredPlatforms[0].id;
        }
        
        return null;
    } catch (error) {
        console.error('获取最常用平台失败:', error);
        // 出错时返回精选第一个平台
        const featuredPlatforms = getPlatformsByCategory('featured');
        return featuredPlatforms && featuredPlatforms.length > 0 ? featuredPlatforms[0].id : null;
    }
}

// ==================== 渲染常用平台 ====================
function renderFrequentPlatforms() {
    const platforms = getTopFrequentPlatforms(5);
    
    if (platforms.length === 0) {
        frequentPlatforms.style.display = 'none';
        return;
    }
    
    frequentIcons.innerHTML = platforms.map(platform => `
        <button 
            class="frequent-icon-btn" 
            data-platform="${platform.id}"
            data-name="${platform.name}"
            data-category="${platform.category}"
            title="${platform.name}"
        >
            ${platform.iconSvg}
        </button>
    `).join('');
    
    // 显示常用平台容器
    frequentPlatforms.style.display = 'flex';
    
    // 绑定点击事件
    document.querySelectorAll('.frequent-icon-btn').forEach(btn => {
        btn.addEventListener('click', handlePlatformClick);
    });
}

// ==================== URL 参数处理 ====================
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    const category = urlParams.get('category');
    
    if (category && getCategoryById(category)) {
        switchCategory(category);
    }
    
    if (query) {
        searchInput.value = query;
        currentQuery = query;
        clearBtn.classList.add('show');
        updatePlatformCards(query);
    }
}

// ==================== Toast 通知 ====================
function showToast(message, duration = 2000) {
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// ==================== 欢迎卡片管理 ====================
function checkFirstVisit() {
    try {
        // 检查是否有 showWelcome URL 参数（从设置页面跳转）
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('showWelcome') === 'true') {
            showWelcomeCard();
            // 清除 URL 参数
            window.history.replaceState({}, '', window.location.pathname);
            return;
        }
        
        // 检查 localStorage 是否已访问过
        const hasVisited = localStorage.getItem('hasVisited');
        if (!hasVisited) {
            // 首次访问，显示欢迎卡片
            showWelcomeCard();
        }
    } catch (error) {
        console.error('检查首次访问失败:', error);
    }
}

function showWelcomeCard() {
    if (welcomeCard) {
        welcomeCard.style.display = 'block';
        // 触发重排以确保动画播放
        void welcomeCard.offsetWidth;
        // 让搜索框获得焦点（可选）
        setTimeout(() => {
            searchInput.focus();
        }, 600);
    }
}

function hideWelcomeCard() {
    if (welcomeCard) {
        // 添加淡出动画
        welcomeCard.style.animation = 'welcomeSlideOut 0.4s ease-out forwards';
        
        setTimeout(() => {
            welcomeCard.style.display = 'none';
            // 重置动画
            welcomeCard.style.animation = '';
        }, 400);
        
        // 标记用户已访问
        try {
            localStorage.setItem('hasVisited', 'true');
        } catch (error) {
            console.error('保存访问状态失败:', error);
        }
    }
}

// 导出函数供外部调用（如设置页面）
window.showWelcomeCard = showWelcomeCard;

// ==================== PWA 支持 ====================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // 注册 Service Worker（如果需要的话）
        // navigator.serviceWorker.register('/sw.js');
    });
}

// ==================== 启动应用 ====================
init();
