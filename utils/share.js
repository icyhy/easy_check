/**
 * 分享功能工具模块
 * 提供分享到微信好友、朋友圈等功能
 */

const util = require('./util.js');

/**
 * 分享管理器
 */
class ShareManager {
  constructor() {
    this.shareTemplates = {
      checkin: {
        title: '今日打卡完成！',
        path: '/pages/checkin/checkin',
        imageUrl: '/images/share-checkin.jpg'
      },
      stats: {
        title: '我的打卡统计',
        path: '/pages/stats/stats', 
        imageUrl: '/images/share-stats.jpg'
      },
      tasks: {
        title: '我的任务管理',
        path: '/pages/tasks/tasks',
        imageUrl: '/images/share-tasks.jpg'
      },
      focus: {
        title: '我的专注时光',
        path: '/pages/focus/focus',
        imageUrl: '/images/share-focus.jpg'
      }
    };
  }

  /**
   * 生成打卡分享内容
   * @param {Object} checkinData - 打卡数据
   * @returns {Object} 分享配置
   */
  generateCheckinShare(checkinData) {
    const { score, completedTasks, totalTasks } = checkinData;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const motivationalTexts = [
      '每一次打卡都是对自己的承诺！',
      '坚持就是胜利，今天又进步了一点！',
      '自律给我自由，打卡让我成长！',
      '小步快跑，日积月累见成效！',
      '今天的努力，是明天的收获！'
    ];
    
    const randomText = motivationalTexts[Math.floor(Math.random() * motivationalTexts.length)];
    
    return {
      title: `今日打卡${score}分，完成${completedTasks}个任务！${randomText}`,
      path: '/pages/checkin/checkin',
      imageUrl: '/images/share-checkin.jpg',
      query: `date=${util.formatDate(new Date())}`
    };
  }

  /**
   * 生成统计分享内容
   * @param {Object} statsData - 统计数据
   * @returns {Object} 分享配置
   */
  generateStatsShare(statsData) {
    const { checkedDays, completionRate, currentStreak, totalScore } = statsData;
    
    let shareText = '';
    if (currentStreak >= 30) {
      shareText = `坚持打卡${checkedDays}天，连续${currentStreak}天不间断！我是自律达人！`;
    } else if (currentStreak >= 7) {
      shareText = `已坚持${checkedDays}天，连续${currentStreak}天打卡！自律路上不孤单！`;
    } else {
      shareText = `打卡${checkedDays}天，完成率${completionRate}%，总分${totalScore}分！一起来打卡吧！`;
    }
    
    return {
      title: shareText,
      path: '/pages/stats/stats',
      imageUrl: '/images/share-stats.jpg'
    };
  }

  /**
   * 生成任务分享内容
   * @param {Array} tasks - 任务列表
   * @returns {Object} 分享配置
   */
  generateTasksShare(tasks) {
    const activeTasksCount = tasks.filter(task => task.isActive).length;
    const difficultyStats = this.calculateDifficultyStats(tasks);
    
    let shareText = `我制定了${activeTasksCount}个自律目标：`;
    if (difficultyStats.hard > 0) {
      shareText += `${difficultyStats.hard}个挑战级，`;
    }
    if (difficultyStats.medium > 0) {
      shareText += `${difficultyStats.medium}个进阶级，`;
    }
    if (difficultyStats.easy > 0) {
      shareText += `${difficultyStats.easy}个基础级，`;
    }
    shareText = shareText.replace(/，$/, '！一起来挑战自己吧！');
    
    return {
      title: shareText,
      path: '/pages/tasks/tasks',
      imageUrl: '/images/share-tasks.jpg'
    };
  }

  /**
   * 计算任务难度统计
   * @param {Array} tasks - 任务列表
   * @returns {Object} 难度统计
   */
  calculateDifficultyStats(tasks) {
    const stats = { easy: 0, medium: 0, hard: 0 };
    
    tasks.forEach(task => {
      if (task.isActive) {
        stats[task.difficulty] = (stats[task.difficulty] || 0) + 1;
      }
    });
    
    return stats;
  }

  /**
   * 生成成就分享内容
   * @param {Object} achievement - 成就数据
   * @returns {Object} 分享配置
   */
  generateAchievementShare(achievement) {
    const achievementTexts = {
      weekStreak: '连续打卡7天成就解锁！坚持的力量让我更强大！',
      monthStreak: '连续打卡30天成就解锁！我是自律大师！',
      perfectDay: '完美一天成就解锁！今天所有任务都完成了！',
      taskMaster: '任务大师成就解锁！已累计完成100个任务！',
      scoreKing: '分数之王成就解锁！单日得分突破100分！'
    };
    
    return {
      title: achievementTexts[achievement.id] || '新成就解锁！继续加油！',
      path: '/pages/stats/stats?tab=achievement',
      imageUrl: achievement.icon
    };
  }

