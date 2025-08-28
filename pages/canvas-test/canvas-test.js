/**
 * Canvas测试页面 - 用于诊断微信小程序Canvas渲染问题
 */
Page({
  data: {
    canvasReady: false,
    testBlocks: [
      { id: 1, x: 100, y: 100, width: 80, height: 60, color: '#ff4d4f', text: '测试1' },
      { id: 2, x: 200, y: 150, width: 80, height: 60, color: '#52c41a', text: '测试2' },
      { id: 3, x: 300, y: 200, width: 80, height: 60, color: '#1890ff', text: '测试3' }
    ]
  },

  canvas: null,
  ctx: null,
  isCanvas2D: false,

  onLoad() {
    console.log('Canvas测试页面加载');
    this.initCanvas();
  },

  /**
   * 初始化Canvas
   */
  async initCanvas() {
    try {
      console.log('[Canvas测试] 开始初始化Canvas');
      
      // 获取系统信息
      const systemInfo = wx.getSystemInfoSync();
      console.log('[Canvas测试] 系统信息:', {
        platform: systemInfo.platform,
        version: systemInfo.version,
        SDKVersion: systemInfo.SDKVersion,
        pixelRatio: systemInfo.pixelRatio,
        screenWidth: systemInfo.screenWidth,
        screenHeight: systemInfo.screenHeight
      });
      
      // 尝试使用Canvas 2D API
      const query = wx.createSelectorQuery();
      
      query.select('#testCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          console.log('[Canvas测试] Canvas查询结果:', res);
          
          if (res && res[0] && res[0].node) {
            // Canvas 2D API
            console.log('[Canvas测试] 使用Canvas 2D API');
            const canvas = res[0].node;
            const canvasSize = res[0].size;
            
            console.log('[Canvas测试] Canvas节点信息:', {
              canvas: !!canvas,
              size: canvasSize,
              canvasWidth: canvas.width,
              canvasHeight: canvas.height
            });
            
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.isCanvas2D = true;
            
            console.log('[Canvas测试] 上下文获取结果:', {
              ctx: !!this.ctx,
              contextType: this.ctx ? typeof this.ctx : 'undefined'
            });
            
            // 设置Canvas尺寸
            const dpr = systemInfo.pixelRatio || 2;
            console.log('[Canvas测试] 设备像素比:', dpr);
            
            const logicalWidth = canvasSize.width;
            const logicalHeight = canvasSize.height;
            const physicalWidth = logicalWidth * dpr;
            const physicalHeight = logicalHeight * dpr;
            
            canvas.width = physicalWidth;
            canvas.height = physicalHeight;
            
            console.log('[Canvas测试] Canvas尺寸设置:', {
              logical: { width: logicalWidth, height: logicalHeight },
              physical: { width: physicalWidth, height: physicalHeight },
              actualCanvas: { width: canvas.width, height: canvas.height }
            });
            
            // 缩放上下文
            this.ctx.scale(dpr, dpr);
            console.log('[Canvas测试] 上下文缩放完成:', dpr);
            
            // 测试基本绘制能力
            this.testBasicDrawing();
            
            console.log('[Canvas测试] Canvas 2D初始化完成');
            this.setData({ canvasReady: true });
            this.drawTestBlocks();
          } else {
            // 降级到传统Canvas API
            console.log('[Canvas测试] 降级到传统Canvas API');
            this.ctx = wx.createCanvasContext('testCanvas');
            this.isCanvas2D = false;
            
            console.log('[Canvas测试] 传统Canvas初始化完成');
            this.setData({ canvasReady: true });
            this.drawTestBlocks();
          }
        });
    } catch (error) {
      console.error('Canvas初始化失败:', error);
    }
  },

  /**
   * 测试基本绘制能力
   */
  testBasicDrawing() {
    if (!this.ctx) {
      console.error('[Canvas测试] 上下文不存在，无法进行基本绘制测试');
      return;
    }

    try {
      console.log('[Canvas测试] 开始基本绘制测试');
      
      // 测试填充矩形
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(10, 10, 50, 30);
      console.log('[Canvas测试] 红色矩形绘制完成');
      
      // 测试描边矩形
      this.ctx.strokeStyle = '#00ff00';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(70, 10, 50, 30);
      console.log('[Canvas测试] 绿色边框矩形绘制完成');
      
      // 测试文字
      this.ctx.fillStyle = '#0000ff';
      this.ctx.font = '16px Arial';
      this.ctx.fillText('测试文字', 10, 60);
      console.log('[Canvas测试] 蓝色文字绘制完成');
      
      // 测试圆形
      this.ctx.beginPath();
      this.ctx.arc(150, 25, 20, 0, 2 * Math.PI);
      this.ctx.fillStyle = '#ffff00';
      this.ctx.fill();
      console.log('[Canvas测试] 黄色圆形绘制完成');
      
      console.log('[Canvas测试] 基本绘制测试完成');
    } catch (error) {
      console.error('[Canvas测试] 基本绘制测试失败:', error);
    }
  },

  /**
   * 绘制测试色块
   */
  drawTestBlocks() {
    if (!this.ctx) {
      console.error('[Canvas测试] Canvas上下文未初始化');
      return;
    }

    console.log('[Canvas测试] 开始绘制测试色块，色块数量:', this.data.testBlocks.length);
    
    try {
      // 清空画布
      if (this.isCanvas2D) {
        this.ctx.clearRect(0, 0, 750, 600);
        console.log('[Canvas测试] Canvas 2D 画布清空完成');
      } else {
        this.ctx.clearRect(0, 0, 750, 600);
        console.log('[Canvas测试] 传统Canvas 画布清空完成');
      }

      // 绘制背景
      this.ctx.fillStyle = '#f0f0f0';
      this.ctx.fillRect(0, 0, 750, 600);
      console.log('[Canvas测试] 背景绘制完成');
      
      // 绘制测试色块
      console.log('[Canvas测试] 开始绘制', this.data.testBlocks.length, '个测试色块');
      this.data.testBlocks.forEach((block, index) => {
        console.log(`[Canvas测试] 绘制色块 ${index + 1}:`, block);
        
        try {
          // 绘制色块背景
          this.ctx.fillStyle = block.color;
          this.ctx.fillRect(block.x, block.y, block.width, block.height);
          
          // 绘制边框
          this.ctx.strokeStyle = '#000000';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(block.x, block.y, block.width, block.height);
          
          // 绘制文字
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = '16px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(
            block.text,
            block.x + block.width / 2,
            block.y + block.height / 2
          );
          
          console.log(`[Canvas测试] 色块 ${index + 1} 绘制成功`);
        } catch (error) {
          console.error(`[Canvas测试] 色块 ${index + 1} 绘制失败:`, error);
        }
      });
      
      // 绘制调试信息
      this.ctx.fillStyle = '#333333';
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(`Canvas API: ${this.isCanvas2D ? 'Canvas 2D' : '传统Canvas'}`, 20, 20);
      this.ctx.fillText(`色块数量: ${this.data.testBlocks.length}`, 20, 40);
      this.ctx.fillText(`绘制时间: ${new Date().toLocaleTimeString()}`, 20, 60);
      
      // 提交绘制（传统Canvas API需要）
      if (!this.isCanvas2D && this.ctx.draw) {
        console.log('[Canvas测试] 调用draw()提交绘制');
        this.ctx.draw();
      }
      
      console.log('[Canvas测试] 测试色块绘制完成');
    } catch (error) {
      console.error('[Canvas测试] 绘制测试色块失败:', error);
    }
  },

  /**
   * Canvas点击事件
   */
  onCanvasTap(e) {
    console.log('Canvas点击事件:', e);
    
    const x = e.detail.x || e.x;
    const y = e.detail.y || e.y;
    
    console.log(`点击坐标: (${x}, ${y})`);
    
    // 检查点击的色块
    const clickedBlock = this.data.testBlocks.find(block => {
      return x >= block.x && x <= block.x + block.width &&
             y >= block.y && y <= block.y + block.height;
    });
    
    if (clickedBlock) {
      console.log('点击了色块:', clickedBlock);
      wx.showToast({
        title: `点击了${clickedBlock.text}`,
        icon: 'success'
      });
    } else {
      console.log('点击了空白区域');
    }
  },

  /**
   * 重新绘制
   */
  redraw() {
    console.log('重新绘制');
    this.drawTestBlocks();
  },

  /**
   * 添加随机色块
   */
  addRandomBlock() {
    const newBlock = {
      id: Date.now(),
      x: Math.random() * 600,
      y: Math.random() * 400 + 100,
      width: 60 + Math.random() * 40,
      height: 40 + Math.random() * 30,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      text: `随机${this.data.testBlocks.length + 1}`
    };
    
    this.setData({
      testBlocks: [...this.data.testBlocks, newBlock]
    });
    
    this.drawTestBlocks();
  },

  /**
   * 清空色块
   */
  clearBlocks() {
    this.setData({
      testBlocks: []
    });
    this.drawTestBlocks();
  }
});