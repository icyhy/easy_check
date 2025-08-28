/**
 * 矩形分割Canvas渲染器
 * 专门用于微信小程序的递归二分法矩形分割算法
 * 基于rectangle-split-test.html中测试成功的算法
 */

class RectangleCanvasRenderer {
  constructor(canvasId, options = {}) {
    this.canvasId = canvasId;
    this.canvas = null;
    this.ctx = null;
    this.dpr = wx.getSystemInfoSync().pixelRatio || 1;
    
    // 默认配置
    this.options = {
      width: 750,
      height: 800,
      regionCount: 8,
      disturbanceLevel: 0.12,
      showNumbers: true,
      showBorders: true,
      borderColor: '#333',
      borderWidth: 2,
      ...options
    };
    
    // 状态管理
    this.regions = [];
    this.colorBlocks = [];
    this.selectedRegion = null;
    
    // 背景图相关状态
    this.backgroundQuote = null;
    this.backgroundImage = null;
    this.completedRegions = new Set(); // 记录已完成的区域ID
    
    console.log('[RectRenderer] 初始化矩形分割渲染器', {
      canvasId,
      dpr: this.dpr,
      options: this.options
    });
  }
  
  /**
   * 初始化Canvas
   */
  async initCanvas() {
    try {
      const query = wx.createSelectorQuery();
      
      return new Promise((resolve, reject) => {
        query.select(`#${this.canvasId}`)
          .fields({ node: true, size: true })
          .exec((res) => {
            if (!res[0]) {
              reject(new Error('Canvas节点未找到'));
              return;
            }
            
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            
            // 设置Canvas尺寸
            const { width, height } = res[0];
            canvas.width = width * this.dpr;
            canvas.height = height * this.dpr;
            ctx.scale(this.dpr, this.dpr);
            
            this.canvas = canvas;
            this.ctx = ctx;
            this.options.width = width;
            this.options.height = height;
            
            console.log('[RectRenderer] Canvas初始化成功', {
              width: canvas.width,
              height: canvas.height,
              dpr: this.dpr
            });
            
            resolve();
          });
      });
    } catch (error) {
      console.error('[RectRenderer] Canvas初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 递归二分法矩形分割算法
   * @param {Object} rect - 矩形区域 {x, y, width, height}
   * @param {number} targetCount - 目标分割数量
   * @returns {Array} 分割后的多边形数组
   */
  recursiveBinaryPartition(rect, targetCount) {
    if (targetCount <= 1) {
      // 确保顶点坐标精确到整数，避免浮点误差
      return [[
        { x: Math.round(rect.x), y: Math.round(rect.y) },
        { x: Math.round(rect.x + rect.width), y: Math.round(rect.y) },
        { x: Math.round(rect.x + rect.width), y: Math.round(rect.y + rect.height) },
        { x: Math.round(rect.x), y: Math.round(rect.y + rect.height) }
      ]];
    }
    
    // 计算分割比例，尽量均匀分配
    const leftCount = Math.ceil(targetCount / 2);
    const rightCount = targetCount - leftCount;
    
    // 决定分割方向（水平或垂直）
    const isHorizontal = rect.width > rect.height ? 
      Math.random() > 0.3 : Math.random() > 0.7;
    
    let leftRect, rightRect;
    
    if (isHorizontal) {
      // 水平分割
      const minSplit = rect.width * 0.3;
      const maxSplit = rect.width * 0.7;
      const splitPos = minSplit + Math.random() * (maxSplit - minSplit);
      
      // 确保分割位置为整数，避免缝隙
      const exactSplitPos = Math.round(splitPos);
      
      leftRect = {
        x: rect.x,
        y: rect.y,
        width: exactSplitPos,
        height: rect.height
      };
      
      rightRect = {
        x: rect.x + exactSplitPos,
        y: rect.y,
        width: rect.width - exactSplitPos,
        height: rect.height
      };
    } else {
      // 垂直分割
      const minSplit = rect.height * 0.3;
      const maxSplit = rect.height * 0.7;
      const splitPos = minSplit + Math.random() * (maxSplit - minSplit);
      
      // 确保分割位置为整数，避免缝隙
      const exactSplitPos = Math.round(splitPos);
      
      leftRect = {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: exactSplitPos
      };
      
      rightRect = {
        x: rect.x,
        y: rect.y + exactSplitPos,
        width: rect.width,
        height: rect.height - exactSplitPos
      };
    }
    
    // 递归分割
    const leftPolygons = this.recursiveBinaryPartition(leftRect, leftCount);
    const rightPolygons = this.recursiveBinaryPartition(rightRect, rightCount);
    
    return [...leftPolygons, ...rightPolygons];
  }
  
  /**
   * 对多边形进行受约束的随机扰动
   * @param {Array} polygon - 多边形顶点数组
   * @param {number} disturbanceLevel - 扰动强度 (0-1)
   * @param {Object} bounds - 边界约束 {x, y, width, height}
   * @returns {Array} 扰动后的多边形顶点
   */
  disturbPolygon(polygon, disturbanceLevel = 0.1, bounds) {
    if (polygon.length < 4) return polygon;
    
    const result = [];
    const tolerance = 0.5; // 边界检测容差
    
    // 根据DPR调整扰动强度
    const adjustedDisturbance = disturbanceLevel / Math.max(1, this.dpr * 0.5);
    
    for (let i = 0; i < polygon.length; i++) {
      const vertex = polygon[i];
      const nextVertex = polygon[(i + 1) % polygon.length];
      
      // 检查当前顶点是否在矩形边界上
      const isOnLeftBoundary = Math.abs(vertex.x - bounds.x) < tolerance;
      const isOnRightBoundary = Math.abs(vertex.x - (bounds.x + bounds.width)) < tolerance;
      const isOnTopBoundary = Math.abs(vertex.y - bounds.y) < tolerance;
      const isOnBottomBoundary = Math.abs(vertex.y - (bounds.y + bounds.height)) < tolerance;
      
      const isOnBoundary = isOnLeftBoundary || isOnRightBoundary || isOnTopBoundary || isOnBottomBoundary;
      
      let disturbedVertex;
      
      if (isOnBoundary) {
        // 边界顶点完全不扰动，确保精确贴合
        disturbedVertex = { 
          x: Math.round(vertex.x), 
          y: Math.round(vertex.y) 
        };
      } else {
        // 内部顶点可以进行有限扰动
        const edgeLength = Math.sqrt(
          Math.pow(nextVertex.x - vertex.x, 2) + 
          Math.pow(nextVertex.y - vertex.y, 2)
        );
        
        // 计算安全的扰动范围
        const maxDisturbance = Math.min(edgeLength * adjustedDisturbance, 8);
        
        // 计算到边界的最小距离
        const distToLeft = vertex.x - bounds.x;
        const distToRight = (bounds.x + bounds.width) - vertex.x;
        const distToTop = vertex.y - bounds.y;
        const distToBottom = (bounds.y + bounds.height) - vertex.y;
        
        const minDistToBoundary = Math.min(distToLeft, distToRight, distToTop, distToBottom);
        
        // 限制扰动范围，确保不会超出边界
        const safeDisturbance = Math.min(maxDisturbance * 0.3, minDistToBoundary - 2);
        
        let disturbanceX = 0;
        let disturbanceY = 0;
        
        if (safeDisturbance > 1) {
          disturbanceX = (Math.random() - 0.5) * safeDisturbance;
          disturbanceY = (Math.random() - 0.5) * safeDisturbance;
        }
        
        disturbedVertex = {
          x: Math.round(vertex.x + disturbanceX),
          y: Math.round(vertex.y + disturbanceY)
        };
        
        // 双重检查，确保扰动后的点仍在边界内
        disturbedVertex.x = Math.max(bounds.x + 1, Math.min(bounds.x + bounds.width - 1, disturbedVertex.x));
        disturbedVertex.y = Math.max(bounds.y + 1, Math.min(bounds.y + bounds.height - 1, disturbedVertex.y));
      }
      
      result.push(disturbedVertex);
      
      // 检查下一个顶点是否也在边界上
      const nextIsOnBoundary = (
        Math.abs(nextVertex.x - bounds.x) < tolerance || 
        Math.abs(nextVertex.x - (bounds.x + bounds.width)) < tolerance || 
        Math.abs(nextVertex.y - bounds.y) < tolerance || 
        Math.abs(nextVertex.y - (bounds.y + bounds.height)) < tolerance
      );
      
      // 只在内部边上添加额外顶点，且概率降低以避免过度复杂化
      if (!isOnBoundary && !nextIsOnBoundary && Math.random() > 0.8) {
        const edgeLength = Math.sqrt(
          Math.pow(nextVertex.x - vertex.x, 2) + 
          Math.pow(nextVertex.y - vertex.y, 2)
        );
        
        if (edgeLength > 60) {
          const midX = (disturbedVertex.x + nextVertex.x) / 2;
          const midY = (disturbedVertex.y + nextVertex.y) / 2;
          
          // 确保中点也在安全范围内
          const safeMidX = Math.max(bounds.x + 2, Math.min(bounds.x + bounds.width - 2, midX));
          const safeMidY = Math.max(bounds.y + 2, Math.min(bounds.y + bounds.height - 2, midY));
          
          result.push({
            x: Math.round(safeMidX),
            y: Math.round(safeMidY)
          });
        }
      }
    }
    
    return result;
  }
  
  /**
   * 计算多边形面积
   * @param {Array} polygon - 多边形顶点数组
   * @returns {number} 面积
   */
  calculatePolygonArea(polygon) {
    if (polygon.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      area += polygon[i].x * polygon[j].y;
      area -= polygon[j].x * polygon[i].y;
    }
    return Math.abs(area) / 2;
  }
  
  /**
   * 预设的不透明颜色数组
   */
  static PRESET_COLORS = [
    '#FF6B6B', // 红色
    '#4ECDC4', // 青色
    '#45B7D1', // 蓝色
    '#96CEB4', // 绿色
    '#FFEAA7', // 黄色
    '#DDA0DD', // 紫色
    '#98D8C8', // 薄荷绿
    '#F7DC6F', // 金黄色
    '#BB8FCE', // 淡紫色
    '#85C1E9', // 天蓝色
    '#F8C471', // 橙色
    '#82E0AA'  // 浅绿色
  ];

  /**
   * 从预设颜色中随机选择一个不透明颜色
   * @returns {string} 十六进制颜色字符串
   */
  getRandomColor() {
    const colors = RectangleCanvasRenderer.PRESET_COLORS;
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
  }
  
  /**
   * 绘制多边形
   * @param {Array} polygon - 多边形顶点
   * @param {string} fillColor - 填充颜色
   * @param {string} strokeColor - 边框颜色
   * @param {number} lineWidth - 线宽
   */
  drawPolygon(polygon, fillColor, strokeColor = '#333', lineWidth = 2) {
    if (polygon.length < 3) return;
    
    const ctx = this.ctx;
    
    ctx.beginPath();
    ctx.moveTo(polygon[0].x, polygon[0].y);
    
    for (let i = 1; i < polygon.length; i++) {
      ctx.lineTo(polygon[i].x, polygon[i].y);
    }
    
    ctx.closePath();
    
    // 填充
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    
    // 边框
    if (strokeColor && this.options.showBorders) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }
  
  /**
   * 生成矩形分割区域
   * @param {number} regionCount - 区域数量
   * @returns {Array} 分割区域数组
   */
  generateRectangularRegions(regionCount = null) {
    const count = regionCount || this.options.regionCount;
    
    console.log(`[RectRenderer] 开始生成 ${count} 个矩形分割区域`);
    
    // 计算分割区域（留出边距）
    const margin = 20;
    const baseRect = {
      x: margin,
      y: margin,
      width: this.options.width - margin * 2,
      height: this.options.height - margin * 2
    };
    
    // 使用递归二分法进行分割
    const polygons = this.recursiveBinaryPartition(baseRect, count);
    
    // 对多边形进行受约束的随机扰动
    const disturbedPolygons = polygons.map(polygon => 
      this.disturbPolygon(polygon, this.options.disturbanceLevel, baseRect)
    );
    
    // 生成最终的区域数据
    this.regions = disturbedPolygons.map((polygon, index) => {
      const area = this.calculatePolygonArea(polygon);
      const centerX = polygon.reduce((sum, v) => sum + v.x, 0) / polygon.length;
      const centerY = polygon.reduce((sum, v) => sum + v.y, 0) / polygon.length;
      
      return {
        id: index,
        polygon: polygon,
        area: area,
        center: { x: centerX, y: centerY },
        color: this.getRandomColor(),
        occupied: false
      };
    });
    
    console.log(`[RectRenderer] 成功生成 ${this.regions.length} 个分割区域`);
    return this.regions;
  }
  
  /**
   * 渲染所有区域
   */
  renderRegions() {
    if (!this.ctx) {
      console.warn('[RectRenderer] Canvas未初始化');
      return;
    }
    
    // 清空画布
    this.ctx.clearRect(0, 0, this.options.width, this.options.height);
    
    // 绘制背景图（如果存在）
    if (this.backgroundImage) {
      this.ctx.drawImage(this.backgroundImage, 0, 0);
    }
    
    // 绘制外边框
    const margin = 20;
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(margin, margin, this.options.width - margin * 2, this.options.height - margin * 2);
    
    // 绘制所有区域
    this.regions.forEach((region, index) => {
      // 获取对应的色块数据
      const colorBlock = this.colorBlocks[index];
      const isCompleted = colorBlock && colorBlock.completed;
      const isRegionCompleted = this.completedRegions.has(index);
      
      // 如果区域已完成（双击消除），则不绘制色块，显示背景图
      if (isRegionCompleted) {
        // 只绘制边框，不填充颜色，让背景图透过
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        const polygon = region.polygon;
        this.ctx.moveTo(polygon[0].x, polygon[0].y);
        for (let i = 1; i < polygon.length; i++) {
          this.ctx.lineTo(polygon[i].x, polygon[i].y);
        }
        this.ctx.closePath();
        this.ctx.stroke();
        return;
      }
      
      let fillColor = region.color;
      let strokeColor = this.options.borderColor;
      
      // 如果有任务数据，使用任务颜色
      if (colorBlock) {
        fillColor = colorBlock.color;
        
        // 任务完成时不使用半透明效果，保持原色
        if (isCompleted) {
          strokeColor = '#999';
        }
      }
      
      this.drawPolygon(
        region.polygon, 
        fillColor, 
        strokeColor, 
        this.options.borderWidth
      );
      
      // 绘制区域编号或任务名称（已完成的区域不显示）
      if (this.options.showNumbers && !isRegionCompleted) {
        this.ctx.fillStyle = isCompleted ? '#999' : '#333';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        
        const text = colorBlock ? (index + 1).toString() : (index + 1).toString();
        this.ctx.fillText(
          text, 
          region.center.x, 
          region.center.y + 5
        );
        
        // 如果任务已完成，绘制勾选标记
        if (isCompleted) {
          this.ctx.fillStyle = '#52c41a';
          this.ctx.font = 'bold 20px Arial';
          this.ctx.fillText(
            '✓', 
            region.center.x, 
            region.center.y - 15
          );
        }
      }
    });
  }
  
  /**
   * 检查点是否在多边形内部
   * @param {Object} point - 点坐标 {x, y}
   * @param {Array} polygon - 多边形顶点数组
   * @returns {boolean} 是否在多边形内
   */
  isPointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
          (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
        inside = !inside;
      }
    }
    return inside;
  }
  
  /**
   * 处理触摸事件，检测被触摸的区域
   * @param {Object} touchPoint - 触摸点坐标 {x, y}
   * @returns {number} 被选中区域的索引，未找到返回-1
   */
  handleTouch(touchPoint) {
    // 由于Canvas使用了DPR缩放，但触摸坐标是基于CSS像素的，
    // 这里不需要额外的坐标转换，因为区域生成时使用的是CSS像素坐标
    console.log(`[RectRenderer] 处理触摸事件，原始坐标:`, touchPoint);
    console.log(`[RectRenderer] Canvas尺寸: ${this.options.width}x${this.options.height}, DPR: ${this.dpr}`);
    console.log(`[RectRenderer] 当前区域数量: ${this.regions.length}`);
    
    for (let i = 0; i < this.regions.length; i++) {
      const region = this.regions[i];
      console.log(`[RectRenderer] 检测区域 ${region.id} (索引${i})，中心:`, region.center);
      console.log(`[RectRenderer] 区域多边形:`, region.polygon);
      
      if (this.isPointInPolygon(touchPoint, region.polygon)) {
        this.selectedRegion = region;
        console.log(`[RectRenderer] 选中区域 ${region.id} (索引${i})`);
        return i; // 返回区域索引而不是区域对象
      }
    }
    
    console.log(`[RectRenderer] 未找到匹配区域，触摸点:`, touchPoint);
    this.selectedRegion = null;
    return -1; // 返回-1表示未找到
  }
  
  /**
   * 清空画布
   */
  clearCanvas() {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.options.width, this.options.height);
    }
    this.regions = [];
    this.colorBlocks = [];
    this.selectedRegion = null;
  }
  
  /**
   * 获取色块数据（兼容打卡页面）
   */
  getColorBlocks() {
    return this.colorBlocks;
  }
  
  /**
   * 设置任务数据并生成对应的色块
   */
  setTasks(tasks) {
    this.colorBlocks = tasks.map((task, index) => ({
      id: `region_${index}`,
      taskId: task.id,
      taskName: task.name,
      regionIndex: index,
      color: this.getTaskColor(task.difficulty),
      completed: task.completed || false,
      score: task.score
    }));
  }
  
  /**
   * 根据任务难度获取颜色
   */
  getTaskColor(difficulty) {
    const colors = {
      easy: '#52c41a',    // 简单任务 - 绿色
      medium: '#1890ff',  // 中等任务 - 蓝色
      hard: '#f5222d'     // 困难任务 - 红色
    };
    return colors[difficulty] || '#666';
  }
  
  /**
   * 清空色块数据
   */
  clearBlocks() {
    this.colorBlocks = [];
    this.regions = [];
  }
  
  /**
   * 获取渲染统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const totalArea = this.regions.reduce((sum, region) => sum + region.area, 0);
    const avgArea = this.regions.length > 0 ? totalArea / this.regions.length : 0;
    
    return {
      regionCount: this.regions.length,
      totalArea: Math.round(totalArea),
      avgArea: Math.round(avgArea),
      occupiedRegions: this.regions.filter(r => r.occupied).length
    };
  }
  
  /**
   * 设置背景名言
   * @param {Object} quote - 名言对象 {text, author, category}
   */
  setBackgroundQuote(quote) {
    this.backgroundQuote = quote;
    this.generateBackgroundImage();
  }
  
  /**
   * 生成背景图
   * 在Canvas上绘制名言文字作为背景
   */
  generateBackgroundImage() {
    if (!this.ctx || !this.backgroundQuote) return;
    
    // 创建离屏Canvas用于生成背景图
    const offscreenCanvas = wx.createOffscreenCanvas({
      type: '2d',
      width: this.options.width,
      height: this.options.height
    });
    const offscreenCtx = offscreenCanvas.getContext('2d');
    
    // 设置背景色
    offscreenCtx.fillStyle = '#f8f9fa';
    offscreenCtx.fillRect(0, 0, this.options.width, this.options.height);
    
    // 绘制名言文字
    const margin = 40;
    const maxWidth = this.options.width - margin * 2;
    
    // 绘制名言内容
    offscreenCtx.fillStyle = '#666';
    offscreenCtx.font = 'bold 24px Arial';
    offscreenCtx.textAlign = 'center';
    
    const lines = this.wrapText(offscreenCtx, this.backgroundQuote.text, maxWidth, 30);
    const startY = this.options.height / 2 - (lines.length * 30) / 2;
    
    lines.forEach((line, index) => {
      offscreenCtx.fillText(
        line,
        this.options.width / 2,
        startY + index * 35
      );
    });
    
    // 绘制作者
    offscreenCtx.fillStyle = '#999';
    offscreenCtx.font = '18px Arial';
    offscreenCtx.fillText(
      `—— ${this.backgroundQuote.author}`,
      this.options.width / 2,
      startY + lines.length * 35 + 40
    );
    
    // 保存背景图
    this.backgroundImage = offscreenCanvas;
    
    console.log('[RectRenderer] 背景图生成完成', {
      quote: this.backgroundQuote.text,
      author: this.backgroundQuote.author
    });
  }
  
  /**
   * 文字换行处理
   * @param {CanvasRenderingContext2D} ctx - Canvas上下文
   * @param {string} text - 要换行的文字
   * @param {number} maxWidth - 最大宽度
   * @param {number} lineHeight - 行高
   * @returns {Array} 换行后的文字数组
   */
  wrapText(ctx, text, maxWidth, lineHeight) {
    const words = text.split('');
    const lines = [];
    let currentLine = '';
    
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && i > 0) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
    
    return lines;
  }
  
  /**
   * 标记区域为已完成
   * @param {number} regionIndex - 区域索引
   */
  markRegionCompleted(regionIndex) {
    this.completedRegions.add(regionIndex);
    console.log('[RectRenderer] 区域已完成', { regionIndex, completedCount: this.completedRegions.size });
  }
  
  /**
   * 检查是否所有区域都已完成
   * @returns {boolean} 是否全部完成
   */
  isAllRegionsCompleted() {
    return this.completedRegions.size === this.regions.length;
  }
}

module.exports = RectangleCanvasRenderer;