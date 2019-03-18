export class Matrix {
  data: number[][];
  r: number;
  c: number;
  constructor(data: number[][]) {
    this.data = data;
    this.r = data.length;
    this.c = data[0].length;
    return this;
  }
  clone(): Matrix {
    const newData: number[][] = [];
    this.data.forEach((r: number[], i: number) => {
      newData[i] = [];
      r.forEach((c: number, j: number) => {
        newData[i][j] = c;
      })
    });
    return new Matrix(newData);
  }
}