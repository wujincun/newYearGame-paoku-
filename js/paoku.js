/**
 * Created by Administrator on 2016/12/5.
 */
/**
 * Created by Administrator on 2016/11/16.
 */

var paoku = {
    $score: $('#score'),
    $time: $('#time'),
    w: $(window).width(),
    h: $(window).height(),


    animationTimeGap:0,
    blockItemTop: 0,
    bgDistance: 0,//背景到start的位置
    runner: {},//人的集合
    houseList: [],
    blockList: [],//障碍物的数组集合
    /*bgSpeed: 4,  //和baseSpeed，给了一个初始值，可以在初始化时根据其他因素设置
    //要求速度变化，设置
    bgMidSpeed: 6,
    bgFastSpeed: 10,*/
    //可以通过speedFlag来判断是何速度，背景图片切换的时候作为判断边界
    frameCount: 0,//每一帧的计算
    circle: 0,//背景循环次数
    isInit: false,
    rafId: '',//动画的id
    flag: false,//标志是否跳起 true为跳起
    isUp: false,//是否向上跳
    score: 0,//分数
    scoreFlag: false,
    blockflag: true,
    lastTime : 0,

    blockS:0,

    init: function () {
        var _this = this;
        //加载完图片后render
        var imgs = [
            './img/1.png',
            './img/2.png',
            './img/3.png',
            './img/background.jpg',
            './img/bag.png',
            './img/block.png',
            './img/btnBackground.png',
            './img/child.png',
            './img/close.png',
            './img/couponClose.png',
            './img/cutTimeBackground.png',
            './img/failHeader.png',
            './img/house1.png',
            './img/house2.png',
            './img/house3.png',
            './img/house4.png',
            './img/popBackground.png',
            './img/runner.png',
            './img/successHeader.png'
        ];
        var num = imgs.length;
        for (var i = 0; i < num; i++) {
            var img = new Image();
            img.src = imgs[i];
            img.onload = function () {
                num--;
                if (num > 0) {
                    return;
                }
                _this.render()
            }
        }
        //requestAnimation兼容
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
        }
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = function (callback, element) {
                var currTime = Date.now();
                var timeToCall = Math.max(0, 16.7 - (currTime - lastTime));
                var id = window.setTimeout(function () {
                    callback(currTime + timeToCall);
                }, timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };
        }
        if (!window.cancelAnimationFrame) {
            window.cancelAnimationFrame = function (id) {
                clearTimeout(id);
            };
        }
    },
    render: function () {
        var _this = this;
        var w = this.w;
        var h = this.h;
        var canvas = document.getElementById('canvas');
        var ctx = canvas.getContext('2d');
        canvas.width = w;
        canvas.height = h;
        ctx.clearRect(0, 0, w, h);
        //画场景
        _this.renderBg(ctx);
        _this.renderBlock(ctx);
        _this.renderHouse(ctx);
        _this.renderRunner(ctx);

        if (!this.isInit) {
            this.renderListener(ctx);//3s开始倒计时
            this.isInit = true;
        }
    },
    renderBg: function (ctx) {
        var _this = this;
        _this.bg = new Image();
        _this.bg.src = './img/background.jpg';
        ctx.drawImage(_this.bg, 0, 0, _this.w, _this.h);
    },
    renderBlock: function (ctx) {
        var _this = this;
        var w = _this.w;
        var h = _this.h;
        _this.blockToBlockDistance = h * 350 / 1334;
        _this.endToBlockDistance = h * 480 / 1334;
        _this.startToEndDistance = h*(1334-370)/1334;
        var blockDistance = _this.endToBlockDistance;

        _this.baseBlockSpeed = _this.startToEndDistance/3000;//S:h*(1334-370)/1334;t=3000ms;1s60帧，则一帧的速度？？？
        _this.blockSizeRatio = _this.baseBlockSizeRatio =2/(3000*3);//这是比值，max是min的3倍，t=3000ms;
        //初始化的障碍物
        for (var i = 0; i < 3; i++) {
            _this.blockList[i] = {};
            _this.blockList[i].img = new Image();
            _this.blockList[i].img.src = './img/block.png';
            i == 0 && (_this.blockList[0].renderSize = [w * 0.5 * 0.2, w * 0.5 * 159 * 0.2/ 376]);
            i == 1 && (_this.blockList[1].renderSize = [w * 0.5 * 0.5, w * 0.5 * 159 * 0.5 / 376]);
            i == 2 && (_this.blockList[2].renderSize = [w * 0.5, w * 0.5 * 159 / 376]);
            _this.blockList[i].position = [(w - _this.blockList[i].renderSize[0]) / 2, blockDistance];
            ctx.drawImage(_this.blockList[i].img, _this.blockList[i].position[0], _this.blockList[i].position[1], _this.blockList[i].renderSize[0], _this.blockList[i].renderSize[1]);
            blockDistance += _this.blockToBlockDistance;
        }
    },
    renderHouse: function (ctx) {
        var _this = this;
        var w = _this.w;
        var h = _this.h;
        _this.houseToHouseDistance = h * 50 / 1334;
        _this.houseCurrentX = 0.3;
        _this.endToHouseDistance = h * 320 / 1334;
        var houseTop ,houseLeft;
        for (var i = 0; i < 8; i++) {
            _this.houseList[i] = {};
            _this.houseList[i].img = new Image();
            _this.houseList[i].sourceCutX = 0.3;
            //左边
            //var leftHouseRight = w * 32 / 750 + _this.houseList[0].renderSize[0];
            if (i == 0) {
                houseTop = _this.endToHouseDistance;
                houseLeft = w * 32 / 750;
                _this.houseList[i].img.src = './img/house1.png';
                _this.houseList[i].size = [w * 0.59, w * 0.41];//442*307
                _this.houseList[i].renderSize = [_this.houseList[0].size[0] * 0.6, _this.houseList[0].size[1] * 0.6];
                _this.houseList[i].position = [houseLeft, houseTop];//位置水平竖直都变，
            }
            if (i == 1) {
                houseTop = houseTop + _this.houseToHouseDistance + _this.houseList[0].renderSize[1];
                //ouseLeft =
                _this.houseList[i].img.src = './img/house3.png';//377*309
                _this.houseList[i].size = [w * 0.5, w * 0.412];
                _this.houseList[i].renderSize = [_this.houseList[i].size[0] * 0.8, _this.houseList[1].size[1] * 0.8];
                _this.houseList[i].position = [-_this.houseList[i].renderSize[0]*_this.houseList[i].sourceCutX*i*1.1,houseTop];//位置水平竖直都变，
            }
            if (i == 2) {
                houseTop = houseTop + _this.houseToHouseDistance + _this.houseList[1].renderSize[1];
                _this.houseList[i].img.src = './img/house1.png';
                _this.houseList[i].size = [w * 0.59, w * 0.41];//442*307
                _this.houseList[i].renderSize = [_this.houseList[i].size[0], _this.houseList[2].size[1]];
                _this.houseList[i].position = [-_this.houseList[i].renderSize[0]*_this.houseList[i].sourceCutX*i*1.2,houseTop];//位置水平竖直都变，
            }
            if (i == 3) {
                houseTop = houseTop + _this.houseToHouseDistance + _this.houseList[2].renderSize[1];
                _this.houseList[i].img.src = './img/house3.png';//377*309
                _this.houseList[i].size = [w * 0.5, w * 0.412];
                _this.houseList[i].renderSize = [_this.houseList[i].size[0] * 1.5, _this.houseList[1].size[1] * 1.5];
                _this.houseList[i].position = [-_this.houseList[i].renderSize[0]*_this.houseList[i].sourceCutX*i,houseTop];//位置水平竖直都变，
            }
            if (i == 4) {
                houseTop = _this.endToHouseDistance;
                _this.houseList[i].img.src = './img/house2.png';
                _this.houseList[i].size = [w * 0.4293, w * 0.412];//322*309
                _this.houseList[i].renderSize = [_this.houseList[i].size[0]*0.6, _this.houseList[3].size[1]*0.6];
                _this.houseList[i].position = [w-w * 32 / 750-_this.houseList[0].renderSize[0], h * 320 / 1334];//位置水平竖直都变，
            }
            if (i == 5) {
                houseTop = houseTop + _this.houseToHouseDistance + _this.houseList[4].renderSize[1];
                _this.houseList[i].img.src = './img/house4.png';
                _this.houseList[i].size = [w * 0.543, w * 0.421];//407*316
                _this.houseList[i].renderSize = [_this.houseList[i].size[0]*0.8, _this.houseList[4].size[1]*0.8];
                _this.houseList[i].position = [w-_this.houseList[i].renderSize[0]*(1-_this.houseList[i].sourceCutX*(i-4)*1.1),_this.endToHouseDistance +  _this.houseToHouseDistance*(i-4)+_this.houseList[i-4-1].renderSize[1]];//位置水平竖直都变，
            }
            if (i == 6) {
                houseTop = houseTop + _this.houseToHouseDistance + _this.houseList[5].renderSize[1];
                _this.houseList[i].img.src = './img/house2.png';
                _this.houseList[i].size = [w * 0.4293, w * 0.412];//322*309
                _this.houseList[i].renderSize = [_this.houseList[i].size[0], _this.houseList[5].size[1]];
                _this.houseList[i].position = [w-_this.houseList[i].renderSize[0]*(1-_this.houseList[i].sourceCutX*(i-4)*1.2), _this.endToHouseDistance +  _this.houseToHouseDistance*(i-4)+_this.houseList[i-4-1].renderSize[1]+_this.houseList[i-4-2].renderSize[1]];//位置水平竖直都变，
            }
            if (i == 7) {
                houseTop = houseTop + _this.houseToHouseDistance + _this.houseList[6].renderSize[1];
                _this.houseList[i].img.src = './img/house4.png';
                _this.houseList[i].size = [w * 0.543, w * 421];//407*316
                _this.houseList[i].renderSize = [_this.houseList[i].size[0]*1.2, _this.houseList[4].size[1]*1.2];
                _this.houseList[i].position = [w-_this.houseList[i].renderSize[0]*(1-_this.houseList[i].sourceCutX*(i-4)*1.3),_this.endToHouseDistance +  _this.houseToHouseDistance*(i-4)+_this.houseList[i-4-1].renderSize[1]+_this.houseList[i-4-2].renderSize[1]+_this.houseList[i-4-3].renderSize[1]];//位置水平竖直都变，
            }
            ctx.drawImage(_this.houseList[i].img, 0, 0, _this.houseList[i].size[0], _this.houseList[i].size[1], _this.houseList[i].position[0], _this.houseList[i].position[1], _this.houseList[i].renderSize[0], _this.houseList[i].renderSize[1])
        }


    },//画背景的两侧建筑
    renderRunner: function (ctx) {
        var _this = this;
        var w = this.w;
        var h = this.h;
        //按照图片尺寸设定人物宽高
        _this.runner.img = new Image();
        _this.runner.img.src = './img/runner.png';
        _this.runner.size = [w * 0.22, w * 0.22 * 263 / 165];
        //_this.bigRunnerSize = [_this.runner.size[0] * 1.2,_this.runner.size[1] * 1.2];

        _this.runner.centerPositon = (w - _this.runner.size[0]) / 2;
        _this.runner.positon = [_this.runner.centerPositon, (h - _this.runner.size[1] * 1.2) / 2];//1.2看图定的
        _this.runner.floor = [_this.runner.centerPositon, _this.runner.size[1]];
        _this.runner.ceiling = [_this.runner.centerPositon, _this.runner.size[1] - 200];

        ctx.drawImage(_this.runner.img, _this.runner.positon[0], _this.runner.positon[1], _this.runner.size[0], _this.runner.size[1]);
    },
    renderListener: function (ctx) {
        var _this = this;
        var $countTime = $('#countTime');
        var $jumpHint = $('#jumpHint');

        var readyCountNum = 3;
        var readyCountTimer = setInterval(function () {
            readyCountNum--;
            if (readyCountNum == 0) {
                clearInterval(readyCountTimer);
                $countTime.hide();
                //提示上跳
                $jumpHint.show();
                $jumpHint.on('touchstart', function (e) {
                    e.preventDefault();
                    $jumpHint.hide();

                    _this.initTime = _this.initRadioTime =Date.now();
                    _this.run(ctx); //跑
                    _this.bind(ctx);
                });
            } else {
                $('#num ').attr('class', 'num_' + readyCountNum);
            }
        }, 1000);
    },
    run: function (ctx) {
        var _this = this;
        var timeGap, seconds;
        function animateRun() {
            window.cancelAnimationFrame(_this.rafId);//不清理会动画积累
            //计时
            timeGap = Date.now() - _this.initTime;
            seconds = Math.round(timeGap / 10);
            _this.$time.text(seconds / 100 + 's');

            //画
            ctx.clearRect(0, 0, _this.w, _this.h);
            _this.changeSpeed();
            _this.frameCount++;

            _this.renderBg(ctx);
            _this.runBlock(ctx);
            _this.runHouse(ctx);
            _this.animationTimeGap = 0;

            /*if (_this.flag) {//跳起
                _this.jumpRunner(ctx);//画每一帧跳起的小人
                _this.rafId = window.requestAnimationFrame(animateRun);
            } else {
                _this.runRunner(ctx);//画每一帧奔跑的小人
                _this.rafId = window.requestAnimationFrame(animateRun);
                if (_this.frameCount % 5 == 0) {
                    if (_this.collisionTest()) {
                        _this.handleCollision();
                    }
                }
            }*/
            _this.rafId = window.requestAnimationFrame(animateRun);//不可写在此处，否则碰撞检测_this.collisionTest()清除不了动画，因为还没有
        }
        animateRun();
    },
    runBlock: function (ctx) {
        var _this = this;
        var w = _this.w;
        var h = _this.h;
        var blockDisappearTop = h*370/1334;
        _this.blockSize = [w * 0.5,w * 0.5 * 159/ 376];
        //位移
        var curTime = Date.now();
        (_this.lastTime > 0) && (_this.blockS = _this.baseBlockSpeed * (curTime - _this.lastTime));
        _this.lastTime = curTime;
        //每一个
        for (var i = 0; i < _this.blockList.length; i++) {
            if(_this.blockList[i].position[1] <= blockDisappearTop){
                _this.blockList[i].renderSize = [w * 0.5*1.5, w * 0.5 * 159*1.5/ 376];
                _this.blockList[i].position = [(w - _this.blockList[i].renderSize[0]) / 2, blockDisappearTop+_this.blockToBlockDistance*3];
            }else{
                _this.blockList[i].position = [(w - _this.blockList[i].renderSize[0]) / 2, _this.blockList[i].position[1] - _this.blockS];
                _this.blockList[i].blockSizeRadio = _this.blockList[i].position[1]*_this.blockSizeRatio*3000/_this.startToEndDistance;
                _this.blockList[i].renderSize = [_this.blockSize[0]* _this.blockList[i].blockSizeRadio,_this.blockSize[1]* _this.blockList[i].blockSizeRadio];
            }
            ctx.drawImage(_this.blockList[i].img, _this.blockList[i].position[0], _this.blockList[i].position[1], _this.blockList[i].renderSize[0], _this.blockList[i].renderSize[1]);
        }
    },
    runHouse: function (ctx) {
        var _this = this;
        var w=_this.w;
        var h=_this.h;
        var houseSizeStep = 0.995;
        var houseDisappearTop = h*320/1334;
        var houseHSum;
        for (var i = 0; i < _this.houseList.length; i++) {
            //左边
            if(i<4){
                if(_this.houseList[i].position[1] <= houseDisappearTop){
                    _this.houseList[i].renderSize = [_this.houseList[i].size[0]*2.5,_this.houseList[i].size[1]*2.5];
                    houseHSum = _this.houseList[1].renderSize[1] +_this.houseList[2].renderSize[1]+_this.houseList[2].renderSize[1]+_this.houseList[3].renderSize[1];
                    _this.houseList[i].position = [-850, houseDisappearTop+houseHSum];
                }else{
                    _this.houseList[i].renderSize = [_this.houseList[i].renderSize[0]*houseSizeStep,_this.houseList[i].renderSize[1]*houseSizeStep];
                    _this.houseList[i].position = [_this.houseList[i].position[0]+3,_this.houseList[i].position[1] - _this.bgSpeed]
                }

            }else{
                _this.houseList[i].position = [_this.houseList[i].position[0]-1.5,_this.houseList[i].position[1] - _this.bgSpeed]
            }

            ctx.drawImage(_this.houseList[i].img, 0, 0, _this.houseList[i].size[0], _this.houseList[i].size[1], _this.houseList[i].position[0], _this.houseList[i].position[1], _this.houseList[i].renderSize[0], _this.houseList[i].renderSize[1])
        }
    },//两侧房子
    runRunner: function (ctx) {
        var _this = this;
        var blockItem = _this.blockList[0];
        //小人中心点坐标
        _this.runnerHoriCenterCord = [_this.runner.positon[0] + _this.runner.size[0] / 2, _this.runner.positon[1] + _this.runner.size[1] / 2];
        //障碍物中心点坐标
        _this.blockHoriCenterCord = [blockItem.left + _this.blockSize[0] / 2, blockItem.top + _this.blockSize[1] / 2];
        if (_this.runnerHoriCenterCord[1] - _this.blockHoriCenterCord[1] > 0 && _this.runnerHoriCenterCord[1] - _this.blockHoriCenterCord[1] < (_this.runner.size[1] + _this.blockSize[1]) / 2) {
            _this.runBlock(ctx);
            ctx.drawImage(_this.runner.img, _this.runner.positon[0], _this.runner.positon[1], _this.runner.size[0], _this.runner.size[1]);
        } else {
            ctx.drawImage(_this.runner.img, _this.runner.positon[0], _this.runner.positon[1], _this.runner.size[0], _this.runner.size[1]);
            _this.runBlock(ctx);
        }
    },
    jumpRunner: function (ctx) {
        var _this = this;
        //判断up or down；
        if (!_this.isUp) {
            _this.runner.size[0] += 4;
            _this.runner.size[1] += 4;

            if (_this.runner.positon[1] <= _this.runner.ceiling[1]) {
                _this.runner.positon[1] = _this.runner.ceiling[1];
                _this.isUp = true
            } else {
                _this.runner.positon[1] -= 20;//背景速度为6
            }
            ctx.drawImage(_this.runner.img, _this.runner.positon[0], _this.runner.positon[1], _this.runner.size[0], _this.runner.size[1]);
            _this.runBlock(ctx);
        } else {
            _this.runner.size[0] -= 2;
            _this.runner.size[1] -= 2;
            if (_this.runner.positon[1] >= _this.runner.floor[1]) {
                _this.runner.positon[1] = _this.runner.floor[1];
                _this.isUp = false;
                _this.flag = false;
                if (_this.scoreFlag) {
                    _this.score += 10;
                    _this.$score.text(_this.score);
                    _this.scoreFlag = false;
                }
            } else {
                _this.runner.positon[1] += 10;
            }
            _this.runBlock(ctx);
            ctx.drawImage(_this.runner.img, _this.runner.positon[0], _this.runner.positon[1], _this.runner.size[0], _this.runner.size[1]);
        }
        //加分
        if (_this.collisionTest()) {
            _this.scoreFlag = true;
        }
    },
    /*jumpRunner: function (ctx) {
     var _this = this;
     //判断up or down；
     if (!_this.isUp) {
     if(_this.runnerSizeW >= _this.bigRunnerSize[0]){
     _this.runnerSizeW = _this.bigRunnerSize[0]
     }else{
     _this.runnerSizeW += 4
     }
     if(_this.runnerSizeH >= _this.bigRunnerSize[1]){
     _this.runnerSizeH = _this.bigRunnerSize[1]
     }else{
     _this.runnerSizeH += 4
     }
     if (_this.runner.positon[1] <= _this.runner.ceiling[1]) {
     _this.runner.positon[1] = _this.runner.ceiling[1];
     _this.isUp = true
     } else {
     _this.runner.positon[1] -= 20;//背景速度为6
     }
     ctx.drawImage(_this.runner.img, _this.runner.positon[0], _this.runner.positon[1], _this.runnerSizeW, _this.runnerSizeH);
     _this.runBlock(ctx);
     } else {
     if(_this.runnerSizeW <= _this.runner.size[0]){
     _this.runnerSizeW = _this.runner.size[0]
     }else{
     _this.runnerSizeW -= 2
     }
     if(_this.runnerSizeH <= _this.runner.size[1]){
     _this.runnerSizeH = _this.runner.size[1]
     }else{
     _this.runnerSizeH -= 2
     }
     _this.runner.size[0] -= 2;
     _this.runner.size[1] -= 2;
     if (_this.runner.positon[1] >= _this.runner.floor[1]) {
     _this.runner.positon[1] = _this.runner.floor[1];
     _this.isUp = false;
     _this.flag = false;
     if(_this.scoreFlag){
     _this.score += 10;
     _this.$score.text(_this.score);
     _this.scoreFlag = false;
     }
     } else {
     _this.runner.positon[1] += 10;
     }
     _this.runBlock(ctx);
     ctx.drawImage(_this.runner.img, _this.runner.positon[0], _this.runner.positon[1], _this.runnerSizeW, _this.runnerSizeH);
     }
     //加分
     if(_this.collisionTest()){
     _this.scoreFlag = true;
     }
     },*/

    bind: function (ctx) {
        var _this = this;
        //swiperUp
        var initY, initX, moveY, moveX, distanceY, temp;

        canvas.addEventListener('touchstart', function (e) {
            e.preventDefault();
            moveY = initY = e.targetTouches[0].pageY;
            moveX = initX = e.targetTouches[0].pageX;
            temp = _this.runner.positon[1];
        });
        canvas.addEventListener('touchmove', function (e) {
            e.preventDefault();
            if (!_this.flag && checkMoveUp(e)) {// 未跳起状态并且移动一定距离
                _this.flag = true;
                _this.run(ctx);
            }
            function checkMoveUp(e) {
                moveX = e.targetTouches[0].pageX;
                moveY = e.targetTouches[0].pageY;
                distanceX = moveX - initX;
                distanceY = moveY - initY;
                if (Math.abs(distanceX) < Math.abs(distanceY) && distanceY < -30) {//判断向上滑
                    return true
                }
                return false;
            }
        });
    },
