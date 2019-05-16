//app.js
App({
  onLaunch: function () {
    wx.getSystemInfo({
      success: res => {
        this.statusBarHeight = res.statusBarHeight;
        this.useLength = 46;
      }
    });
  },
  statusBarHeight: 0,
  useLength: 0
});
