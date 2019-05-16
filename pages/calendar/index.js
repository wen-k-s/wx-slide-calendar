// pages/calendar/index.js
import solarLunar from '../../modules/solarlunar/src/solarLunar';

const conf = {
  data: {
    prevCur: 1,
    swip_idx: 1,
    months: ['prev', 'cur', 'next'],  // 渲染时改变
    weeksCh: ['日', '一', '二', '三', '四', '五', '六']
  },
  onLoad() {
    
    conf.jumpToToday.call(this);
    
    wx.setNavigationBarTitle({
      title: `【滑动日历】 ${this.data.months[1].year || '--'} 年 ${this.data.months[1].month || '--'} 月`
    });
  },
  /**
   * 渲染日历 -- 逻辑层通过 Page 实例的 setData 方法传递数据到渲染层。
   * @param {number} year
   * @param {number} month
  */
  renderCalendar(swip_idx, { year, month, day, choosed, hasTodo, todoText }) {
    const days = conf.calculateDays.call(this, year, month);
    const { emptyGrids, lastEmptyGrids } = conf.calculateEmptyGrids.call(this, year, month);
    const narrow = days.length + (emptyGrids && emptyGrids.length)
      + (lastEmptyGrids && lastEmptyGrids.length) > 35 ? true : false;

    let cur = new Date();
    const idx = cur.getDate() - 1;
    cur = { year: cur.getFullYear(), month: cur.getMonth() + 1 };

    let flag = false;
    if (month === cur.month && year === cur.year) {
      days[idx].isCurDate = true;
      days[idx].choosed = true;
      flag = true;
    }
    if (emptyGrids) {
      const { year: prevYear, month: prevMonth } = conf.getPrevMonth.call(this, { year, month });
      
      emptyGrids.forEach(item => {      
        
        item.dayCn = this.getLunarDayCn(prevYear, prevMonth, item.day);
        
      });
    }
    days.forEach(item => {
      item.dayCn = this.getLunarDayCn(year, month, item.day);
    });
    if (lastEmptyGrids) {
      lastEmptyGrids.forEach(item => {
        const { year: nextYear, month: nextMonth } = conf.getNextMonth.call(this, { year, month });
        item.dayCn = this.getLunarDayCn(nextYear, nextMonth, item.day);
      });
    }

    this.setData({
      [`months[${swip_idx}]`]: {
        year,
        month,
        emptyGrids,
        lastEmptyGrids,
        days,
        narrow
      }
    });
    // 最后后恢复choosed
    flag ? days[idx].choosed = false : '';
  },
  
  /**
   * 跳转至今天
  */
  jumpToToday() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    conf.renderCalendar.call(this, 1, {year, month});
    conf.renderCalendar.call(this, 0, conf.getPrevMonth.call(this, { year, month }));
    conf.renderCalendar.call(this, 2, conf.getNextMonth.call(this, { year, month }));
  },
  /**
   * 获取上一月 --年月
   */
  getPrevMonth({ year, month }) {
    // let { year, month } = this.data.months[this.data.swip_idx];
    month = month - 1;
    if (month < 1) {
      year = year - 1;
      month = 12;
    }
    return { year, month };
  },
  /**
   * 获取下一月 --年月
   */
  getNextMonth({ year, month }) {
    // let { year, month } = this.data.months[this.data.swip_idx];
    month = month + 1;
    if (month > 12) {
      year = year + 1;
      month = 1;
    }
    return { year, month };
  },
  /**
   * 计算指定月份共多少天
   * @param {number} year 年份
   * @param {number} month  月份
   */
  getThisMonthDays(year, month) {
    if(month < 1) return;
    return new Date(year, month, 0).getDate();
  },
  /**
   * 计算指定月份第一天星期几
   * @param {number} year 年份
   * @param {number} month  月份
   */
  getFirstDayOfWeek(year, month) {
    // return new Date(Date.UTC(year, month - 1, 1)).getDay();
    return new Date(year, month - 1, 1).getDay();
    /*
    当new Date()传入的参数是年份、月份等数值参数(如：2017,1,22,00,21,50)时， Date构造函数会在后台调用Date.UTC(),即：

new Date(2017,1,22,00,21,50) 和 new Date(Date.UTC(2017,1,22,00,21,50)) 是等价的！
    */
  },
  /**
   * 计算指定日期星期几
   * @param {number} year 年份
   * @param {number} month  月份
   * @param {number} day 日
  */
  getDayOfWeek(year, month, day) {
    return new Date(year, month - 1, day).getDay();
    // 等价于 return new Date(Date.UTC(year, month - 1, date)).getDay();
  },
  /**
   * 计算当前月份前后两月应占的格子
   * @param {number} year 年份
   * @param {number} month 月份
  */
  calculateEmptyGrids(year, month) {
    const emptyGrids = conf.calculatePrevMonthGrids.call(this, year, month);
    const lastEmptyGrids  = conf.calculateNextMonthGrids.call(this, year, month);
    return { emptyGrids, lastEmptyGrids }
  },
  /**
   * 计算上月应占的格子
   * @param {number} year 年份
   * @param {number} month 月份
  */
  calculatePrevMonthGrids(year, month) {
    let emptyGrids = [];
    const prevMonthDays = conf.getThisMonthDays(year, month - 1);
    const firstDayOfWeek = conf.getFirstDayOfWeek(year, month);
    if (firstDayOfWeek > 0) {
      for (let i = prevMonthDays - firstDayOfWeek + 1; i <= prevMonthDays; i++) {
        emptyGrids.push({day: i});
      }
    } else {
      emptyGrids = null;
    }
    return emptyGrids;
  },
  /**
   * 计算下月应占的格子
   * @param {number} year 年份
   * @param {number} month 月份
  */
  calculateNextMonthGrids(year, month) {
    let lastEmptyGrids = [];
    const thisMonthDays = conf.getThisMonthDays(year, month);
    const lastDayWeek = conf.getDayOfWeek(year, month, thisMonthDays);
    if (+lastDayWeek !== 6) {
      const len = 7 - (lastDayWeek + 1);

      for (let i = 1; i <= len; i++) {
        lastEmptyGrids.push({day: i});
      }
    } else {
      lastEmptyGrids = null;
    }
    return lastEmptyGrids;
  },
  /**
   * 计算日期面板数据
   * @param {number} year 年份
   * @param {number} month 月份
  */
  calculateDays(year, month) {
    let days = [];

    const thisMonthDays = this.getThisMonthDays(year, month);

    for (let i = 1; i <= thisMonthDays; i++) {
      days.push({
        day: i,
        choosed: false
      });
    }
    return days;
  },
  /**
   * 日期点击事件
   * @param {object} e 事件对象
   */
  tapDayItem(e) {
    const idx = e.currentTarget.dataset.idx;
    const swip_idx = this.data.swip_idx
    const days = this.data.months[swip_idx].days;
    days[idx].choosed = true;
    this.setData({
      [`months[${swip_idx}].days`]: days
    });
    // console.log('当前点击日期：', days[idx]);
    // 渲染后choosed恢复
    days[idx].choosed = false;
  },
  /**
   * bind swiper滑动改变月份时触发
  */
  monthSwipeChanged(e) {
    const cur = e.detail.current;

    wx.setNavigationBarTitle({
      title: `【滑动日历】 ${this.data.months[cur].year || '--'} 年 ${this.data.months[cur].month || '--'} 月`
    });
    const prevCur = this.data.prevCur;
    this.setData({
      swip_idx: cur
    });
    let renPrev = false; // ren -- rendar
    let idx;        // 要重新渲染的滑块的idx
    let d = cur - prevCur;
    if (d === -1 || d === 2) {
      renPrev = true;
    }
    for (let i = 0; i < 3; i ++) {
      if (i !== cur && i !== prevCur) {
        idx = i;
        break;
      }
    }
    const { year, month } = this.data.months[cur];
    if(renPrev) {
      conf.renderCalendar.call(this, idx, conf.getPrevMonth.call(this, { year, month }));
    } else {
      conf.renderCalendar.call(this, idx, conf.getNextMonth.call(this, { year, month }));
    }

    this.data.prevCur = cur;  // 结束后preCur改变
  },

  /**
   * 获取农历数据
   * @param {number} year 年
   * @param {number} month 月
   * @param {number} day 日
  */
  getLunarDayCn(year, month, day) {
    let lunar = solarLunar.solar2lunar(year, month, day); // 输入的日子为公历
    if (lunar.isTerm) {
      return lunar.term;
    }
    return lunar.dayCn;
  },
  /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
  onPullDownRefresh: function () {
    wx.stopPullDownRefresh();
  },

  onShareAppMessage() {
    return {
      title: '滑动日历',
      desc: '还是新鲜的日历哟',
      path: 'pages/callendar/index'
    };
  }
};

Page(conf);
/*
prevCur: 1

prev: 0,
cur: 1,
next: 2,

左选：
0 1 2     (Used to represent months[2] , the same below)
2 0 1     change 2    0 - 1 = -1  
1 2 0     change 1    2 - 0 = 2
0 1 2     change 0    1 - 2 = -1
右选：
0 1 2     
1 2 0     change 0    2 - 1 = 1
2 0 1     change 1    0 - 2 = -2
0 1 2     change 2    1 - 0 = 1

cur and prevCur do not change
*/