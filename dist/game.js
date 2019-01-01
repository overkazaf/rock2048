"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var matrix_1 = require("./matrix");
var direction_1 = require("./enums/direction");
var random_1 = require("./TrainModels/random");
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
        this.lastPredictions = [];
        this.lastMovementDirection = null;
        this.trainModel = new random_1.RandomTrainModel();
        this.lastState = [];
    }
    Game.prototype.print = function (prefix) {
        var data = this.matrix.data;
        console.log(prefix || '', "score::" + this.score);
        data.forEach(function (row) {
            var current = [];
            row.forEach(function (item) {
                current.push(item);
            });
            console.log("[ " + current.join(',') + " ]");
        });
    };
    Game.prototype.predictNextDirection = function () {
        var state = this.convertBoardStateToVector();
        this.lastState = state;
        return this.trainModel.predict(state);
    };
    Game.prototype.genNextRandomDirection = function () {
        return ~~(Math.random() * 4);
    };
    Game.prototype.handleGameOver = function () {
        // const input = this;
        // const label = [];
        // // 优化之前移动导致游戏结束的状态
        // if (this.lastPredictions) {
        // }
        // trainingDataSet.inputs.push(input);
        // trainingDataSet.labels.push(label);
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
                // 移动
                _this.moveByDirection(dir);
                emptyBlockCounts.push(_this.findEmptyCordinates().length);
                scores.push(_this.score);
            }
            existed2Counts.push(_this.findExistedNumberCounts(2));
            // 还原状态
            _this.setMatrix(originalMatrix);
        });
        return [
            emptyBlockCounts,
            scores,
            existed2Counts,
        ];
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
        console.log("U failed, final score:" + this.score + ", total steps: " + this.states.length / 2);
        console.log('Final 2048 game state', this.matrix.data);
    };
    Game.prototype.start = function () {
        var _this = this;
        var c = 0;
        this.timer = setInterval(function () {
            if (c++ % 2 === 0) {
                var cords = _this.genRandomCordinate();
                if (!cords.length) {
                    clearInterval(_this.timer);
                    _this.showGameOverMessage();
                    _this.trainingRecords.push([_this.score, _this.states]);
                    _this.handleGameOver();
                    return;
                }
                var x = cords[0], y = cords[1];
                _this.matrix.data[x][y] = 2;
                _this.pushState([-1, _this.matrix.data]);
                _this.print();
            }
            else {
                var predictions = _this.predictNextDirection();
                if (predictions.every(function (p) { return p == 0; })) {
                    _this.showGameOverMessage();
                }
                else {
                    var findDirByIndex = function (arr) {
                        return arr.indexOf(Math.max.apply(null, arr));
                    };
                    var dir = findDirByIndex(predictions);
                    // We will use this state to optimize the training performance later
                    _this.lastPredictions = predictions;
                    _this.lastMovementDirection = dir;
                    _this.moveByDirection(dir);
                    _this.pushState([dir, _this.matrix.data]);
                }
            }
        }, 0);
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
    /** 顺时间旋转二维矩阵，参考我的LeetCode AC case
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
       * 进行顺时间旋转有如下的变换关系，记起始变换位置为(x, y)，blablabla
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
