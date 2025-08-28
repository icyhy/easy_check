/**
 * 自律打卡小程序 - 应用入口文件
 * 负责全局配置、数据管理和生命周期管理
 */
const { storageManager } = require('./utils/storage.js');
const util = require('./utils/util.js');

App({
  /**
   * 全局数据
   */
  globalData: {
    userInfo: null,
    tasks: [], // 用户任务列表
    checkinData: {}, // 打卡数据 {date: {blocks: [], completedBlocks: [], score: 0}}
    quotes: [], // 名人名言数据
    currentDate: '', // 当前日期
    systemInfo: null, // 系统信息
    userSettings: {}, // 用户设置
    statistics: {}, // 统计数据
    achievements: {} // 成就数据
  },

  /**
   * 应用启动时的初始化
   */
  onLaunch() {
    console.log('自律打卡小程序启动');
    
    // 获取系统信息
    this.getSystemInfo();
    
    // 初始化本地存储数据
    this.initLocalData();
    
    // 设置当前日期
    this.setCurrentDate();
    
    // 加载名人名言数据
    this.loadQuotes();
    
    // 初始化用户设置
    this.initUserSettings();
  },

  /**
   * 应用显示时触发
   */
  onShow() {
    console.log('应用显示');
    // 更新当前日期
    this.setCurrentDate();
  },

  /**
   * 应用隐藏时触发
   */
  onHide() {
    console.log('应用隐藏');
    // 保存所有数据
    this.saveAllData();
  },

  /**
   * 获取系统信息
   */
  getSystemInfo() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res;
        console.log('系统信息获取成功:', res);
      },
      fail: (err) => {
        console.error('获取系统信息失败:', err);
      }
    });
  },

  /**
   * 初始化本地存储数据
   */
  initLocalData() {
    try {
      // 使用存储管理器加载数据
      this.globalData.tasks = storageManager.loadTasks();
      this.globalData.checkinData = storageManager.loadCheckinData();
      this.globalData.userSettings = storageManager.loadUserSettings();
      this.globalData.statistics = storageManager.loadStatistics();
      this.globalData.achievements = storageManager.loadAchievements();
      
      // 如果没有任务数据，初始化默认任务
      if (this.globalData.tasks.length === 0) {
        this.initDefaultTasks();
      }
      
      console.log('本地数据加载成功，任务数量:', this.globalData.tasks.length);
    } catch (error) {
      console.error('本地数据加载失败:', error);
    }
  },

  /**
   * 初始化用户设置
   */
  initUserSettings() {
    if (!this.globalData.userSettings || Object.keys(this.globalData.userSettings).length === 0) {
      this.globalData.userSettings = storageManager.loadUserSettings();
    }
  },

  /**
   * 初始化默认任务
   * 为新用户提供一些示例任务
   */
  initDefaultTasks() {
    console.log('初始化默认任务');
    
    const defaultTasks = [
      {
        id: 'default_task_1',
        name: '早起锻炼',
        description: '每天早上进行30分钟的运动',
        difficulty: 'easy',
        repeatType: 'daily',
        createTime: Date.now(),
        updateTime: Date.now()
      },
      {
        id: 'default_task_2',
        name: '阅读学习',
        description: '每天阅读至少1小时',
        difficulty: 'medium',
        repeatType: 'daily',
        createTime: Date.now(),
        updateTime: Date.now()
      },
      {
        id: 'default_task_3',
        name: '技能提升',
        description: '学习新技能或深入专业知识',
        difficulty: 'hard',
        repeatType: 'daily',
        createTime: Date.now(),
        updateTime: Date.now()
      },
      {
        id: 'default_task_4',
        name: '健康饮食',
        description: '保持营养均衡的饮食习惯',
        difficulty: 'easy',
        repeatType: 'daily',
        createTime: Date.now(),
        updateTime: Date.now()
      },
      {
        id: 'default_task_5',
        name: '冥想放松',
        description: '每天进行10-15分钟的冥想',
        difficulty: 'medium',
        repeatType: 'daily',
        createTime: Date.now(),
        updateTime: Date.now()
      }
    ];
    
    this.globalData.tasks = defaultTasks;
    storageManager.saveTasks(this.globalData.tasks);
    
    console.log('默认任务初始化完成，共', defaultTasks.length, '个任务');
   },
 
   /**
   * 保存所有数据
   */
  saveAllData() {
    try {
      storageManager.saveTasks(this.globalData.tasks);
      storageManager.saveCheckinData(this.globalData.checkinData);
      storageManager.saveUserSettings(this.globalData.userSettings);
      storageManager.saveStatistics(this.globalData.statistics);
      storageManager.saveAchievements(this.globalData.achievements);
      
      console.log('全局数据保存成功');
    } catch (error) {
      console.error('全局数据保存失败:', error);
    }
  },

  /**
   * 设置当前日期
   */
  setCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    this.globalData.currentDate = `${year}-${month}-${day}`;
  },

  /**
   * 加载名人名言数据
   */
  loadQuotes() {
    // 这里可以从本地文件或API加载名人名言
    // 暂时使用静态数据
    this.globalData.quotes = [
      {
        text: "成功不是终点，失败不是末日，继续前进的勇气才最可贵。",
        author: "温斯顿·丘吉尔",
        image: "/images/quotes/quote1.jpg"
      },
      {
        text: "你今天的努力，是幸运的伏笔。",
        author: "佚名",
        image: "/images/quotes/quote2.jpg"
      },
      {
        text: "不要等待机会，而要创造机会。",
        author: "乔治·萧伯纳",
        image: "/images/quotes/quote3.jpg"
      }
    ];
  },

  /**
   * 保存数据到本地存储
   * @param {string} key - 存储键名
   * @param {any} data - 要存储的数据
   */
  saveToStorage(key, data) {
    return storageManager.save(key, data);
  },

  /**
   * 从本地存储获取数据
   * @param {string} key - 存储键名
   * @param {any} defaultValue - 默认值
   * @returns {any} 存储的数据
   */
  getFromStorage(key, defaultValue = null) {
    return storageManager.load(key, defaultValue);
  },

  // ==================== 任务管理相关方法 ====================

  /**
   * 添加任务
   * @param {object} task - 任务对象
   */
  addTask(task) {
    this.globalData.tasks.push(task);
    storageManager.saveTasks(this.globalData.tasks);
  },

  /**
   * 更新任务
   * @param {string} taskId - 任务ID
   * @param {object} updatedTask - 更新的任务数据
   */
  updateTask(taskId, updatedTask) {
    const index = this.globalData.tasks.findIndex(task => task.id === taskId);
    if (index !== -1) {
      this.globalData.tasks[index] = { ...this.globalData.tasks[index], ...updatedTask };
      storageManager.saveTasks(this.globalData.tasks);
    }
  },

  /**
   * 删除任务
   * @param {string} taskId - 任务ID
   */
  deleteTask(taskId) {
    this.globalData.tasks = this.globalData.tasks.filter(task => task.id !== taskId);
    storageManager.saveTasks(this.globalData.tasks);
  },

  /**
   * 保存任务列表（兼容旧调用）
   * 用于兼容页面中直接调用 app.saveTasks(tasks) 的场景
   * @param {Array} tasks - 要保存的任务数组
   */
  saveTasks(tasks) {
    // 类型与空值防御
    if (!Array.isArray(tasks)) {
      console.warn('saveTasks: 参数不是数组，将使用当前全局任务列表');
      tasks = this.globalData.tasks || [];
    }

    this.globalData.tasks = tasks;
    storageManager.saveTasks(this.globalData.tasks);
  },

  /**
   * 获取今日任务
   * @returns {Array} 今日任务列表
   */
  getTodayTasks() {
    return this.globalData.tasks.filter(task => task.enabled);
  },

  // ==================== 打卡数据相关方法 ====================

  /**
   * 保存打卡数据
   * @param {string} date - 日期
   * @param {object} checkinData - 打卡数据
   */
  saveCheckinData(date, checkinData) {
    this.globalData.checkinData[date] = checkinData;
    storageManager.saveCheckinData(this.globalData.checkinData);
  },

  /**
   * 获取打卡数据
   * @param {string} date - 日期
   * @returns {object|null} 打卡数据
   */
  getCheckinData(date) {
    return this.globalData.checkinData[date] || null;
  },

  // ==================== 统计数据相关方法 ====================

  /**
   * 更新统计数据
   */
  updateStatistics() {
    const checkinData = this.globalData.checkinData;
    const tasks = this.globalData.tasks;
    
    // 计算总打卡天数
    const totalCheckinDays = Object.keys(checkinData).length;
    
    // 计算连续打卡天数
    const continuousCheckinDays = this.calculateContinuousCheckinDays();
    
    // 计算总得分
    let totalScore = 0;
    Object.values(checkinData).forEach(dayData => {
      totalScore += dayData.score || 0;
    });
    
    // 更新统计数据
    this.globalData.statistics = {
      ...this.globalData.statistics,
      totalCheckinDays,
      continuousCheckinDays,
      maxContinuousCheckinDays: Math.max(
        this.globalData.statistics.maxContinuousCheckinDays || 0,
        continuousCheckinDays
      ),
      totalScore,
      lastUpdateTime: Date.now()
    };
    
    storageManager.saveStatistics(this.globalData.statistics);
  },

  /**
   * 计算连续打卡天数
   * @returns {number} 连续打卡天数
   */
  calculateContinuousCheckinDays() {
    const checkinData = this.globalData.checkinData;
    const dates = Object.keys(checkinData).sort();
    
    if (dates.length === 0) {
      return 0;
    }
    
    let continuousDays = 0;
    const today = this.globalData.currentDate;
    
    // 从今天开始往前计算连续天数
    let currentDate = new Date(today);
    
    while (true) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      if (checkinData[dateStr] && checkinData[dateStr].completedBlocks && checkinData[dateStr].completedBlocks.length > 0) {
        continuousDays++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return continuousDays;
  },

  // ==================== 成就系统相关方法 ====================

  /**
   * 获取成就数据
   * @returns {array} 成就数据数组
   */
  getAchievements() {
    const achievements = this.globalData.achievements || {};
    const achievementList = [];
    
    // 将对象格式的成就数据转换为数组格式
    Object.keys(achievements).forEach(key => {
      if (achievements[key]) {
        achievementList.push({
          id: key,
          unlocked: true,
          unlockedAt: new Date().toISOString(), // 可以根据需要调整时间戳
          progress: 100
        });
      }
    });
    
    return achievementList;
  },

  /**
   * 检查并更新成就
   */
  checkAchievements() {
    const statistics = this.globalData.statistics;
    const achievements = this.globalData.achievements;
    let hasNewAchievement = false;
    
    // 首次打卡成就
    if (!achievements.firstCheckin && statistics.totalCheckinDays >= 1) {
      achievements.firstCheckin = true;
      hasNewAchievement = true;
      console.log('解锁成就：首次打卡');
    }
    
    // 连续打卡7天成就
    if (!achievements.weekStreak && statistics.continuousCheckinDays >= 7) {
      achievements.weekStreak = true;
      hasNewAchievement = true;
      console.log('解锁成就：连续打卡7天');
    }
    
    // 连续打卡30天成就
    if (!achievements.monthStreak && statistics.continuousCheckinDays >= 30) {
      achievements.monthStreak = true;
      hasNewAchievement = true;
      console.log('解锁成就：连续打卡30天');
    }
    
    if (hasNewAchievement) {
      this.globalData.achievements = achievements;
      storageManager.saveAchievements(achievements);
    }
    
    return hasNewAchievement;
  },

  /**
   * 获取今日名言
   * @returns {object} 今日名言对象
   */
  getTodayQuote() {
    if (this.globalData.quotes.length === 0) return null;
    
    // 根据日期生成随机索引，确保同一天返回相同的名言
    const dateStr = this.globalData.currentDate;
    const hash = this.hashCode(dateStr);
    const index = Math.abs(hash) % this.globalData.quotes.length;
    
    return this.globalData.quotes[index];
  },

  /**
   * 字符串哈希函数
   * @param {string} str - 输入字符串
   * @returns {number} 哈希值
   */
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash;
  }
});