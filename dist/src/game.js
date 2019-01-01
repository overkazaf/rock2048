"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var matrix_1 = require("./matrix");
var DIRATION;
(function (DIRATION) {
    DIRATION[DIRATION["LEFT"] = 0] = "LEFT";
    DIRATION[DIRATION["RIGHT"] = 1] = "RIGHT";
    DIRATION[DIRATION["UP"] = 2] = "UP";
    DIRATION[DIRATION["DOWN"] = 3] = "DOWN";
})(DIRATION || (DIRATION = {}));
;
var Game = /** @class */ (function () {
    function Game() {
        this.matrix = new matrix_1.Matrix([
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]);
        this.score = 0;
        this.isOver = false;
        this.states = [];
        this.trainingRecords = [];
        this.start();
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
        return this.genNextRandomDirection();
    };
    Game.prototype.genNextRandomDirection = function () {
        return ~~(Math.random() * 4);
    };
    Game.prototype.start = function () {
        var _this = this;
        var c = 0;
        this.timer = setInterval(function () {
            if (c++ % 2 === 0) {
                var cords = _this.genRandomCordinate();
                if (!cords.length) {
                    clearInterval(_this.timer);
                    console.error("U failed, final score:" + _this.score + ", total steps: " + _this.states.length / 2);
                    console.log('Final state', _this.matrix.data);
                    _this.trainingRecords.push([_this.score, _this.states]);
                    // this.trainModal.train();
                    return;
                }
                var x = cords[0], y = cords[1];
                _this.matrix.data[x][y] = 2;
                _this.pushState([-1, _this.matrix.data]);
                _this.print();
            }
            else {
                var dir = _this.predictNextDirection();
                while (_this.isMovable(dir))
                    dir = _this.predictNextDirection();
                _this.moveByDirection(dir);
                _this.pushState([dir, _this.matrix.data]);
            }
        }, 30);
    };
    Game.prototype.pushState = function (step) {
        this.states.push(step);
    };
    Game.prototype.moveByDirection = function (dir) {
        switch (dir) {
            case DIRATION.UP:
                this.moveUp();
                break;
            case DIRATION.DOWN:
                this.moveDown();
                break;
            case DIRATION.LEFT:
                this.moveLeft();
                break;
            case DIRATION.RIGHT:
                this.moveRight();
                break;
        }
    };
    Game.prototype.compareMatrix = function (matrixA, matrixB) {
        var ma = matrixA.data, ra = matrixA.r, ca = matrixA.c;
        var mb = matrixB.data, rb = matrixB.r, cb = matrixB.c;
        if (ra !== rb || ca !== cb)
            return false;
        var isTheSame = true;
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
        // 逆时针旋转90度相当于顺时针旋转270度
        return this.rotateClockwise(matrix, 3);
    };
    /** 顺时间旋转矩阵，参考我的LeetCode AC case
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
       * 进行顺时间旋转有如下的变换关系，记起始变换位置为(x, y):
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
    Game.prototype.updateScore = function () {
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
