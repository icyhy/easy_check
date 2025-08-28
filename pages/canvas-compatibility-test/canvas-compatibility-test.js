/**
 * Canvas API兼容性测试页面
 * 测试Canvas 2D API和传统Canvas API的降级兼容方案
 */
Page({
  data: {
    testResults: [],
    currentTest: '',
    isCanvas2D: false,
    canvasReady: false
  },

  onLoad() {
    console.log('[兼容性测试] 页面加载');
    this.initTests();
  },

  /**
   * 初始化测试
   */
  initTests() {
    console.log('[兼容性测试] 开始初始化测试');
    this.setData({
      currentTest: '正在初始化Canvas...',
      testResults: []
    });
    
    // 延迟执行，确保页面渲染完成
    setTimeout(() => {
      this.testCanvasCompatibility();
    }, 500);
  },

  /**
   * 测试Canvas兼容性
   */
  async testCanvasCompatibility() {
    const results = [];
    
    try {
      // 测试1: Canvas 2D API
      this.setData({ currentTest: '测试Canvas 2D API...' });
      const canvas2DResult = await this.testCanvas2D();
      results.push(canvas2DResult);
      
      // 测试2: 传统Canvas API
      this.setData({ currentTest: '测试传统Canvas API...' });
      const legacyResult = await this.testLegacyCanvas();
      results.push(legacyResult);
      
      // 测试3: 渲染器兼容性
      this.setData({ currentTest: '测试渲染器兼容性...' });
      const rendererResult = await this.testRendererCompatibility();
      results.push(rendererResult);
      
    } catch (error) {
      console.error('[兼容性测试] 测试过程中发生错误:', error);
      results.push({
        name: '测试异常',
        success: false,
        message: error.message,
        details: error.stack
      });
    }
    
    this.setData({
      testResults: results,
      currentTest: '测试完成'
    });
    
    console.log('[兼容性测试] 所有测试完成:', results);
  },

  /**
   * 测试Canvas 2D API
   */
  testCanvas2D() {
    return new Promise((resolve) => {
      console.log('[兼容性测试] 开始测试Canvas 2D API');
      
      try {
        const query = wx.createSelectorQuery();
        query.select('#test-canvas-2d')
          .fields({ node: true, size: true })
          .exec((res) => {
            console.log('[兼容性测试] Canvas 2D查询结果:', res);
            
            if (!res || !res[0] || !res[0].node) {
              resolve({
                name: 'Canvas 2D API',
                success: false,
                message: 'Canvas节点获取失败',
                details: 'SelectorQuery未返回有效的Canvas节点'
              });
              return;
            }
            
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              resolve({
                name: 'Canvas 2D API',
                success: false,
                message: '2D上下文获取失败',
                details: 'canvas.getContext("2d")返回null'
              });
              return;
            }
            
            // 测试基本绘制功能
            try {
              canvas.width = 300;
              canvas.height = 200;
              
              ctx.fillStyle = '#ff0000';
              ctx.fillRect(10, 10, 50, 50);
              
              ctx.strokeStyle = '#00ff00';
              ctx.strokeRect(70, 10, 50, 50);
              
              ctx.fillStyle = '#0000ff';
              ctx.font = '16px Arial';
              ctx.fillText('Canvas 2D', 10, 80);
              
              resolve({
                name: 'Canvas 2D API',
                success: true,
                message: 'Canvas 2D API工作正常',
                details: '成功创建2D上下文并完成基本绘制'
              });
              
            } catch (drawError) {
              resolve({
                name: 'Canvas 2D API',
                success: false,
                message: '绘制操作失败',
                details: drawError.message
              });
            }
          });
      } catch (error) {
        resolve({
          name: 'Canvas 2D API',
          success: false,
          message: '测试过程异常',
          details: error.message
        });
      }
    });
  },

  /**
   * 测试传统Canvas API
   */
  testLegacyCanvas() {
    return new Promise((resolve) => {
      console.log('[兼容性测试] 开始测试传统Canvas API');
      
      try {
        const ctx = wx.createCanvasContext('legacy-canvas', this);
        
        if (!ctx) {
          resolve({
            name: '传统Canvas API',
            success: false,
            message: '传统Canvas上下文创建失败',
            details: 'wx.createCanvasContext返回null'
          });
          return;
        }
        
        // 测试基本绘制功能
        try {
          ctx.setFillStyle('#ff0000');
          ctx.fillRect(10, 10, 50, 50);
          
          ctx.setStrokeStyle('#00ff00');
          ctx.strokeRect(70, 10, 50, 50);
          
          ctx.setFillStyle('#0000ff');
          ctx.setFontSize(16);
          ctx.fillText('Legacy Canvas', 10, 80);
          
          ctx.draw(false, () => {
            resolve({
              name: '传统Canvas API',
              success: true,
              message: '传统Canvas API工作正常',
              details: '成功创建传统上下文并完成基本绘制'
            });
          });
          
        } catch (drawError) {
          resolve({
            name: '传统Canvas API',
            success: false,
            message: '绘制操作失败',
            details: drawError.message
          });
        }
        
      } catch (error) {
        resolve({
          name: '传统Canvas API',
          success: false,
          message: '测试过程异常',
          details: error.message
        });
      }
    });
  },

  /**
   * 测试渲染器兼容性
   */
  async testRendererCompatibility() {
    console.log('[兼容性测试] 开始测试渲染器兼容性');
    
    try {
      const { CanvasCheckinRenderer } = require('../../utils/canvas-renderer');
      
      // 创建渲染器实例
      const renderer = new CanvasCheckinRenderer('test-canvas-2d', {
        width: 300,
        height: 200,
        dpr: wx.getSystemInfoSync().pixelRatio || 2
      });
      
      // 测试初始化
      await renderer.init();
      
      // 添加测试色块
      renderer.addColorBlock({
        id: 'test-block-1',
        x: 50,
        y: 50,
        width: 60,
        height: 40,
        color: '#ff6b6b',
        text: '测试',
        completed: false
      });
      
      // 测试渲染
      renderer.render();
      
      return {
        name: '渲染器兼容性',
        success: true,
        message: '渲染器兼容性测试通过',
        details: `使用${renderer.isCanvas2D ? 'Canvas 2D' : '传统Canvas'} API`
      };
      
    } catch (error) {
      return {
        name: '渲染器兼容性',
        success: false,
        message: '渲染器测试失败',
        details: error.message
      };
    }
  },

  /**
   * 重新运行测试
   */
  onRetestTap() {
    console.log('[兼容性测试] 重新运行测试');
    this.initTests();
  },

  /**
   * 清空测试结果
   */
  onClearTap() {
    console.log('[兼容性测试] 清空测试结果');
    this.setData({
      testResults: [],
      currentTest: '等待测试...'
    });
  }
});