  /**
   * 生成专注分享内容
   * @param {Object} focusData - 专注数据
   * @returns {Object} 分享配置
   */
  generateFocusShare(focusData) {
    const { todayStats, completedSession } = focusData;
    const totalMinutes = Math.floor(todayStats.totalTime / 60);
    
    const motivationalTexts = [
      '专注让时间更有价值！',
      '每一分专注都是成长的积累！',
      '专注是通往成功的必经之路！',
      '今天的专注，明天的收获！',
      '专注时光，收获满满！'
    ];
    
    const randomText = motivationalTexts[Math.floor(Math.random() * motivationalTexts.length)];
    
    return {
      title: `🎯 今日专注 ${totalMinutes} 分钟！${randomText}`,
      path: '/pages/focus/focus',
      imageUrl: '/images/share-focus.jpg',
      content: {
        totalTime: todayStats.totalTime,
        totalMinutes: totalMinutes,
        completedSessions: todayStats.completedSessions,
        motivationalText: randomText,
        sessionInfo: completedSession ? {
          project: completedSession.project.name,
          duration: Math.floor(completedSession.duration / 60)
        } : null
      }
    };
  }

  /**
   * 分享到微信好友
   * @param {string} type - 分享类型
   * @param {Object} data - 分享数据
   * @returns {Object} 分享配置
   */
  shareToFriend(type, data) {
    let shareConfig;
    
    switch (type) {
      case 'checkin':
        shareConfig = this.generateCheckinShare(data);
        break;
      case 'stats':
        shareConfig = this.generateStatsShare(data);
        break;
      case 'tasks':
        shareConfig = this.generateTasksShare(data);
        break;
      case 'achievement':
        shareConfig = this.generateAchievementShare(data);
        break;
      case 'focus':
        shareConfig = this.generateFocusShare(data);
        break;
      default:
        shareConfig = this.shareTemplates.checkin;
    }
    
    return shareConfig;
  }

  /**
   * 分享到朋友圈
   * @param {string} type - 分享类型
   * @param {Object} data - 分享数据
   * @returns {Object} 分享配置
   */
  shareToTimeline(type, data) {
    const shareConfig = this.shareToFriend(type, data);
    
    // 朋友圈分享需要添加更多激励性文字
    const timelineTexts = {
      checkin: '自律打卡，每天进步一点点！',
      stats: '坚持的路上，感谢有你们的陪伴！',
      tasks: '设定目标，勇敢追梦！',
      achievement: '又解锁新成就，继续努力！',
      focus: '专注时光，收获成长！'
    };
    
    return {
      ...shareConfig,
      title: `${shareConfig.title} ${timelineTexts[type] || ''}`,
      query: undefined // 朋友圈不支持query参数
    };
  }

  /**
   * 生成分享海报数据
   * @param {string} type - 分享类型
   * @param {Object} data - 分享数据
   * @returns {Object} 海报数据
   */
  generatePosterData(type, data) {
    const baseConfig = {
      width: 750,
      height: 1334,
      backgroundColor: '#667eea',
      elements: []
    };
    
    switch (type) {
      case 'checkin':
        return this.generateCheckinPoster(baseConfig, data);
      case 'stats':
        return this.generateStatsPoster(baseConfig, data);
      case 'tasks':
        return this.generateTasksPoster(baseConfig, data);
      default:
        return baseConfig;
    }
  }

  /**
   * 生成打卡海报
   * @param {Object} baseConfig - 基础配置
   * @param {Object} data - 打卡数据
   * @returns {Object} 海报配置
   */
  generateCheckinPoster(baseConfig, data) {
    const { score, completedTasks, totalTasks, date } = data;
    
    baseConfig.elements = [
      // 背景渐变
      {
        type: 'rect',
        x: 0,
        y: 0,
        width: 750,
        height: 1334,
        backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      },
      // 标题
      {
        type: 'text',
        text: '自律打卡',
        x: 375,
        y: 200,
        fontSize: 60,
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: 'bold'
      },
      // 日期
      {
        type: 'text',
        text: date,
        x: 375,
        y: 280,
        fontSize: 32,
        color: '#ffffff',
        textAlign: 'center',
        opacity: 0.8
      },
      // 分数圆环
      {
        type: 'circle',
        x: 375,
        y: 500,
        radius: 120,
        strokeColor: '#ffffff',
        strokeWidth: 8,
        fillColor: 'transparent'
      },
      // 分数文字
      {
        type: 'text',
        text: `${score}分`,
        x: 375,
        y: 500,
        fontSize: 48,
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: 'bold'
      },
      // 任务完成情况
      {
        type: 'text',
        text: `完成 ${completedTasks}/${totalTasks} 个任务`,
        x: 375,
        y: 700,
        fontSize: 36,
        color: '#ffffff',
        textAlign: 'center'
      },
      // 激励文字
      {
        type: 'text',
        text: '每一次打卡都是对自己的承诺',
        x: 375,
        y: 900,
        fontSize: 28,
        color: '#ffffff',
        textAlign: 'center',
        opacity: 0.9
      },
      // 小程序码占位
      {
        type: 'rect',
        x: 575,
        y: 1050,
        width: 120,
        height: 120,
        backgroundColor: '#ffffff',
        borderRadius: 10
      },
      // 扫码提示
      {
        type: 'text',
        text: '扫码加入打卡',
        x: 500,
        y: 1200,
        fontSize: 24,
        color: '#ffffff',
        textAlign: 'center'
      }
    ];
    
    return baseConfig;
  }

