// pages/projects/projects.js
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
    startX: 0, // 记录触摸开始时的横坐标
    startY: 0, // 记录触摸开始时的纵坐标
    projects: [
      {
        id: 'book',
        name: '看书',
        icon: '/images/book-icon.png',
        days: 0,
        remainingHours: 10000,
        color: '#e0f7fa' // Light Cyan
      },
      {
        id: 'study',
        name: '学习',
        icon: '/images/study-icon.png',
        days: 0,
        remainingHours: 10000,
        color: '#e3f2fd' // Light Blue
      },
      {
        id: 'run',
        name: '跑起来',
        icon: '/images/run-icon.png',
        days: 0,
        remainingHours: 10000,
        color: '#fffde7' // Light Yellow
      }
    ]
  },

  /**
   * 加载项目列表
   */
  loadProjects() {
    const projects = wx.getStorageSync('projects') || [];
    this.setData({
      projects: projects
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.getSystemInfo();
    // 监听从add-project页面返回时传递的数据
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('projectAdded', (res) => {
      console.log('接收到项目列表:', res.projects);
      this.setData({
        projects: res.projects
      });
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadProjects();
  },

  /**
   * 获取系统信息
   */
  getSystemInfo() {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight;
    const navBarHeight = 44; // 小程序导航栏高度一般为44px
    this.setData({
      statusBarHeight,
      navBarHeight
    });
  },

  /**
   * 返回上一页
   */
  navigateBack() {
    wx.navigateBack();
  },

  /**
   * 跳转到添加项目页面
   */
  /**
   * 跳转到添加项目页面
   */
  navigateToAddProject() {
    wx.navigateTo({
      url: '/pages/add-project/add-project',
    })
  },

  /**
   * 编辑项目
   */
  /**
   * 编辑项目
   */
  editProject(e) {
    const projectId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/add-project/add-project?id=${projectId}`,
    })
  },

  /**
   * 触摸开始事件
   */
  touchStart(e) {
    this.setData({
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
    });
  },

  /**
   * 触摸移动事件
   */
  touchMove(e) {
    const { startX, startY, projects } = this.data;
    const touchMoveX = e.touches[0].clientX;
    const touchMoveY = e.touches[0].clientY;
    const angle = this.angle({
      X: startX,
      Y: startY
    }, {
      X: touchMoveX,
      Y: touchMoveY
    });

    projects.forEach((item, index) => {
      item.x = 0;
      // 滑动角度小于30度才执行
      if (Math.abs(angle) > 30) return;

      if (touchMoveX < startX) { // 左滑
        item.x = startX - touchMoveX > 80 ? -80 : startX - touchMoveX; // 限制最大滑动距离为80px
        item.showDelete = item.x === -80; // 根据滑动距离判断是否显示删除按钮
      } else { // 右滑
        item.x = 0;
        item.showDelete = false;
      }
    });

    this.setData({
      projects: projects
    });
  },

  /**
   * 触摸结束事件
   */
  touchEnd(e) {
    const { startX, projects } = this.data;
    const touchEndX = e.changedTouches[0].clientX;

    projects.forEach((item, index) => {
      if (touchEndX < startX && startX - touchEndX > 40) { // 滑动距离大于40px才显示删除按钮
        item.x = -80;
        item.showDelete = true; // 添加一个标志来控制删除按钮的显示
      } else {
        item.x = 0;
        item.showDelete = false;
      }
    });

    this.setData({
      projects: projects
    });
  },

  /**
   * 计算滑动角度
   */
  angle(start, end) {
    const _X = end.X - start.X;
    const _Y = end.Y - start.Y;
    return 360 * Math.atan2(_Y, _X) / (2 * Math.PI);
  },

  /**
   * 删除项目
   */
  deleteProject(e) {
    console.log('Event object e:', e);
    const projectId = e.currentTarget.dataset.id;
    let projects = wx.getStorageSync('projects') || [];
    console.log('尝试删除项目，项目ID:', projectId);
    let updatedProjects = projects.filter(p => p.id !== projectId);
    console.log('删除后的项目列表:', updatedProjects);
    wx.setStorageSync('projects', updatedProjects);
    this.setData({
      projects: updatedProjects
    });
    wx.showToast({
      title: '项目删除成功',
      icon: 'success',
      duration: 1500
    });
  }
})