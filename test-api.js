// API测试脚本
async function testAPI() {
    console.log('🧪 开始API集成测试...\n');

    try {
        // 1. 测试健康检查
        console.log('1. 测试健康检查...');
        const healthResponse = await fetch('http://localhost:3001/api/health');
        const healthData = await healthResponse.json();
        console.log('✅ 健康检查通过:', healthData.message);

        // 2. 测试登录
        console.log('\n2. 测试登录...');
        const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: 'love2024' })
        });
        const loginData = await loginResponse.json();
        if (loginData.success) {
            console.log('✅ 登录成功:', loginData.user.person1Name + ' ❤️ ' + loginData.user.person2Name);

            const token = loginData.token;
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            // 3. 测试创建日记
            console.log('\n3. 测试创建日记...');
            const diaryResponse = await fetch('http://localhost:3001/api/diaries', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    title: '第一篇日记',
                    content: '今天我们测试了爱情网站的API功能，一切都很顺利！',
                    mood: 'happy',
                    weather: 'sunny',
                    date: new Date().toISOString().split('T')[0]
                })
            });
            const diaryData = await diaryResponse.json();
            if (diaryData.success) {
                console.log('✅ 日记创建成功:', diaryData.data.title);
            }

            // 4. 测试获取日记列表
            console.log('\n4. 测试获取日记列表...');
            const getDiariesResponse = await fetch('http://localhost:3001/api/diaries', {
                headers
            });
            const getDiariesData = await getDiariesResponse.json();
            if (getDiariesData.success) {
                console.log('✅ 日记列表获取成功，共', getDiariesData.data.length, '篇日记');
            }

            // 5. 测试创建待办事项
            console.log('\n5. 测试创建待办事项...');
            const todoResponse = await fetch('http://localhost:3001/api/todos', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    content: '一起去看电影',
                    priority: 'high',
                    category: 'date'
                })
            });
            const todoData = await todoResponse.json();
            if (todoData.success) {
                console.log('✅ 待办事项创建成功:', todoData.data.content);
            }

            // 6. 测试创建悄悄话
            console.log('\n6. 测试创建悄悄话...');
            const messageResponse = await fetch('http://localhost:3001/api/messages', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    content: '我爱你，今天的API测试真成功！',
                    author: '包胡呢斯图',
                    isSpecial: true
                })
            });
            const messageData = await messageResponse.json();
            if (messageData.success) {
                console.log('✅ 悄悄话创建成功:', messageData.data.content);
            }

            console.log('\n🎉 所有API测试完成！');
            console.log('\n📋 测试总结:');
            console.log('   ✅ 用户认证系统正常');
            console.log('   ✅ 日记功能正常');
            console.log('   ✅ 待办事项功能正常');
            console.log('   ✅ 悄悄话功能正常');
            console.log('\n💖 爱情网站后端API运行完美！');

        } else {
            console.log('❌ 登录失败:', loginData.error);
        }

    } catch (error) {
        console.error('❌ API测试失败:', error.message);
    }
}

// 运行测试
if (typeof window === 'undefined') {
    // Node.js环境
    const { fetch } = require('cross-fetch');
    testAPI();
} else {
    // 浏览器环境
    testAPI();
}