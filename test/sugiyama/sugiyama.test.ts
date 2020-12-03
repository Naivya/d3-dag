import {
  Operator as CoordOperator,
  NodeSizeAccessor
} from "../../src/sugiyama/coord";
import { SimpleDatum, doub, dummy, single, three, trip } from "../examples";
import {
  coordCenter,
  coordGreedy,
  coordMinCurve,
  coordTopological,
  coordVert,
  decrossOpt,
  decrossTwoLayer,
  layeringCoffmanGraham,
  layeringLongestPath,
  layeringSimplex,
  layeringTopological,
  sugiyama
} from "../../src";

import { DagNode } from "../../src/dag/node";
import { Operator as DecrossOperator } from "../../src/sugiyama/decross";
import { Operator as LayeringOperator } from "../../src/sugiyama/layering";

type SimpleNode = DagNode<SimpleDatum>;

test("sugiyama() works for single node", () => {
  const dag = single();
  const [node] = sugiyama()(dag).dag;
  expect(node.x).toBeCloseTo(0.5);
  expect(node.y).toBeCloseTo(0.5);
});

test("sugiyama() works for double node vertically", () => {
  const dag = doub();
  const [first, second] = sugiyama().layering(layeringTopological())(dag).dag;
  expect(first.x).toBeCloseTo(0.5);
  expect(first.y).toBeCloseTo(0.5);
  expect(second.x).toBeCloseTo(0.5);
  expect(second.y).toBeCloseTo(1.5);
});

test("sugiyama() works for triple node horizontally", () => {
  const dag = trip();
  const [first, second, third] = sugiyama()(dag).dag;
  expect(first.x).toBeCloseTo(0.5);
  expect(first.y).toBeCloseTo(0.5);
  expect(second.x).toBeCloseTo(1.5);
  expect(second.y).toBeCloseTo(0.5);
  expect(third.x).toBeCloseTo(2.5);
  expect(third.y).toBeCloseTo(0.5);
});

test("sugiyama() works for triple node horizontally sized", () => {
  const dag = trip();
  const [first, second, third] = sugiyama().size([6, 2])(dag).dag;
  expect(first.x).toBeCloseTo(1.0);
  expect(first.y).toBeCloseTo(1.0);
  expect(second.x).toBeCloseTo(3.0);
  expect(second.y).toBeCloseTo(1.0);
  expect(third.x).toBeCloseTo(5.0);
  expect(third.y).toBeCloseTo(1.0);
});

test("sugiyama() works with a dummy node", () => {
  const dag = dummy();
  const [first, second, third] = sugiyama()(dag).dag.idescendants("before");
  expect(first.y).toBeCloseTo(0.5);
  expect(second.y).toBeCloseTo(1.5);
  expect(third.y).toBeCloseTo(2.5);

  expect(first.x).toBeGreaterThanOrEqual(0.5);
  expect(first.x).toBeLessThan(1.0);
  expect(third.x).toBeGreaterThanOrEqual(0.5);
  expect(third.x).toBeLessThan(1.0);
  expect(first.x).toBeCloseTo(third.x);
  expect(first.x).not.toBeCloseTo(second.x);
  expect(Math.abs(first.x - second.x)).toBeLessThan(0.5);
});

test("sugiyama() allows changing nodeSize", () => {
  const base = three();

  function nodeSize(node: DagNode): [number, number] {
    const size = parseInt(node.id) + 1;
    return [size, size];
  }

  const layout = sugiyama().nodeSize(nodeSize);
  expect(layout.nodeSize()).toEqual(nodeSize);
  const { dag, width, height } = layout(base);
  expect(width).toBeCloseTo(9);
  expect(height).toBeCloseTo(10);
  const [head, ...rest] = dag.idescendants("before");
  const [tail, ...mids] = rest.reverse();

  for (const node of dag) {
    expect(node.x).toBeGreaterThanOrEqual(1);
    expect(node.x).toBeLessThanOrEqual(8);
  }

  expect(head.y).toBeCloseTo(0.5);
  for (const mid of mids) {
    expect(mid.y).toBeCloseTo(3);
  }
  expect(tail.y).toBeCloseTo(7.5);
});

