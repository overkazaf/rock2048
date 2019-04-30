"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var matrix_1 = require("./matrix");
var direction_1 = require("./enums/direction");
var Models = require("./TrainModels/index");
var chalk = require('chalk');
var fs = require('fs');
var path = require('path');
var RandomModel = Models.RandomModel, NNModel = Models.NNModel;
var SWITCH_PLAYER_TIMEOUT = 0;
var RESTART_COUNT = process.argv[2] || 5;
var trainingDataSet = {
    inputs: [],
    labels: [],
};
var Game = (function () {
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
        this.trainRecords = [];
        this.prevPredictions = [];
        this.lastPredictions = [];
        this.lastState = [];
        this.prevState = [];
        this.prevMovementDirection = null;
        this.lastMovementDirection = null;
        this.trainModel = new NNModel();
        this.trainModel.init();
        this.restartCount = RESTART_COUNT;
    }
    Game.prototype.resetMatrix = function () {
        this.score = 0;
        this.matrix = new matrix_1.Matrix([
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ]);
    };
    Game.prototype.printState = function (prefix) {
        var data = this.matrix.data;
        console.log(chalk.yellow("\nCurrent score: " + this.score + ", board state: "));
        data.forEach(function (row) {
            var current = [];
            row.forEach(function (item) {
                current.push(item);
            });
            console.log(chalk.green("[ " + current.join(',') + " ]"));
        });
        console.log('\n');
    };
    Game.prototype.predictNextDirection = function () {
        this.prevState = this.lastState;
        console.log("original score: " + this.score);
        var currentState = this.convertBoardStateToVector();
        console.log('currentState in predictNextDirection\n', chalk.red("emptyBlockCounts, scores, existed2Counts"));
        console.table(currentState.map(function (r, i) {
            return r.map(function (c) {
                if (i === 0)
                    return "empty " + c;
                else if (i === 1)
                    return "score " + c;
                else
                    return "2counts " + c;
            });
        }));
        this.lastState = currentState;
        return this.trainModel.predict(currentState);
    };
    Game.prototype.genNextRandomDirection = function () {
        return ~~(Math.random() * 4);
    };
    Game.prototype.handleGameOver = function () {
        var _this = this;
        var label = [];
        // 优化之前移动导致游戏结束的状态
        var _a = this, lastState = _a.lastState, prevMovementDirection = _a.prevMovementDirection, lastMovementDirection = _a.lastMovementDirection;
        switch (lastMovementDirection) {
            case direction_1.DIRECTION.UP:
                // 上次是向上移动挂掉的，同理是可以向下的，下次记得向下做一次尝试，至少不会太差。
                label = [0, 1, 0, 0];
                break;
            case direction_1.DIRECTION.DOWN:
                label = [1, 0, 0, 0];
                break;
            case direction_1.DIRECTION.LEFT:
                label = [0, 0, 0, 1];
                break;
            case direction_1.DIRECTION.RIGHT:
                label = [0, 0, 1, 0];
                break;
        }
        console.log('lastState', 
        // this.convertBoardStateToVector(),
        direction_1.DIRECTION[this.lastMovementDirection], this.lastMatrixShadow, label);
        trainingDataSet.inputs.push(this.convertBoardStateToVector(this.lastMatrixShadow));
        trainingDataSet.labels.push(label);
        if (this.findCurrentMaxNumber() < 2048 && this.restartCount-- > 0) {
            // this.trainRecords.push([ 
            //   this.findCurrentMaxNumber(), 
            //   [this.trainModel.weights, this.trainModel.biases]
            // ]);
            setTimeout(function () {
                _this.resetMatrix();
                _this.start();
            }, 50);
        }
        else {
            console.log('Current max value in the matrix', this.findCurrentMaxNumber());
            console.table(trainingDataSet.inputs[0]);
            console.table(trainingDataSet.inputs[1]);
            console.table(trainingDataSet.labels);
            fs.writeFileSync(path.join(__dirname, "trained_" + new Date() + ".json"), JSON.stringify(trainingDataSet));
        }
        // console.info(
        //   'Training',
        //   'lastMovementDirection ==>',
        //   DIRECTION[lastMovementDirection],
        //   'lastState ==> ',
        //   lastState,
        //   'label ==> ',
        //   label,
        // );
        // this.trainingModel.fit(trainingDataSet.inputs, trainingDataSet.labels);
    };
    Game.prototype.getOptimizedStateToVector = function () {
        var _this = this;
        var directions = [direction_1.DIRECTION.UP, direction_1.DIRECTION.DOWN, direction_1.DIRECTION.LEFT, direction_1.DIRECTION.RIGHT];
        var originalMatrix = this.matrix.clone();
        // 这里可以做一些DFS的优化，进行深度移动的尝试，搜索从某个方向开始，在N次移动后的分值
        // 必要的时候可以memorized，后续做剪枝
        var board = (_a = {},
            _a[direction_1.DIRECTION.UP] = [],
            _a[direction_1.DIRECTION.DOWN] = [],
            _a[direction_1.DIRECTION.LEFT] = [],
            _a[direction_1.DIRECTION.RIGHT] = [],
            _a);
        var dfs = function (startDir, paths, depth) {
            if (depth === void 0) { depth = 4; }
            if (depth === 0) {
                // 递归结束，还原矩阵
                _this.setMatrix(originalMatrix);
                return;
            }
            var emptyBlockCounts = [];
            var scores = [];
            var existed2Counts = [];
            directions.forEach(function (dir) {
                var oldScore = _this.score;
                if (!_this.isDirMovable(dir)) {
                    emptyBlockCounts.push(0);
                }
                else {
                    _this.moveByDirection(dir);
                    emptyBlockCounts.push(_this.findEmptyCoordinates().length);
                }
                scores.push(_this.score);
                existed2Counts.push(_this.findCurrentMaxNumber());
                var rMatrix = _this.matrix.clone();
                var newPaths = paths.slice();
                newPaths.push(dir);
                console.log('newPaths', newPaths.join('-'));
                // if (emptyBlockCounts.length === 4 && depth === 1) {
                //   // 只放入最后第depth次移动的结果，根据其分值进行预测
                //   board[startDir].push({
                //     emptyBlockCounts,
                //     scores,
                //     existed2Counts,
                //   });
                // }
                board[paths.join('-')] = {
                    score: _this.score,
                    state: rMatrix.data,
                };
                dfs(startDir, newPaths, depth - 1);
                _this.score = oldScore;
                _this.setMatrix(rMatrix);
                newPaths.pop();
            });
        };
        this.setMatrix(originalMatrix);
        directions.forEach(function (dir) {
            dfs(dir, [], 3);
        });
        // 对比maxState与state的评分，我们用相应的权重做加权对比
        var ys = function (givenState) {
            return directions.map(function (dir) {
                if (givenState.emptyBlockCounts[dir] === 0)
                    return 0;
                return _this.trainModel.weights[0] * givenState.emptyBlockCounts[dir] || 0 +
                    _this.trainModel.weights[0] * givenState.scores[dir] || 0 +
                    _this.trainModel.weights[0] * givenState.existed2Counts[dir] || 0 +
                    _this.trainModel.biases[0];
            });
        };
        var getMaxEvalState = function (states) {
            var maxState = {};
            states.forEach(function (state) {
                if (!Object.keys(maxState).length) {
                    maxState = __assign({}, state);
                }
                else {
                    var ys1 = Math.max.apply(null, ys(maxState));
                    var ys2 = Math.max.apply(null, ys(state));
                    if (ys2 > ys1) {
                        maxState = __assign({}, state);
                    }
                }
            });
            return maxState;
        };
        var dfsMaxEvaluations = function () {
            var evals = Object.keys(board).map(function (dir) {
                // 找到评估最高的state并返回
                return getMaxEvalState(board[dir]);
            });
            return evals;
        };
        console.log('board', board);
        var _b = getMaxEvalState(dfsMaxEvaluations()), emptyBlockCounts = _b.emptyBlockCounts, scores = _b.scores, existed2Counts = _b.existed2Counts;
        return [
            emptyBlockCounts,
            scores,
            existed2Counts,
        ];
        var _a;
    };
    Game.prototype.convertBoardStateToVector = function (givenMatrix) {
        // return this.getOptimizedStateToVector();
        var _this = this;
        var directions = [direction_1.DIRECTION.UP, direction_1.DIRECTION.DOWN, direction_1.DIRECTION.LEFT, direction_1.DIRECTION.RIGHT];
        var emptyBlockCounts = [];
        var scores = [];
        var existed2Counts = [];
        var originalMatrix = givenMatrix || this.matrix.clone();
        // this.getOptimizedStateToVector();
        // console.log('Speculating matrix transformation');
        // console.table(
        //   originalMatrix.data,
        // );
        directions.forEach(function (dir) {
            // 从每个方向开始，递归做尝试
            var oldScore = _this.score;
            if (!_this.isDirMovable(dir)) {
                // 无法移动，说明存在的空格数为0，且强制记住这个值为不可移动
                emptyBlockCounts.push(-1);
                console.log(chalk.red(direction_1.DIRECTION[dir] + " is unreachable..."));
                existed2Counts.push(0);
            }
            else {
                // 移动后计算分值
                _this.moveByDirection(dir);
                emptyBlockCounts.push(_this.findEmptyCoordinates().length);
                // console.log(
                //   chalk.red(`Trying ${DIRECTION[dir]}...`)
                // );
                // console.table(
                //   this.matrix.data,
                // );
                existed2Counts.push(_this.findExistedNumberCounts());
            }
            scores.push(_this.score);
            // 还原状态
            _this.setMatrix(originalMatrix);
            // 还原分数
            _this.score = oldScore;
        });
        return [
            emptyBlockCounts,
            scores,
            existed2Counts,
        ];
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
    Game.prototype.checkContinousNumber = function (data, x, y) {
        var current = data[x][y];
        var count = 0;
        if (data[x][y + 1] && current === data[x][y + 1])
            count++;
        if (data[x][y - 1] && current === data[x][y - 1])
            count++;
        if (data[x + 1] && data[x + 1][y] && current === data[x + 1][y])
            count++;
        if (data[x - 1] && data[x - 1][y] && current === data[x - 1][y])
            count++;
        return count > 0;
    };
    Game.prototype.findExistedNumberCounts = function () {
        var _this = this;
        var data = this.matrix.data;
        var resultMap = {};
        data.forEach(function (row, x) {
            row.forEach(function (item, y) {
                if (typeof resultMap[item] === 'undefined')
                    resultMap[item] = 0;
                if (_this.checkContinousNumber(data, x, y)) {
                    resultMap[item]++;
                }
            });
        });
        var maxCount = 0;
        Object.keys(resultMap).map(function (item) {
            if (resultMap[item] > maxCount)
                maxCount = resultMap[item];
        });
        return maxCount;
    };
    Game.prototype.showGameOverMessage = function () {
        console.log('');
        console.log(chalk.red("U failed, final score:" + this.score + ", total steps: " + this.states.length / 2));
        console.log('Final 2048 game state');
        console.table(this.matrix.data);
        console.log('');
    };
    Game.prototype.start = function () {
        this.genNewBoardState();
    };
    Game.prototype.genNewBoardState = function () {
        var coords = this.genRandomUsableCoordinate();
        if (!coords.length) {
            // Can't find a random position to place
            clearInterval(this.timer);
            this.showGameOverMessage();
            this.trainRecords.push([this.score, this.states]);
            this.handleGameOver();
            return;
        }
        var x = coords[0], y = coords[1];
        // Try to put 2 into a valid place
        this.matrix.data[x][y] = 2;
        this.pushState([
            // marked -1 as AI's movement
            -1, this.matrix.data
        ]);
        if (1) {
            setTimeout(this.simulateNextMove.bind(this), SWITCH_PLAYER_TIMEOUT);
        }
    };
    Game.prototype.simulateNextMove = function () {
        var _this = this;
        var predictionPromiseLike = this.predictNextDirection();
        var predictionFn = function (predictions) {
            console.log('predictions', predictions);
            var cannotMoveAnyMore = predictions.every(function (p) { return p === 0; });
            if (cannotMoveAnyMore) {
                _this.showGameOverMessage();
                _this.handleGameOver();
            }
            else {
                // 找到加权值最大的方向，选择它作为下次移动的方向
                var maxSortedPredictions = predictions.sort(function (a, b) {
                    return b - a;
                });
                var dir = 0;
                for (var i = 0; i < maxSortedPredictions.length; i++) {
                    if (_this.isDirMovable(i)) {
                        dir = i;
                        break;
                    }
                }
                // const dir = findMaxAndMovableDirection(predictions);
                // We will use this state to optimize the training performance later
                // this.lastPredictions = predictions;
                _this.lastMovementDirection = dir;
                console.log("AI predictions ==> " + predictions + ", dir ===> " + direction_1.DIRECTION[dir] + ", isMovable(" + _this.isDirMovable(dir) + ")");
                console.log("Before moving " + direction_1.DIRECTION[dir]);
                console.table(_this.matrix.data);
                // 检查是否真正可移动
                var tmp = _this.matrix.clone();
                _this.moveByDirection(dir);
                var isTheSameMatrix = _this.equalsMatrix(tmp, _this.matrix);
                if (!isTheSameMatrix) {
                    _this.lastMatrixShadow = tmp;
                    _this.lastMovementDirection = dir;
                }
                _this.pushState([dir, _this.matrix.data]);
                console.log("After moving " + direction_1.DIRECTION[dir]);
                console.table(_this.matrix.data);
                // Tell the programme to generate next state
                _this.genNewBoardState();
            }
        };
        try {
            // Promise-Like values, and these values are probably returned by tensorflow
            predictionPromiseLike.data().then(function (data) {
                var exp_sum = data.reduce(function (prev, curr) {
                    return prev + curr;
                }, 0);
                var softmaxData = data.map(function (d) {
                    return d / exp_sum;
                });
                // console.log('softmaxData', fixedData, exp_sum, softmaxData);
                predictionFn(softmaxData);
            });
        }
        catch (e) {
            predictionFn.call(null, predictionPromiseLike);
        }
    };
    Game.prototype.pushState = function (step) {
        this.states.push(step);
        if (1) {
            // For debugging
            this.printState();
        }
    };
    Game.prototype.moveByDirection = function (dir) {
        switch (dir) {
            case direction_1.DIRECTION.UP:
                this.moveUp();
                break;
            case direction_1.DIRECTION.DOWN:
                this.moveDown();
                break;
            case direction_1.DIRECTION.LEFT:
                this.moveLeft();
                break;
            case direction_1.DIRECTION.RIGHT:
                this.moveRight();
                break;
        }
    };
    Game.prototype.equalsMatrix = function (matrixA, matrixB) {
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
    Game.prototype.isDirMovable = function (dir) {
        var originalMatrix = this.matrix.clone();
        this.moveByDirection(dir);
        var isTheSameMatrix = this.equalsMatrix(originalMatrix, this.matrix);
        // 移动后重置
        this.setMatrix(originalMatrix);
        // 如果两个矩阵值不一样，说明是可移动的
        return !isTheSameMatrix;
    };
    Game.prototype.setMatrix = function (matrix) {
        this.matrix = new matrix_1.Matrix(matrix.data.slice());
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
                // 每次len -=2 是因为每一轮的旋转操作，都会消除最外层的两圈数字
                for (var j = i; j < c - i - 1; j++) {
                    // 可以认为是在四个象限里对四个数字进行旋转，记为 A,B,C,D，变换关系为 A->B->C->D->A
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
        // console.log(
        //   'uuuuu'
        // );
        // console.table(
        //   this.matrix.data
        // );
        var tmpMatrix = this.rotateClockwise(this.matrix);
        // console.table(
        //   tmpMatrix.data
        // );
        this.setMatrix(tmpMatrix);
        this.moveRight();
        // console.table(
        //   this.matrix.data
        // );
        var targetMatrix = this.rotateClockwise(this.matrix, 3);
        // console.table(
        //   targetMatrix.data
        // );
        this.setMatrix(targetMatrix);
    };
    Game.prototype.moveDown = function () {
        // 相当于逆时针旋转，右移，再进行顺时针旋转
        // console.log(
        //   'ddddd'
        // );
        // console.table(
        //   this.matrix.data
        // );
        var tmpMatrix = this.rotateCounterClockwise(this.matrix);
        // console.table(
        //   tmpMatrix.data
        // );
        this.setMatrix(tmpMatrix);
        this.moveRight();
        // console.table(
        //   this.matrix.data
        // );
        var targetMatrix = this.rotateClockwise(this.matrix);
        // console.table(
        //   targetMatrix.data
        // );
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
    /**
     * 生成随机可占用的坐标点
     */
    Game.prototype.genRandomUsableCoordinate = function () {
        var coords = this.findEmptyCoordinates();
        if (coords.length) {
            return coords[Math.floor(Math.random() * coords.length)];
        }
        else {
            return [];
        }
    };
    Game.prototype.findEmptyCoordinates = function () {
        var data = this.matrix.data;
        var coordinates = [];
        data.forEach(function (row, x) {
            row.forEach(function (item, y) {
                if (item === 0) {
                    coordinates.push([x, y]);
                }
            });
        });
        return coordinates;
    };
    return Game;
}());
exports.default = Game;
