/**
 * 本地存储管理模块
 * 统一管理小程序的本地存储操作
 */

const util = require('./util.js');

// 存储键名常量
const STORAGE_KEYS = {
  TASKS: 'tasks',                    // 任务列表
  CHECKIN_DATA: 'checkinData',      // 打卡数据
  USER_SETTINGS: 'userSettings',    // 用户设置
  STATISTICS: 'statistics',         // 统计数据
  ACHIEVEMENTS: 'achievements'      // 成就数据
};

/**
 * 存储管理类
 */
class StorageManager {
  constructor() {
    this.keys = STORAGE_KEYS;
  }

  /**
   * 保存数据到本地存储
   * @param {string} key - 存储键
   * @param {any} data - 存储数据
   * @returns {boolean} 是否成功
   */
  save(key, data) {
    try {
      const dataToSave = {
        data,
        timestamp: Date.now(),
        version: '1.0.0'
      };
      
      wx.setStorageSync(key, dataToSave);
      console.log(`数据保存成功: ${key}`);
      return true;
    } catch (error) {
      console.error(`数据保存失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 从本地存储获取数据
   * @param {string} key - 存储键
   * @param {any} defaultValue - 默认值
   * @returns {any} 存储的数据
   */
  load(key, defaultValue = null) {
    try {
      const storedData = wx.getStorageSync(key);
      
      if (!storedData) {
        return defaultValue;
      }
      
      // 兼容旧版本数据格式
      if (typeof storedData === 'object' && storedData.data !== undefined) {
        return storedData.data;
      }
      
      return storedData;
    } catch (error) {
      console.error(`数据加载失败: ${key}`, error);
      return defaultValue;
    }
  }

  /**
   * 删除存储数据
   * @param {string} key - 存储键
   * @returns {boolean} 是否成功
   */
  remove(key) {
    try {
      wx.removeStorageSync(key);
      console.log(`数据删除成功: ${key}`);
      return true;
    } catch (error) {
      console.error(`数据删除失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 清空所有存储数据
   * @returns {boolean} 是否成功
   */
  clear() {
    try {
      wx.clearStorageSync();
      console.log('所有数据清空成功');
      return true;
    } catch (error) {
      console.error('数据清空失败', error);
      return false;
    }
  }

  /**
   * 获取存储信息
   * @returns {object} 存储信息
   */
  getStorageInfo() {
    try {
      const info = wx.getStorageInfoSync();
      return {
        keys: info.keys,
        currentSize: info.currentSize,
        limitSize: info.limitSize
      };
    } catch (error) {
      console.error('获取存储信息失败', error);
      return null;
    }
  }

  // ==================== 任务相关存储 ====================

  /**
   * 保存任务列表
   * @param {Array} tasks - 任务列表
   * @returns {boolean} 是否成功
   */
  saveTasks(tasks) {
    return this.save(this.keys.TASKS, tasks);
  }

  /**
   * 加载任务列表
   * @returns {Array} 任务列表
   */
  loadTasks() {
    return this.load(this.keys.TASKS, []);
  }

  // ==================== 打卡数据相关存储 ====================

  /**
   * 保存打卡数据
   * @param {object} checkinData - 打卡数据
   * @returns {boolean} 是否成功
   */
  saveCheckinData(checkinData) {
    return this.save(this.keys.CHECKIN_DATA, checkinData);
  }

  /**
   * 加载打卡数据
   * @returns {object} 打卡数据
   */
  loadCheckinData() {
    return this.load(this.keys.CHECKIN_DATA, {});
  }

  /**
   * 保存单日打卡数据
   * @param {string} date - 日期 (YYYY-MM-DD)
   * @param {object} dayData - 当日数据
   * @returns {boolean} 是否成功
   */
  saveDayCheckinData(date, dayData) {
    const allData = this.loadCheckinData();
    allData[date] = {
      ...dayData,
      date,
      timestamp: Date.now()
    };
    return this.saveCheckinData(allData);
  }

  /**
   * 加载单日打卡数据
   * @param {string} date - 日期 (YYYY-MM-DD)
   * @returns {object|null} 当日数据
   */
  loadDayCheckinData(date) {
    const allData = this.loadCheckinData();
    return allData[date] || null;
  }

  // ==================== 用户设置相关存储 ====================

  /**
   * 保存用户设置
   * @param {object} settings - 用户设置
   * @returns {boolean} 是否成功
   */
  saveUserSettings(settings) {
    return this.save(this.keys.USER_SETTINGS, settings);
  }

  /**
   * 加载用户设置
   * @returns {object} 用户设置
   */
  loadUserSettings() {
    const defaultSettings = {
      soundEnabled: true,           // 音效开关
      vibrationEnabled: true,       // 震动开关
      notificationEnabled: true,    // 通知开关
      theme: 'auto',               // 主题设置
      language: 'zh-CN'            // 语言设置
    };
    
    return this.load(this.keys.USER_SETTINGS, defaultSettings);
  }

  // ==================== 统计数据相关存储 ====================

  /**
   * 保存统计数据
   * @param {object} statistics - 统计数据
   * @returns {boolean} 是否成功
   */
  saveStatistics(statistics) {
    return this.save(this.keys.STATISTICS, statistics);
  }

  /**
   * 加载统计数据
   * @returns {object} 统计数据
   */
  loadStatistics() {
    const defaultStats = {
      totalCheckinDays: 0,          // 总打卡天数
      continuousCheckinDays: 0,     // 连续打卡天数
      maxContinuousCheckinDays: 0,  // 最大连续打卡天数
      totalScore: 0,                // 总得分
      totalTasks: 0,                // 总任务数
      completedTasks: 0,            // 已完成任务数
      tasksByDifficulty: {          // 各难度任务统计
        easy: { total: 0, completed: 0 },
        medium: { total: 0, completed: 0 },
        hard: { total: 0, completed: 0 }
      },
      lastUpdateTime: Date.now()    // 最后更新时间
    };
    
    return this.load(this.keys.STATISTICS, defaultStats);
  }

  // ==================== 成就数据相关存储 ====================

  /**
   * 保存成就数据
   * @param {object} achievements - 成就数据
   * @returns {boolean} 是否成功
   */
  saveAchievements(achievements) {
    return this.save(this.keys.ACHIEVEMENTS, achievements);
  }

  /**
   * 加载成就数据
   * @returns {object} 成就数据
   */
  loadAchievements() {
    const defaultAchievements = {
      firstCheckin: false,          // 首次打卡
      weekStreak: false,           // 连续打卡7天
      monthStreak: false,          // 连续打卡30天
      perfectDay: false,           // 完美一天
      taskMaster: false,           // 任务大师
      scoreKing: false             // 分数之王
    };
    
    return this.load(this.keys.ACHIEVEMENTS, defaultAchievements);
  }

  // ==================== 数据迁移和备份 ====================

  /**
   * 导出所有数据
   * @returns {object} 所有数据
   */
  exportAllData() {
    return {
      tasks: this.loadTasks(),
      checkinData: this.loadCheckinData(),
      userSettings: this.loadUserSettings(),
      statistics: this.loadStatistics(),
      achievements: this.loadAchievements(),
      exportTime: Date.now(),
      version: '1.0.0'
    };
  }

  /**
   * 导入所有数据
   * @param {object} data - 要导入的数据
   * @returns {boolean} 是否成功
   */
  importAllData(data) {
    try {
      if (data.tasks) this.saveTasks(data.tasks);
      if (data.checkinData) this.saveCheckinData(data.checkinData);
      if (data.userSettings) this.saveUserSettings(data.userSettings);
      if (data.statistics) this.saveStatistics(data.statistics);
      if (data.achievements) this.saveAchievements(data.achievements);
      
      console.log('数据导入成功');
      return true;
    } catch (error) {
      console.error('数据导入失败', error);
      return false;
    }
  }

  /**
   * 数据备份
   * @returns {string} 备份数据的JSON字符串
   */
  backup() {
    try {
      const allData = this.exportAllData();
      return JSON.stringify(allData);
    } catch (error) {
      console.error('数据备份失败', error);
      return null;
    }
  }

  /**
   * 数据恢复
   * @param {string} backupData - 备份数据的JSON字符串
   * @returns {boolean} 是否成功
   */
  restore(backupData) {
    try {
      const data = JSON.parse(backupData);
      return this.importAllData(data);
    } catch (error) {
      console.error('数据恢复失败', error);
      return false;
    }
  }
}

// 创建单例实例
const storageManager = new StorageManager();

module.exports = {
  StorageManager,
  storageManager,
  STORAGE_KEYS
};