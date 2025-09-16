// 智能数据迁移（保留用户数据，只更新设置）
(function() {
    const savedData = localStorage.getItem('loveWebsiteData');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            // 如果是旧版本，进行数据迁移而不是直接删除
            if (!parsedData.version || parsedData.version !== '2.0') {
                console.log('检测到旧版本，正在迁移用户数据...');

                // 保留所有用户创建的内容
                const migratedData = {
                    version: '2.0',
                    diaries: parsedData.diaries || [],
                    memorials: parsedData.memorials || [],
                    photos: parsedData.photos || [],
                    todos: parsedData.todos || [],
                    messages: parsedData.messages || [],
                    settings: {
                        names: { person1: '包胡呢斯图', person2: '张萨出拉' }, // 更新名字
                        loveStartDate: '2023-09-09' // 更新相恋日期
                    }
                };

                // 保存迁移后的数据
                localStorage.setItem('loveWebsiteData', JSON.stringify(migratedData));
                console.log('数据迁移完成，用户内容已保留，设置已更新');
            }
        } catch (e) {
            console.log('缓存数据损坏，使用默认设置...');
            // 只有数据损坏时才清理
            localStorage.removeItem('loveWebsiteData');
        }
    }
})();

// 情侣网站主要功能实现
class LoveWebsite {
    constructor() {
        this.currentSection = 'dashboard';
        this.loveStartDate = null;
        this.isLoggedIn = false;
        this.version = '2.0'; // 版本号，用于清理旧缓存
        this.data = {
            version: this.version,
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
        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.isLoggedIn = true;
        this.showApp();
        this.initLoveDate();
    }

    // 数据持久化
    saveData() {
        localStorage.setItem('loveWebsiteData', JSON.stringify(this.data));
    }

    loadData() {
        const savedData = localStorage.getItem('loveWebsiteData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);

            // 合并数据，保留用户内容
            this.data = {
                ...this.data,
                ...parsedData,
                version: this.version, // 确保版本号正确
                settings: {
                    names: { person1: '包胡呢斯图', person2: '张萨出拉' },
                    loveStartDate: '2023-09-09'
                }
            };
        }

        // 确保数据一致性
        this.data.version = this.version;
        this.data.settings.loveStartDate = '2023-09-09';
        this.data.settings.names = { person1: '包胡呢斯图', person2: '张萨出拉' };
        this.saveData();
    }

    // 显示主应用
    showApp() {
        const mainApp = document.getElementById('mainApp');
        mainApp.classList.remove('hidden');
        this.updateDashboard();
        this.showNotification('欢迎来到我们的爱情小屋！', 'success');
    }

    // 初始化恋爱日期
    initLoveDate() {
        this.loveStartDate = new Date(this.data.settings.loveStartDate);
        this.updateLoveDayDisplay();
    }

    updateLoveDayDisplay() {
        const today = new Date();
        const diffTime = today - this.loveStartDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        const loveDayElement = document.getElementById('loveDay');
        const totalDaysElement = document.getElementById('totalDays');

        if (loveDayElement) {
            loveDayElement.textContent = `相恋第 ${diffDays} 天`;
        }
        if (totalDaysElement) {
            totalDaysElement.textContent = diffDays;
        }
    }

    // 事件绑定
    bindEvents() {

        // 导航按钮
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // 各种添加按钮
        document.getElementById('addDiaryBtn').addEventListener('click', () => this.showDiaryModal());
        document.getElementById('addMemorialBtn').addEventListener('click', () => this.showMemorialModal());
        document.getElementById('addPhotoBtn').addEventListener('click', () => this.showPhotoModal());
        document.getElementById('addTodoBtn').addEventListener('click', () => this.showTodoModal());
        document.getElementById('addMessageBtn').addEventListener('click', () => this.showMessageModal());
    }

    // 页面切换
    showSection(sectionName) {
        // 隐藏所有内容区域
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });

        // 显示目标区域
        document.getElementById(sectionName).classList.remove('hidden');

        // 更新导航状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        this.currentSection = sectionName;

