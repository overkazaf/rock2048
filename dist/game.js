"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var matrix_1 = require("./matrix");
var direction_1 = require("./enums/direction");
var Models = __importStar(require("./TrainModels/index"));
var BaseModel = Models.BaseModel, RandomModel = Models.RandomModel, NNModel = Models.NNModel;
var TIMEOUT = 3000;
var trainingDataSet = {
    inputs: [],
    labels: [],
};
var Game = /** @class */ (function () {
    function Game() {
        this.matrix = new matrix_1.Matrix([
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ]);
        this.score = 0;
        this.isOver = false;
        this.states = [];
        this.trainingRecords = [];
        this.prevPredictions = [];
        this.lastPredictions = [];
        this.lastState = [];
        this.prevState = [];
        this.prevMovementDirection = null;
        this.lastMovementDirection = null;
        this.trainingModel = new RandomModel();
        this.trainingModel.init();
    }
    Game.prototype.printState = function (prefix) {
        var data = this.matrix.data;
        console.log("\nCurrent score: " + this.score + ", board state: ");
        data.forEach(function (row) {
            var current = [];
            row.forEach(function (item) {
                current.push(item);
            });
            console.log("[ " + current.join(',') + " ]");
        });
        console.log('\n');
    };
    Game.prototype.predictNextDirection = function () {
        this.prevState = this.lastState;
        var state = this.convertBoardStateToVector();
        this.lastState = state;
        return this.trainingModel.predict(state);
    };
    Game.prototype.genNextRandomDirection = function () {
        return ~~(Math.random() * 4);
    };
    Game.prototype.handleGameOver = function () {
        var label = [];
        // 优化之前移动导致游戏结束的状态
        var _a = this, lastState = _a.lastState, prevMovementDirection = _a.prevMovementDirection, lastMovementDirection = _a.lastMovementDirection;
        switch (lastMovementDirection) {
            case direction_1.DIRATION.UP:
                // 上次是向上移动挂掉的，同理是可以向下的，下次记得向下做一次尝试，至少不会太差。
                label = [0, 1, 0, 0];
                break;
            case direction_1.DIRATION.DOWN:
                label = [1, 0, 0, 0];
                break;
            case direction_1.DIRATION.LEFT:
                label = [0, 0, 0, 1];
                break;
            case direction_1.DIRATION.RIGHT:
                label = [0, 0, 1, 0];
                break;
        }
        trainingDataSet.inputs.push(lastState);
        trainingDataSet.labels.push(label);
        // console.info(
        //   'Training',
        //   'lastMovementDirection ==>',
        //   DIRATION[lastMovementDirection],
        //   'lastState ==> ',
        //   lastState,
        //   'label ==> ',
        //   label,
        // );
        // this.trainingModel.fit(trainingDataSet.inputs, trainingDataSet.labels);
    };
    Game.prototype.convertBoardStateToVector = function () {
        var _this = this;
        var directions = [direction_1.DIRATION.UP, direction_1.DIRATION.DOWN, direction_1.DIRATION.LEFT, direction_1.DIRATION.RIGHT];
        var emptyBlockCounts = [];
        var scores = [];
        var existed2Counts = [];
        var originalMatrix = this.matrix.clone();
        directions.forEach(function (dir) {
            if (!_this.isMovable(dir)) {
                emptyBlockCounts.push(0);
                scores.push(_this.score);
            }
            else {
                // 移动后计算分值
                _this.moveByDirection(dir);
                emptyBlockCounts.push(_this.findEmptyCordinates().length);
                scores.push(_this.score);
            }
            existed2Counts.push(_this.findCurrentMaxNumber());
            // 还原状态
            _this.setMatrix(originalMatrix);
        });
        var vector = [
            scores,
            emptyBlockCounts,
            existed2Counts,
        ];
        console.log('vector', vector);
        return vector;
    };
    Game.prototype.findCurrentMaxNumber = function () {
        var data = this.matrix.data;
        var maxNum = 0;
        data.forEach(function (row, x) {
            row.forEach(function (item, y) {
                if (item >= maxNum) {
                    maxNum = item;
                }
            });
        });
        return maxNum;
    };
    Game.prototype.findExistedNumberCounts = function (num) {
        var data = this.matrix.data;
        var count = 0;
        data.forEach(function (row, x) {
            row.forEach(function (item, y) {
                if (item === num) {
                    count++;
                }
            });
        });
        return count;
    };
    Game.prototype.showGameOverMessage = function () {
        console.log('');
        console.log("U failed, final score:" + this.score + ", total steps: " + this.states.length / 2);
        console.log('Final 2048 game state', this.matrix.data);
        console.log('');
    };
    Game.prototype.start = function () {
        this.genNewBoardState();
    };
    Game.prototype.genNewBoardState = function () {
        var _this = this;
        var cords = this.genRandomCordinate();
        if (!cords.length) {
            clearInterval(this.timer);
            this.showGameOverMessage();
            this.trainingRecords.push([this.score, this.states]);
            this.handleGameOver();
            return;
        }
        var x = cords[0], y = cords[1];
        this.matrix.data[x][y] = 2;
        this.pushState([-1, this.matrix.data]);
        this.printState();
        setTimeout(function () {
            _this.moveNext();
        }, TIMEOUT);
    };
    Game.prototype.moveNext = function () {
        var _this = this;
        var predictionPromiseLike = this.predictNextDirection();
        var predictionFn = function (predictions) {
            if (predictions.every(function (p) { return p == 0; })) {
                _this.showGameOverMessage();
                _this.handleGameOver();
            }
            else {
                var findMaxNumIndexInArray = function (arr) {
                    var maxNum = Math.max.apply(null, arr);
                    var maxIndex = -1;
                    arr.forEach(function (num, index) {
                        if (num >= maxNum) {
                            maxIndex = index;
                            return;
                        }
                    });
                    return maxIndex;
                };
                _this.prevPredictions = _this.lastPredictions;
                _this.prevMovementDirection = _this.lastMovementDirection;
                var dir = findMaxNumIndexInArray(predictions);
                // We will use this state to optimize the training performance later
                _this.lastPredictions = predictions;
                _this.lastMovementDirection = dir;
                console.log("AI predictions ==> " + predictions + ", dir ===> " + dir);
                console.log("Before moving " + direction_1.DIRATION[dir], _this.matrix.data);
                _this.moveByDirection(dir);
                _this.pushState([dir, _this.matrix.data]);
                console.log('After moving', _this.matrix.data);
                // Tell the programme to generate next state
                _this.genNewBoardState();
            }
        };
        try {
            // promise-like return values, probably returned by tensorflow
            predictionPromiseLike.data().then(predictionFn);
        }
        catch (e) {
            predictionFn.call(null, predictionPromiseLike);
        }
    };
    Game.prototype.pushState = function (step) {
        this.states.push(step);
    };
    Game.prototype.moveByDirection = function (dir) {
        switch (dir) {
            case direction_1.DIRATION.UP:
                this.moveUp();
                break;
            case direction_1.DIRATION.DOWN:
                this.moveDown();
                break;
            case direction_1.DIRATION.LEFT:
                this.moveLeft();
                break;
            case direction_1.DIRATION.RIGHT:
                this.moveRight();
                break;
        }
    };
    Game.prototype.compareMatrix = function (matrixA, matrixB) {
        var ma = matrixA.data, ra = matrixA.r, ca = matrixA.c;
        var mb = matrixB.data, rb = matrixB.r, cb = matrixB.c;
        if (ra !== rb || ca !== cb)
            return false;
        for (var i = 0; i < ra; i++) {
            for (var j = 0; j < ca; j++) {
                if (ma[i][j] !== mb[i][j]) {
                    return false;
                }
            }
        }
        return true;
    };
    Game.prototype.isMovable = function (dir) {
        var originalMatrix = this.matrix.clone();
        this.moveByDirection(dir);
        if (this.compareMatrix(originalMatrix, this.matrix)) {
            this.setMatrix(originalMatrix);
            return false;
        }
        return true;
    };
    Game.prototype.setMatrix = function (matrix) {
        this.matrix = matrix;
    };
    Game.prototype.rotateCounterClockwise = function (matrix) {
        // 逆时针旋转90度相当于顺时针旋转270度，先这么来吧，后边再优化
        return this.rotateClockwise(matrix, 3);
    };
    /** 顺时针旋转二维矩阵，参考我的LeetCode AC case
     *  https://leetcode.com/submissions/detail/16339569/
       * input:
       * [
       *  [1, 2],
       *  [3, 4]
       * ]
       *
       * output:
       *
       * [
       *  [4, 1],
       *  [3, 2]
       * ]
       *
       * 即
       * 【
       *    A(0,0), ....., A(0, j+c-1),
       *    ....
       *    A(r-1,0), ....., A(r-1, j+c-1),
       *  】
       * 进行顺时针旋转有如下的变换关系，记起始变换位置为(x, y)，blablabla
       *
       */
    Game.prototype.rotateClockwise = function (matrix, rotateTimes) {
        if (rotateTimes === void 0) { rotateTimes = 1; }
        var tmpMatrix = matrix.clone();
        var data = tmpMatrix.data, r = tmpMatrix.r, c = tmpMatrix.c;
        var modedRotateTimes = rotateTimes % 4;
        while (modedRotateTimes--) {
            for (var i = 0, len = r; i < ~~(r / 2); i++, len -= 2) {
                for (var j = i; j < c - i - 1; j++) {
                    var t = data[i][j];
                    data[i][j] = data[i + len - 1 - (j - i)][i];
                    data[i + len - 1 - (j - i)][i] = data[i + len - 1][i + len - 1 - (j - i)];
                    data[i + len - 1][i + len - 1 - (j - i)] = data[j][i + len - 1];
                    data[j][i + len - 1] = t;
                }
            }
        }
        return tmpMatrix;
    };
    Game.prototype.moveUp = function () {
        // 相当于顺时针旋转，右移，再进行逆时针旋转
        var tmpMatrix = this.rotateClockwise(this.matrix);
        this.setMatrix(tmpMatrix);
        this.moveRight();
        var targetMatrix = this.rotateCounterClockwise(this.matrix);
        this.setMatrix(targetMatrix);
    };
    Game.prototype.moveDown = function () {
        // 相当于逆时针旋转，右移，再进行顺时针旋转
        var tmpMatrix = this.rotateCounterClockwise(this.matrix);
        this.setMatrix(tmpMatrix);
        this.moveRight();
        var targetMatrix = this.rotateClockwise(this.matrix);
        this.setMatrix(targetMatrix);
    };
    Game.prototype.moveLeft = function () {
        var shiftedMatrix = this.shiftLeft(this.matrix);
        var accumulatedMatrix = this.accumulateLeft(shiftedMatrix);
        this.setMatrix(accumulatedMatrix);
    };
    Game.prototype.moveRight = function () {
        var shiftedMatrix = this.shiftRight(this.matrix);
        var accumulatedMatrix = this.accumulateRight(shiftedMatrix);
        this.setMatrix(accumulatedMatrix);
    };
    Game.prototype.shiftLeft = function (matrix) {
        var tmpMatrix = matrix.clone();
        var data = tmpMatrix.data, r = tmpMatrix.r, c = tmpMatrix.c;
        for (var i = 0; i < r; i++) {
            var zeroArr = [];
            var tmp = [];
            for (var j = 0; j < c; j++) {
                if (data[i][j] === 0) {
                    zeroArr.push(0);
                }
                else {
                    tmp.push(data[i][j]);
                }
            }
            data[i] = tmp.concat(zeroArr);
        }
        return tmpMatrix;
    };
    Game.prototype.accumulateLeft = function (matrix) {
        var tmpMatrix = matrix.clone();
        var data = tmpMatrix.data, r = tmpMatrix.r, c = tmpMatrix.c;
        for (var i = 0; i < r; i++) {
            for (var j = 0; j < c; j++) {
                if (data[i][j] === 0 && data[i][j + 1] > 0) {
                    data[i][j] = data[i][j + 1];
                    data[i][j + 1] = 0;
                }
                else if (data[i][j] !== 0 && data[i][j] === data[i][j + 1]) {
                    data[i][j] *= 2;
                    this.score += data[i][j];
                    data[i][j + 1] = 0;
                }
            }
        }
        return tmpMatrix;
    };
    Game.prototype.shiftRight = function (matrix) {
        var tmpMatrix = matrix.clone();
        var data = tmpMatrix.data, r = tmpMatrix.r, c = tmpMatrix.c;
        for (var i = 0; i < r; i++) {
            var row = [];
            for (var j = 0; j < c; j++) {
                if (data[i][j] === 0) {
                    row.unshift(0);
                }
                else {
                    row.push(data[i][j]);
                }
            }
            data[i] = row;
        }
        return tmpMatrix;
    };
    Game.prototype.accumulateRight = function (matrix) {
        var tmpMatrix = matrix.clone();
        var data = tmpMatrix.data, r = tmpMatrix.r, c = tmpMatrix.c;
        for (var i = 0; i < r; i++) {
            for (var j = c - 1; j > 0; j--) {
                if (data[i][j] === 0 && data[i][j - 1] > 0) {
                    data[i][j] = data[i][j - 1];
                    data[i][j - 1] = 0;
                }
                else if (data[i][j] !== 0 && data[i][j] === data[i][j - 1]) {
                    data[i][j] *= 2;
                    this.score += data[i][j];
                    data[i][j - 1] = 0;
                }
            }
        }
        return tmpMatrix;
    };
    Game.prototype.isGameOver = function () {
        return false;
    };
    Game.prototype.genRandomCordinate = function () {
        var cords = this.findEmptyCordinates();
        if (cords.length) {
            return cords[Math.floor(Math.random() * cords.length)];
        }
        else {
            return [];
        }
    };
    Game.prototype.findEmptyCordinates = function () {
        var data = this.matrix.data;
        var cordinates = [];
        data.forEach(function (row, x) {
            row.forEach(function (item, y) {
                if (item === 0) {
                    cordinates.push([x, y]);
                }
            });
        });
        return cordinates;
    };
    return Game;
}());
exports.default = Game;
