# Canvas 打卡区域重构设计方案

## 问题分析

### 当前问题
1. **定位精度问题**：使用DOM元素绝对定位，在不同设备上存在精度误差
2. **边界控制不准确**：色块可能溢出到容器外部（右侧漏出）
3. **性能问题**：大量DOM元素影响渲染性能
4. **交互体验**：消除后色块重新生成逻辑不完善

### 根本原因
- 当前使用 `style="left: {{item.x}}px; top: {{item.y}}px"` 进行定位
- 容器尺寸转换（750rpx/800rpx）存在精度损失
- 边界检测算法不够精确

## Canvas 方案设计

### 核心架构

```typescript
interface CanvasCheckinSystem {
  // Canvas 上下文
  canvasContext: CanvasRenderingContext2D;
  
  // 背景图片
  backgroundImage: HTMLImageElement;
  
  // 色块数据
  colorBlocks: ColorBlock[];
  
  // 蒙版区域
  maskRegions: MaskRegion[];
}

interface ColorBlock {
  id: string;
  taskId: string;
  taskName: string;
  // Canvas 坐标系统
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  score: number;
  completed: boolean;
  // 蒙版路径
  maskPath: Path2D;
}

interface MaskRegion {
  id: string;
  // 图片分割区域
  sourceRect: Rect;
  // Canvas 绘制区域
  targetRect: Rect;
  // 蒙版形状
  maskShape: 'rectangle' | 'circle' | 'polygon';
  // 路径数据
  path: Path2D;
}
```

### 实现层次

1. **底层：背景图片**
   - 使用 `drawImage()` 绘制完整背景
   - 支持图片缩放和居中显示

2. **中层：色块蒙版**
   - 使用 `Path2D` 创建精确的蒙版区域
   - 支持矩形、圆形、多边形等形状
   - 通过 `clip()` 实现图片区域分割

3. **上层：交互反馈**
   - 触摸检测使用 `isPointInPath()`
   - 动画效果通过 `requestAnimationFrame`
   - 消除效果使用渐变透明度

### 技术特性

#### TypeScript 类型安全
```typescript
class CanvasCheckinRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private blocks: Map<string, ColorBlock> = new Map();
  
  constructor(canvasId: string) {
    // 类型安全的初始化
  }
  
  public renderBackground(imageUrl: string): Promise<void> {
    // 异步图片加载
  }
  
  public addColorBlock(block: ColorBlock): void {
    // 添加色块到渲染队列
  }
  
  public handleTouch(x: number, y: number): ColorBlock | null {
    // 精确的触摸检测
  }
}
```

#### Skyline 渲染引擎优化
- 使用 `wx.createCanvasContext()` 创建上下文
- 避免使用不支持的 CSS 属性
- 优化绘制频率，减少重绘
- 使用 `wx.canvasToTempFilePath()` 进行截图分享

### 核心算法

#### 1. 图片区域分割算法
```typescript
function createMaskRegions(imageWidth: number, imageHeight: number, blockCount: number): MaskRegion[] {
  const regions: MaskRegion[] = [];
  const gridSize = Math.ceil(Math.sqrt(blockCount));
  
  for (let i = 0; i < blockCount; i++) {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    
    const region: MaskRegion = {
      id: `region_${i}`,
      sourceRect: {
        x: (col * imageWidth) / gridSize,
        y: (row * imageHeight) / gridSize,
        width: imageWidth / gridSize,
        height: imageHeight / gridSize
      },
      targetRect: {
        x: col * (imageWidth / gridSize),
        y: row * (imageHeight / gridSize),
        width: imageWidth / gridSize,
        height: imageHeight / gridSize
      },
      maskShape: 'rectangle',
      path: new Path2D()
    };
    
    // 创建矩形路径
    region.path.rect(
      region.targetRect.x,
      region.targetRect.y,
      region.targetRect.width,
      region.targetRect.height
    );
    
    regions.push(region);
  }
  
  return regions;
}
```

#### 2. 精确边界检测
```typescript
function generateSafePosition(
  canvasWidth: number, 
  canvasHeight: number, 
  blockWidth: number, 
  blockHeight: number,
  rotation: number
): { x: number; y: number } {
  // 计算旋转后的边界框
  const rotatedBounds = calculateRotatedBounds(blockWidth, blockHeight, rotation);
  
  // 确保完全在画布内
  const safeX = rotatedBounds.width / 2 + Math.random() * (canvasWidth - rotatedBounds.width);
  const safeY = rotatedBounds.height / 2 + Math.random() * (canvasHeight - rotatedBounds.height);
  
  return { x: safeX, y: safeY };
}
```

#### 3. 高性能触摸检测
```typescript
function detectTouchedBlock(x: number, y: number, blocks: ColorBlock[]): ColorBlock | null {
  // 从上到下检测（Z-index 顺序）
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    if (!block.completed && isPointInBlock(x, y, block)) {
      return block;
    }
  }
  return null;
}

function isPointInBlock(x: number, y: number, block: ColorBlock): boolean {
  // 考虑旋转的精确检测
  const centerX = block.x + block.width / 2;
  const centerY = block.y + block.height / 2;
  
  // 将点转换到色块的本地坐标系
  const cos = Math.cos(-block.rotation * Math.PI / 180);
  const sin = Math.sin(-block.rotation * Math.PI / 180);
  
  const localX = cos * (x - centerX) - sin * (y - centerY) + centerX;
  const localY = sin * (x - centerX) + cos * (y - centerY) + centerY;
  
  return localX >= block.x && localX <= block.x + block.width &&
         localY >= block.y && localY <= block.y + block.height;
}
```

### 实现步骤

1. **创建 Canvas 组件**
   - 替换现有的 WXML 结构
   - 实现 Canvas 初始化逻辑

2. **实现渲染系统**
   - 背景图片绘制
   - 色块蒙版绘制
   - 动画系统

3. **优化交互逻辑**
   - 触摸事件处理
   - 消除动画效果
   - 完成状态管理

4. **性能优化**
   - 减少重绘频率
   - 使用离屏 Canvas
   - 内存管理优化

### 预期效果

1. **精确定位**：色块完全在容器内，无溢出问题
2. **流畅交互**：60fps 的动画效果
3. **完美适配**：支持不同屏幕尺寸和 Skyline 渲染
4. **优秀性能**：减少 DOM 操作，提升渲染效率

### 兼容性考虑

- **微信小程序 Canvas 2D API**：使用新版 Canvas 2D 接口
- **Skyline 渲染引擎**：避免不支持的特性
- **设备适配**：支持不同 DPR 和屏幕尺寸
- **降级方案**：保留 DOM 方案作为备选