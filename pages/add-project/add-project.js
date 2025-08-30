Page({

  /**
   * 页面的初始数据
   */
  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
    projectName: '',
    totalTargetTime: 10000,
    dailyPlanOptions: ['不计划', '1小时', '2小时', '3小时', '4小时', '5小时', '6小时', '7小时', '8小时'],
    dailyPlanIndex: 0,
    icons: [
      '/images/book-icon.png',
      '/images/study-icon.png',
      '/images/run-icon.png',
      '/images/achievements-inactive.png',
      '/images/achievements-new.png',
      '/images/checkin-inactive.png',
      '/images/checkin-new.png',
      '/images/focus-inactive.png',
      '/images/focus-new.png',
      '/images/tasks-inactive.png',
      '/images/tasks-new.png'
    ],
    selectedIcon: '/images/book-icon.png',
    colors: [
      '#FFDDC1', '#FFABAB', '#FFC3A0', '#FF677D', '#D4A5A5', '#392F5B', '#8D86C9', '#2F3C7E', '#A7BED3',
      '#C8E9EE', '#79ADDC', '#FFC0AD', '#E0BBE4', '#957DAD', '#D291BC', '#FFC72C', '#DA2C38', '#007bff',
      '#6A0572', '#AB83A1', '#F7CAC9', '#F7786B', '#2F4858', '#86BBD8', '#33658A', '#F6AE2D', '#F26419'
    ],
    selectedColor: '#FFDDC1',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getSystemInfo();
    if (options.id) {
      // 编辑模式
      const projects = wx.getStorageSync('projects') || [];
      const projectToEdit = projects.find(p => p.id === options.id);
      if (projectToEdit) {
        const dailyPlanIndex = this.data.dailyPlanOptions.indexOf(projectToEdit.dailyPlan);
        this.setData({
          projectName: projectToEdit.name,
          totalTargetTime: projectToEdit.remainingHours,
          dailyPlanIndex: dailyPlanIndex >= 0 ? dailyPlanIndex : 0,
          selectedIcon: projectToEdit.icon,
          selectedColor: projectToEdit.color,
          editingProjectId: options.id
        });
      }
    }
  },

  /**
   * 获取系统信息
   */
  getSystemInfo() {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight;
    const navBarHeight = 44;
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
   * 项目名称输入
   */
  onProjectNameInput(e) {
    this.setData({
      projectName: e.detail.value
    });
  },

  /**
   * 总目标时间输入
   */
  onTotalTargetTimeInput(e) {
    this.setData({
      totalTargetTime: parseInt(e.detail.value) || 0
    });
  },

  /**
   * 每日计划选择
   */
  onDailyPlanChange(e) {
    this.setData({
      dailyPlanIndex: e.detail.value
    });
  },

  /**
   * 图标选择
   */
  onIconSelect(e) {
    this.setData({
      selectedIcon: e.currentTarget.dataset.icon
    });
  },

  /**
   * 颜色选择
   */
  onColorSelect(e) {
    this.setData({
      selectedColor: e.currentTarget.dataset.color
    });
  },

  /**
   * 取消添加项目
   */
  cancelAddProject() {
    wx.navigateBack();
  },

  /**
   * 保存项目
   */
  saveProject() {
    const { projectName, totalTargetTime, dailyPlanIndex, selectedIcon, selectedColor, editingProjectId } = this.data;
    
    if (!projectName.trim()) {
      wx.showToast({
        title: '请输入项目名称',
        icon: 'none'
      });
      return;
    }

    if (totalTargetTime <= 0) {
      wx.showToast({
        title: '请输入有效的目标时间',
        icon: 'none'
      });
      return;
    }

    const dailyPlan = this.data.dailyPlanOptions[dailyPlanIndex];
    let projects = wx.getStorageSync('projects') || [];
    
    if (editingProjectId) {
      // 编辑模式
      const projectIndex = projects.findIndex(p => p.id === editingProjectId);
      if (projectIndex >= 0) {
        projects[projectIndex] = {
          ...projects[projectIndex],
          name: projectName,
          remainingHours: totalTargetTime,
          dailyPlan: dailyPlan,
          icon: selectedIcon,
          color: selectedColor
        };
      }
    } else {
      // 新增模式
      const newProject = {
        id: Date.now().toString(),
        name: projectName,
        icon: selectedIcon,
        days: 0,
        remainingHours: totalTargetTime,
        color: selectedColor,
        dailyPlan: dailyPlan,
        createdAt: new Date().toISOString()
      };
      projects.push(newProject);
    }

    wx.setStorageSync('projects', projects);
    
    wx.showToast({
      title: editingProjectId ? '项目更新成功' : '项目添加成功',
      icon: 'success',
      duration: 1500
    });

    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})