// ==================== 分类配置 ====================
// 定义应用的5大分类体系（精选、社交媒体、购物平台、新闻资讯、视频平台）

const CATEGORIES = {
    featured: {
        id: 'featured',
        name: '精选',
        icon: '⭐',
        order: 0,
        description: '最常用的搜索平台'
    },
    social: {
        id: 'social',
        name: '社交媒体',
        icon: '👥',
        order: 1,
        description: '社交平台、内容社区'
    },
    shopping: {
        id: 'shopping',
        name: '购物平台',
        icon: '🛒',
        order: 2,
        description: '电商、二手交易'
    },
    news: {
        id: 'news',
        name: '新闻资讯',
        icon: '📰',
        order: 3,
        description: '新闻媒体、资讯平台'
    },
    video: {
        id: 'video',
        name: '视频平台',
        icon: '📺',
        order: 4,
        description: '长短视频、直播平台'
    },
    // ai: {
    //     id: 'ai',
    //     name: 'AI工具',
    //     icon: '🤖',
    //     order: 3,
    //     description: '人工智能对话、搜索与创作'
    // },

    // tools: {
    //     id: 'tools',
    //     name: '工具搜索',
    //     icon: '🔧',
    //     order: 6,
    //     description: '搜索引擎、技术工具'
    // }
};

// 获取所有分类（按order排序）
function getAllCategories() {
    return Object.values(CATEGORIES).sort((a, b) => a.order - b.order);
}

// 根据ID获取分类
function getCategoryById(categoryId) {
    return CATEGORIES[categoryId] || null;
}