test("sugiyama() allows changing operators", () => {
  const dag = dummy();
  const layering: LayeringOperator<SimpleNode> = (dag) => {
    for (const [i, node] of dag.idescendants("before").entries()) {
      node.layer = i;
    }
  };
  const decross: DecrossOperator<SimpleNode> = () => undefined;
  const coord: CoordOperator<SimpleNode> = (layers): number => {
    for (const layer of layers) {
      const div = Math.max(1, layer.length);
      layer.forEach((node, i) => {
        node.x = i / div;
      });
    }
    return 1;
  };
  const nodeSize: NodeSizeAccessor<SimpleNode> = () => [2, 2];
  const layout = sugiyama<SimpleNode>()
    .layering(layering)
    .decross(decross)
    .coord(coord)
    .nodeSize(nodeSize)
    .size([1, 2])
    .debug(true);
  expect(layout.layering()).toBe(layering);
  expect(layout.decross()).toBe(decross);
  expect(layout.coord()).toBe(coord);
  expect(layout.nodeSize()).toBe(nodeSize);
  expect(layout.size()).toEqual([1, 2]);
  expect(layout.debug()).toBeTruthy();
  // still runs
  layout(dag);
});

test("sugiyama() allows setting all builtin operators", () => {
  const dag = single();
  // mostly a type check
  const layout = sugiyama()
    .layering(layeringTopological())
    .layering(layeringSimplex())
    .layering(layeringLongestPath())
    .layering(layeringCoffmanGraham())
    .coord(coordCenter())
    .coord(coordVert())
    .coord(coordMinCurve())
    .coord(coordGreedy())
    .coord(coordTopological())
    .decross(decrossTwoLayer())
    .decross(decrossOpt());
  // still runs, although it won't actually run much of this
  const [root] = layout(dag).dag;
  expect(root.x).toBeCloseTo(0.5);
  expect(root.y).toBeCloseTo(0.5);
});

test("sugiyama() throws with noop layering", () => {
  const dag = dummy();
  const layout = sugiyama().layering(() => undefined);
  expect(() => layout(dag)).toThrow(
    "layering did not assign layer to node '0'"
  );
});

test("sugiyama() throws with invalid layers", () => {
  // layers are weird
  const dag = dummy();
  const layout = sugiyama().layering((dag) => {
    for (const node of dag) {
      node.layer = -1;
    }
  });
  expect(() => layout(dag)).toThrow(
    "layering assigned a negative layer (-1) to node '0'"
  );
});

// test("sugiyama() throws with flat layering", () => {
//   // layers are weird
//   const dag = dummy();
//   const layout = sugiyama().layering((dag) => {
//     for (const node of dag) {
//       node.layer = 0;
//     }
//   });
//   expect(() => layout(dag)).toThrow(
//     `layering left child node "1" (0) with a greater or equal layer to parent node "0" (0)`
//   );
// });

test("sugiyama() throws with noop coord", () => {
  const dag = dummy();
  const layout = sugiyama().coord(() => 1);
  expect(() => layout(dag)).toThrow("coord didn't assign an x to node '0'");
});

test("sugiyama() throws with bad coord width", () => {
  const dag = dummy();
  const layout = sugiyama().coord(
    (layers: (DagNode & { x?: number })[][]): number => {
      for (const layer of layers) {
        for (const node of layer) {
          node.x = 2;
        }
      }
      return 1; // 1 < 2
    }
  );
  expect(() => layout(dag)).toThrow(
    "coord assgined an x (2) outside of [0, 1]"
  );
});

test("sugiyama() throws with negative node width", () => {
  const dag = dummy();
  const layout = sugiyama().nodeSize(() => [-1, 1]);
  expect(() => layout(dag)).toThrow(
    "all node sizes must be non-negative, but got width -1 and height 1 for node id: 0"
  );
});

test("sugiyama() throws with negative node height", () => {
  const dag = dummy();
  const layout = sugiyama().nodeSize(() => [1, -1]);
  expect(() => layout(dag)).toThrow(
    "all node sizes must be non-negative, but got width 1 and height -1 for node id: 0"
  );
});

test("sugiyama() throws with zero node height", () => {
  const dag = dummy();
  const layout = sugiyama().nodeSize(() => [1, 0]);
  expect(() => layout(dag)).toThrow(
    "at least one node must have positive height, but total height was zero"
  );
});

test("sugiyama() fails passing an arg to constructor", () => {
  const willFail = (sugiyama as unknown) as (x: null) => void;
  expect(() => willFail(null)).toThrow("got arguments to sugiyama");
});
