/**
 * 成就页面逻辑
 * 展示用户获得的成就和进度
 */

const app = getApp();
const util = require('../../utils/util.js');
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
    
    achievements: [], // 所有成就列表
    unlockedAchievements: [], // 已解锁成就
    lockedAchievements: [], // 未解锁成就
    totalAchievements: 0, // 总成就数
    unlockedCount: 0, // 已解锁数量
    completionRate: 0 // 完成率
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.initPage();
  },

  /**
   * 初始化页面
   */
  initPage() {
    this.getSystemInfo();
    this.loadAchievements();
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
      
      console.log('成就页面渲染模式:', isSkyline ? 'Skyline' : 'WebView');
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
      query.select('.achievements-container').node((res) => {
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
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadAchievements();
  },

  /**
   * 加载成就数据
   */
  loadAchievements() {
    try {
      // 获取成就数据
      const achievements = app.getAchievements() || [];
      const allAchievements = this.getAllAchievementDefinitions();
      
      // 合并成就定义和用户数据
      const mergedAchievements = allAchievements.map(definition => {
        const userAchievement = achievements.find(a => a.id === definition.id);
        const unlocked = userAchievement ? userAchievement.unlocked : false;
        const unlockedAt = userAchievement ? userAchievement.unlockedAt : null;
        return {
          ...definition,
          unlocked,
          unlockedAt,
          progress: userAchievement ? userAchievement.progress : 0,
          showUnlockTime: unlocked && unlockedAt
        };
      });
      
      // 分类成就
      const unlockedAchievements = mergedAchievements.filter(a => a.unlocked);
      const lockedAchievements = mergedAchievements.filter(a => !a.unlocked);
      
      // 计算统计数据
      const totalAchievements = mergedAchievements.length;
      const unlockedCount = unlockedAchievements.length;
      const completionRate = totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0;
      
      this.setData({
        achievements: mergedAchievements,
        unlockedAchievements,
        lockedAchievements,
        totalAchievements,
        unlockedCount,
        completionRate
      });
      
    } catch (error) {
      console.error('加载成就数据失败:', error);
      util.showToast('加载成就数据失败');
    }
  },

  /**
   * 获取所有成就定义
   */
  getAllAchievementDefinitions() {
    return [
      // 打卡成就
      {
        id: 'first_checkin',
        name: '初次打卡',
        description: '完成第一次打卡',
        icon: '🎉',
        category: 'checkin',
        difficulty: 'easy',
        target: 1,
        reward: 10
      },
      {
        id: 'checkin_7_days',
        name: '一周坚持',
        description: '累计打卡7天',
        icon: '📅',
        category: 'checkin',
        difficulty: 'medium',
        target: 7,
        reward: 50
      },
      {
        id: 'checkin_30_days',
        name: '月度达人',
        description: '累计打卡30天',
        icon: '🗓️',
        category: 'checkin',
        difficulty: 'hard',
        target: 30,
        reward: 200
      },
      {
        id: 'checkin_100_days',
        name: '百日坚持',
        description: '累计打卡100天',
        icon: '💯',
        category: 'checkin',
        difficulty: 'legendary',
        target: 100,
        reward: 500
      },
      
      // 连续成就
      {
        id: 'streak_3_days',
        name: '三日连击',
        description: '连续打卡3天',
        icon: '🔥',
        category: 'streak',
        difficulty: 'easy',
        target: 3,
        reward: 30
      },
      {
        id: 'streak_7_days',
        name: '一周连击',
        description: '连续打卡7天',
        icon: '🔥',
        category: 'streak',
        difficulty: 'medium',
        target: 7,
        reward: 100
      },
      {
        id: 'streak_30_days',
        name: '月度连击',
        description: '连续打卡30天',
        icon: '🔥',
        category: 'streak',
        difficulty: 'hard',
        target: 30,
        reward: 300
      },
      
      // 分数成就
      {
        id: 'score_100',
        name: '百分达成',
        description: '单日得分达到100分',
        icon: '⭐',
        category: 'score',
        difficulty: 'medium',
        target: 100,
        reward: 50
      },
      {
        id: 'score_1000_total',
        name: '千分里程',
        description: '累计得分达到1000分',
        icon: '🌟',
        category: 'score',
        difficulty: 'hard',
        target: 1000,
        reward: 200
      },
      
      // 任务成就
      {
        id: 'task_perfect_day',
        name: '完美一天',
        description: '单日完成所有任务',
        icon: '🎯',
        category: 'task',
        difficulty: 'medium',
        target: 1,
        reward: 100
      },
      {
        id: 'task_hard_master',
        name: '困难征服者',
        description: '完成10个困难任务',
        icon: '💪',
        category: 'task',
        difficulty: 'hard',
        target: 10,
        reward: 150
      },
      
      // 特殊成就
      {
        id: 'early_bird',
        name: '早起鸟儿',
        description: '在早上6点前完成打卡',
        icon: '🐦',
        category: 'special',
        difficulty: 'medium',
        target: 1,
        reward: 80
      },
      {
        id: 'night_owl',
        name: '夜猫子',
        description: '在晚上11点后完成打卡',
        icon: '🦉',
        category: 'special',
        difficulty: 'medium',
        target: 1,
        reward: 80
      }
    ];
  },



  /**
   * 查看成就详情
   */
  viewAchievementDetail(e) {
    const achievementId = e.currentTarget.dataset.id;
    const achievement = this.data.achievements.find(a => a.id === achievementId);
    
    if (!achievement) return;
    
    const progressPercent = achievement.target > 0 ? Math.min((achievement.progress / achievement.target) * 100, 100) : 0;
    
    wx.showModal({
      title: achievement.name,
      content: `${achievement.description}\n\n进度: ${achievement.progress}/${achievement.target} (${progressPercent.toFixed(1)}%)\n奖励: ${achievement.reward}分\n难度: ${this.getDifficultyText(achievement.difficulty)}`,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  /**
   * 获取难度文本
   */
  getDifficultyText(difficulty) {
    const difficultyMap = {
      'easy': '简单',
      'medium': '中等',
      'hard': '困难',
      'legendary': '传奇'
    };
    return difficultyMap[difficulty] || '未知';
  },

  /**
   * 分享成就
   */
  shareAchievements() {
    const { unlockedCount, totalAchievements, completionRate } = this.data;
    
    if (unlockedCount === 0) {
      util.showToast('还没有解锁任何成就哦');
      return;
    }
    
    const shareData = {
      unlockedCount,
      totalAchievements,
      completionRate,
      date: app.globalData.currentDate
    };
    
    // 显示分享选项
    wx.showActionSheet({
      itemList: ['分享给好友', '生成分享海报'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 分享给好友
          const shareConfig = shareManager.shareToFriend('achievements', shareData);
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
      const posterData = shareManager.generatePosterData('achievements', shareData);
      
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
    const { unlockedCount, totalAchievements, completionRate } = this.data;
    
    const shareData = {
      unlockedCount,
      totalAchievements,
      completionRate,
      date: app.globalData.currentDate
    };
    
    const shareConfig = shareManager.shareToFriend('achievements', shareData);
    
    // 保存分享记录
    shareManager.saveShareRecord('achievements', shareData);
    
    return shareConfig;
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    const { unlockedCount, totalAchievements, completionRate } = this.data;
    
    const shareData = {
      unlockedCount,
      totalAchievements,
      completionRate,
      date: app.globalData.currentDate
    };
    
    const shareConfig = shareManager.shareToTimeline('achievements', shareData);
    
    // 保存分享记录
    shareManager.saveShareRecord('achievements_timeline', shareData);
    
    return shareConfig;
  }
});