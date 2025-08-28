/**
 * 自律打卡页面 - 核心逻辑文件
 * 实现色块生成、消除、数据存储和交互功能
 */

const app = getApp();
const util = require('../../utils/util.js');
const { shareManager } = require('../../utils/share.js');
const RectangleCanvasRenderer = require('../../utils/rectangle-canvas-renderer.js');
const { getRandomQuote } = require('../../data/quotes.js');

Page({
  /**
   * 页面数据
   */
  data: {
    // 系统信息
    statusBarHeight: 0,
    navBarHeight: 88,
    
    // 渲染模式
    isSkyline: false,
    
    // 日期信息
    currentDate: '',
    
    // 今日名言
    todayQuote: null,
    
    // 任务相关数据
    todayTasks: [],
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
    
    // 打卡相关数据
    todayScore: 0,
    colorBlocks: [],
    allTasksCompleted: false,
    
    // 完成弹窗
    showCompletionModal: false,
    
    // 色块颜色配置
    blockColors: {
      easy: '#52c41a',    // 简单任务 - 绿色
      medium: '#1890ff',  // 中等任务 - 蓝色
      hard: '#f5222d'     // 困难任务 - 红色
    },
    
    // 任务分数配置
    taskScores: {
      easy: 10,
      medium: 20,
      hard: 30
    },
    
    // Canvas 相关
    canvasReady: false,
    canvasLoading: true,
    debugMode: false // 调试模式，生产环境关闭
  },
  
  // Canvas 渲染器实例
  canvasRenderer: null,
  
  // 双击检测相关
  lastTapTime: 0,
  tapTimeout: null,

  /**
   * 页面加载时执行
   */
  onLoad() {
    console.log('打卡页面加载');
    this.initPage();
  },

  /**
   * 页面显示时执行
   */
  onShow() {
    console.log('打卡页面显示');
    this.refreshData();
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    console.log('下拉刷新');
    this.refreshData();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  /**
   * 初始化页面
   */
  initPage() {
    console.log('开始初始化打卡页面');
    // 获取系统信息
    this.getSystemInfo();
    
    // 设置当前日期
    this.setCurrentDate();
    
    // 加载今日名言
    this.loadTodayQuote();
    
    // 加载任务数据
    this.loadTasks(); // loadTasks内部会调用initCheckinData
    
    // 初始化Canvas
    this.initCanvas();
  },

  /**
   * 刷新数据
   */
  refreshData() {
    this.setCurrentDate();
    this.loadTasks();
    this.initCheckinData();
  },

  /**
   * 初始化Canvas渲染器（矩形分割算法）
   */
  async initCanvas() {
    try {
      console.log('开始初始化矩形分割Canvas渲染器');
      this.setData({ canvasLoading: true });
      
      // 创建矩形分割渲染器
      this.canvasRenderer = new RectangleCanvasRenderer('checkinCanvas', {
        regionCount: this.data.todayTasks.length || 8, // 根据任务数量设置区域数
        disturbanceLevel: 0.12, // 扰动强度
        showNumbers: true, // 显示区域编号
        showBorders: true, // 显示边框
        borderColor: '#333',
        borderWidth: 2
      });
      
      console.log('矩形分割渲染器创建完成');
      
      // 初始化Canvas
      await this.canvasRenderer.initCanvas();
      console.log('Canvas初始化完成');
      
      // 设置随机背景名言
      const backgroundQuote = getRandomQuote();
      console.log('设置背景名言:', backgroundQuote);
      this.canvasRenderer.setBackgroundQuote(backgroundQuote);
      
      // 生成矩形分割区域
      const taskCount = this.data.todayTasks.length || 8;
      console.log('正在生成矩形分割区域，任务数量:', taskCount);
      this.canvasRenderer.generateRectangularRegions(taskCount);
      console.log('矩形分割区域生成完成');
      
      // 渲染区域
      this.canvasRenderer.renderRegions();
      
      this.setData({ 
        canvasReady: true,
        canvasLoading: false 
      });
      
    } catch (error) {
      console.error('Canvas初始化失败:', error);
      this.setData({ 
        canvasLoading: false,
        canvasReady: false 
      });
      
      // 显示错误提示
      wx.showToast({
        title: 'Canvas初始化失败',
        icon: 'error'
      });
    }
  },



  /**
   * 加载Canvas背景图片
   */
  async loadCanvasBackground() {
    if (!this.canvasRenderer || !this.data.todayQuote) return;
    
    try {
      console.log('加载Canvas背景图片:', this.data.todayQuote.image);
      await this.canvasRenderer.loadBackgroundImage(this.data.todayQuote.image);
      this.canvasRenderer.render();
      console.log('Canvas背景图片加载完成');
    } catch (error) {
      console.error('Canvas背景图片加载失败:', error);
    }
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
    
    console.log('渲染模式:', isSkyline ? 'Skyline' : 'WebView');
    }
  },

  /**
   * 检测当前渲染模式
   * @returns {boolean} true为Skyline模式，false为WebView模式
   */
  detectRenderingMode() {
    try {
      // 方法1：检查基础库版本
      const systemInfo = wx.getSystemInfoSync();
      const SDKVersion = systemInfo.SDKVersion;
      
      // 基础库版本 2.29.2 及以上支持 Skyline
      const versionParts = SDKVersion.split('.').map(Number);
      const supportsSkyline = (
        versionParts[0] > 2 || 
        (versionParts[0] === 2 && versionParts[1] > 29) ||
        (versionParts[0] === 2 && versionParts[1] === 29 && versionParts[2] >= 2)
      );
      
      // 方法2：特性检测（备用方案）
      if (supportsSkyline) {
        // 检查是否真正启用了 Skyline
        // 可以通过检查特定的 API 或行为来判断
        return true;
      }
      
      return false;
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
       query.select('.checkin-container').node((res) => {
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
   * 设置当前日期
   */
  setCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    this.setData({
      currentDate: `${month}月${day}日`
    });
    
    app.globalData.currentDate = dateStr;
  },

  /**
   * 加载今日名言
   */
  async loadTodayQuote() {
    try {
      const quotesData = require('../../data/quotes.js');
      const todayQuote = quotesData.getTodayQuote(app.globalData.currentDate);
      
      this.setData({
        todayQuote
      });
      
      console.log('今日名言加载成功:', todayQuote);
      
      // 如果Canvas已准备好，加载背景图片
      if (this.canvasRenderer && this.data.canvasReady) {
        await this.loadCanvasBackground();
      }
      
    } catch (error) {
      console.error('加载名言失败:', error);
      // 使用默认名言
      this.setData({
        todayQuote: {
          text: "每一个不曾起舞的日子，都是对生命的辜负。",
          author: "尼采",
          category: "生活"
        }
      });
    }
  },

  /**
   * 加载任务数据
   */
  loadTasks() {
    const tasks = app.globalData.tasks || [];
    console.log('加载任务数据，任务总数:', tasks.length);
    
    const todayTasks = tasks.map(task => ({
      ...task,
      completed: false,
      score: this.data.taskScores[task.difficulty] || 10,
      difficultyText: this.getDifficultyText(task.difficulty)
    }));
    
    console.log('处理后的今日任务:', todayTasks);
    
    this.setData({
      todayTasks,
      totalTasks: todayTasks.length
    });
    
    this.updateTaskStats();
    
    // 任务加载完成后，立即初始化打卡数据
    this.initCheckinData();
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
   * 初始化打卡数据
   */
  initCheckinData() {
    const currentDate = app.globalData.currentDate;
    const checkinData = app.getCheckinData(currentDate);
    
    if (checkinData) {
      // 加载已有的打卡数据
      this.loadExistingCheckinData(checkinData);
    } else {
      // 生成新的色块分割
      this.generateColorBlocks();
    }
  },

  /**
   * 加载已有的打卡数据
   * @param {object} checkinData - 打卡数据
   */
  loadExistingCheckinData(checkinData) {
    const { blocks, completedBlocks, score } = checkinData;
    
    // 更新任务完成状态
    const updatedTasks = this.data.todayTasks.map(task => {
      const isCompleted = completedBlocks.includes(task.id);
      return { ...task, completed: isCompleted };
    });
    
    // 更新色块状态
    const updatedBlocks = blocks.map(block => ({
      ...block,
      completed: completedBlocks.includes(block.taskId)
    }));
    
    this.setData({
      todayTasks: updatedTasks,
      colorBlocks: updatedBlocks,
      todayScore: score
    });
    
    this.updateTaskStats();
  },

  /**
   * 生成色块分割（矩形分割算法）
   */
  generateColorBlocks() {
    console.log('开始生成色块，当前任务数量:', this.data.todayTasks.length);
    const tasks = this.data.todayTasks;
    
    if (!this.canvasRenderer) {
      console.error('Canvas渲染器未初始化');
      return;
    }
    
    if (tasks.length === 0) {
      console.log('没有任务，无法生成色块');
      // 即使没有任务，也要清空色块数组
      this.canvasRenderer.clearBlocks();
      this.setData({
        colorBlocks: []
      });
      return;
    }
    
    try {
      console.log('开始生成矩形分割色块，任务数量:', tasks.length);
      
      // 设置任务数据到渲染器
      this.canvasRenderer.setTasks(tasks);
      
      // 使用矩形分割渲染器生成色块
      const taskCount = tasks.length;
      this.canvasRenderer.generateRectangularRegions(taskCount);
      
      // 渲染色块
      this.canvasRenderer.renderRegions();
      
      // 获取生成的色块数据
      const colorBlocks = this.canvasRenderer.getColorBlocks() || [];
      
      console.log('矩形分割色块生成完成，总数:', colorBlocks.length);
      this.setData({
        colorBlocks: colorBlocks
      });
      
    } catch (error) {
      console.error('生成色块失败:', error);
      wx.showToast({
        title: '生成色块失败',
        icon: 'error'
      });
    }
    
    // 保存色块数据
    this.saveCheckinData();
  },

  /**
   * 公开方法：重新生成色块（供其他页面调用）
   */
  regenerateBlocks() {
    console.log('重新生成色块');
    // 重新加载任务数据
    this.loadTasks();
    // 重新生成色块
    this.generateColorBlocks();
  },



  /**
   * 色块点击事件
   * @param {object} e - 事件对象
   */
  /**
   * Canvas触摸开始事件
   * @param {Object} e - 事件对象
   */
  onCanvasTouchStart(e) {
    if (!this.canvasRenderer || !this.data.canvasReady) return;
    
    const touch = e.touches[0];
    // 使用微信小程序的坐标系统，直接使用touch的x和y
    const x = touch.x;
    const y = touch.y;
    
    // 添加容器触摸效果
    this.setData({
      canvasTouching: true
    });
    
    console.log('Canvas触摸开始:', { x, y });
    
    // 传递给Canvas渲染器处理
    if (this.canvasRenderer.handleTouchStart) {
      this.canvasRenderer.handleTouchStart({
        touches: [{ x, y }],
        currentTarget: e.currentTarget
      });
    }
  },

  /**
   * Canvas触摸结束事件
   * @param {Object} e - 事件对象
   */
  onCanvasTouchEnd(e) {
    // 移除容器触摸效果
    this.setData({
      canvasTouching: false
    });
    
    console.log('Canvas触摸结束');
  },

  /**
   * Canvas点击事件
   * @param {Object} e - 事件对象
   */
  onCanvasTap(e) {
    if (!this.canvasRenderer || !this.data.canvasReady) return;
    
    const touch = e.detail || e.changedTouches[0];
    
    // 尝试获取Canvas节点信息来计算正确的坐标
    const query = wx.createSelectorQuery().in(this);
    query.select('#checkinCanvas').boundingClientRect((rect) => {
      let x, y;
      
      if (rect && rect.left !== undefined && rect.top !== undefined) {
        // 计算相对于Canvas的坐标
        const relativeX = touch.x - rect.left;
        const relativeY = touch.y - rect.top;
        
        // 将触摸坐标转换为Canvas逻辑坐标系统
        // Canvas渲染器使用的逻辑尺寸就是显示尺寸，不需要转换为750x800
        x = relativeX;
        y = relativeY;
        
        console.log('Canvas点击事件详情(坐标转换):', {
          原始坐标: { x: touch.x, y: touch.y },
          Canvas边界: rect,
          相对坐标: { x: relativeX, y: relativeY },
          逻辑坐标: { x, y },
          Canvas显示尺寸: { width: rect.width, height: rect.height }
        });
      } else {
          // 真机调试时的容错处理，直接使用触摸坐标
          x = touch.x;
          y = touch.y;
          
          console.log('Canvas点击事件详情(容错模式):', {
            原始坐标: { x: touch.x, y: touch.y },
            使用坐标: { x, y }
          });
      }
      
      // 双击检测逻辑
      const currentTime = Date.now();
      const timeDiff = currentTime - this.lastTapTime;
      
      if (timeDiff < 300) {
        // 双击事件
        console.log('检测到双击');
        if (this.tapTimeout) {
          clearTimeout(this.tapTimeout);
          this.tapTimeout = null;
        }
        this.handleCanvasDoubleTap(e, x, y);
      } else {
        // 单击事件，延迟执行以等待可能的双击
        this.tapTimeout = setTimeout(() => {
          this.handleCanvasSingleTap(e, x, y);
          this.tapTimeout = null;
        }, 300);
      }
      
      this.lastTapTime = currentTime;
    }).exec();
  },
  
  /**
   * Canvas单击事件处理
   * @param {Object} e - 事件对象
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   */
  handleCanvasSingleTap(e, x, y) {
    console.log('处理单击事件:', { x, y });
    // 单击暂时不做任何操作，保留给将来扩展
  },
  
  /**
   * Canvas双击事件处理
   * @param {Object} e - 事件对象
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   */
  handleCanvasDoubleTap(e, x, y) {
    console.log('处理双击事件:', { x, y });
    
    // 检测被点击的区域，现在返回区域索引
    const regionIndex = this.canvasRenderer.handleTouch({ x, y });
    
    if (regionIndex >= 0) {
      const region = this.canvasRenderer.regions[regionIndex];
      console.log('双击区域索引:', regionIndex, '区域ID:', region.id, '区域中心:', region.center);
      
      // 检查该区域是否已经被消除
      if (this.canvasRenderer.completedRegions.has(regionIndex)) {
        console.log('区域已被消除，忽略双击');
        return;
      }
      
      // 直接使用区域索引完成任务，不需要额外的ID转换
      this.showTaskConfirmDialog(regionIndex);
    } else {
      console.log('未找到对应区域，坐标:', { x, y });
    }
  },
  
  /**
   * Canvas长按事件
   * @param {Object} e - 事件对象
   */
  onCanvasLongTap(e) {
     if (!this.canvasRenderer || !this.data.canvasReady) return;
     
     const touch = e.detail || e.changedTouches[0];
     
     console.log('Canvas长按原始坐标:', { x: touch.x, y: touch.y });
     
     // 获取Canvas节点信息来计算正确的坐标
     const query = wx.createSelectorQuery().in(this);
     query.select('#checkinCanvas').boundingClientRect((rect) => {
       let x, y;
       
       if (rect && rect.left !== undefined && rect.top !== undefined) {
          // 计算相对于Canvas的坐标
          const relativeX = touch.x - rect.left;
          const relativeY = touch.y - rect.top;
          
          // 使用相对坐标作为逻辑坐标
          x = relativeX;
          y = relativeY;
          
          console.log('Canvas长按坐标转换:', {
            原始坐标: { x: touch.x, y: touch.y },
            Canvas边界: rect,
            相对坐标: { x: relativeX, y: relativeY },
            逻辑坐标: { x, y }
          });
        } else {
          // 真机调试时的容错处理
          x = touch.x;
          y = touch.y;
          
          console.log('Canvas长按坐标转换(容错模式):', {
            原始坐标: { x: touch.x, y: touch.y },
            逻辑坐标: { x, y }
          });
       }
       
       // 检测被点击的区域，现在返回区域索引
       const regionIndex = this.canvasRenderer.handleTouch({ x, y });
       
       if (regionIndex >= 0) {
         console.log('长按区域索引:', regionIndex);
         // 长按也弹出确认对话框
         this.showTaskConfirmDialog(regionIndex);
       } else {
         console.log('长按未找到对应区域，坐标:', { x, y });
       }
     }).exec();
   },
   
  /**
   * 显示任务确认对话框
   * @param {Object} region - 被点击的区域对象
   */
  showTaskConfirmDialog(regionIndex) {
    if (regionIndex < 0 || regionIndex >= this.data.todayTasks.length) return;
    
    const task = this.data.todayTasks[regionIndex];
    
    if (!task || task.completed) return;
    
    wx.showModal({
      title: '完成任务',
      content: `确定要完成任务「${task.name}」吗？\n完成后将获得 ${task.score} 分奖励。`,
      confirmText: '完成',
      cancelText: '取消',
      confirmColor: '#52c41a',
      success: (res) => {
        if (res.confirm) {
          console.log('用户确认完成任务:', task.name);
          this.completeRegionTask(regionIndex);
        } else {
          console.log('用户取消完成任务');
        }
      }
    });
  },

  /**
   * 完成区域任务
   * @param {number} regionIndex - 区域索引
   */
  completeRegionTask(regionIndex) {
    const task = this.data.todayTasks[regionIndex];
    
    if (!task || task.completed) return;
    
    console.log('完成区域任务:', task.name);
    
    // 播放音效
    this.playCompletionSound();
    
    // 更新任务状态
    const updatedTasks = [...this.data.todayTasks];
    updatedTasks[regionIndex].completed = true;
    
    // 更新得分
    const newScore = this.data.todayScore + task.score;
    
    this.setData({
      todayTasks: updatedTasks,
      todayScore: newScore
    });
    
    // 标记区域完成并重新渲染
    this.canvasRenderer.markRegionCompleted(regionIndex);
    this.canvasRenderer.renderRegions();
    
    // 更新统计数据
    this.updateTaskStats();
    
    // 保存数据
    this.saveCheckinData();
    
    // 检查是否全部完成
    this.checkAllTasksCompleted();
    
    // 显示完成提示
    if (this.canvasRenderer.isAllRegionsCompleted()) {
      wx.showToast({
        title: '背景图完全显露！',
        icon: 'success'
      });
    } else {
      wx.showToast({
        title: '任务完成！',
        icon: 'success'
      });
    }
  },
  
  /**
   * 处理所有任务完成
   */
  handleAllTasksCompleted() {
    console.log('所有任务已完成');
    this.checkAllTasksCompleted();
  },

  /**
   * 更新任务统计信息
   */
  updateTaskStats() {
    const completedCount = this.data.todayTasks.filter(task => task.completed).length;
    const totalCount = this.data.todayTasks.length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    this.setData({
      completedTasks: completedCount,
      completionRate,
      allTasksCompleted: completedCount === totalCount && totalCount > 0
    });
  },

  /**
   * 检查是否全部任务完成
   */
  checkAllTasksCompleted() {
    if (this.data.allTasksCompleted) {
      console.log('所有任务已完成！');
      setTimeout(() => {
        this.setData({
          showCompletionModal: true
        });
      }, 500);
    }
  },

  /**
   * 播放完成音效
   */
  playCompletionSound() {
    wx.vibrateShort({
      type: 'light'
    });
  },

  /**
   * 保存打卡数据
   */
  saveCheckinData() {
    const currentDate = app.globalData.currentDate;
    const completedBlocks = this.data.colorBlocks
      .filter(block => block.completed)
      .map(block => block.taskId);
    
    const checkinData = {
      blocks: this.data.colorBlocks,
      completedBlocks,
      score: this.data.todayScore,
      date: currentDate,
      timestamp: Date.now()
    };
    
    // 保存到全局数据和本地存储
    app.saveCheckinData(currentDate, checkinData);
    
    // 更新统计数据
    app.updateStatistics();
    
    // 检查成就
    const hasNewAchievement = app.checkAchievements();
    if (hasNewAchievement) {
      // 可以在这里显示成就解锁提示
      console.log('有新成就解锁！');
    }
    
    console.log('打卡数据已保存:', checkinData);
  },

  /**
   * 隐藏完成提示模态框
   */
  hideCompletionModal() {
    this.setData({
      showCompletionModal: false
    });
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 阻止事件冒泡
  },

  /**
   * 分享结果
   */
  shareResult() {
    console.log('分享打卡结果');
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    
    this.hideCompletionModal();
  },

  /**
   * 分享到微信好友
   */
  onShareAppMessage() {
    const { todayScore, colorBlocks } = this.data;
    const completedTasks = colorBlocks.filter(block => block.completed).length;
    const totalTasks = colorBlocks.length;
    
    const shareData = {
      score: todayScore,
      completedTasks,
      totalTasks,
      date: app.globalData.currentDate
    };
    
    const shareConfig = shareManager.shareToFriend('checkin', shareData);
    
    // 保存分享记录
    shareManager.saveShareRecord('checkin', shareData);
    
    return shareConfig;
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    const { todayScore, colorBlocks } = this.data;
    const completedTasks = colorBlocks.filter(block => block.completed).length;
    const totalTasks = colorBlocks.length;
    
    const shareData = {
      score: todayScore,
      completedTasks,
      totalTasks,
      date: app.globalData.currentDate
    };
    
    const shareConfig = shareManager.shareToTimeline('checkin', shareData);
    
    // 保存分享记录
    shareManager.saveShareRecord('checkin_timeline', shareData);
    
    return shareConfig;
  },

  /**
   * 分享打卡结果
   */
  shareCheckinResult() {
    const { todayScore, colorBlocks } = this.data;
    const completedTasks = colorBlocks.filter(block => block.completed).length;
    const totalTasks = colorBlocks.length;
    
    if (completedTasks === 0) {
      util.showToast('还没有完成任何任务哦');
      return;
    }
    
    const shareData = {
      score: todayScore,
      completedTasks,
      totalTasks,
      date: app.globalData.currentDate
    };
    
    // 显示分享选项
    wx.showActionSheet({
      itemList: ['分享给好友', '生成分享海报'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 分享给好友
          const shareConfig = shareManager.shareToFriend('checkin', shareData);
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
      const posterData = shareManager.generatePosterData('checkin', shareData);
      
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
   * 页面卸载
   */
  onUnload() {
    console.log('打卡页面卸载');
    
    // 清理定时器
    if (this.tapTimeout) {
      clearTimeout(this.tapTimeout);
      this.tapTimeout = null;
    }
    
    // 清理Canvas渲染器
    if (this.canvasRenderer) {
      if (this.canvasRenderer.destroy) {
        this.canvasRenderer.destroy();
      }
      this.canvasRenderer = null;
    }
    
    if (this.simpleRenderer) {
      if (this.simpleRenderer.destroy) {
        this.simpleRenderer.destroy();
      }
      this.simpleRenderer = null;
    }
  }
});