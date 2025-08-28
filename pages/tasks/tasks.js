/**
 * 任务管理页面 - 逻辑文件
 * 实现任务的增删改查和数据管理功能
 */

const app = getApp();
const util = require('../../utils/util.js');
const { shareManager } = require('../../utils/share.js');

Page({
  /**
   * 页面数据
   */
  data: {
    // 系统信息
    statusBarHeight: 0,
    navBarHeight: 88,
    isSkyline: false, // 渲染模式检测
    
    // 任务数据
    tasks: [],
    easyTasksCount: 0,
    mediumTasksCount: 0,
    hardTasksCount: 0,
    isEmpty: true, // 任务列表是否为空
    hasItems: false, // 任务列表是否有项目
    
    // UI状态
    showTaskModal: false,
    showActionSheet: false,
    isEditMode: false,
    currentTaskId: '',
    canSubmit: false, // 是否可以提交表单
    
    // 表单数据
    taskForm: {
      name: '',
      description: '',
      difficulty: 'easy',
      repeatType: 'once'
    },
    
    // 循环设置选项
    repeatOptions: [
      {
        value: 'once',
        name: '仅一次',
        icon: '📅'
      },
      {
        value: 'daily',
        name: '每天',
        icon: '🔄'
      },
      {
        value: 'weekly',
        name: '每周',
        icon: '📆'
      },
      {
        value: 'monthly',
        name: '每月',
        icon: '🗓️'
      }
    ],

    // 难度选项配置
    difficultyOptions: [
      {
        value: 'easy',
        name: '简单',
        color: '#52c41a',
        score: 10
      },
      {
        value: 'medium',
        name: '中等',
        color: '#1890ff',
        score: 20
      },
      {
        value: 'hard',
        name: '困难',
        color: '#f5222d',
        score: 30
      }
    ]
  },

  /**
   * 页面加载时执行
   */
  onLoad() {
    console.log('任务管理页面加载');
    this.initPage();
  },

  /**
   * 页面显示时执行
   */
  onShow() {
    console.log('任务管理页面显示');
    this.loadTasks();
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    console.log('下拉刷新');
    this.loadTasks();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  /**
   * 初始化页面
   */
  initPage() {
    // 获取系统信息
    this.getSystemInfo();
    
    // 加载任务数据
    this.loadTasks();
  },

  /**
   * 获取系统信息和渲染模式检测
   */
  getSystemInfo() {
    const systemInfo = app.globalData.systemInfo;
    if (systemInfo) {
      // 检测渲染模式
      const isSkyline = this.detectRenderingMode();
      
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight,
        isSkyline: isSkyline
      });
      
      // 动态添加渲染模式CSS类名
      this.applyRenderingModeStyles(isSkyline);
      
      console.log('任务页面渲染模式:', isSkyline ? 'Skyline' : 'WebView');
    }
  },

  /**
   * 检测当前渲染模式
   * @returns {boolean} true为Skyline模式，false为WebView模式
   */
  detectRenderingMode() {
    try {
      // 检查基础库版本
      const systemInfo = wx.getSystemInfoSync();
      const SDKVersion = systemInfo.SDKVersion;
      
      // 基础库版本 2.29.2 及以上支持 Skyline
      const versionParts = SDKVersion.split('.').map(Number);
      const supportsSkyline = (
        versionParts[0] > 2 || 
        (versionParts[0] === 2 && versionParts[1] > 29) ||
        (versionParts[0] === 2 && versionParts[1] === 29 && versionParts[2] >= 2)
      );
      
      return supportsSkyline;
    } catch (error) {
      console.warn('渲染模式检测失败，默认使用 WebView 模式:', error);
      return false;
    }
  },

  /**
   * 应用渲染模式相关的样式类名
   * @param {boolean} isSkyline - 是否为Skyline模式
   */
  applyRenderingModeStyles(isSkyline) {
    try {
      const query = wx.createSelectorQuery().in(this);
      query.select('.tasks-page').node((res) => {
        if (res && res.node) {
          // 移除之前的模式类名
          res.node.classList.remove('skyline-mode', 'webview-mode');
          // 添加当前模式类名
          res.node.classList.add(isSkyline ? 'skyline-mode' : 'webview-mode');
        }
      }).exec();
    } catch (error) {
      console.warn('应用渲染模式样式失败:', error);
    }
  },

  /**
   * 加载任务数据
   */
  loadTasks() {
    const tasks = app.globalData.tasks || [];
    
    // 处理任务数据，添加显示所需的字段
    const processedTasks = tasks.map(task => ({
      ...task,
      difficultyText: this.getDifficultyText(task.difficulty),
      score: this.getTaskScore(task.difficulty),
      createTime: this.formatDate(task.createTime),
      repeatText: this.getRepeatText(task.repeatType)
    }));
    
    // 统计各难度任务数量
    const easyCount = tasks.filter(task => task.difficulty === 'easy').length;
    const mediumCount = tasks.filter(task => task.difficulty === 'medium').length;
    const hardCount = tasks.filter(task => task.difficulty === 'hard').length;
    
    this.setData({
      tasks: processedTasks,
      easyTasksCount: easyCount,
      mediumTasksCount: mediumCount,
      hardTasksCount: hardCount,
      isEmpty: tasks.length === 0,
      hasItems: tasks.length > 0
    });
    
    console.log('任务数据加载完成:', processedTasks);
  },

  /**
   * 获取难度文本
   * @param {string} difficulty - 难度等级
   * @returns {string} 难度文本
   */
  getDifficultyText(difficulty) {
    const difficultyMap = {
      easy: '简单',
      medium: '中等',
      hard: '困难'
    };
    return difficultyMap[difficulty] || '未知';
  },

  /**
   * 获取任务分数
   * @param {string} difficulty - 难度等级
   * @returns {number} 任务分数
   */
  getTaskScore(difficulty) {
    const scoreMap = {
      easy: 10,
      medium: 20,
      hard: 30
    };
    return scoreMap[difficulty] || 10;
  },

  /**
   * 获取循环类型文本
   * @param {string} repeatType - 循环类型
   * @returns {string} 循环文本
   */
  getRepeatText(repeatType) {
    const repeatMap = {
      once: '仅一次',
      daily: '每天重复',
      weekly: '每周重复',
      monthly: '每月重复'
    };
    return repeatMap[repeatType] || '仅一次';
  },

  /**
   * 格式化日期
   * @param {string|number} timestamp - 时间戳
   * @returns {string} 格式化后的日期
   */
  formatDate(timestamp) {
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  },

  /**
   * 显示添加任务模态框
   */
  showAddTaskModal() {
    console.log('显示添加任务模态框');
    this.setData({
      showTaskModal: true,
      isEditMode: false,
      currentTaskId: '',
      canSubmit: false,
      taskForm: {
        name: '',
        description: '',
        difficulty: 'easy',
        repeatType: 'once'
      }
    });
  },

  /**
   * 隐藏任务模态框
   */
  hideTaskModal() {
    console.log('隐藏任务模态框');
    this.setData({
      showTaskModal: false
    });
  },

  /**
   * 更新表单提交状态
   */
  updateCanSubmit() {
    const { name } = this.data.taskForm;
    this.setData({
      canSubmit: name && name.trim().length > 0
    });
  },

  /**
   * 任务名称输入事件
   * @param {object} e - 事件对象
   */
  onTaskNameInput(e) {
    this.setData({
      'taskForm.name': e.detail.value
    }, () => {
      this.updateCanSubmit();
    });
  },

  /**
   * 任务描述输入事件
   * @param {object} e - 事件对象
   */
  onTaskDescInput(e) {
    this.setData({
      'taskForm.description': e.detail.value
    });
  },

  /**
   * 选择循环类型
   * @param {object} e - 事件对象
   */
  selectRepeatType(e) {
    const { repeat } = e.currentTarget.dataset;
    console.log('选择循环类型:', repeat);
    this.setData({
      'taskForm.repeatType': repeat
    });
  },

  /**
   * 选择难度
   * @param {object} e - 事件对象
   */
  selectDifficulty(e) {
    const { difficulty } = e.currentTarget.dataset;
    console.log('选择难度:', difficulty);
    this.setData({
      'taskForm.difficulty': difficulty
    });
  },

  /**
   * 提交任务表单
   * @param {object} e - 事件对象
   */
  submitTask(e) {
    const { name, description, difficulty } = this.data.taskForm;
    
    // 验证表单
    if (!name.trim()) {
      wx.showToast({
        title: '请输入任务名称',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.isEditMode) {
      this.updateTask();
    } else {
      this.addTask();
    }
  },

  /**
   * 添加新任务
   */
  addTask() {
    const { name, description, difficulty, repeatType } = this.data.taskForm;
    
    const newTask = {
      id: this.generateTaskId(),
      name: name.trim(),
      description: description.trim(),
      difficulty,
      repeatType,
      createTime: Date.now(),
      updateTime: Date.now()
    };
    
    // 添加到全局数据
    app.globalData.tasks.push(newTask);
    
    // 保存到本地存储
    app.saveTasks(app.globalData.tasks);
    
    // 刷新页面数据
    this.loadTasks();
    
    // 自动生成打卡色块（如果当前在打卡页面）
    this.generateCheckinBlocks();
    
    // 隐藏模态框
    this.hideTaskModal();
    
    // 显示成功提示
    wx.showToast({
      title: '任务添加成功',
      icon: 'success'
    });
    
    console.log('新任务添加成功:', newTask);
  },

  /**
   * 更新任务
   */
  updateTask() {
    const { name, description, difficulty, repeatType } = this.data.taskForm;
    const taskId = this.data.currentTaskId;
    
    // 找到要更新的任务
    const taskIndex = app.globalData.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      wx.showToast({
        title: '任务不存在',
        icon: 'error'
      });
      return;
    }
    
    // 更新任务数据
    app.globalData.tasks[taskIndex] = {
      ...app.globalData.tasks[taskIndex],
      name: name.trim(),
      description: description.trim(),
      difficulty,
      repeatType,
      updateTime: Date.now()
    };
    
    // 保存到本地存储
    app.saveTasks(app.globalData.tasks);
    
    // 刷新页面数据
    this.loadTasks();
    
    // 隐藏模态框
    this.hideTaskModal();
    
    // 显示成功提示
    wx.showToast({
      title: '任务更新成功',
      icon: 'success'
    });
    
    console.log('任务更新成功:', app.globalData.tasks[taskIndex]);
  },

  /**
   * 生成任务ID
   * @returns {string} 任务ID
   */
  generateTaskId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * 编辑任务
   * @param {object} e - 事件对象
   */
  editTask(e) {
    const { taskId } = e.currentTarget.dataset;
    console.log('编辑任务:', taskId);
    
    // 找到要编辑的任务
    const task = app.globalData.tasks.find(t => t.id === taskId);
    if (!task) {
      wx.showToast({
        title: '任务不存在',
        icon: 'error'
      });
      return;
    }
    
    // 填充表单数据
    this.setData({
      showTaskModal: true,
      isEditMode: true,
      currentTaskId: taskId,
      taskForm: {
        name: task.name,
        description: task.description || '',
        difficulty: task.difficulty,
        repeatType: task.repeatType || 'once'
      }
    }, () => {
      this.updateCanSubmit();
    });
  },

  /**
   * 删除任务
   * @param {object} e - 事件对象
   */
  deleteTask(e) {
    const { taskId } = e.currentTarget.dataset;
    console.log('删除任务:', taskId);
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个任务吗？删除后无法恢复。',
      confirmText: '删除',
      confirmColor: '#f5222d',
      success: (res) => {
        if (res.confirm) {
          this.confirmDeleteTask(taskId);
        }
      }
    });
  },

  /**
   * 确认删除任务
   * @param {string} taskId - 任务ID
   */
  confirmDeleteTask(taskId) {
    // 从全局数据中删除
    app.globalData.tasks = app.globalData.tasks.filter(task => task.id !== taskId);
    
    // 保存到本地存储
    app.saveTasks(app.globalData.tasks);
    
    // 刷新页面数据
    this.loadTasks();
    
    // 显示成功提示
    wx.showToast({
      title: '任务删除成功',
      icon: 'success'
    });
    
    console.log('任务删除成功:', taskId);
  },

  /**
   * 显示任务操作菜单
   * @param {object} e - 事件对象
   */
  showTaskActions(e) {
    const { taskId } = e.currentTarget.dataset;
    console.log('显示任务操作菜单:', taskId);
    
    this.setData({
      showActionSheet: true,
      currentTaskId: taskId
    });
    
    // 触发震动反馈
    wx.vibrateShort({
      type: 'light'
    });
  },

  /**
   * 隐藏操作菜单
   */
  hideActionSheet() {
    console.log('隐藏操作菜单');
    this.setData({
      showActionSheet: false,
      currentTaskId: ''
    });
  },

  /**
   * 从操作菜单编辑任务
   */
  editTaskFromSheet() {
    const taskId = this.data.currentTaskId;
    this.hideActionSheet();
    
    // 模拟点击编辑按钮
    this.editTask({
      currentTarget: {
        dataset: { taskId }
      }
    });
  },

  /**
   * 从操作菜单删除任务
   */
  deleteTaskFromSheet() {
    const taskId = this.data.currentTaskId;
    this.hideActionSheet();
    
    // 模拟点击删除按钮
    this.deleteTask({
      currentTarget: {
        dataset: { taskId }
      }
    });
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 阻止事件冒泡
  },

  /**
   * 自动生成打卡色块
   */
  generateCheckinBlocks() {
    try {
      // 获取当前页面栈
      const pages = getCurrentPages();
      const checkinPage = pages.find(page => page.route === 'pages/checkin/checkin');
      
      if (checkinPage && checkinPage.generateBlocks) {
        // 如果打卡页面存在且有生成色块的方法，则调用
        checkinPage.generateBlocks();
        console.log('自动生成打卡色块成功');
      }
    } catch (error) {
      console.error('自动生成打卡色块失败:', error);
    }
  },

  /**
   * 分享任务列表
   */
  shareTasks() {
    const { tasks } = this.data;
    const taskCount = tasks.length;
    
    if (taskCount === 0) {
      util.showToast('还没有添加任务哦');
      return;
    }
    
    const easyTasks = tasks.filter(task => task.difficulty === 'easy').length;
    const mediumTasks = tasks.filter(task => task.difficulty === 'medium').length;
    const hardTasks = tasks.filter(task => task.difficulty === 'hard').length;
    
    const shareData = {
      taskCount,
      easyTasks,
      mediumTasks,
      hardTasks,
      tasks: tasks.map(task => ({
        name: task.name,
        difficulty: task.difficulty,
        score: task.score
      })),
      date: app.globalData.currentDate
    };
    
    // 显示分享选项
    wx.showActionSheet({
      itemList: ['分享给好友', '生成分享海报'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 分享给好友
          const shareConfig = shareManager.shareToFriend('tasks', shareData);
          wx.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage', 'shareTimeline']
          });
        } else if (res.tapIndex === 1) {
          // 生成分享海报
          this.generateSharePoster(shareData);
        }
      }
    });
  },

  /**
   * 生成分享海报
   */
  generateSharePoster(shareData) {
    wx.showLoading({ title: '生成海报中...' });
    
    try {
      const posterData = shareManager.generatePosterData('tasks', shareData);
      
      // 这里可以集成海报生成库，如 painter 或自定义 canvas 绘制
      // 暂时显示提示
      setTimeout(() => {
        wx.hideLoading();
        util.showToast('海报生成功能开发中');
      }, 1000);
      
    } catch (error) {
      wx.hideLoading();
      console.error('生成海报失败:', error);
      util.showToast('生成海报失败');
    }
  },

  /**
   * 分享到微信好友
   */
  onShareAppMessage() {
    const { tasks } = this.data;
    const taskCount = tasks.length;
    
    if (taskCount === 0) {
      return {
        title: '自律打卡小程序，一起来制定目标吧！',
        path: '/pages/tasks/tasks'
      };
    }
    
    const easyTasks = tasks.filter(task => task.difficulty === 'easy').length;
    const mediumTasks = tasks.filter(task => task.difficulty === 'medium').length;
    const hardTasks = tasks.filter(task => task.difficulty === 'hard').length;
    
    const shareData = {
      taskCount,
      easyTasks,
      mediumTasks,
      hardTasks,
      tasks: tasks.map(task => ({
        name: task.name,
        difficulty: task.difficulty,
        score: task.score
      })),
      date: app.globalData.currentDate
    };
    
    const shareConfig = shareManager.shareToFriend('tasks', shareData);
    
    // 保存分享记录
    shareManager.saveShareRecord('tasks', shareData);
    
    return shareConfig;
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    const { tasks } = this.data;
    const taskCount = tasks.length;
    
    if (taskCount === 0) {
      return {
        title: '自律打卡，每天进步一点点！'
      };
    }
    
    const easyTasks = tasks.filter(task => task.difficulty === 'easy').length;
    const mediumTasks = tasks.filter(task => task.difficulty === 'medium').length;
    const hardTasks = tasks.filter(task => task.difficulty === 'hard').length;
    
    const shareData = {
      taskCount,
      easyTasks,
      mediumTasks,
      hardTasks,
      tasks: tasks.map(task => ({
        name: task.name,
        difficulty: task.difficulty,
        score: task.score
      })),
      date: app.globalData.currentDate
    };
    
    const shareConfig = shareManager.shareToTimeline('tasks', shareData);
    
    // 保存分享记录
    shareManager.saveShareRecord('tasks_timeline', shareData);
    
    return shareConfig;
  }
});