/**
 * 专注页面逻辑
 * 实现专注计时器、项目管理和统计功能
 */

const app = getApp();
const { shareManager } = require('../../utils/share.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 系统信息
    statusBarHeight: 0,
    navBarHeight: 88,
    isSkyline: false, // 渲染模式检测
    
    // 专注状态
    isRunning: false, // 是否正在专注
    isPaused: false, // 是否暂停
    currentTime: 0, // 当前专注时间（秒）
    targetTime: 1800, // 目标时间（默认30分钟）
    
    // 时间显示
    displayTime: '30:00',
    progress: 0, // 进度百分比
    
    // 项目管理
    projects: [
      {
        id: 'reading',
        name: '看书',
        icon: '/images/book-icon.png',
        color: '#52c41a',
        todayTime: 0
      },
      {
        id: 'study',
        name: '学习',
        icon: '/images/study-icon.png',
        color: '#1890ff',
        todayTime: 0
      },
      {
        id: 'exercise',
        name: '跑起来',
        icon: '/images/run-icon.png',
        color: '#faad14',
        todayTime: 1800 // 30分钟
      }
    ],
    currentProject: null, // 当前选中的项目
    
    // 今日统计
    todayStats: {
      totalTime: 1800, // 今日总专注时间（秒）
      completedSessions: 1, // 完成的专注次数
      targetGoal: 7200 // 目标时间（2小时）
    },
    
    // 定时器
    timer: null,
    
    // 时间选择选项
    timeOptions: [
      { value: 900, label: '15分钟' },
      { value: 1800, label: '30分钟' },
      { value: 2700, label: '45分钟' },
      { value: 3600, label: '60分钟' }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.initPage();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadProjects();
    this.loadFocusData();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // 页面隐藏时暂停计时器但不重置
    if (this.data.isRunning && !this.data.isPaused) {
      this.pauseFocus();
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    this.clearTimer();
  },

  /**
   * 初始化页面
   */
  initPage() {
    this.getSystemInfo();
    this.loadFocusData();
    this.updateDisplay();
  },

  /**
   * 获取系统信息和渲染模式检测
   */
  getSystemInfo() {
    try {
      // 检测渲染模式
      const isSkyline = this.detectRenderingMode();
      
      this.setData({
        isSkyline: isSkyline
      });
      
      // 动态添加渲染模式CSS类名
      this.applyRenderingModeStyles(isSkyline);
      
      console.log('专注页面渲染模式:', isSkyline ? 'Skyline' : 'WebView');
    } catch (error) {
      console.warn('获取系统信息失败:', error);
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
      query.select('.focus-container').node((res) => {
        if (res && res.node && res.node.classList) {
          // 移除之前的模式类名
          res.node.classList.remove('skyline-mode', 'webview-mode');
          // 添加当前模式类名
          res.node.classList.add(isSkyline ? 'skyline-mode' : 'webview-mode');
        } else {
          console.warn('无法获取容器节点或classList不存在');
        }
      }).exec();
    } catch (error) {
      console.warn('应用渲染模式样式失败:', error);
    }
  },

  /**
   * 加载项目列表
   */
  loadProjects() {
    const projects = wx.getStorageSync('projects') || [];
    this.setData({
      projects: projects,
      currentProject: projects.length > 0 ? projects[0] : null, // 默认选中第一个项目，如果没有项目则为null
      hasProjects: projects.length > 0 // 用于控制开始按钮的禁用状态
    });
  },

  /**
   * 加载专注数据
   */
  loadFocusData() {
    try {
      // 从本地存储加载数据
      const focusData = wx.getStorageSync('focusData') || {};
      const today = this.getCurrentDate();
      
      // 更新今日统计
      const todayData = focusData[today] || {
        totalTime: 0,
        completedSessions: 0,
        projects: {}
      };
      
      // 更新项目今日时间
      const updatedProjects = this.data.projects.map(project => {
        const todayTime = todayData.projects[project.id] || 0;
        return {
          ...project,
          todayTime: todayTime,
          todayTimeText: this.formatTime(todayTime)
        };
      });
      
      const totalTime = todayData.totalTime;
      this.setData({
        projects: updatedProjects,
        todayStats: {
          ...this.data.todayStats,
          totalTime: totalTime,
          totalTimeText: this.formatTime(totalTime),
          completedSessions: todayData.completedSessions
        }
      });
    } catch (error) {
      console.error('加载专注数据失败:', error);
    }
  },

  /**
   * 导航到项目管理页面
   */
  navigateToProjects() {
    wx.navigateTo({
      url: '/pages/projects/projects'
    });
  },

  /**
   * 保存专注数据
   */
  saveFocusData() {
    try {
      const focusData = wx.getStorageSync('focusData') || {};
      const today = this.getCurrentDate();
      
      // 构建项目时间数据
      const projectsData = {};
      this.data.projects.forEach(project => {
        projectsData[project.id] = project.todayTime;
      });
      
      focusData[today] = {
        totalTime: this.data.todayStats.totalTime,
        completedSessions: this.data.todayStats.completedSessions,
        projects: projectsData
      };
      
      wx.setStorageSync('focusData', focusData);
    } catch (error) {
      console.error('保存专注数据失败:', error);
    }
  },

  /**
   * 选择项目
   */
  selectProject(e) {
    const projectId = e.currentTarget.dataset.projectId;
    const project = this.data.projects.find(p => p.id === projectId);
    
    if (project) {
      this.setData({
        currentProject: project
      });
    }
  },

  /**
   * 选择专注时间
   */
  selectTime(e) {
    const time = parseInt(e.currentTarget.dataset.time);
    
    this.setData({
      targetTime: time,
      currentTime: 0,
      progress: 0
    });
    
    this.updateDisplay();
  },

  /**
   * 开始专注
   */
  startFocus() {
    if (this.data.isRunning) return;

    // 如果没有项目，提示用户添加项目并跳转
    if (!this.data.currentProject) {
      wx.showModal({
        title: '提示',
        content: '请先选择一个项目才能开始专注哦！',
        showCancel: false,
        confirmText: '去添加',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/add-project/add-project',
            });
          }
        },
      });
      return;
    }

    this.setData({
      isRunning: true,
      isPaused: false,
      currentTime: 0,
      displayTime: this.formatTime(this.data.targetTime),
      progress: 0
    });
    this.startTimer();
  },

  /**
   * 暂停专注
   */
  pauseFocus() {
    this.setData({
      isPaused: true
    });
    
    this.clearTimer();
  },

  /**
   * 继续专注
   */
  resumeFocus() {
    this.setData({
      isPaused: false
    });
    
    this.startTimer();
  },

  /**
   * 停止专注
   */
  stopFocus() {
    this.clearTimer();
    
    // 如果有进度，记录本次专注
    if (this.data.currentTime > 0) {
      this.recordFocusSession();
    }
    
    this.resetFocus();
  },

  /**
   * 重置专注状态
   */
  resetFocus() {
    this.setData({
      isRunning: false,
      isPaused: false,
      currentTime: 0,
      progress: 0
    });
    
    this.updateDisplay();
  },

  /**
   * 启动计时器
   */
  startTimer() {
    this.clearTimer();
    
    this.data.timer = setInterval(() => {
      const newTime = this.data.currentTime + 1;
      const progress = Math.min((newTime / this.data.targetTime) * 100, 100);
      
      this.setData({
        currentTime: newTime,
        progress: progress
      });
      
      this.updateDisplay();
      
      // 检查是否完成
      if (newTime >= this.data.targetTime) {
        this.completeFocus();
      }
    }, 1000);
  },

  /**
   * 清除计时器
   */
  clearTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.data.timer = null;
    }
  },

  /**
   * 完成专注
   */
  completeFocus() {
    this.clearTimer();
    this.recordFocusSession();
    
    // 显示完成提示
    wx.showToast({
      title: '专注完成！',
      icon: 'success'
    });
    
    this.resetFocus();
  },

  /**
   * 记录专注会话
   */
  recordFocusSession() {
    const sessionTime = this.data.currentTime;
    const project = this.data.currentProject;
    
    if (!project || sessionTime < 60) { // 至少1分钟才记录
      return;
    }
    
    // 更新项目时间
    const updatedProjects = this.data.projects.map(p => {
      if (p.id === project.id) {
        const newTodayTime = p.todayTime + sessionTime;
        return {
          ...p,
          todayTime: newTodayTime,
          todayTimeText: this.formatTime(newTodayTime)
        };
      }
      return p;
    });
    
    // 更新今日统计
    const newTotalTime = this.data.todayStats.totalTime + sessionTime;
    const newCompletedSessions = this.data.todayStats.completedSessions + 1;
    
    this.setData({
      projects: updatedProjects,
      todayStats: {
        ...this.data.todayStats,
        totalTime: newTotalTime,
        totalTimeText: this.formatTime(newTotalTime),
        completedSessions: newCompletedSessions
      }
    });
    
    // 保存数据
    this.saveFocusData();
  },

  /**
   * 更新时间显示
   */
  updateDisplay() {
    const remainingTime = this.data.targetTime - this.data.currentTime;
    const minutes = Math.floor(Math.abs(remainingTime) / 60);
    const seconds = Math.abs(remainingTime) % 60;
    
    const displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    this.setData({
      displayTime: displayTime
    });
  },

  /**
   * 格式化时间显示（秒数转换为可读格式）
   * @param {number} seconds - 秒数
   * @returns {string} 格式化的时间字符串
   */
  formatTime(seconds) {
    if (!seconds || seconds === 0) {
      return '0s';
    }
    
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;
      let result = `${hours}h`;
      if (minutes > 0) result += ` ${minutes}m`;
      if (remainingSeconds > 0) result += ` ${remainingSeconds}s`;
      return result;
    }
  },

  /**
   * 获取当前日期字符串
   * @returns {string} YYYY-MM-DD 格式的日期字符串
   */
  getCurrentDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * 分享专注成果
   */
  shareFocus() {
    const shareData = {
      title: '我的专注时光',
      desc: `今日专注 ${this.formatTime(this.data.todayStats.totalTime)}，完成 ${this.data.todayStats.completedSessions} 次专注`,
      imageUrl: '/images/share-focus.jpg'
    };
    
    shareManager.shareToFriend(shareData);
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    return {
      title: `专注打卡 - 今日专注${this.formatTime(this.data.todayStats.totalTime)}`
    };
  },

  /**
   * 分享给朋友
   */
  onShareAppMessage() {
    return {
      title: '专注时光，自律成长',
      desc: `今日专注 ${this.formatTime(this.data.todayStats.totalTime)}`,
      path: '/pages/focus/focus'
    };
  }
});