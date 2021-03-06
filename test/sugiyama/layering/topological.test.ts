import { doub, square } from "../../examples";

import { layeringTopological } from "../../../src";
import { toLayers } from "../utils";

test("layeringTopological() works for square", () => {
  const dag = square();
  layeringTopological()(dag);
  const layers = toLayers(dag);
  expect([
    [[0], [1], [2], [3]],
    [[0], [2], [1], [3]]
  ]).toContainEqual(layers);
});

test("layeringTopological() works for disconnected graph", () => {
  const dag = doub();
  layeringTopological()(dag);
  const layers = toLayers(dag);
  expect([
    [[0], [1]],
    [[1], [0]]
  ]).toContainEqual(layers);
});

test("layeringTopological() fails passing an arg to constructor", () => {
  const willFail = (layeringTopological as unknown) as (x: null) => void;
  expect(() => willFail(null)).toThrow("got arguments to topological");
});
