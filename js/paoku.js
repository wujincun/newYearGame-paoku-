/**
 * Created by Administrator on 2016/12/5.
 */
var paoku = {
    $score: $('#score'),
    $time: $('#time'),
    $jumpHint : $('#jumpHint'),
    w: $(window).width(),
    h: $(window).height(),
    runner: {},//人
    runnerShadow: {},//人的阴影
    houseList: [],//房子的集合
    blockList: [],//障碍物的数组集合
    frameCount: 0,//每一帧的计算
    isInit: false,
    hintInit:false,//第一次到block显示提示
    hintFlag:false,//提示出现时停止动画
    notFailJump:true,//起跳过早并不失败
    rafId: '',//动画的id
    flag: false,//标志是否跳起 true为跳起
    isUp: false,//是否向上跳
    score: 0,//分数
    lastTime: 0,
    pauseTime:0,//提示遮罩出现暂停的时间
    totalTime: 3000,
    runnerTime: 400,
    minBlockSizeM: 1 / 3.5,//最小最大比
    minHouseSizeM: 1 / 3.5,
    maxRunnerSizeM: 1.05,
    minShadowSizeM: 1 / 2,
    blockS: 0,
    houseS: 0,

    API: {
        getResult: '/ajax/aj_activity170101.php'
    },
    init: function () {
        var _this = this;
        //加载完图片后render
        var imgs = [
            './img/game/1.png',
            './img/game/2.png',
            './img/game/3.png',
            './img/game/background.jpg',
            './img/game/block.png',
            './img/game/cutTimeBackground.png',
            './img/game/house1.png',
            './img/game/house2.png',
            './img/game/house3.png',
            './img/game/house4.png',
            './img/game/runner.png',
            './img/game/runnerShadow.png'
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
        _this.renderRunnerShadow(ctx);
        _this.renderRunner(ctx);

        if (!this.isInit) {
            this.renderListener(ctx);//3s开始倒计时
            this.isInit = true;
        }
    },
    renderBg: function (ctx) {
        var _this = this;
        _this.bg = new Image();
        _this.bg.src = './img/game/background.jpg';
        ctx.drawImage(_this.bg, 0, 0, _this.w, _this.h);
    },
    renderBlock: function (ctx) {
        var _this = this;
        var w = _this.w;
        var h = _this.h;
        _this.blockSize = [w * 0.5, w * 0.5 * 159 / 376];
        _this.blockToBlockDistance = h * 400 / 1334;
        _this.endToBlockDistance = h * 370 / 1334;
        _this.blockDisappearDistance = h * 360 / 1334;
        _this.startToEndBlockDistance = h * (1334 - 360 - 160) / 1334;
        var blockDistance = _this.endToBlockDistance;
        _this.blockSpeed = _this.baseBlockSpeed = _this.startToEndBlockDistance / _this.totalTime;//S:h*(1334-370)/1334;t=3000ms;1s60帧，则一帧的速度？？？
        //初始化的障碍物
        for (var i = 0; i < 3; i++) {
            _this.blockList[i] = {};
            _this.blockList[i].img = new Image();
            _this.blockList[i].img.src = './img/game/block.png';
            _this.blockList[i].position = [0, blockDistance];//先根据top算尺寸，再根据尺寸算left
            _this.blockList[i].radio = (_this.blockList[i].position[1] - _this.blockDisappearDistance) / _this.startToEndBlockDistance;
            _this.blockList[i].blockSizeRadio = _this.blockList[i].radio * (1 - _this.minBlockSizeM) + _this.minBlockSizeM;
            _this.blockList[i].renderSize = [_this.blockSize[0] * _this.blockList[i].blockSizeRadio, _this.blockSize[1] * _this.blockList[i].blockSizeRadio];
            _this.blockList[i].position = [(w - _this.blockList[i].renderSize[0]) / 2, blockDistance];
            ctx.drawImage(_this.blockList[i].img, _this.blockList[i].position[0], _this.blockList[i].position[1], _this.blockList[i].renderSize[0], _this.blockList[i].renderSize[1]);
            blockDistance += _this.blockToBlockDistance;
        }
    },
    renderHouse: function (ctx) {
        var _this = this;
        var w = _this.w;
        var h = _this.h;
        var top;
        _this.endToHouseDistance = h * 300 / 1334; //开始渲染时最小房子在页面上的top
        _this.leftToHouseRightDistance = w * 320 / 750;//最小房子的右边在页面上的left
        _this.houseDisappearDistance = h * 290 / 1334; //房子消失的位置top
        _this.startToEndHouseDistance = h * (1334 - 290 - 394) / 1334; //最大房顶到最小房顶为650
        _this.leftStartToEndDistance = w * 216 / 750;                     //跑道倾斜角度为72度左右，那么移动的高是宽的3倍，大约为650/3=216；
        _this.houseSpeed = _this.baseHouseSpeed = _this.startToEndHouseDistance / _this.totalTime;//S:h*(1334-370)/1334;t=3000ms;1s60帧，则一帧的速度？？？
        _this.leftBaseHouseSpeed = _this.leftStartToEndDistance / _this.totalTime;//水平方向上的速度
        for (var i = 0; i < 8; i++) {
            _this.houseList[i] = {};
            _this.houseList[i].img = new Image();
            _this.houseList[i].position = [];
            //左边
            if (i == 0) {
                _this.houseList[i].img.src = './img/game/house1.png';
                _this.houseList[i].size = [w * 0.59, w * 0.41];//442*307
                _this.houseList[i].position[1] = top = _this.endToHouseDistance;//位置水平竖直都变，
            }
            if (i == 1) {
                _this.houseList[i].img.src = './img/game/house3.png';//377*309
                _this.houseList[i].size = [w * 0.5, w * 0.412];
                _this.houseList[i].position[1] = top += _this.houseList[i - 1].renderSize[1] * 1.5;//位置水平竖直都变，
            }
            if (i == 2) {
                _this.houseList[i].img.src = './img/game/house1.png';
                _this.houseList[i].size = [w * 0.59, w * 0.41];//442*307
                _this.houseList[i].position[1] = top += _this.houseList[i - 1].renderSize[1] * 1.5;//位置水平竖直都变，
            }
            if (i == 3) {
                _this.houseList[i].img.src = './img/game/house3.png';//377*309
                _this.houseList[i].size = [w * 0.5, w * 0.412];
                _this.houseList[i].position[1] = top += _this.houseList[i - 1].renderSize[1] * 1.5;//位置水平竖直都变，
            }
            if (i == 4) {
                _this.houseList[i].img.src = './img/game/house2.png';
                _this.houseList[i].size = [w * 0.4293, w * 0.412];//322*309
                _this.houseList[i].position[1] = top = _this.endToHouseDistance;//位置水平竖直都变，
            }
            if (i == 5) {
                _this.houseList[i].img.src = './img/game/house4.png';
                _this.houseList[i].size = [w * 0.527, w * 0.41];//407*316---395.40822*307
                _this.houseList[i].position[1] = top += _this.houseList[i - 1].renderSize[1] * 1.5;//位置水平竖直都变，
            }
            if (i == 6) {
                _this.houseList[i].img.src = './img/game/house2.png';
                _this.houseList[i].size = [w * 0.4293, w * 0.412];//322*309
                _this.houseList[i].position[1] = top += _this.houseList[i - 1].renderSize[1] * 1.5;//位置水平竖直都变，
            }
            if (i == 7) {
                _this.houseList[i].img.src = './img/game/house4.png';
                _this.houseList[i].size = [w * 0.527, w * 0.41];//407*316
                _this.houseList[i].position[1] = top += _this.houseList[i - 1].renderSize[1] * 1.5;//位置水平竖直都变，
            }
            _this.houseList[i].radio = (_this.houseList[i].position[1] - _this.houseDisappearDistance) / _this.startToEndHouseDistance;
            _this.houseList[i].houseSizeRadio = _this.houseList[i].radio * (1 - _this.minHouseSizeM) + _this.minHouseSizeM
            _this.houseList[i].renderSize = [_this.houseList[i].size[0] * _this.houseList[i].houseSizeRadio, _this.houseList[i].size[1] * _this.houseList[i].houseSizeRadio];
            if (i < 4) {
                _this.houseList[i].position[0] = _this.leftToHouseRightDistance - _this.houseList[i].radio * _this.leftStartToEndDistance - _this.houseList[i].renderSize[0];//位置水平竖直都变，
            } else {
                _this.houseList[i].position[0] = w - (_this.leftToHouseRightDistance - _this.houseList[i].radio * _this.leftStartToEndDistance)//位置水平竖直都变，
            }
            ctx.drawImage(_this.houseList[i].img, _this.houseList[i].position[0], _this.houseList[i].position[1], _this.houseList[i].renderSize[0], _this.houseList[i].renderSize[1])
        }
    },//画背景的两侧建筑
    renderRunnerShadow: function (ctx) {
        var _this = this;
        var w = this.w;
        var h = this.h;
        //按照图片尺寸设定人物宽高
        _this.runnerShadow.img = new Image();
        _this.runnerShadow.img.src = './img/game/runnerShadow.png';
        _this.runnerShadow.size = [w * 0.132, w * 0.132 * 32 / 99];//99*32
        _this.runnerShadow.renderSize = [_this.runnerShadow.size[0], _this.runnerShadow.size[1]];
        _this.runnerShadow.position = [(w - _this.runnerShadow.renderSize[0]) / 2, 650 * h / 1334];//760量的
        _this.shadowFooter = _this.runnerShadow.position[1] + _this.runnerShadow.renderSize[1];
        ctx.drawImage(_this.runnerShadow.img, _this.runnerShadow.position[0], _this.runnerShadow.position[1], _this.runnerShadow.renderSize[0], _this.runnerShadow.renderSize[1])
    },
    renderRunner: function (ctx) {
        var _this = this;
        var w = this.w;
        var h = this.h;
        //按照图片尺寸设定人物宽高
        _this.runner.img = new Image();
        _this.runner.img.src = './img/game/runner.png';
        _this.runner.size = [w * 0.22 * 0.95, w * 0.22 * 263 / 165 * 0.95];
        _this.runner.renderSize = [_this.runner.size[0], _this.runner.size[1]];
        _this.runner.leftposition = (w - _this.runner.renderSize[0]) / 2;
        _this.runner.topPosition = _this.runnerShadow.position[1] - _this.runner.renderSize[1] + _this.runnerShadow.renderSize[1] * 1 / 2;
        _this.runner.position = [_this.runner.leftposition, _this.runner.topPosition];
        _this.runner.floor = [_this.runner.centerposition, _this.runner.topPosition + _this.runnerShadow.renderSize[1] * 1 / 2];//???为什么一开始正常，
        _this.runner.ceiling = [_this.runner.centerposition, _this.runner.floor[1] - 200 * h / 1334];
        _this.runnerSpeed = _this.baseRunnerSpeed = 400 * h / (_this.runnerTime * 1334);
        _this.runnerFooter = _this.runner.floor[1]+_this.runner.renderSize[1];
        //小人中心点坐标
        _this.runnerHoriCenterCord = [_this.runner.position[0] + _this.runner.size[0] / 2, _this.runner.position[1] + _this.runner.size[1] / 2];
        ctx.drawImage(_this.runner.img, _this.runner.position[0], _this.runner.position[1], _this.runner.renderSize[0], _this.runner.renderSize[1]);
    },
    renderListener: function (ctx) {
        var _this = this;
        var $countTime = $('#countTime');
        var readyCountNum = 3;
        var readyCountTimer = setInterval(function () {
            readyCountNum--;
            if (readyCountNum == 0) {
                clearInterval(readyCountTimer);
                $countTime.hide();
                _this.initTime = _this.initRadioTime = Date.now();
                _this.run(ctx); //跑
                _this.bind(ctx);
            } else {
                $('#num ').attr('class', 'num_' + readyCountNum);
            }
        }, 1000);
    },
    run: function (ctx, index) {
        var _this = this;
        var timeGap, seconds;

        function animateRun() {
            window.cancelAnimationFrame(_this.rafId);//不清理会动画积累
            //计时
            timeGap = Date.now() - _this.initTime - _this.pauseTime;
            seconds = Math.round(timeGap / 10);
            _this.$time.text(seconds / 100 + 's');
            //位移
            var curTime = Date.now();
            if (_this.lastTime > 0) {
                _this.blockS = _this.blockSpeed * 17;
                _this.houseS = _this.houseSpeed * 17;
                _this.runnerS = _this.runnerSpeed * 17
               /* _this.blockS = _this.blockSpeed * (curTime - _this.lastTime);
                 _this.houseS = _this.houseSpeed * (curTime - _this.lastTime);
                 _this.runnerS = _this.runnerSpeed * (curTime - _this.lastTime)*/
            }
            _this.lastTime = curTime;
            //画
            ctx.clearRect(0, 0, _this.w, _this.h);
            _this.changeSpeed();
            _this.frameCount++;

            _this.renderBg(ctx);
            _this.runHouse(ctx);

            if (_this.flag) {//跳起
                _this.jumpRunner(ctx, index);//画每一帧跳起的小人
                _this.rafId = window.requestAnimationFrame(animateRun);
            } else {
                _this.runRunner(ctx);//画每一帧奔跑的小人
                if(_this.hintFlag){
                    window.cancelAnimationFrame(_this.rafId)
                }else{
                    _this.rafId = window.requestAnimationFrame(animateRun);
                }
                if (_this.fail) {
                    _this.handleCollision();
                    return false;
                }
            }
            //_this.rafId = window.requestAnimationFrame(animateRun);//不可写在此处，否则碰撞检测_this.collisionTest()清除不了动画，因为还没有
        }
        animateRun();
    },
    runBlock: function (ctx) {
        var _this = this;
        var w = _this.w;
        for (var i = 0; i < _this.blockList.length; i++) {
            var blockItem = _this.blockList[i];
            if (blockItem.position[1] <= _this.blockDisappearDistance) {
                blockItem.renderSize = [w * 0.5 * 1.5, w * 0.5 * 159 * 1.5 / 376];
                blockItem.position = [(w - blockItem.renderSize[0]) / 2, _this.blockDisappearDistance + _this.blockToBlockDistance * 3];
            } else {
                blockItem.radio = (blockItem.position[1] - _this.blockDisappearDistance) / _this.startToEndBlockDistance;
                blockItem.blockSizeRadio = blockItem.radio * (1 - _this.minBlockSizeM) + _this.minBlockSizeM;
                blockItem.renderSize = [_this.blockSize[0] * blockItem.blockSizeRadio, _this.blockSize[1] * blockItem.blockSizeRadio];
                blockItem.position = [(w - blockItem.renderSize[0]) / 2, blockItem.position[1] - _this.blockS];
            }
            ctx.drawImage(blockItem.img, blockItem.position[0], blockItem.position[1], blockItem.renderSize[0], blockItem.renderSize[1]);
        }
    },
    runHouse: function (ctx) {
        var _this = this;
        var w = _this.w;
        for (var i = 0; i < 8; i++) {
            if (i < 4) {
                if (_this.houseList[i].position[1] <= _this.houseDisappearDistance) {
                    var maxLeftHouseH = Math.max(_this.houseList[0].renderSize[1], _this.houseList[1].renderSize[1], _this.houseList[2].renderSize[1], _this.houseList[3].renderSize[1]);
                    _this.houseList[i].position[1] = _this.houseDisappearDistance + (_this.houseList[0].renderSize[1] + _this.houseList[1].renderSize[1] + _this.houseList[2].renderSize[1] + _this.houseList[3].renderSize[1]) * 1.5 - maxLeftHouseH;
                } else {
                    _this.houseList[i].position[1] = _this.houseList[i].position[1] - _this.houseS;
                }
                _this.houseList[i].radio = (_this.houseList[i].position[1] - _this.houseDisappearDistance) / _this.startToEndHouseDistance;
                _this.houseList[i].houseSizeRadio = _this.houseList[i].radio * (1 - _this.minHouseSizeM) + _this.minHouseSizeM
                _this.houseList[i].renderSize = [_this.houseList[i].size[0] * _this.houseList[i].houseSizeRadio, _this.houseList[i].size[1] * _this.houseList[i].houseSizeRadio];
                _this.houseList[i].position[0] = _this.leftToHouseRightDistance - _this.houseList[i].radio * _this.leftStartToEndDistance - _this.houseList[i].renderSize[0];//位置水平竖直都变，
            } else {
                if (_this.houseList[i].position[1] <= _this.houseDisappearDistance) {
                    var maxRightHouseH = Math.max(_this.houseList[4].renderSize[1], _this.houseList[5].renderSize[1], _this.houseList[6].renderSize[1], _this.houseList[7].renderSize[1]);
                    _this.houseList[i].position[1] = _this.houseDisappearDistance + (_this.houseList[4].renderSize[1] + _this.houseList[5].renderSize[1] + _this.houseList[6].renderSize[1] + _this.houseList[7].renderSize[1]) * 1.5 - maxRightHouseH;
                } else {
                    _this.houseList[i].position[1] = _this.houseList[i].position[1] - _this.houseS;
                }
                _this.houseList[i].radio = (_this.houseList[i].position[1] - _this.houseDisappearDistance) / _this.startToEndHouseDistance;
                _this.houseList[i].houseSizeRadio = _this.houseList[i].radio * (1 - _this.minHouseSizeM) + _this.minHouseSizeM;
                _this.houseList[i].renderSize = [_this.houseList[i].size[0] * _this.houseList[i].houseSizeRadio, _this.houseList[i].size[1] * _this.houseList[i].houseSizeRadio];
                _this.houseList[i].position[0] = w - (_this.leftToHouseRightDistance - _this.houseList[i].radio * _this.leftStartToEndDistance);//位置水平竖直都变，
            }
            ctx.drawImage(_this.houseList[i].img, _this.houseList[i].position[0], _this.houseList[i].position[1], _this.houseList[i].renderSize[0], _this.houseList[i].renderSize[1])
        }
    },
    runRunner: function (ctx, index) {
        var _this = this;
        //判断
        var lastIndex,lastBlockItem,blockItem,jumpBlockItem;
        //跳起情况
        if(typeof (index) != 'undefined'){
            lastIndex = index - 1 == -1 ? 2 : index - 1;
            lastBlockItem = _this.blockList[lastIndex];
            blockItem = _this.blockList[index];
            //挡住上一个,判断跳起时blockItem的中心在小人上半部还是下半部？或者挡住当前（当前认为已经跳过）
            if((blockItem.position[1]>lastBlockItem.position[1] && _this.runnerFooter<blockItem.position[1] && _this.runner.position[1] <= lastBlockItem.position[1]+lastBlockItem.renderSize[1]) ||(blockItem.position[1] + blockItem.renderSize[1] <= _this.runnerFooter && blockItem.position[1] + blockItem.renderSize[1]/2 > _this.runner.position[1]+_this.runner.renderSize[1]/2)){
                _this.runRunnerShadow(ctx);
                _this.runBlock(ctx);
                ctx.drawImage(_this.runner.img, _this.runner.position[0], _this.runner.position[1], _this.runner.renderSize[0], _this.runner.renderSize[1]);
                _this.notFailJump = true
            }else{
                //当前block和runner的关系
                if(_this.successJump) {
                    if(blockItem.position[1]<_this.runnerFooter-_this.blockSpeed * _this.runnerTime){
                        _this.runRunnerShadow(ctx);
                        _this.runBlock(ctx);
                        ctx.drawImage(_this.runner.img, _this.runner.position[0], _this.runner.position[1], _this.runner.renderSize[0], _this.runner.renderSize[1]);
                    }else {
                        _this.runRunnerShadow(ctx);
                        ctx.drawImage(_this.runner.img, _this.runner.position[0], _this.runner.position[1], _this.runner.renderSize[0], _this.runner.renderSize[1]);
                        _this.runBlock(ctx);
                    }
                }else{
                    //起跳特别早,人压住上一个block,但是落下并不撞上
                    if(_this.notFailJump != true){
                        _this.fail = true;
                        _this.notFailJump = false
                    }
                    if(lastBlockItem.position[1] >_this.h && blockItem.position[1] + blockItem.renderSize[1] < _this.runnerFooter && blockItem.position[1] + blockItem.renderSize[1]/2 > _this.runner.position[1]+_this.runner.renderSize[1]/2){
                        _this.runRunnerShadow(ctx);
                        _this.runBlock(ctx);
                        ctx.drawImage(_this.runner.img, _this.runner.position[0], _this.runner.position[1], _this.runner.renderSize[0], _this.runner.renderSize[1]);
                    }else{
                        _this.runRunnerShadow(ctx);
                        ctx.drawImage(_this.runner.img, _this.runner.position[0], _this.runner.position[1], _this.runner.renderSize[0], _this.runner.renderSize[1]);
                        _this.runBlock(ctx);
                    }
                }
            }
        }else{
            //跑步状态，判断挡住条件
            if(_this.index == null){
                _this.temp = _this.getIndex()
            }
            _this.index = _this.getIndex();
            blockItem = _this.blockList[_this.index];
            //跳起时的block
            jumpBlockItem = _this.blockList[_this.temp];
            //跳起落下
            if(_this.successJump){
                _this.runRunnerShadow(ctx);
                _this.runBlock(ctx);
                ctx.drawImage(_this.runner.img, _this.runner.position[0], _this.runner.position[1], _this.runner.renderSize[0], _this.runner.renderSize[1]);
                if(_this.temp != _this.index && (jumpBlockItem.position[1] + jumpBlockItem.renderSize[1]) < _this.runner.position[1] || jumpBlockItem.position[1]>_this.h){
                    _this.successJump = false;
                }
            }else{
                //未跳起过
                if(blockItem.position[1]<_this.runnerFooter - blockItem.renderSize[1]){
                    _this.fail = true;
                }
                if(!_this.hintInit){
                    if(blockItem.position[1]<_this.runnerFooter){
                        _this.$jumpHint.show();
                        _this.hintInit = true;
                        _this.hintFlag = true;
                        _this.pauseTimeStart = Date.now();
                    }
                }
                _this.runRunnerShadow(ctx);
                ctx.drawImage(_this.runner.img, _this.runner.position[0], _this.runner.position[1], _this.runner.renderSize[0], _this.runner.renderSize[1]);
                _this.runBlock(ctx);
            }
        }
    },
    jumpRunner: function (ctx, index) {
        var _this = this;
        //判断up or down；
        if (!_this.isUp) {
            if (_this.runner.position[1] <= _this.runner.ceiling[1]) {
                _this.runner.position[1] = _this.runner.ceiling[1];
                _this.isUp = true
            } else {
                _this.runner.position[1] = _this.runner.position[1] - _this.runnerS;
            }
            _this.runner.radio = (_this.runner.position[1] - _this.runner.ceiling[1]) / (_this.runner.ceiling[1] - _this.runner.floor[1]);
            _this.runner.houseSizeRadio = _this.runner.radio * (_this.maxRunnerSizeM - 1) + 1;
            _this.runner.renderSize = [_this.runner.size[0] * _this.runner.houseSizeRadio, _this.runner.size[1] * _this.runner.houseSizeRadio];

        } else {
            if (_this.runner.position[1] >= _this.runner.floor[1]) {
                _this.runner.position[1] = _this.runner.floor[1];
                if (_this.successJump) {
                    _this.score += 10;
                    _this.$score.text(_this.score);
                }
                _this.isUp = false;
                _this.flag = false;
            } else {
                _this.runner.position[1] = _this.runner.position[1] + _this.runnerS;
            }
            _this.runner.radio = (_this.runner.position[1] - _this.runner.ceiling[1]) / (_this.runner.ceiling[1] - _this.runner.floor[1]);
            _this.runner.houseSizeRadio = _this.runner.radio * (_this.maxRunnerSizeM - 1) + 1;
            _this.runner.renderSize = [_this.runner.size[0] * _this.runner.houseSizeRadio, _this.runner.size[1] * _this.runner.houseSizeRadio];

        }
        if (_this.successJump && _this.isUp) {
            _this.runBlock(ctx);
            _this.runRunnerShadow(ctx);
            ctx.drawImage(_this.runner.img, _this.runner.position[0], _this.runner.position[1], _this.runner.renderSize[0], _this.runner.renderSize[1]);
        } else {
            _this.runRunner(ctx, index)
        }
    },
    runRunnerShadow: function (ctx) {
        var _this = this;
        var w = _this.w;
        _this.runnerShadow.radio = (_this.runner.ceiling[1] - _this.runner.position[1]) / (_this.runner.ceiling[1] - _this.runner.floor[1]);
        _this.runnerShadow.radio = _this.runnerShadow.radio ? _this.runnerShadow.radio : 1;
        _this.runnerShadow.shadowSizeRadio = _this.runnerShadow.radio * (1 - _this.minShadowSizeM) + _this.minShadowSizeM;
        _this.runnerShadow.renderSize = [_this.runnerShadow.size[0] * _this.runnerShadow.shadowSizeRadio, _this.runnerShadow.size[1] * _this.runnerShadow.shadowSizeRadio];
        _this.runnerShadow.position = [(w - _this.runnerShadow.renderSize[0]) / 2, _this.runnerShadow.position[1]];//740量的
        ctx.drawImage(_this.runnerShadow.img, _this.runnerShadow.position[0], _this.runnerShadow.position[1], _this.runnerShadow.renderSize[0], _this.runnerShadow.renderSize[1])
    },
    bind: function (ctx) {
        var _this = this;
        //swiperUp
        var initY, initX, moveY, moveX, distanceY;
        var $popContainer = $('.popContainer');
        var $gamePopContainer = $('#gamePopContainer');
        var $successPop = $gamePopContainer.find('.successPop');
        var $resultPopContainer = $('#resultPopContainer');
        var $getCouponPop = $resultPopContainer.find('.getCouponPop');
        var $couponMoneyNum = $getCouponPop.find('.couponMoneyNum');
        var $noCouponPop = $resultPopContainer.find('.noCouponPop');

        canvas.addEventListener('touchstart', function(e){
            e.preventDefault();
            moveY = initY = e.targetTouches[0].pageY;
            moveX = initX = e.targetTouches[0].pageX;
            _this.index = null;
        });
        canvas.addEventListener('touchmove', function (e) {
            if(_this.hintFlag){
                _this.$jumpHint.hide();
                _this.successJump = true;
                _this.hintFlag = false;
                _this.lastTime = 0;
                _this.pauseTime = Date.now() - _this.pauseTimeStart;
            }
            e.preventDefault();
            if (!_this.flag && checkMoveUp(e)) {// 未跳起状态并且移动一定距离
                _this.flag = true;
                var index = _this.getIndex();
                _this.successJump = (_this.blockList[index].position[1] < _this.shadowFooter && _this.blockList[index].position[1] > (_this.shadowFooter - _this.blockList[index].renderSize[1]));
                _this.run(ctx, index);
            }
            function checkMoveUp(e) {
                moveX = e.targetTouches[0].pageX;
                moveY = e.targetTouches[0].pageY;
                distanceX = moveX - initX;
                distanceY = moveY - initY;
                return (Math.abs(distanceX) < Math.abs(distanceY) && distanceY < -30);//判断向上滑
            }
        });
        $popContainer.on('touchstart', '.close', function () {
            $popContainer.hide();
            window.location.href = "newYearH5.html"
        });
        $successPop.on('touchstart', '.couponBag', function () {
            $.ajax({
                url: _this.API.getResult,
                type: 'GET',
                dataType: 'json',
                data: {
                    score:_this.score
                }
            }).done(function (data) {
                $resultPopContainer.show();
                $gamePopContainer.hide();
                if (data.code == 200) {
                    $getCouponPop.show();
                    $noCouponPop.hide();
                    $couponMoneyNum.text();
                } else {
                    $noCouponPop.show();
                    $getCouponPop.hide();
                }
            })
        });
    },
    getIndex: function () {
        var _this = this;
        var arr = [];
        _this.blockToRunnerA = [];//起跳前每个block到runner的距离的集合
        for (var i = 0; i < _this.blockList.length; i++) {
            var blockItem = _this.blockList[i];
            var blockToRunner = (blockItem.position[1]+blockItem.renderSize[1]/2) - (_this.runner.position[1]+_this.runner.renderSize[1]/2);
            _this.blockToRunnerA.push(blockToRunner);
            if (blockToRunner >= 0) {
                arr.push(blockToRunner)
            }
        }
        return index = _this.blockToRunnerA.indexOf(Math.min.apply(null, arr));
    },
    handleCollision: function () {
        var _this = this;
        window.cancelAnimationFrame(_this.rafId);
        _this.gameOver();
    },
    gameOver: function () {
        var _this = this;
        var $gamePopContainer = $('#gamePopContainer');
        var $successPop = $gamePopContainer.find('.successPop');
        var $failPop = $gamePopContainer.find('.failPop');
        $gamePopContainer.show();
        if (_this.score >= 50) {
            $successPop.show();
            $successPop.find('.num').text(_this.score/10);
            $successPop.find('.score').text(_this.score);
            $failPop.hide()
        } else {
            $failPop.show();
            $failPop.find('.score').text(_this.score);
            $successPop.hide();
        }
    },
    changeSpeed: function () {
        var _this = this;
        if (_this.score > 50) {
            var scoreGap = Math.floor(_this.score / 50);
            if (scoreGap % 2) {
                _this.blockSpeed = _this.baseBlockSpeed * 1.2;
                _this.houseSpeed = _this.baseHouseSpeed * 1.2;
            } else {
                _this.blockSpeed = _this.baseBlockSpeed * 1.5;
                _this.houseSpeed = _this.baseHouseSpeed * 1.5;
            }
        }
    }
};
paoku.init();