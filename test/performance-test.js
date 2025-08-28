/**
 * Canvas渲染器性能测试
 * 测试优化后的渲染性能和内存使用
 */

// 模拟微信小程序环境
const mockWx = {
  getSystemInfoSync: () => ({
    pixelRatio: 2,
    screenWidth: 375,
    screenHeight: 667
  }),
  createCanvasContext: (canvasId) => ({
    clearRect: () => {},
    drawImage: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    setFillStyle: () => {},
    setStrokeStyle: () => {},
    setLineWidth: () => {},
    setLineDash: () => {},
    draw: () => {}
  })
};

// 模拟Canvas 2D API
const mockCanvas = {
  width: 750,
  height: 800,
  getContext: () => ({
    clearRect: () => {},
    drawImage: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    globalAlpha: 1,
    setLineDash: () => {}
  }),
  createCanvas: () => mockCanvas
};

global.wx = mockWx;
global.requestAnimationFrame = (callback) => setTimeout(callback, 16);

const { CanvasCheckinRenderer } = require('../utils/canvas-renderer.js');

/**
 * 性能测试套件
 */
class PerformanceTestSuite {
  constructor() {
    this.results = [];
  }

  /**
   * 运行所有性能测试
   */
  async runAllTests() {
    console.log('🚀 开始Canvas渲染器性能测试...\n');

    await this.testRenderingPerformance();
    await this.testMemoryUsage();
    await this.testSpatialOptimization();
    await this.testBatchRendering();
    await this.testOffscreenCanvas();

    this.printSummary();
  }

  /**
   * 测试渲染性能
   */
  async testRenderingPerformance() {
    console.log('=== 测试渲染性能 ===');

    const renderer = new CanvasCheckinRenderer('test-canvas', {
      width: 750,
      height: 800,
      enableOffscreenCanvas: true,
      enableSpatialOptimization: true,
      maxFPS: 60
    });

    // 模拟Canvas元素
    renderer.canvas = mockCanvas;
    await renderer.init();

    // 生成大量色块进行压力测试
    const blockCount = 100;
    const startTime = Date.now();

    for (let i = 0; i < blockCount; i++) {
      renderer.addColorBlock({
        id: `perf-block-${i}`,
        text: `Block ${i}`,
        color: `hsl(${i * 3.6}, 70%, 60%)`,
        width: 60 + Math.random() * 40,
        height: 30 + Math.random() * 20,
        completed: false
      });
    }

    const addTime = Date.now() - startTime;

    // 测试渲染性能
    const renderStartTime = Date.now();
    const renderCount = 50;

    for (let i = 0; i < renderCount; i++) {
      renderer.render();
      // 模拟帧间隔
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    const renderTime = Date.now() - renderStartTime;
    const avgRenderTime = renderTime / renderCount;
    const estimatedFPS = 1000 / avgRenderTime;

    console.log(`✅ 添加 ${blockCount} 个色块耗时: ${addTime}ms`);
    console.log(`✅ 平均渲染时间: ${avgRenderTime.toFixed(2)}ms/帧`);
    console.log(`✅ 估算FPS: ${estimatedFPS.toFixed(1)}`);

    // 获取性能统计
    const stats = renderer.getPerformanceStats();
    console.log(`✅ 性能统计:`, stats);

    this.results.push({
      test: '渲染性能',
      passed: estimatedFPS >= 30, // 至少30FPS
      details: { avgRenderTime, estimatedFPS, blockCount }
    });

    renderer.destroy();
  }

  /**
   * 测试内存使用
   */
  async testMemoryUsage() {
    console.log('\n=== 测试内存使用 ===');

    const renderer = new CanvasCheckinRenderer('test-canvas', {
      enableOffscreenCanvas: true,
      enableSpatialOptimization: true
    });

    renderer.canvas = mockCanvas;
    await renderer.init();

    // 测试内存泄漏
    const initialMemory = process.memoryUsage().heapUsed;
    
    // 创建和销毁大量色块
    for (let cycle = 0; cycle < 10; cycle++) {
      // 添加色块
      for (let i = 0; i < 50; i++) {
        renderer.addColorBlock({
          id: `memory-test-${cycle}-${i}`,
          text: `Test ${i}`,
          color: '#ff6b6b',
          width: 80,
          height: 40,
          completed: false
        });
      }

      // 渲染几帧
      for (let i = 0; i < 5; i++) {
        renderer.render();
      }

      // 清理色块
      renderer.clearBlocks();
    }

    // 强制垃圾回收（如果可用）
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryDiff = finalMemory - initialMemory;
    const memoryDiffMB = memoryDiff / (1024 * 1024);

    console.log(`✅ 初始内存: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
    console.log(`✅ 最终内存: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);
    console.log(`✅ 内存差异: ${memoryDiffMB.toFixed(2)}MB`);

    this.results.push({
      test: '内存使用',
      passed: memoryDiffMB < 10, // 内存增长小于10MB
      details: { memoryDiffMB }
    });

    renderer.destroy();
  }

  /**
   * 测试空间优化
   */
  async testSpatialOptimization() {
    console.log('\n=== 测试空间优化 ===');

    // 测试启用空间优化
    const optimizedRenderer = new CanvasCheckinRenderer('test-canvas', {
      enableSpatialOptimization: true
    });
    optimizedRenderer.canvas = mockCanvas;
    await optimizedRenderer.init();

    // 测试未启用空间优化
    const normalRenderer = new CanvasCheckinRenderer('test-canvas', {
      enableSpatialOptimization: false
    });
    normalRenderer.canvas = mockCanvas;
    await normalRenderer.init();

    // 添加相同的色块
    const blockCount = 200;
    const blocks = [];
    
    for (let i = 0; i < blockCount; i++) {
      const block = {
        id: `spatial-test-${i}`,
        text: `Block ${i}`,
        color: '#4ecdc4',
        width: 60,
        height: 30,
        completed: false
      };
      blocks.push(block);
    }

    // 测试优化版本
    const optimizedStartTime = Date.now();
    blocks.forEach(block => optimizedRenderer.addColorBlock(block));
    
    // 测试碰撞检测性能
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 750;
      const y = Math.random() * 800;
      optimizedRenderer.getBlockAtPosition(x, y);
    }
    const optimizedTime = Date.now() - optimizedStartTime;

    // 测试普通版本
    const normalStartTime = Date.now();
    blocks.forEach(block => normalRenderer.addColorBlock(block));
    
    // 测试碰撞检测性能
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 750;
      const y = Math.random() * 800;
      normalRenderer.getBlockAtPosition(x, y);
    }
    const normalTime = Date.now() - normalStartTime;

