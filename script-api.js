// 智能数据迁移 - 从localStorage迁移到服务器
(function() {
    const savedData = localStorage.getItem('loveWebsiteData');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            // 检查是否需要迁移到服务器
            if (parsedData && (parsedData.diaries?.length > 0 || parsedData.photos?.length > 0)) {
                console.log('检测到本地数据，将在登录后进行迁移...');
                localStorage.setItem('pendingMigration', savedData);
            }
        } catch (e) {
            console.log('本地缓存数据损坏，已清理');
            localStorage.removeItem('loveWebsiteData');
        }
    }
})();

// 情侣网站主要功能实现 - API版本
class LoveWebsite {
    constructor() {
        this.currentSection = 'dashboard';
        this.loveStartDate = null;
        this.isLoggedIn = false;
        this.user = null;
        this.version = '3.0'; // API版本
        this.data = {
            diaries: [],
            memorials: [],
            photos: [],
            todos: [],
            messages: [],
            settings: {
                names: { person1: '包胡呢斯图', person2: '张萨出拉' },
                loveStartDate: '2023-09-09'
            }
        };

        // 检查登录状态
        this.checkAuth();
    }

    // 检查认证状态
    async checkAuth() {
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                const response = await apiClient.get('/auth/profile');
                if (response.success) {
                    this.user = response.user;
                    this.isLoggedIn = true;
                    this.data.settings = {
                        names: {
                            person1: this.user.person1Name,
                            person2: this.user.person2Name
                        },
                        loveStartDate: this.user.loveStartDate
                    };
                    this.showApp();
                    this.initLoveDate();
                    await this.loadAllData();
                    this.showSection('dashboard');

                    // 检查是否需要数据迁移
                    await this.checkAndMigrate();
                    return;
                }
            } catch (error) {
                console.log('自动登录失败:', error.message);
            }
        }

        this.showLogin();
    }

    // 检查并执行数据迁移
    async checkAndMigrate() {
        const pendingMigration = localStorage.getItem('pendingMigration');
        if (pendingMigration) {
            try {
                console.log('开始迁移本地数据到服务器...');
                const localData = JSON.parse(pendingMigration);

                // 迁移日记
                if (localData.diaries?.length > 0) {
                    for (const diary of localData.diaries) {
                        try {
                            await apiClient.post('/diaries', {
                                title: diary.title,
                                content: diary.content,
                                mood: diary.mood,
                                weather: diary.weather,
                                date: diary.date,
                                images: diary.images || []
                            });
                        } catch (error) {
                            console.error('迁移日记失败:', error);
                        }
                    }
                }

                // 迁移待办事项
                if (localData.todos?.length > 0) {
                    for (const todo of localData.todos) {
                        try {
                            await apiClient.post('/todos', {
                                content: todo.content,
                                priority: todo.priority || 'medium',
                                category: todo.category || 'general',
                                isCompleted: todo.isCompleted || false
                            });
                        } catch (error) {
                            console.error('迁移待办事项失败:', error);
                        }
                    }
                }

                // 迁移纪念日
                if (localData.memorials?.length > 0) {
                    for (const memorial of localData.memorials) {
                        try {
                            await apiClient.post('/memorials', {
                                title: memorial.title,
                                description: memorial.description,
                                date: memorial.date,
                                importance: memorial.importance || 'medium',
                                category: memorial.category || 'anniversary'
                            });
                        } catch (error) {
                            console.error('迁移纪念日失败:', error);
                        }
                    }
                }

                // 迁移悄悄话
                if (localData.messages?.length > 0) {
                    for (const message of localData.messages) {
                        try {
                            await apiClient.post('/messages', {
                                content: message.content,
                                author: message.author,
                                isSpecial: message.isSpecial || false
                            });
                        } catch (error) {
                            console.error('迁移悄悄话失败:', error);
                        }
                    }
                }

                localStorage.removeItem('pendingMigration');
                localStorage.removeItem('loveWebsiteData');
                console.log('数据迁移完成！');

                // 重新加载数据
                await this.loadAllData();
                this.showSection(this.currentSection);

            } catch (error) {
                console.error('数据迁移失败:', error);
            }
        }
    }

    // 显示登录界面
    showLogin() {
        const loginHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
                <div class="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
                    <div class="text-center mb-8">
                        <i class="fas fa-heart text-pink-500 text-6xl mb-4"></i>
                        <h1 class="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                            我们的爱情小屋
                        </h1>
                        <p class="text-gray-600 mt-2">输入密码进入专属空间</p>
                    </div>

                    <form id="loginForm" class="space-y-6">
                        <div>
                            <input type="password" id="loginPassword"
                                   class="w-full p-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-pink-400 transition-colors"
                                   placeholder="请输入密码" required>
                        </div>

                        <button type="submit"
                                class="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white py-4 rounded-lg font-semibold hover:shadow-lg transition-all">
                            <i class="fas fa-sign-in-alt mr-2"></i>
                            进入爱情小屋
                        </button>

                        <div id="loginError" class="text-red-500 text-sm text-center hidden"></div>
                    </form>

                    <div class="mt-6 text-center text-sm text-gray-500">
                        <p>默认密码: love2024</p>
                    </div>
                </div>
            </div>
        `;

        document.body.innerHTML = loginHTML;

        // 绑定登录事件
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.login();
        });

        // 回车键登录
        document.getElementById('loginPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.login();
            }
        });
    }

    // 登录功能
    async login() {
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');

        if (!password) {
            this.showError('请输入密码', errorDiv);
            return;
        }

        try {
            const response = await apiClient.post('/auth/login', { password });

            if (response.success) {
                apiClient.setToken(response.token);
                this.user = response.user;
                this.isLoggedIn = true;
                this.data.settings = {
                    names: {
                        person1: this.user.person1Name,
                        person2: this.user.person2Name
                    },
                    loveStartDate: this.user.loveStartDate
                };

                this.showApp();
                this.initLoveDate();
                await this.loadAllData();
                this.showSection('dashboard');

                // 检查数据迁移
                await this.checkAndMigrate();
            }
        } catch (error) {
            this.showError(error.message, errorDiv);
        }
    }

    // 显示错误信息
    showError(message, element) {
        element.textContent = message;
        element.classList.remove('hidden');
        setTimeout(() => {
            element.classList.add('hidden');
        }, 3000);
    }

    // 加载所有数据
    async loadAllData() {
        try {
            await Promise.all([
                this.loadDiaries(),
                this.loadPhotos(),
                this.loadMemorials(),
                this.loadTodos(),
                this.loadMessages()
            ]);
        } catch (error) {
            console.error('加载数据失败:', error);
        }
    }

    // 加载日记
    async loadDiaries() {
        try {
            const response = await apiClient.get('/diaries');
            if (response.success) {
                this.data.diaries = response.data;
            }
        } catch (error) {
            console.error('加载日记失败:', error);
        }
    }

    // 加载照片
    async loadPhotos() {
        try {
            const response = await apiClient.get('/photos');
            if (response.success) {
                this.data.photos = response.data;
            }
        } catch (error) {
            console.error('加载照片失败:', error);
        }
    }

    // 加载纪念日
    async loadMemorials() {
        try {
            const response = await apiClient.get('/memorials');
            if (response.success) {
                this.data.memorials = response.data;
            }
        } catch (error) {
            console.error('加载纪念日失败:', error);
        }
    }

    // 加载待办事项
    async loadTodos() {
        try {
            const response = await apiClient.get('/todos');
            if (response.success) {
                this.data.todos = response.data;
            }
        } catch (error) {
            console.error('加载待办事项失败:', error);
        }
    }

    // 加载悄悄话
    async loadMessages() {
        try {
            const response = await apiClient.get('/messages');
            if (response.success) {
                this.data.messages = response.data;
            }
        } catch (error) {
            console.error('加载悄悄话失败:', error);
        }
    }

    // 显示主应用
    showApp() {
        const mainAppHTML = `
        <!-- 主界面 -->
        <div id="mainApp">
            <!-- 顶部导航 -->
            <nav class="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-40">
                <div class="container mx-auto px-4 py-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-heart text-pink-500 text-2xl"></i>
                            <h1 class="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                                我们的爱情小屋
                            </h1>
                        </div>
                        <div class="flex items-center space-x-4">
                            <span id="loveDay" class="text-sm text-gray-600 bg-pink-100 px-3 py-1 rounded-full"></span>
                            <button id="logoutBtn" class="text-gray-600 hover:text-red-500 transition-colors">
                                <i class="fas fa-sign-out-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <!-- 侧边栏导航 -->
            <div class="flex">
                <aside class="w-64 bg-white/70 backdrop-blur-md shadow-lg min-h-screen fixed left-0 top-16 z-30">
                    <nav class="p-6">
                        <ul class="space-y-3">
                            <li>
                                <button class="nav-item w-full text-left p-3 rounded-lg transition-all hover:bg-pink-100 flex items-center space-x-3"
                                        data-section="dashboard">
                                    <i class="fas fa-home text-pink-500"></i>
                                    <span>首页</span>
                                </button>
                            </li>
                            <li>
                                <button class="nav-item w-full text-left p-3 rounded-lg transition-all hover:bg-pink-100 flex items-center space-x-3"
                                        data-section="diary">
                                    <i class="fas fa-book text-purple-500"></i>
                                    <span>爱情日记</span>
                                </button>
                            </li>
                            <li>
                                <button class="nav-item w-full text-left p-3 rounded-lg transition-all hover:bg-pink-100 flex items-center space-x-3"
                                        data-section="photos">
                                    <i class="fas fa-images text-blue-500"></i>
                                    <span>美好回忆</span>
                                </button>
                            </li>
                            <li>
                                <button class="nav-item w-full text-left p-3 rounded-lg transition-all hover:bg-pink-100 flex items-center space-x-3"
                                        data-section="memorial">
                                    <i class="fas fa-calendar-heart text-red-500"></i>
                                    <span>重要纪念</span>
                                </button>
                            </li>
                            <li>
                                <button class="nav-item w-full text-left p-3 rounded-lg transition-all hover:bg-pink-100 flex items-center space-x-3"
                                        data-section="todo">
                                    <i class="fas fa-tasks text-green-500"></i>
                                    <span>我们的计划</span>
                                </button>
                            </li>
                            <li>
                                <button class="nav-item w-full text-left p-3 rounded-lg transition-all hover:bg-pink-100 flex items-center space-x-3"
                                        data-section="message">
                                    <i class="fas fa-heart text-pink-500"></i>
                                    <span>悄悄话</span>
                                </button>
                            </li>
                            <li>
                                <button class="nav-item w-full text-left p-3 rounded-lg transition-all hover:bg-pink-100 flex items-center space-x-3"
                                        data-section="settings">
                                    <i class="fas fa-cog text-gray-500"></i>
                                    <span>设置</span>
                                </button>
                            </li>
                        </ul>
                    </nav>
                </aside>

                <!-- 主要内容区域 -->
                <main class="flex-1 ml-64 p-8">
                    <div id="mainContent">
                        <!-- 内容将通过JavaScript动态加载 -->
                    </div>
                </main>
            </div>
        </div>

        <!-- 模态框 -->
        <div id="modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div id="modalContent">
                    <!-- 模态框内容 -->
                </div>
            </div>
        </div>
        `;

        document.body.innerHTML = mainAppHTML;
        this.bindEvents();
    }

    // 绑定事件
    bindEvents() {
        // 导航事件
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const section = item.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // 退出登录
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // 模态框关闭
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                this.closeModal();
            }
        });
    }

    // 退出登录
    logout() {
        apiClient.setToken(null);
        this.isLoggedIn = false;
        this.user = null;
        this.data = {
            diaries: [],
            memorials: [],
            photos: [],
            todos: [],
            messages: [],
            settings: {
                names: { person1: '包胡呢斯图', person2: '张萨出拉' },
                loveStartDate: '2023-09-09'
            }
        };
        this.showLogin();
    }

    // 初始化恋爱日期
    initLoveDate() {
        const loveStartDate = new Date(this.data.settings.loveStartDate);
        const today = new Date();
        const daysDiff = Math.ceil((today - loveStartDate) / (1000 * 60 * 60 * 24));

        document.getElementById('loveDay').textContent = `我们在一起 ${daysDiff} 天了 💕`;
    }

    // 显示指定页面
    showSection(sectionName) {
        this.currentSection = sectionName;

        // 更新导航状态
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('bg-pink-100', 'text-pink-600');
            if (item.getAttribute('data-section') === sectionName) {
                item.classList.add('bg-pink-100', 'text-pink-600');
            }
        });

        // 根据不同页面显示内容
        switch(sectionName) {
            case 'dashboard':
                this.showDashboard();
                break;
            case 'diary':
                this.showDiary();
                break;
            case 'photos':
                this.showPhotos();
                break;
            case 'memorial':
                this.showMemorial();
                break;
            case 'todo':
                this.showTodo();
                break;
            case 'message':
                this.showMessage();
                break;
            case 'settings':
                this.showSettings();
                break;
        }
    }    // 显示仪表板
    showDashboard() {
        const content = `
            <div class="dashboard-container">
                <h2 class="text-3xl font-bold text-gray-800 mb-8 flex items-center">
                    <i class="fas fa-home text-pink-500 mr-3"></i>
                    我们的爱情小屋
                </h2>

                <!-- 统计卡片 -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="stat-card bg-gradient-to-r from-pink-400 to-pink-500 text-white rounded-2xl p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-pink-100">爱情日记</p>
                                <p id="diaryCount" class="text-3xl font-bold">${this.data.diaries.length}</p>
                            </div>
                            <i class="fas fa-book text-4xl text-pink-200"></i>
                        </div>
                    </div>

                    <div class="stat-card bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-2xl p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-blue-100">美好回忆</p>
                                <p id="photoCount" class="text-3xl font-bold">${this.data.photos.length}</p>
                            </div>
                            <i class="fas fa-camera text-4xl text-blue-200"></i>
                        </div>
                    </div>

                    <div class="stat-card bg-gradient-to-r from-green-400 to-green-500 text-white rounded-2xl p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-green-100">待办事项</p>
                                <p id="todoCount" class="text-3xl font-bold">${this.data.todos.filter(t => !t.isCompleted).length}</p>
                            </div>
                            <i class="fas fa-tasks text-4xl text-green-200"></i>
                        </div>
                    </div>

                    <div class="stat-card bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-2xl p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-purple-100">悄悄话</p>
                                <p id="messageCount" class="text-3xl font-bold">${this.data.messages.length}</p>
                            </div>
                            <i class="fas fa-heart text-4xl text-purple-200"></i>
                        </div>
                    </div>
                </div>

                <!-- 最近动态 -->
                <div class="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-lg">
                    <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-clock text-pink-500 mr-2"></i>
                        最近动态
                    </h3>
                    <div id="recentActivities" class="space-y-3">
                        <!-- 动态内容 -->
                    </div>
                </div>
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;
        this.renderRecentActivities();
    }

    renderRecentActivities() {
        const container = document.getElementById('recentActivities');
        const activities = this.getRecentActivities();

        if (activities.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">还没有任何动态，快去记录你们的美好时光吧！</p>';
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div class="flex items-center space-x-4 p-4 bg-white/50 rounded-xl fade-in">
                <i class="fas ${activity.icon} text-2xl ${activity.color}"></i>
                <div>
                    <p class="font-medium">${activity.title}</p>
                    <p class="text-sm text-gray-500">${activity.time}</p>
                </div>
            </div>
        `).join('');
    }

    getRecentActivities() {
        const activities = [];

        // 最近的日记
        this.data.diaries.slice(-3).forEach(diary => {
            activities.push({
                icon: 'fa-book',
                color: 'text-purple-500',
                title: `写了日记：${diary.title}`,
                time: this.formatDate(diary.date || diary.createdAt),
                timestamp: new Date(diary.date || diary.createdAt)
            });
        });

        // 最近的照片
        this.data.photos.slice(-3).forEach(photo => {
            activities.push({
                icon: 'fa-camera',
                color: 'text-blue-500',
                title: `上传了照片：${photo.title}`,
                time: this.formatDate(photo.uploadDate || photo.createdAt),
                timestamp: new Date(photo.uploadDate || photo.createdAt)
            });
        });

        return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
    }

    // 日记功能
    showDiary() {
        const content = `
            <div class="diary-container">
                <div class="flex items-center justify-between mb-8">
                    <h2 class="text-3xl font-bold text-gray-800 flex items-center">
                        <i class="fas fa-book text-purple-500 mr-3"></i>
                        爱情日记
                    </h2>
                    <button id="addDiaryBtn" class="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all">
                        <i class="fas fa-plus mr-2"></i>
                        写日记
                    </button>
                </div>

                <div id="diaryList" class="grid gap-6">
                    <!-- 日记列表 -->
                </div>
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;
        document.getElementById('addDiaryBtn').addEventListener('click', () => this.showDiaryModal());
        this.renderDiaries();
    }

    showDiaryModal() {
        this.showModal('写日记', `
            <form id="diaryForm" class="space-y-4">
                <div>
                    <label class="block text-gray-700 font-medium mb-2">标题</label>
                    <input type="text" id="diaryTitle" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                           placeholder="今天发生了什么特别的事？" required>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">心情</label>
                    <select id="diaryMood" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400">
                        <option value="happy">😊 开心</option>
                        <option value="love">🥰 甜蜜</option>
                        <option value="excited">😍 兴奋</option>
                        <option value="romantic">🤗 浪漫</option>
                        <option value="sad">😢 难过</option>
                        <option value="calm">😴 平静</option>
                    </select>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">天气</label>
                    <select id="diaryWeather" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400">
                        <option value="sunny">☀️ 晴天</option>
                        <option value="cloudy">⛅ 多云</option>
                        <option value="rainy">🌧️ 雨天</option>
                        <option value="snowy">❄️ 雪天</option>
                        <option value="windy">🌈 大风</option>
                    </select>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">内容</label>
                    <textarea id="diaryContent" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                              rows="6" placeholder="写下今天的故事..." required></textarea>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">日期</label>
                    <input type="date" id="diaryDate" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                           value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="flex space-x-3">
                    <button type="submit" class="flex-1 bg-gradient-to-r from-pink-400 to-purple-400 text-white p-3 rounded-lg hover:shadow-lg transition-all">
                        保存日记
                    </button>
                    <button type="button" onclick="loveWebsite.closeModal()"
                            class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                        取消
                    </button>
                </div>
            </form>
        `);

        document.getElementById('diaryForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveDiary();
        });
    }

    async saveDiary() {
        const title = document.getElementById('diaryTitle').value;
        const content = document.getElementById('diaryContent').value;
        const mood = document.getElementById('diaryMood').value;
        const weather = document.getElementById('diaryWeather').value;
        const date = document.getElementById('diaryDate').value;

        try {
            const response = await apiClient.post('/diaries', {
                title,
                content,
                mood,
                weather,
                date
            });

            if (response.success) {
                await this.loadDiaries();
                this.renderDiaries();
                this.closeModal();
                this.showNotification('日记保存成功！', 'success');

                // 更新仪表板
                if (this.currentSection === 'dashboard') {
                    this.showDashboard();
                }
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    renderDiaries() {
        const container = document.getElementById('diaryList');
        if (this.data.diaries.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">还没有日记，开始记录你们的甜蜜时光吧！</p>';
            return;
        }

        const moodEmojis = {
            happy: '😊',
            love: '🥰',
            excited: '😍',
            romantic: '🤗',
            sad: '😢',
            calm: '😴'
        };

        const weatherEmojis = {
            sunny: '☀️',
            cloudy: '⛅',
            rainy: '🌧️',
            snowy: '❄️',
            windy: '💨'
        };

        container.innerHTML = this.data.diaries
            .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
            .map(diary => `
                <div class="diary-card bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-bold text-gray-800">${diary.title}</h3>
                        <div class="flex items-center space-x-2">
                            <span class="text-2xl">${moodEmojis[diary.mood] || '😊'}</span>
                            <span class="text-2xl">${weatherEmojis[diary.weather] || '☀️'}</span>
                            <button onclick="loveWebsite.deleteDiary(${diary.id})"
                                    class="text-red-500 hover:text-red-700 transition-colors">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <p class="text-gray-600 mb-4">${diary.content}</p>
                    <div class="text-sm text-gray-500">
                        <i class="fas fa-calendar mr-1"></i>
                        ${this.formatDate(diary.date || diary.createdAt)}
                    </div>
                </div>
            `).join('');
    }

    async deleteDiary(id) {
        if (confirm('确定要删除这篇日记吗？')) {
            try {
                await apiClient.delete(`/diaries/${id}`);
                await this.loadDiaries();
                this.renderDiaries();
                this.showNotification('日记已删除', 'success');

                // 更新仪表板
                if (this.currentSection === 'dashboard') {
                    this.showDashboard();
                }
            } catch (error) {
                this.showNotification(error.message, 'error');
            }
        }
    }

    // 照片功能
    showPhotos() {
        const content = `
            <div class="photos-container">
                <div class="flex items-center justify-between mb-8">
                    <h2 class="text-3xl font-bold text-gray-800 flex items-center">
                        <i class="fas fa-images text-blue-500 mr-3"></i>
                        美好回忆
                    </h2>
                    <button id="addPhotoBtn" class="bg-gradient-to-r from-blue-400 to-purple-400 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all">
                        <i class="fas fa-plus mr-2"></i>
                        上传照片
                    </button>
                </div>

                <div id="photoGrid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <!-- 照片网格 -->
                </div>
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;
        document.getElementById('addPhotoBtn').addEventListener('click', () => this.showPhotoModal());
        this.renderPhotos();
    }

    showPhotoModal() {
        this.showModal('上传照片', `
            <form id="photoForm" class="space-y-4" enctype="multipart/form-data">
                <div>
                    <label class="block text-gray-700 font-medium mb-2">标题</label>
                    <input type="text" id="photoTitle" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                           placeholder="给这些照片起个名字" required>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">选择照片</label>
                    <input type="file" id="photoFiles" accept="image/*" multiple
                           class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400" required>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">描述</label>
                    <textarea id="photoDescription" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                              rows="3" placeholder="记录这些美好瞬间..."></textarea>
                </div>
                <div class="flex space-x-3">
                    <button type="submit" class="flex-1 bg-gradient-to-r from-blue-400 to-purple-400 text-white p-3 rounded-lg hover:shadow-lg transition-all">
                        上传照片
                    </button>
                    <button type="button" onclick="loveWebsite.closeModal()"
                            class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                        取消
                    </button>
                </div>
            </form>
        `);

        document.getElementById('photoForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.savePhotos();
        });
    }

    async savePhotos() {
        const title = document.getElementById('photoTitle').value;
        const description = document.getElementById('photoDescription').value;
        const fileInput = document.getElementById('photoFiles');

        if (fileInput.files.length === 0) {
            this.showNotification('请选择要上传的照片', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);

        for (let i = 0; i < fileInput.files.length; i++) {
            formData.append('photos', fileInput.files[i]);
        }

        try {
            const response = await apiClient.upload('/photos/upload', formData);

            if (response.success) {
                await this.loadPhotos();
                this.renderPhotos();
                this.closeModal();
                this.showNotification('照片上传成功！', 'success');

                // 更新仪表板
                if (this.currentSection === 'dashboard') {
                    this.showDashboard();
                }
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    renderPhotos() {
        const container = document.getElementById('photoGrid');
        if (this.data.photos.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8 col-span-full">还没有上传照片，快来记录美好瞬间吧！</p>';
            return;
        }

        container.innerHTML = this.data.photos
            .sort((a, b) => new Date(b.uploadDate || b.createdAt) - new Date(a.uploadDate || a.createdAt))
            .map(photo => `
                <div class="photo-item relative group">
                    <img src="${photo.thumbnailUrl || photo.url}" alt="${photo.title}"
                         class="w-full h-full object-cover rounded-lg cursor-pointer"
                         onclick="loveWebsite.showImageModal('${photo.url}', '${photo.title}', '${photo.description || ''}')">
                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <div class="text-center text-white">
                            <button onclick="loveWebsite.showImageModal('${photo.url}', '${photo.title}', '${photo.description || ''}')"
                                    class="bg-blue-500 px-3 py-2 rounded-lg mr-2 hover:bg-blue-600 transition-colors">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="loveWebsite.deletePhoto(${photo.id})"
                                    class="bg-red-500 px-3 py-2 rounded-lg hover:bg-red-600 transition-colors">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
    }

    async deletePhoto(id) {
        if (confirm('确定要删除这张照片吗？')) {
            try {
                await apiClient.delete(`/photos/${id}`);
                await this.loadPhotos();
                this.renderPhotos();
                this.showNotification('照片已删除', 'success');

                // 更新仪表板
                if (this.currentSection === 'dashboard') {
                    this.showDashboard();
                }
            } catch (error) {
                this.showNotification(error.message, 'error');
            }
        }
    }    // 纪念日功能
    showMemorial() {
        const content = `
            <div class="memorial-container">
                <div class="flex items-center justify-between mb-8">
                    <h2 class="text-3xl font-bold text-gray-800 flex items-center">
                        <i class="fas fa-calendar-heart text-red-500 mr-3"></i>
                        重要纪念日
                    </h2>
                    <button id="addMemorialBtn" class="bg-gradient-to-r from-red-400 to-pink-400 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all">
                        <i class="fas fa-plus mr-2"></i>
                        添加纪念日
                    </button>
                </div>

                <div id="memorialList" class="grid gap-6">
                    <!-- 纪念日列表 -->
                </div>
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;
        document.getElementById('addMemorialBtn').addEventListener('click', () => this.showMemorialModal());
        this.renderMemorials();
    }

    showMemorialModal() {
        this.showModal('添加纪念日', `
            <form id="memorialForm" class="space-y-4">
                <div>
                    <label class="block text-gray-700 font-medium mb-2">标题</label>
                    <input type="text" id="memorialTitle" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                           placeholder="纪念日名称" required>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">日期</label>
                    <input type="date" id="memorialDate" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400" required>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">重要程度</label>
                    <select id="memorialImportance" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400">
                        <option value="high">⭐⭐⭐ 非常重要</option>
                        <option value="medium">⭐⭐ 比较重要</option>
                        <option value="low">⭐ 一般重要</option>
                    </select>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">描述</label>
                    <textarea id="memorialDescription" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                              rows="3" placeholder="记录这个特殊日子的意义..."></textarea>
                </div>
                <div class="flex items-center">
                    <input type="checkbox" id="memorialRecurring" checked class="mr-2">
                    <label for="memorialRecurring" class="text-gray-700">每年重复提醒</label>
                </div>
                <div class="flex space-x-3">
                    <button type="submit" class="flex-1 bg-gradient-to-r from-red-400 to-pink-400 text-white p-3 rounded-lg hover:shadow-lg transition-all">
                        保存纪念日
                    </button>
                    <button type="button" onclick="loveWebsite.closeModal()"
                            class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                        取消
                    </button>
                </div>
            </form>
        `);

        document.getElementById('memorialForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveMemorial();
        });
    }

    async saveMemorial() {
        const title = document.getElementById('memorialTitle').value;
        const date = document.getElementById('memorialDate').value;
        const importance = document.getElementById('memorialImportance').value;
        const description = document.getElementById('memorialDescription').value;
        const isRecurring = document.getElementById('memorialRecurring').checked;

        try {
            const response = await apiClient.post('/memorials', {
                title,
                date,
                importance,
                description,
                isRecurring
            });

            if (response.success) {
                await this.loadMemorials();
                this.renderMemorials();
                this.closeModal();
                this.showNotification('纪念日保存成功！', 'success');
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    renderMemorials() {
        const container = document.getElementById('memorialList');
        if (this.data.memorials.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">还没有纪念日，添加一个特殊的日子吧！</p>';
            return;
        }

        const importanceStars = {
            high: '⭐⭐⭐',
            medium: '⭐⭐',
            low: '⭐'
        };

        container.innerHTML = this.data.memorials
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(memorial => {
                const memorialDate = new Date(memorial.date);
                const today = new Date();
                const daysUntil = Math.ceil((memorialDate - today) / (1000 * 60 * 60 * 24));

                return `
                    <div class="memorial-card bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-xl font-bold text-gray-800">${memorial.title}</h3>
                            <div class="flex items-center space-x-2">
                                <span class="text-lg">${importanceStars[memorial.importance]}</span>
                                <button onclick="loveWebsite.deleteMemorial(${memorial.id})"
                                        class="text-red-500 hover:text-red-700 transition-colors">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        ${memorial.description ? `<p class="text-gray-600 mb-4">${memorial.description}</p>` : ''}
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-gray-500">
                                <i class="fas fa-calendar mr-1"></i>
                                ${this.formatDate(memorial.date)}
                            </span>
                            <span class="${daysUntil < 0 ? 'text-gray-500' : daysUntil <= 7 ? 'text-red-500' : 'text-green-500'}">
                                ${daysUntil < 0 ? '已过去' : daysUntil === 0 ? '就是今天！' : `还有 ${daysUntil} 天`}
                            </span>
                        </div>
                    </div>
                `;
            }).join('');
    }

    async deleteMemorial(id) {
        if (confirm('确定要删除这个纪念日吗？')) {
            try {
                await apiClient.delete(`/memorials/${id}`);
                await this.loadMemorials();
                this.renderMemorials();
                this.showNotification('纪念日已删除', 'success');
            } catch (error) {
                this.showNotification(error.message, 'error');
            }
        }
    }

    // 待办事项功能
    showTodo() {
        const content = `
            <div class="todo-container">
                <div class="flex items-center justify-between mb-8">
                    <h2 class="text-3xl font-bold text-gray-800 flex items-center">
                        <i class="fas fa-tasks text-green-500 mr-3"></i>
                        我们的计划
                    </h2>
                    <button id="addTodoBtn" class="bg-gradient-to-r from-green-400 to-blue-400 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all">
                        <i class="fas fa-plus mr-2"></i>
                        添加计划
                    </button>
                </div>

                <div class="mb-6">
                    <div class="flex space-x-4">
                        <button onclick="loveWebsite.filterTodos('all')" class="filter-btn active px-4 py-2 rounded-lg bg-blue-100 text-blue-600">
                            全部
                        </button>
                        <button onclick="loveWebsite.filterTodos('pending')" class="filter-btn px-4 py-2 rounded-lg bg-gray-100 text-gray-600">
                            待完成
                        </button>
                        <button onclick="loveWebsite.filterTodos('completed')" class="filter-btn px-4 py-2 rounded-lg bg-gray-100 text-gray-600">
                            已完成
                        </button>
                    </div>
                </div>

                <div id="todoList" class="space-y-4">
                    <!-- 待办事项列表 -->
                </div>
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;
        document.getElementById('addTodoBtn').addEventListener('click', () => this.showTodoModal());
        this.renderTodos();
    }

    showTodoModal() {
        this.showModal('添加计划', `
            <form id="todoForm" class="space-y-4">
                <div>
                    <label class="block text-gray-700 font-medium mb-2">计划内容</label>
                    <input type="text" id="todoContent" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                           placeholder="我们要一起做什么？" required>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">优先级</label>
                    <select id="todoPriority" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400">
                        <option value="high">🔥 高优先级</option>
                        <option value="medium">⭐ 中等优先级</option>
                        <option value="low">💤 低优先级</option>
                    </select>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">分类</label>
                    <select id="todoCategory" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400">
                        <option value="date">💕 约会计划</option>
                        <option value="travel">✈️ 旅行计划</option>
                        <option value="life">🏠 生活计划</option>
                        <option value="general">📝 其他</option>
                    </select>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">截止日期 (可选)</label>
                    <input type="date" id="todoDueDate" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400">
                </div>
                <div class="flex space-x-3">
                    <button type="submit" class="flex-1 bg-gradient-to-r from-green-400 to-blue-400 text-white p-3 rounded-lg hover:shadow-lg transition-all">
                        保存计划
                    </button>
                    <button type="button" onclick="loveWebsite.closeModal()"
                            class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                        取消
                    </button>
                </div>
            </form>
        `);

        document.getElementById('todoForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveTodo();
        });
    }

    async saveTodo() {
        const content = document.getElementById('todoContent').value;
        const priority = document.getElementById('todoPriority').value;
        const category = document.getElementById('todoCategory').value;
        const dueDate = document.getElementById('todoDueDate').value;

        try {
            const response = await apiClient.post('/todos', {
                content,
                priority,
                category,
                dueDate: dueDate || null
            });

            if (response.success) {
                await this.loadTodos();
                this.renderTodos();
                this.closeModal();
                this.showNotification('计划保存成功！', 'success');

                // 更新仪表板
                if (this.currentSection === 'dashboard') {
                    this.showDashboard();
                }
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    filterTodos(filter) {
        // 更新按钮状态
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active', 'bg-blue-100', 'text-blue-600');
            btn.classList.add('bg-gray-100', 'text-gray-600');
        });

        event.target.classList.remove('bg-gray-100', 'text-gray-600');
        event.target.classList.add('active', 'bg-blue-100', 'text-blue-600');

        this.renderTodos(filter);
    }

    renderTodos(filter = 'all') {
        const container = document.getElementById('todoList');
        let filteredTodos = this.data.todos;

        if (filter === 'pending') {
            filteredTodos = this.data.todos.filter(todo => !todo.isCompleted);
        } else if (filter === 'completed') {
            filteredTodos = this.data.todos.filter(todo => todo.isCompleted);
        }

        if (filteredTodos.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">没有找到相关计划</p>';
            return;
        }

        const priorityIcons = {
            high: '🔥',
            medium: '⭐',
            low: '💤'
        };

        const categoryIcons = {
            date: '💕',
            travel: '✈️',
            life: '🏠',
            general: '📝'
        };

        container.innerHTML = filteredTodos
            .sort((a, b) => {
                if (a.isCompleted !== b.isCompleted) {
                    return a.isCompleted ? 1 : -1;
                }
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            })
            .map(todo => `
                <div class="todo-item bg-white/70 backdrop-blur-md rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow ${todo.isCompleted ? 'opacity-60' : ''}">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <button onclick="loveWebsite.toggleTodo(${todo.id})"
                                    class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${todo.isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-500'}">
                                ${todo.isCompleted ? '<i class="fas fa-check text-xs"></i>' : ''}
                            </button>
                            <div>
                                <p class="font-medium ${todo.isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}">${todo.content}</p>
                                <div class="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                                    <span>${priorityIcons[todo.priority]} ${todo.priority}</span>
                                    <span>${categoryIcons[todo.category]} ${todo.category}</span>
                                    ${todo.dueDate ? `<span><i class="fas fa-calendar mr-1"></i>${this.formatDate(todo.dueDate)}</span>` : ''}
                                </div>
                            </div>
                        </div>
                        <button onclick="loveWebsite.deleteTodo(${todo.id})"
                                class="text-red-500 hover:text-red-700 transition-colors">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
    }

    async toggleTodo(id) {
        try {
            await apiClient.patch(`/todos/${id}/toggle`);
            await this.loadTodos();
            this.renderTodos();

            // 更新仪表板
            if (this.currentSection === 'dashboard') {
                this.showDashboard();
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async deleteTodo(id) {
        if (confirm('确定要删除这个计划吗？')) {
            try {
                await apiClient.delete(`/todos/${id}`);
                await this.loadTodos();
                this.renderTodos();
                this.showNotification('计划已删除', 'success');

                // 更新仪表板
                if (this.currentSection === 'dashboard') {
                    this.showDashboard();
                }
            } catch (error) {
                this.showNotification(error.message, 'error');
            }
        }
    }    // 悄悄话功能
    showMessage() {
        const content = `
            <div class="message-container">
                <div class="flex items-center justify-between mb-8">
                    <h2 class="text-3xl font-bold text-gray-800 flex items-center">
                        <i class="fas fa-heart text-pink-500 mr-3"></i>
                        悄悄话
                    </h2>
                    <button id="addMessageBtn" class="bg-gradient-to-r from-pink-400 to-red-400 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all">
                        <i class="fas fa-plus mr-2"></i>
                        写悄悄话
                    </button>
                </div>

                <div id="messageList" class="space-y-6">
                    <!-- 悄悄话列表 -->
                </div>
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;
        document.getElementById('addMessageBtn').addEventListener('click', () => this.showMessageModal());
        this.renderMessages();
    }

    showMessageModal() {
        this.showModal('写悄悄话', `
            <form id="messageForm" class="space-y-4">
                <div>
                    <label class="block text-gray-700 font-medium mb-2">作者</label>
                    <select id="messageAuthor" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400">
                        <option value="${this.data.settings.names.person1}">${this.data.settings.names.person1}</option>
                        <option value="${this.data.settings.names.person2}">${this.data.settings.names.person2}</option>
                    </select>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">内容</label>
                    <textarea id="messageContent" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                              rows="6" placeholder="想对对方说什么呢？" required></textarea>
                </div>
                <div class="flex items-center">
                    <input type="checkbox" id="messageSpecial" class="mr-2">
                    <label for="messageSpecial" class="text-gray-700">标记为特殊留言 ⭐</label>
                </div>
                <div class="flex space-x-3">
                    <button type="submit" class="flex-1 bg-gradient-to-r from-pink-400 to-red-400 text-white p-3 rounded-lg hover:shadow-lg transition-all">
                        发送悄悄话
                    </button>
                    <button type="button" onclick="loveWebsite.closeModal()"
                            class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                        取消
                    </button>
                </div>
            </form>
        `);

        document.getElementById('messageForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveMessage();
        });
    }

    async saveMessage() {
        const content = document.getElementById('messageContent').value;
        const author = document.getElementById('messageAuthor').value;
        const isSpecial = document.getElementById('messageSpecial').checked;

        try {
            const response = await apiClient.post('/messages', {
                content,
                author,
                isSpecial
            });

            if (response.success) {
                await this.loadMessages();
                this.renderMessages();
                this.closeModal();
                this.showNotification('悄悄话发送成功！', 'success');

                // 更新仪表板
                if (this.currentSection === 'dashboard') {
                    this.showDashboard();
                }
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    renderMessages() {
        const container = document.getElementById('messageList');
        if (this.data.messages.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">还没有悄悄话，写一些甜蜜的话语吧！</p>';
            return;
        }

        container.innerHTML = this.data.messages
            .sort((a, b) => new Date(b.messageDate || b.createdAt) - new Date(a.messageDate || a.createdAt))
            .map(message => `
                <div class="message-card bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center space-x-2">
                            <span class="font-bold text-pink-600">${message.author}</span>
                            ${message.isSpecial ? '<span class="text-yellow-500">⭐</span>' : ''}
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="text-sm text-gray-500">${this.formatDate(message.messageDate || message.createdAt)}</span>
                            <button onclick="loveWebsite.deleteMessage(${message.id})"
                                    class="text-red-500 hover:text-red-700 transition-colors">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <p class="text-gray-700 leading-relaxed">${message.content}</p>
                </div>
            `).join('');
    }

    async deleteMessage(id) {
        if (confirm('确定要删除这条悄悄话吗？')) {
            try {
                await apiClient.delete(`/messages/${id}`);
                await this.loadMessages();
                this.renderMessages();
                this.showNotification('悄悄话已删除', 'success');

                // 更新仪表板
                if (this.currentSection === 'dashboard') {
                    this.showDashboard();
                }
            } catch (error) {
                this.showNotification(error.message, 'error');
            }
        }
    }

    // 设置功能
    showSettings() {
        const content = `
            <div class="settings-container">
                <h2 class="text-3xl font-bold text-gray-800 mb-8 flex items-center">
                    <i class="fas fa-cog text-gray-500 mr-3"></i>
                    设置
                </h2>

                <div class="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-lg">
                    <form id="settingsForm" class="space-y-6">
                        <div>
                            <h3 class="text-xl font-bold text-gray-800 mb-4">基本信息</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-gray-700 font-medium mb-2">第一个人的名字</label>
                                    <input type="text" id="person1Name" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                                           value="${this.data.settings.names.person1}" required>
                                </div>
                                <div>
                                    <label class="block text-gray-700 font-medium mb-2">第二个人的名字</label>
                                    <input type="text" id="person2Name" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                                           value="${this.data.settings.names.person2}" required>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label class="block text-gray-700 font-medium mb-2">恋爱开始日期</label>
                            <input type="date" id="loveStartDate" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                                   value="${this.data.settings.loveStartDate}" required>
                        </div>

                        <div class="pt-4">
                            <button type="submit" class="bg-gradient-to-r from-pink-400 to-purple-400 text-white px-8 py-3 rounded-lg hover:shadow-lg transition-all">
                                保存设置
                            </button>
                        </div>
                    </form>
                </div>

                <div class="mt-8 bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-lg">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">数据管理</h3>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <h4 class="font-medium">数据统计</h4>
                                <p class="text-sm text-gray-600">查看你们的数据统计信息</p>
                            </div>
                            <div class="text-right text-sm text-gray-500">
                                <p>日记: ${this.data.diaries.length} 篇</p>
                                <p>照片: ${this.data.photos.length} 张</p>
                                <p>纪念日: ${this.data.memorials.length} 个</p>
                                <p>待办: ${this.data.todos.length} 项</p>
                                <p>悄悄话: ${this.data.messages.length} 条</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;

        document.getElementById('settingsForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveSettings();
        });
    }

    async saveSettings() {
        const person1Name = document.getElementById('person1Name').value;
        const person2Name = document.getElementById('person2Name').value;
        const loveStartDate = document.getElementById('loveStartDate').value;

        try {
            const response = await apiClient.put('/auth/settings', {
                person1Name,
                person2Name,
                loveStartDate
            });

            if (response.success) {
                this.user = response.user;
                this.data.settings = {
                    names: {
                        person1: this.user.person1Name,
                        person2: this.user.person2Name
                    },
                    loveStartDate: this.user.loveStartDate
                };

                this.initLoveDate();
                this.showNotification('设置保存成功！', 'success');
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // 显示模态框
    showModal(title, content) {
        const modal = document.getElementById('modal');
        const modalContent = document.getElementById('modalContent');

        modalContent.innerHTML = `
            <div class="p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-2xl font-bold text-gray-800">${title}</h3>
                    <button onclick="loveWebsite.closeModal()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                ${content}
            </div>
        `;

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    // 关闭模态框
    closeModal() {
        const modal = document.getElementById('modal');
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    // 显示图片模态框
    showImageModal(url, title = '', description = '') {
        this.showModal('图片预览', `
            <div class="text-center">
                <img src="${url}" alt="${title}" class="max-w-full max-h-96 mx-auto rounded-lg shadow-lg mb-4">
                ${title ? `<h4 class="text-lg font-bold mb-2">${title}</h4>` : ''}
                ${description ? `<p class="text-gray-600">${description}</p>` : ''}
            </div>
        `);
    }

    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';

        notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // 自动隐藏
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 格式化日期
    formatDate(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return '今天';
        } else if (diffDays === 1) {
            return '昨天';
        } else if (diffDays < 7) {
            return `${diffDays}天前`;
        } else {
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    window.loveWebsite = new LoveWebsite();
});