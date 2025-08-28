/**
 * 通用工具函数
 * 提供项目中常用的工具方法
 */

/**
 * 格式化时间
 * @param {Date} date - 日期对象
 * @param {string} format - 格式化模板
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(date, format = 'YYYY-MM-DD') {
  if (!date) {
    date = new Date();
  }
  
  if (typeof date === 'string' || typeof date === 'number') {
    date = new Date(date);
  }
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  
  const formatMap = {
    'YYYY': year,
    'MM': String(month).padStart(2, '0'),
    'DD': String(day).padStart(2, '0'),
    'HH': String(hour).padStart(2, '0'),
    'mm': String(minute).padStart(2, '0'),
    'ss': String(second).padStart(2, '0'),
    'M': month,
    'D': day,
    'H': hour,
    'm': minute,
    's': second
  };
  
  let result = format;
  Object.keys(formatMap).forEach(key => {
    result = result.replace(new RegExp(key, 'g'), formatMap[key]);
  });
  
  return result;
}

/**
 * 获取当前日期字符串
 * @param {string} format - 格式化模板
 * @returns {string} 日期字符串
 */
function getCurrentDate(format = 'YYYY-MM-DD') {
  return formatTime(new Date(), format);
}

/**
 * 获取星期几
 * @param {Date|string} date - 日期
 * @param {boolean} short - 是否返回简写
 * @returns {string} 星期几
 */
function getWeekDay(date, short = false) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  const weekDays = short 
    ? ['日', '一', '二', '三', '四', '五', '六']
    : ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  
  return weekDays[date.getDay()];
}

/**
 * 计算两个日期之间的天数差
 * @param {Date|string} date1 - 开始日期
 * @param {Date|string} date2 - 结束日期
 * @returns {number} 天数差
 */
function getDaysDiff(date1, date2) {
  if (typeof date1 === 'string') {
    date1 = new Date(date1);
  }
  if (typeof date2 === 'string') {
    date2 = new Date(date2);
  }
  
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/**
 * 生成唯一ID
 * @param {string} prefix - 前缀
 * @returns {string} 唯一ID
 */
function generateId(prefix = 'id') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * 深拷贝对象
 * @param {any} obj - 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
  
  return obj;
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(func, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(func, delay = 300) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      func.apply(this, args);
    }
  };
}

/**
 * 字符串哈希函数
 * @param {string} str - 输入字符串
 * @returns {number} 哈希值
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * 基于种子的随机数生成器
 * @param {number} seed - 随机种子
 * @returns {Function} 随机数生成函数
 */
function seededRandom(seed) {
  let currentSeed = seed;
  return function() {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
}

/**
 * 数组随机打乱
 * @param {Array} array - 要打乱的数组
 * @returns {Array} 打乱后的数组
 */
function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  };
  return result;
}

/**
 * 获取数组中的随机元素
 * @param {Array} array - 数组
 * @param {number} count - 获取数量
 * @returns {any|Array} 随机元素或元素数组
 */
function getRandomFromArray(array, count = 1) {
  if (count === 1) {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * 数字格式化
 * @param {number} num - 数字
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的数字字符串
 */
function formatNumber(num, decimals = 0) {
  if (isNaN(num)) {
    return '0';
  }
  
  return Number(num).toFixed(decimals);
}

/**
 * 百分比格式化
 * @param {number} value - 数值
 * @param {number} total - 总数
 * @param {number} decimals - 小数位数
 * @returns {string} 百分比字符串
 */
function formatPercentage(value, total, decimals = 0) {
  if (total === 0) {
    return '0%';
  }
  
  const percentage = (value / total) * 100;
  return `${formatNumber(percentage, decimals)}%`;
}

/**
 * 存储数据到本地
 * @param {string} key - 存储键
 * @param {any} data - 存储数据
 * @returns {boolean} 是否成功
 */
function setStorage(key, data) {
  try {
    wx.setStorageSync(key, data);
    return true;
  } catch (error) {
    console.error('存储数据失败:', error);
    return false;
  }
}

/**
 * 从本地获取数据
 * @param {string} key - 存储键
 * @param {any} defaultValue - 默认值
 * @returns {any} 存储的数据
 */
function getStorage(key, defaultValue = null) {
  try {
    const data = wx.getStorageSync(key);
    return data !== '' ? data : defaultValue;
  } catch (error) {
    console.error('获取数据失败:', error);
    return defaultValue;
  }
}

/**
 * 删除本地存储数据
 * @param {string} key - 存储键
 * @returns {boolean} 是否成功
 */
function removeStorage(key) {
  try {
    wx.removeStorageSync(key);
    return true;
  } catch (error) {
    console.error('删除数据失败:', error);
    return false;
  }
}

/**
 * 显示提示信息
 * @param {string} title - 提示标题
 * @param {string} icon - 图标类型
 * @param {number} duration - 显示时长
 */
function showToast(title, icon = 'none', duration = 2000) {
  wx.showToast({
    title,
    icon,
    duration
  });
}

/**
 * 显示加载提示
 * @param {string} title - 提示文字
 */
function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  });
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
  wx.hideLoading();
}

/**
 * 显示确认对话框
 * @param {string} content - 对话框内容
 * @param {string} title - 对话框标题
 * @returns {Promise<boolean>} 用户选择结果
 */
function showConfirm(content, title = '提示') {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm);
      },
      fail: () => {
        resolve(false);
      }
    });
  });
}

module.exports = {
  formatTime,
  getCurrentDate,
  getWeekDay,
  getDaysDiff,
  generateId,
  deepClone,
  debounce,
  throttle,
  hashCode,
  seededRandom,
  shuffleArray,
  getRandomFromArray,
  formatNumber,
  formatPercentage,
  setStorage,
  getStorage,
  removeStorage,
  showToast,
  showLoading,
  hideLoading,
  showConfirm
};