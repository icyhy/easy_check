# 微信小程序 Skyline 渲染引擎兼容性指南

## 概述

本文档详细记录了 Easy Check 小程序在适配 Skyline 渲染引擎过程中发现的兼容性问题及其解决方案。Skyline 是微信小程序的新一代渲染引擎，相比传统的 WebView 渲染模式，在性能和功能上有所提升，但也带来了一些兼容性挑战。

## 渲染模式检测

### 实现方案

所有页面都已集成渲染模式检测功能：

```javascript
/**
 * 检测当前渲染模式
 * @returns {boolean} true为Skyline模式，false为WebView模式
 */
detectRenderingMode() {
  try {
    // 方法1: 检查wx.getSystemInfoSync().renderer
    const systemInfo = wx.getSystemInfoSync();
    if (systemInfo.renderer) {
      return systemInfo.renderer === 'skyline';
    }
    
    // 方法2: 特性检测
    const testElement = wx.createSelectorQuery();
    if (testElement && typeof testElement.selectViewport === 'function') {
      return true; // 可能是Skyline
    }
    
    return false; // 默认WebView
  } catch (error) {
    console.warn('渲染模式检测失败，默认使用WebView模式:', error);
    return false;
  }
}
```

### 应用方式

每个页面的 `data` 中都包含 `isSkyline` 字段，用于在 WXML 和 WXSS 中进行条件渲染和样式控制。

## 主要兼容性问题及解决方案

### 1. CSS 属性兼容性

#### 1.1 `backdrop-filter` 属性

**问题**: Skyline 渲染引擎不支持 `backdrop-filter` 属性。

**影响页面**: tasks, stats, achievements, checkin

**解决方案**:
```css
/* 移除 backdrop-filter，使用替代方案 */
.skyline-mode .card {
  background: rgba(255, 255, 255, 0.95);
}

.webview-mode .card {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.8);
}
```

#### 1.2 `gap` 属性

**问题**: Skyline 渲染引擎不完全支持 Flexbox 的 `gap` 属性。

**影响页面**: tasks, stats, achievements

**解决方案**:
```css
/* 使用 margin 替代 gap */
.container {
  /* gap: 16rpx; 移除 */
}

.container .item {
  margin-right: 16rpx;
  margin-bottom: 16rpx;
}

.container .item:last-child {
  margin-right: 0;
}
```

#### 1.3 伪类选择器

**问题**: Skyline 不支持 `:active`、`:hover` 等伪类选择器。

**影响页面**: 所有页面的交互元素

**解决方案**:
```css
/* 移除伪类，使用 JavaScript 控制状态 */
/* .btn:active { transform: scale(0.95); } 移除 */

.btn.touching {
  transform: scale(0.95);
  transition: transform 0.1s ease;
}
```

```javascript
// 在 JavaScript 中处理触摸状态
onTouchStart(e) {
  const { target } = e.currentTarget.dataset;
  this.setData({
    [`${target}Touching`]: true
  });
},

onTouchEnd(e) {
  const { target } = e.currentTarget.dataset;
  this.setData({
    [`${target}Touching`]: false
  });
}
```

#### 1.4 `filter` 属性

**问题**: Skyline 对 CSS `filter` 属性支持有限。

**影响页面**: achievements

**解决方案**:
```css
/* 使用 opacity 替代 grayscale */
.skyline-mode .icon.disabled {
  opacity: 0.4;
}

.webview-mode .icon.disabled {
  filter: grayscale(100%);
}
```

### 2. 动画和过渡优化

#### 2.1 动画性能优化

**解决方案**:
```css
/* 为不同渲染模式设置不同的动画时长 */
.skyline-mode .animated-element {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.webview-mode .animated-element {
  transition: all 0.3s ease;
}

/* 强制硬件加速 */
.animated-element {
  will-change: transform, opacity;
  transform: translateZ(0);
}
```

#### 2.2 触摸反馈优化

**解决方案**:
```css
/* 移除默认的触摸高亮 */
.interactive-element {
  -webkit-tap-highlight-color: transparent;
  tap-highlight-color: transparent;
}

/* 使用自定义触摸反馈 */
.interactive-element.touching {
  transform: scale(0.98);
  opacity: 0.8;
}
```

### 3. 布局兼容性

#### 3.1 Flexbox 兼容性

**问题**: Skyline 对某些 Flexbox 属性的支持与 WebView 有差异。

**解决方案**:
```css
/* 确保 Flexbox 属性的兼容性 */
.flex-container {
  display: flex;
  /* 明确指定 flex-direction */
  flex-direction: row;
  /* 使用具体的对齐方式 */
  align-items: center;
  justify-content: space-between;
}
```

#### 3.2 定位和层级

**解决方案**:
```css
/* 确保 z-index 的正确应用 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  /* 明确指定背景色 */
  background-color: rgba(0, 0, 0, 0.6);
}
```

## 页面特定的兼容性处理

### Tasks 页面

- ✅ 移除了 `backdrop-filter` 属性
- ✅ 将 `gap` 属性替换为 `margin`
- ✅ 移除了 `:active` 伪类，使用 JavaScript 控制触摸状态
- ✅ 添加了渲染模式检测和条件样式

### Stats 页面

- ✅ 优化了图表容器的背景处理
- ✅ 修复了日历组件的布局问题
- ✅ 调整了动画时长以适配不同渲染模式

### Achievements 页面

- ✅ 将 `filter: grayscale` 替换为 `opacity`
- ✅ 优化了成就卡片的布局和间距
- ✅ 修复了分享按钮的交互反馈

### Checkin 页面

- ✅ 优化了色块消除动画
- ✅ 修复了背景图片显示问题
- ✅ 改进了触摸反馈机制

### Profile 和 Statistics 页面

- ✅ 添加了基础的渲染模式检测
- ✅ 为后续功能开发预留了兼容性框架

## 测试建议

### 1. 功能测试

- [ ] 在支持 Skyline 的微信版本中测试所有页面
- [ ] 验证渲染模式检测是否正确工作
- [ ] 检查所有交互元素的触摸反馈
- [ ] 测试动画和过渡效果的流畅性

### 2. 性能测试

- [ ] 对比 Skyline 和 WebView 模式下的页面加载速度
- [ ] 测试长列表滚动性能
- [ ] 验证动画性能是否有提升

### 3. 兼容性测试

- [ ] 在不同版本的微信客户端中测试
- [ ] 验证在不支持 Skyline 的设备上的降级处理
- [ ] 测试样式在两种渲染模式下的一致性

## 最佳实践总结

### 1. 开发原则

- **渐进增强**: 以 WebView 为基础，为 Skyline 提供增强体验
- **优雅降级**: 确保在不支持 Skyline 的环境中正常工作
- **性能优先**: 充分利用 Skyline 的性能优势

### 2. 代码规范

- 所有页面都应包含渲染模式检测
- 使用条件样式处理兼容性差异
- 避免使用 Skyline 不支持的 CSS 属性
- 优化动画和过渡效果

### 3. 维护建议

- 定期更新兼容性测试
- 关注微信官方的 Skyline 更新
- 收集用户反馈，持续优化体验

## 相关资源

- [微信小程序 Skyline 渲染引擎官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/)
- [Skyline 兼容性说明](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/migration.html)
- [性能优化指南](https://developers.weixin.qq.com/miniprogram/dev/framework/performance/)

---

**更新日期**: 2025-01-16  
**版本**: v1.0  
**维护者**: 开发团队