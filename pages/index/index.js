//index.js
//获取应用实例
var util = require('../../utils/util.js');
var app = getApp();
var today = util.formatTime(new Date((new Date()).getTime()+(1000*60*60*24*7))).split(' ')[0];
var minday = util.formatTime(new Date()).split(' ')[0];
var maxday =  util.formatTime(new Date((new Date()).getTime()+(1000*60*60*24*62))).split(' ')[0];
var sliderWidth = 96; // 需要设置slider的宽度，用于计算中间位置
var page = 1;
var list = new Array();
var list1 = new Array();
var list2 = new Array();
var list3 = new Array();

Page({
  data: {
    all:'act',
    date:today,
    minday:today,
    maxday:maxday,
    tabs: ["全部", "车找人", "人找车","捎货"],
    activeIndex: 0,
    sliderOffset: 0,
    sliderLeft: 0,
    start:'',
    over:'',
    adList: [],
    images: {}
  },
  tabClick: function (e) {
        this.setData({
            sliderOffset: e.currentTarget.offsetLeft,
            activeIndex: e.currentTarget.id
        });
    },
  autoLoad:function(e){
    var $width = e.detail.width,    
      $height = e.detail.height,
      ratio = $width / $height;   
    var viewWidth = 750,           
      viewHeight = 750 / ratio;    
    var image = this.data.images;
    image[e.target.dataset.index] = {
      width: viewWidth,
      height: viewHeight
    }
    this.setData({
      images: image
    })
  },
  bindDateChange:function(e){
    this.setData({
      date:e.detail.value
    })
    this.getList(e.detail.value,this.data.start,this.data.over);
  },
  onShareAppMessage: function () {
    return {
      title: '同城拼车',
      path: 'pages/index/index'
    }
  },
  chooseStart: function () {
    var that = this;
    wx.chooseLocation({
      success: function (res) {
        that.setData({
          start: res.address
        })
        page = 1;
        that.getList(that.data.date, res.address, that.data.over);
      },
      fail: function () {
        that.setData({
          start: ''
        })
        that.getList(that.data.date, '', that.data.over);
        //util.modal('错误', '请检查是否开启手机定位');
      }
    })
  },
  chooseOver: function () {
    var that = this;
    wx.chooseLocation({
      success: function (res) {
        that.setData({
          over: res.address
        })
        that.getList(that.data.date, that.data.start,res.address);
      },
      fail: function () {
        that.setData({
          over: ''
        })
        that.getList(that.data.date, that.data.start,'');
        //util.modal('错误', '请检查是否开启手机定位');
      }
    })
  },
  getList:function(date='',start='',over=''){
    try {
      var start = ((start).split('市')[1]).replace(/([\u4e00-\u9fa5]+[县区]).+/, '$1');
    } catch (e) {
      var start = (start).split(/[县区]/)[0];
    }

    try {
      var over = ((over).split('市')[1]).replace(/([\u4e00-\u9fa5]+[县区]).+/, '$1');
    } catch (e) {
      var over = (over).split(/[县区]/)[0];
    }
    var that = this;
    util.req('info/lists',
      {start:start,over:over,date:date,page:page},
      function(data){
        if(page == 1){          
          list = new Array();
          list1 = new Array();
          list2 = new Array();
          list3 = new Array();
        }

        if (!data.next_page_url) {
          that.setData({ nomore: true });
        } 
        var surp = new Array('','空位','人');
        data.data.forEach(function(item){
          try{
            var start = ((item.departure).split('市')[1]).replace(/([\u4e00-\u9fa5]+[县区]).+/, '$1');
          }catch(e){
            var start = (item.departure).split(/[县区]/)[0];
          }

          try {
            var over = ((item.destination).split('市')[1]).replace(/([\u4e00-\u9fa5]+[县区]).+/, '$1');
          } catch (e) {
            var over = (item.destination).split(/[县区]/)[0];
          }
          var tm = util.getDateDiff(Date.parse(new Date(item.leave_time.replace(/-/g, '/'))));
          var time = item.leave_time;
          if (item.mode == '2') {
            tm = '天天拼';
            var time = item.leave_time.split(' ')[1];
            var day = new Date();
            var now = util.dateFtt('hh:mm:ss', new Date());
            if (time < now) {
              time = util.dateFtt('yyyy-MM-dd ', new Date(day.getTime() + 24 * 60 * 60 * 1000)) + time;
            } else {
              time = util.dateFtt('yyyy-MM-dd ', new Date()) + time;
            }
          }
          var obj = {
            start:start,
            over:over,
            type:that.data.tabs[item.type],
            tp:item.type,
            time: time,
            surplus:item.surplus+surp[item.type],
            see:item.see,
            gender:item.gender,
            avatarUrl:item.avatarUrl,
            goods:item.goods,
            mode:item.mode,
            url: '/pages/info/index?id=' + item.id,
            tm: tm
            };
            list.push(obj);
            if(item.type == 1){
              list1.push(obj);
            }else{
              list2.push(obj);
            }
            if (item.goods == 1) {
              list3.push(obj);
            }
        })

        that.setData({ list: list, list1: list1, list2: list2, list3: list3});
    })

  },
  onPullDownRefresh: function(){
    page = 1;
    this.getList(this.data.date,this.data.start,this.data.over);
    wx.stopPullDownRefresh();
  },
  onLoad: function () {
    var that = this;
    wx.getSystemInfo({
        success: function(res) {
            that.setData({
                sliderLeft: (res.windowWidth / that.data.tabs.length - sliderWidth) / 2,
                sliderOffset: res.windowWidth / that.data.tabs.length * that.data.activeIndex,
                windowHeight: res.windowHeight,
                windowWidth: res.windowWidth
            });
        }
    });

    wx.getLocation({
      success: function (res) { 
        var latitude = res.latitude
        var longitude = res.longitude       
        wx.request({
          url: 'https://api.map.baidu.com/geocoder/v2/?ak=zIOkoO8wWrWA22ObIHPNkCgtLZpkP5lE&location=' + latitude + ',' + longitude + '&output=json&pois=0',
          data: {},
          method: 'GET', 
          header: { 'Content-Type': 'application/json' },
          success: function(res){
            that.setData({
              start: res.data.result.formatted_address
            })
            that.getList(that.data.date, res.data.result.formatted_address);
          }
        })
      },
      fail:function(){
        that.setData({
          start: ''
        })
        that.getList(that.data.date, '');
        //util.modal('错误','请检查是否开启手机定位');
      }
    });

    util.req('banner',[],function(data){
      if(data.status){
        that.setData({ 'adList': data.data});
      }
    })
  },
  onReachBottom:function(){
    if(!this.data.nomore){
      page++;
      this.getList(this.data.date,this.data.start,this.data.over);
    }
  }
})