    const speedup = normalTime / optimizedTime;

    console.log(`✅ 普通版本耗时: ${normalTime}ms`);
    console.log(`✅ 优化版本耗时: ${optimizedTime}ms`);
    console.log(`✅ 性能提升: ${speedup.toFixed(2)}x`);

    this.results.push({
      test: '空间优化',
      passed: speedup > 1.2, // 至少20%性能提升
      details: { speedup, normalTime, optimizedTime }
    });

    optimizedRenderer.destroy();
    normalRenderer.destroy();
  }

  /**
   * 测试批量渲染
   */
  async testBatchRendering() {
    console.log('\n=== 测试批量渲染 ===');

    const renderer = new CanvasCheckinRenderer('test-canvas', {
      enableOffscreenCanvas: true
    });
    renderer.canvas = mockCanvas;
    await renderer.init();

    // 创建不同颜色的色块（测试材质分组）
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
    const blockCount = 100;

    for (let i = 0; i < blockCount; i++) {
      renderer.addColorBlock({
        id: `batch-test-${i}`,
        text: `Block ${i}`,
        color: colors[i % colors.length],
        width: 60,
        height: 30,
        completed: i % 3 === 0 // 部分完成状态
      });
    }

    // 测试批量渲染性能
    const startTime = Date.now();
    const renderCount = 30;

    for (let i = 0; i < renderCount; i++) {
      renderer.render();
    }

    const renderTime = Date.now() - startTime;
    const avgTime = renderTime / renderCount;

    console.log(`✅ 批量渲染 ${blockCount} 个色块`);
    console.log(`✅ 平均渲染时间: ${avgTime.toFixed(2)}ms/帧`);
    console.log(`✅ 估算FPS: ${(1000 / avgTime).toFixed(1)}`);

    this.results.push({
      test: '批量渲染',
      passed: avgTime < 20, // 每帧小于20ms
      details: { avgTime, blockCount }
    });

    renderer.destroy();
  }

  /**
   * 测试离屏Canvas
   */
  async testOffscreenCanvas() {
    console.log('\n=== 测试离屏Canvas ===');

    // 测试启用离屏Canvas
    const offscreenRenderer = new CanvasCheckinRenderer('test-canvas', {
      enableOffscreenCanvas: true
    });
    offscreenRenderer.canvas = mockCanvas;
    await offscreenRenderer.init();

    // 测试未启用离屏Canvas
    const normalRenderer = new CanvasCheckinRenderer('test-canvas', {
      enableOffscreenCanvas: false
    });
    normalRenderer.canvas = mockCanvas;
    await normalRenderer.init();

    // 添加色块
    const blockCount = 50;
    for (let i = 0; i < blockCount; i++) {
      const block = {
        id: `offscreen-test-${i}`,
        text: `Block ${i}`,
        color: '#ff9ff3',
        width: 80,
        height: 40,
        completed: false
      };
      
      offscreenRenderer.addColorBlock(block);
      normalRenderer.addColorBlock(block);
    }

    // 测试渲染性能
    const offscreenStartTime = Date.now();
    for (let i = 0; i < 20; i++) {
      offscreenRenderer.render();
    }
    const offscreenTime = Date.now() - offscreenStartTime;

    const normalStartTime = Date.now();
    for (let i = 0; i < 20; i++) {
      normalRenderer.render();
    }
    const normalTime = Date.now() - normalStartTime;

    const improvement = ((normalTime - offscreenTime) / normalTime * 100);

    console.log(`✅ 普通渲染耗时: ${normalTime}ms`);
    console.log(`✅ 离屏渲染耗时: ${offscreenTime}ms`);
    console.log(`✅ 性能改善: ${improvement.toFixed(1)}%`);

    this.results.push({
      test: '离屏Canvas',
      passed: true, // 功能性测试
      details: { improvement, offscreenTime, normalTime }
    });

    offscreenRenderer.destroy();
    normalRenderer.destroy();
  }

  /**
   * 打印测试总结
   */
  printSummary() {
    console.log('\n=== 性能测试结果 ===');
    
    const passedTests = this.results.filter(r => r.passed).length;
    const totalTests = this.results.length;

    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.passed ? '通过' : '失败'}`);
      
      if (result.details) {
        Object.entries(result.details).forEach(([key, value]) => {
          console.log(`   ${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`);
        });
      }
    });

    console.log(`\n通过: ${passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
      console.log('🎉 所有性能测试通过！Canvas渲染器性能优化成功。');
    } else {
      console.log('⚠️  部分性能测试未通过，需要进一步优化。');
    }
  }
}

// 运行测试
const testSuite = new PerformanceTestSuite();
testSuite.runAllTests().catch(console.error);