        // 根据不同页面加载相应内容
        switch(sectionName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'diary':
                this.renderDiaries();
                break;
            case 'memorial':
                this.renderMemorials();
                break;
            case 'album':
                this.renderPhotos();
                break;
            case 'todo':
                this.renderTodos();
                break;
            case 'message':
                this.renderMessages();
                break;
        }
    }

    // 首页数据更新
    updateDashboard() {
        this.updateLoveDayDisplay();

        // 更新统计数据
        document.getElementById('diaryCount').textContent = this.data.diaries.length;
        document.getElementById('photoCount').textContent = this.data.photos.length;

        // 更新最近动态
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
                time: this.formatDate(diary.date),
                timestamp: new Date(diary.date)
            });
        });

        // 最近的照片
        this.data.photos.slice(-3).forEach(photo => {
            activities.push({
                icon: 'fa-camera',
                color: 'text-blue-500',
                title: `上传了照片：${photo.title}`,
                time: this.formatDate(photo.date),
                timestamp: new Date(photo.date)
            });
        });

        return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
    }

    // 日记功能
    showDiaryModal() {
        const modal = this.createModal('写日记', `
            <form id="diaryForm" class="space-y-4">
                <div>
                    <label class="block text-gray-700 font-medium mb-2">标题</label>
                    <input type="text" id="diaryTitle" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                           placeholder="今天发生了什么特别的事？" required>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">心情</label>
                    <select id="diaryMood" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400">
                        <option value="😊">😊 开心</option>
                        <option value="🥰">🥰 甜蜜</option>
                        <option value="😍">😍 幸福</option>
                        <option value="🤗">🤗 温暖</option>
                        <option value="😢">😢 难过</option>
                        <option value="😴">😴 平静</option>
                    </select>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">天气</label>
                    <select id="diaryWeather" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400">
                        <option value="☀️">☀️ 晴天</option>
                        <option value="⛅">⛅ 多云</option>
                        <option value="🌧️">🌧️ 雨天</option>
                        <option value="❄️">❄️ 雪天</option>
                        <option value="🌈">🌈 雨后彩虹</option>
                    </select>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">内容</label>
                    <textarea id="diaryContent" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                              rows="6" placeholder="写下今天的故事..." required></textarea>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">添加图片</label>
                    <input type="file" id="diaryImage" accept="image/*" multiple
                           class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400">
                </div>
                <div class="flex space-x-3">
                    <button type="submit" class="flex-1 bg-gradient-to-r from-pink-400 to-purple-400 text-white p-3 rounded-lg hover:shadow-lg transition-all">
                        保存日记
                    </button>
                    <button type="button" onclick="this.closest('.modal').remove()"
                            class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                        取消
                    </button>
                </div>
            </form>
        `);

        document.getElementById('diaryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveDiary();
        });
    }

    saveDiary() {
        const title = document.getElementById('diaryTitle').value;
        const content = document.getElementById('diaryContent').value;
        const mood = document.getElementById('diaryMood').value;
        const weather = document.getElementById('diaryWeather').value;
        const imageInput = document.getElementById('diaryImage');

        const diary = {
            id: Date.now(),
            title,
            content,
            mood,
            weather,
            date: new Date().toISOString(),
            images: []
        };

        // 处理图片
        if (imageInput.files.length > 0) {
            Array.from(imageInput.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    diary.images.push({
                        name: file.name,
                        data: e.target.result
                    });
                    this.saveAndUpdate();
                };
                reader.readAsDataURL(file);
            });
        }

        this.data.diaries.push(diary);
        this.saveAndUpdate();
        this.closeModal();
        this.showNotification('日记保存成功！', 'success');
    }

    renderDiaries() {
        const container = document.getElementById('diaryList');
        if (this.data.diaries.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">还没有日记，开始记录你们的甜蜜时光吧！</p>';
            return;
        }

        container.innerHTML = this.data.diaries
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(diary => `
                <div class="diary-card bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-lg card-hover">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-bold text-gray-800">${diary.title}</h3>
                        <div class="flex items-center space-x-2">
                            <span class="text-2xl">${diary.mood}</span>
                            <span class="text-2xl">${diary.weather}</span>
                            <button onclick="loveWebsite.deleteDiary(${diary.id})"
                                    class="text-red-500 hover:text-red-700 transition-colors">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <p class="text-gray-600 mb-4">${diary.content}</p>
                    ${diary.images.length > 0 ? `
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                            ${diary.images.map(img => `
                                <img src="${img.data}" alt="${img.name}"
                                     class="w-full h-24 object-cover rounded-lg cursor-pointer"
                                     onclick="loveWebsite.showImageModal('${img.data}')">
                            `).join('')}
                        </div>
                    ` : ''}
                    <div class="text-sm text-gray-500">
                        <i class="fas fa-calendar mr-1"></i>
                        ${this.formatDate(diary.date)}
                    </div>
                </div>
            `).join('');
    }

    deleteDiary(id) {
        if (confirm('确定要删除这篇日记吗？')) {
            this.data.diaries = this.data.diaries.filter(diary => diary.id !== id);
            this.saveAndUpdate();
            this.renderDiaries();
            this.showNotification('日记已删除', 'success');
        }
    }

    // 纪念日功能
    showMemorialModal() {
        const modal = this.createModal('添加纪念日', `
            <form id="memorialForm" class="space-y-4">
                <div>
                    <label class="block text-gray-700 font-medium mb-2">纪念日名称</label>
                    <input type="text" id="memorialTitle" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                           placeholder="例如：初次见面、第一次约会..." required>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">日期</label>
                    <input type="date" id="memorialDate" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400" required>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">重要程度</label>
                    <select id="memorialImportance" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400">
                        <option value="❤️">❤️ 普通</option>
                        <option value="💕">💕 重要</option>
                        <option value="💖">💖 非常重要</option>
                        <option value="💝">💝 特别重要</option>
                    </select>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">描述</label>
                    <textarea id="memorialDescription" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                              rows="3" placeholder="记录这个特殊日子的意义..."></textarea>
                </div>
                <div class="flex space-x-3">
                    <button type="submit" class="flex-1 bg-gradient-to-r from-red-400 to-pink-400 text-white p-3 rounded-lg hover:shadow-lg transition-all">
                        添加纪念日
                    </button>
                    <button type="button" onclick="this.closest('.modal').remove()"
                            class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                        取消
                    </button>
                </div>
            </form>
        `);

        document.getElementById('memorialForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMemorial();
        });
    }

    saveMemorial() {
        const title = document.getElementById('memorialTitle').value;
        const date = document.getElementById('memorialDate').value;
        const importance = document.getElementById('memorialImportance').value;
        const description = document.getElementById('memorialDescription').value;

        const memorial = {
            id: Date.now(),
            title,
            date,
            importance,
            description,
            createdAt: new Date().toISOString()
        };

        this.data.memorials.push(memorial);
        this.saveAndUpdate();
        this.renderMemorials();
        this.closeModal();
        this.showNotification('纪念日添加成功！', 'success');
    }

    renderMemorials() {
        const container = document.getElementById('memorialList');
        if (this.data.memorials.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8 col-span-full">还没有纪念日，快来添加重要的日子吧！</p>';
            return;
        }

        container.innerHTML = this.data.memorials
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(memorial => {
                const memorialDate = new Date(memorial.date);
                const today = new Date();
                const nextDate = new Date(today.getFullYear(), memorialDate.getMonth(), memorialDate.getDate());

                if (nextDate < today) {
                    nextDate.setFullYear(today.getFullYear() + 1);
                }

                const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
                const yearsAgo = today.getFullYear() - memorialDate.getFullYear();

                return `
                    <div class="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-lg card-hover">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-bold text-gray-800">${memorial.title}</h3>
                            <div class="flex items-center space-x-2">
                                <span class="text-2xl">${memorial.importance}</span>
                                <button onclick="loveWebsite.deleteMemorial(${memorial.id})"
                                        class="text-red-500 hover:text-red-700 transition-colors">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        ${memorial.description ? `<p class="text-gray-600 mb-4">${memorial.description}</p>` : ''}
                        <div class="space-y-2">
                            <div class="text-sm text-gray-500">
                                <i class="fas fa-calendar mr-1"></i>
                                ${this.formatDate(memorial.date)}
                            </div>
                            ${yearsAgo > 0 ? `
                                <div class="text-sm text-pink-600 font-medium">
                                    <i class="fas fa-heart mr-1"></i>
                                    已过去 ${yearsAgo} 年
                                </div>
                            ` : ''}
                            <div class="text-sm text-blue-600 font-medium">
                                <i class="fas fa-clock mr-1"></i>
                                还有 ${daysUntil} 天
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
    }

    deleteMemorial(id) {
        if (confirm('确定要删除这个纪念日吗？')) {
            this.data.memorials = this.data.memorials.filter(memorial => memorial.id !== id);
            this.saveAndUpdate();
            this.renderMemorials();
            this.showNotification('纪念日已删除', 'success');
        }
    }

    // 相册功能
    showPhotoModal() {
        const modal = this.createModal('上传照片', `
            <form id="photoForm" class="space-y-4">
                <div>
                    <label class="block text-gray-700 font-medium mb-2">照片标题</label>
                    <input type="text" id="photoTitle" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                           placeholder="为这张照片起个名字..." required>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">选择照片</label>
                    <input type="file" id="photoFiles" accept="image/*" multiple
                           class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400" required>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">描述</label>
                    <textarea id="photoDescription" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                              rows="3" placeholder="记录照片背后的故事..."></textarea>
                </div>
                <div class="flex space-x-3">
                    <button type="submit" class="flex-1 bg-gradient-to-r from-blue-400 to-purple-400 text-white p-3 rounded-lg hover:shadow-lg transition-all">
                        上传照片
                    </button>
                    <button type="button" onclick="this.closest('.modal').remove()"
                            class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                        取消
                    </button>
                </div>
            </form>
        `);

        document.getElementById('photoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePhotos();
        });
    }

    savePhotos() {
        const title = document.getElementById('photoTitle').value;
        const description = document.getElementById('photoDescription').value;
        const fileInput = document.getElementById('photoFiles');

        if (fileInput.files.length === 0) return;

        Array.from(fileInput.files).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const photo = {
                    id: Date.now() + index,
                    title: `${title} ${fileInput.files.length > 1 ? (index + 1) : ''}`.trim(),
                    description,
                    data: e.target.result,
                    date: new Date().toISOString()
                };

                this.data.photos.push(photo);
                this.saveAndUpdate();

                if (index === fileInput.files.length - 1) {
                    this.renderPhotos();
                    this.closeModal();
                    this.showNotification('照片上传成功！', 'success');
                }
            };
            reader.readAsDataURL(file);
        });
    }

    renderPhotos() {
        const container = document.getElementById('photoGrid');
        if (this.data.photos.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8 col-span-full">还没有照片，快来上传你们的美好回忆吧！</p>';
            return;
        }

        container.innerHTML = this.data.photos
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(photo => `
                <div class="photo-item relative group">
                    <img src="${photo.data}" alt="${photo.title}" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                        <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-x-2">
                            <button onclick="loveWebsite.showImageModal('${photo.data}', '${photo.title}', '${photo.description}')"
                                    class="bg-white text-gray-800 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="loveWebsite.deletePhoto(${photo.id})"
                                    class="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
    }

    showImageModal(src, title = '', description = '') {
        const modal = this.createModal(title || '查看图片', `
            <div class="text-center">
                <img src="${src}" alt="${title}" class="max-w-full max-h-96 mx-auto rounded-lg shadow-lg">
                ${description ? `<p class="mt-4 text-gray-600">${description}</p>` : ''}
                <button onclick="this.closest('.modal').remove()"
                        class="mt-4 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                    关闭
                </button>
            </div>
        `);
    }

    deletePhoto(id) {
        if (confirm('确定要删除这张照片吗？')) {
            this.data.photos = this.data.photos.filter(photo => photo.id !== id);
            this.saveAndUpdate();
            this.renderPhotos();
            this.showNotification('照片已删除', 'success');
        }
    }

    // 待办清单功能
    showTodoModal() {
        const modal = this.createModal('添加待办事项', `
            <form id="todoForm" class="space-y-4">
                <div>
                    <label class="block text-gray-700 font-medium mb-2">待办事项</label>
                    <input type="text" id="todoTitle" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                           placeholder="你们要一起做什么？" required>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">优先级</label>
                    <select id="todoPriority" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400">
                        <option value="low">🟢 普通</option>
                        <option value="medium">🟡 重要</option>
                        <option value="high">🔴 紧急</option>
                    </select>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">截止日期</label>
                    <input type="date" id="todoDueDate" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400">
                </div>
                <div class="flex space-x-3">
                    <button type="submit" class="flex-1 bg-gradient-to-r from-green-400 to-blue-400 text-white p-3 rounded-lg hover:shadow-lg transition-all">
                        添加待办
                    </button>
                    <button type="button" onclick="this.closest('.modal').remove()"
                            class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                        取消
                    </button>
                </div>
            </form>
        `);

        document.getElementById('todoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTodo();
        });
    }

    saveTodo() {
        const title = document.getElementById('todoTitle').value;
        const priority = document.getElementById('todoPriority').value;
        const dueDate = document.getElementById('todoDueDate').value;

        const todo = {
            id: Date.now(),
            title,
            priority,
            dueDate,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.data.todos.push(todo);
        this.saveAndUpdate();
        this.renderTodos();
        this.closeModal();
        this.showNotification('待办事项添加成功！', 'success');
    }

    renderTodos() {
        const todoContainer = document.getElementById('todoList');
        const completedContainer = document.getElementById('completedList');

        const pendingTodos = this.data.todos.filter(todo => !todo.completed);
        const completedTodos = this.data.todos.filter(todo => todo.completed);

        // 渲染未完成的待办
        if (pendingTodos.length === 0) {
            todoContainer.innerHTML = '<p class="text-gray-500 text-center py-4">还没有待办事项</p>';
        } else {
            todoContainer.innerHTML = pendingTodos.map(todo => this.renderTodoItem(todo)).join('');
        }

        // 渲染已完成的待办
        if (completedTodos.length === 0) {
            completedContainer.innerHTML = '<p class="text-gray-500 text-center py-4">还没有完成的事项</p>';
        } else {
            completedContainer.innerHTML = completedTodos.map(todo => this.renderTodoItem(todo)).join('');
        }
    }

    renderTodoItem(todo) {
        const priorityIcons = {
            low: '🟢',
            medium: '🟡',
            high: '🔴'
        };

        return `
            <div class="todo-item ${todo.completed ? 'completed' : ''} p-4 rounded-lg shadow-sm">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <input type="checkbox" ${todo.completed ? 'checked' : ''}
                               onchange="loveWebsite.toggleTodo(${todo.id})"
                               class="w-5 h-5 text-pink-500 rounded focus:ring-pink-400">
                        <div>
                            <p class="todo-text font-medium">${todo.title}</p>
                            <div class="flex items-center space-x-2 text-sm text-gray-500">
                                <span>${priorityIcons[todo.priority]}</span>
                                ${todo.dueDate ? `<span><i class="fas fa-calendar"></i> ${this.formatDate(todo.dueDate)}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <button onclick="loveWebsite.deleteTodo(${todo.id})"
                            class="text-red-500 hover:text-red-700 transition-colors">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    toggleTodo(id) {
        const todo = this.data.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveAndUpdate();
            this.renderTodos();
            this.showNotification(todo.completed ? '任务完成！' : '任务重新激活', 'success');
        }
    }

    deleteTodo(id) {
        if (confirm('确定要删除这个待办事项吗？')) {
            this.data.todos = this.data.todos.filter(todo => todo.id !== id);
            this.saveAndUpdate();
            this.renderTodos();
            this.showNotification('待办事项已删除', 'success');
        }
    }

    // 悄悄话功能
    showMessageModal() {
        const modal = this.createModal('写悄悄话', `
            <form id="messageForm" class="space-y-4">
                <div>
                    <label class="block text-gray-700 font-medium mb-2">来自</label>
                    <select id="messageFrom" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400">
                        <option value="${this.data.settings.names.person1}">${this.data.settings.names.person1}</option>
                        <option value="${this.data.settings.names.person2}">${this.data.settings.names.person2}</option>
                    </select>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-2">悄悄话内容</label>
                    <textarea id="messageContent" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                              rows="5" placeholder="想对TA说什么悄悄话？" required></textarea>
                </div>
                <div class="flex space-x-3">
                    <button type="submit" class="flex-1 bg-gradient-to-r from-orange-400 to-pink-400 text-white p-3 rounded-lg hover:shadow-lg transition-all">
                        发送悄悄话
                    </button>
                    <button type="button" onclick="this.closest('.modal').remove()"
                            class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                        取消
                    </button>
                </div>
            </form>
        `);

        document.getElementById('messageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMessage();
        });
    }

    saveMessage() {
        const from = document.getElementById('messageFrom').value;
        const content = document.getElementById('messageContent').value;

        const message = {
            id: Date.now(),
            from,
            content,
            date: new Date().toISOString()
        };

        this.data.messages.push(message);
        this.saveAndUpdate();
        this.renderMessages();
        this.closeModal();
        this.showNotification('悄悄话发送成功！', 'success');
    }

    renderMessages() {
        const container = document.getElementById('messageList');
        if (this.data.messages.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">还没有悄悄话，快来留言吧！</p>';
            return;
        }

        container.innerHTML = this.data.messages
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(message => `
                <div class="message-bubble ${message.from === this.data.settings.names.person1 ? 'left' : 'right'} fade-in">
                    <div class="font-medium text-sm opacity-80 mb-1">${message.from}</div>
                    <div>${message.content}</div>
                    <div class="text-xs opacity-60 mt-2">${this.formatDate(message.date)}</div>
                    <button onclick="loveWebsite.deleteMessage(${message.id})"
                            class="absolute top-2 right-2 text-white/60 hover:text-white transition-colors">
                        <i class="fas fa-times text-xs"></i>
                    </button>
                </div>
            `).join('');
    }

    deleteMessage(id) {
        if (confirm('确定要删除这条悄悄话吗？')) {
            this.data.messages = this.data.messages.filter(message => message.id !== id);
            this.saveAndUpdate();
            this.renderMessages();
            this.showNotification('悄悄话已删除', 'success');
        }
    }

    // 工具函数
    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal fixed inset-0 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="modal-content bg-white rounded-2xl p-6 w-full max-w-md max-w-[90%] shadow-2xl">
                <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">${title}</h2>
                ${content}
            </div>
        `;

        // 点击模态框外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);
        return modal;
    }

    closeModal() {
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.remove();
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>
            ${message}
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    saveAndUpdate() {
        this.saveData();
        if (this.currentSection === 'dashboard') {
            this.updateDashboard();
        }
    }
}

// 初始化应用
let loveWebsite;
document.addEventListener('DOMContentLoaded', () => {
    loveWebsite = new LoveWebsite();
});

// 添加一些有趣的交互效果
document.addEventListener('DOMContentLoaded', () => {
    // 添加雪花效果（可选）
    function createSnowflake() {
        const snowflake = document.createElement('div');
        snowflake.innerHTML = Math.random() > 0.5 ? '❄️' : '💕';
        snowflake.style.position = 'fixed';
        snowflake.style.top = '-10px';
        snowflake.style.left = Math.random() * window.innerWidth + 'px';
        snowflake.style.fontSize = Math.random() * 10 + 10 + 'px';
        snowflake.style.opacity = Math.random();
        snowflake.style.pointerEvents = 'none';
        snowflake.style.zIndex = '1';

        document.body.appendChild(snowflake);

        const animation = snowflake.animate([
            { transform: 'translateY(-10px) rotate(0deg)' },
            { transform: `translateY(${window.innerHeight + 10}px) rotate(360deg)` }
        ], {
            duration: Math.random() * 3000 + 2000,
            easing: 'linear'
        });

        animation.addEventListener('finish', () => {
            snowflake.remove();
        });
    }

    // 定期创建雪花效果
    setInterval(createSnowflake, 3000);
});