  /**
   * 生成统计海报
   * @param {Object} baseConfig - 基础配置
   * @param {Object} data - 统计数据
   * @returns {Object} 海报配置
   */
  generateStatsPoster(baseConfig, data) {
    const { checkedDays, completionRate, currentStreak, totalScore } = data;
    
    baseConfig.elements = [
      // 背景
      {
        type: 'rect',
        x: 0,
        y: 0,
        width: 750,
        height: 1334,
        backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      },
      // 标题
      {
        type: 'text',
        text: '我的打卡统计',
        x: 375,
        y: 200,
        fontSize: 60,
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: 'bold'
      },
      // 统计卡片背景
      {
        type: 'rect',
        x: 75,
        y: 350,
        width: 600,
        height: 400,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20
      },
      // 统计数据
      {
        type: 'text',
        text: `${checkedDays}`,
        x: 225,
        y: 500,
        fontSize: 48,
        color: '#333333',
        textAlign: 'center',
        fontWeight: 'bold'
      },
      {
        type: 'text',
        text: '打卡天数',
        x: 225,
        y: 540,
        fontSize: 24,
        color: '#666666',
        textAlign: 'center'
      },
      {
        type: 'text',
        text: `${completionRate}%`,
        x: 525,
        y: 500,
        fontSize: 48,
        color: '#333333',
        textAlign: 'center',
        fontWeight: 'bold'
      },
      {
        type: 'text',
        text: '完成率',
        x: 525,
        y: 540,
        fontSize: 24,
        color: '#666666',
        textAlign: 'center'
      },
      {
        type: 'text',
        text: `${currentStreak}`,
        x: 225,
        y: 650,
        fontSize: 48,
        color: '#333333',
        textAlign: 'center',
        fontWeight: 'bold'
      },
      {
        type: 'text',
        text: '连续天数',
        x: 225,
        y: 690,
        fontSize: 24,
        color: '#666666',
        textAlign: 'center'
      },
      {
        type: 'text',
        text: `${totalScore}`,
        x: 525,
        y: 650,
        fontSize: 48,
        color: '#333333',
        textAlign: 'center',
        fontWeight: 'bold'
      },
      {
        type: 'text',
        text: '总分数',
        x: 525,
        y: 690,
        fontSize: 24,
        color: '#666666',
        textAlign: 'center'
      }
    ];
    
    return baseConfig;
  }

  /**
   * 生成任务海报
   * @param {Object} baseConfig - 基础配置
   * @param {Object} data - 任务数据
   * @returns {Object} 海报配置
   */
  generateTasksPoster(baseConfig, data) {
    // 任务海报的具体实现
    return baseConfig;
  }

  /**
   * 保存分享记录
   * @param {string} type - 分享类型
   * @param {Object} data - 分享数据
   */
  saveShareRecord(type, data) {
    try {
      const shareRecords = wx.getStorageSync('shareRecords') || [];
      const record = {
        type,
        data,
        timestamp: Date.now(),
        date: util.formatDate(new Date())
      };
      
      shareRecords.unshift(record);
      
      // 只保留最近100条记录
      if (shareRecords.length > 100) {
        shareRecords.splice(100);
      }
      
      wx.setStorageSync('shareRecords', shareRecords);
    } catch (error) {
      console.error('保存分享记录失败:', error);
    }
  }

  /**
   * 获取分享记录
   * @param {number} limit - 限制数量
   * @returns {Array} 分享记录列表
   */
  getShareRecords(limit = 10) {
    try {
      const shareRecords = wx.getStorageSync('shareRecords') || [];
      return shareRecords.slice(0, limit);
    } catch (error) {
      console.error('获取分享记录失败:', error);
      return [];
    }
  }
}

// 创建ShareManager实例
const shareManager = new ShareManager();

// 导出ShareManager实例
module.exports = {
  ShareManager,
  shareManager
};