//碰撞检测
    collisionTest: function () {
        var _this = this;
        //Math.abs(runnerHoriCenterCord[0] - blockHoriCenterCord[0]) < (_this.runner.size[0] + blockItem.width) / 2 && Math.abs(runnerHoriCenterCord[1] - blockHoriCenterCord[1]) < (_this.runner.size[1] + blockItem.height) / 2
        if (Math.abs(_this.runnerHoriCenterCord[1] - _this.blockHoriCenterCord[1]) < (_this.runner.size[1] + _this.blockSize[1] ) / 16) {//16随意定的，要给缓冲量
            return true
        }
        return false;
    },
    handleCollision: function () {
        var _this = this;
        window.cancelAnimationFrame(_this.rafId);
        _this.gameOver();
    },
    gameOver: function () {
        alert('Game Over');
        /*canvas.removeEventListener('touchstart', this.handleTouchStart, true);//解绑
         canvas.removeEventListener('touchmove', this.handleTouchMove, true)*/
    },
    changeSpeed: function () {
        var _this = this;
        if (_this.circle >= 2) {
            var circleNum = Math.floor(_this.circle / 4);
            (circleNum != 0 && circleNum % 2) ? _this.bgSpeed = _this.bgMidSpeed : _this.bgSpeed = _this.bgFastSpeed;
        }
    }
};
paoku.init();