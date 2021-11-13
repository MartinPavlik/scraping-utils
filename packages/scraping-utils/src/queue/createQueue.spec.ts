import { expect } from "chai";
import { createQueue } from "./createQueue";
import { delay } from "../utils/delay";

describe("createQueue", () => {
  describe("enqueue", () => {
    it("adds item to queue", () => {
      const q = createQueue<string>();

      q.enqueue("test-1");
      q.enqueue("test-2");
      q.enqueue("test-3");

      expect(q.getQueue()).to.deep.equal(["test-1", "test-2", "test-3"]);
    });
  });
  describe("subscribe", () => {
    it("consumes items from a queue", async () => {
      const q = createQueue<string>();

      q.enqueue("test-1");
      q.enqueue("test-2");
      q.enqueue("test-3");

      const result: string[] = [];

      await new Promise<void>((resolve, reject) => {
        q.subscribe({
          next: async (message: string) => {
            result.push(message);
          },
          error: reject,
          complete: resolve,
        });
      });

      expect(result).to.deep.equal(["test-1", "test-2", "test-3"]);
    });
    it("allows maximum parallelLimit promises to run in parallel (paralellLimit = 5)", async () => {
      const parallelLimit = 5;
      const q = createQueue<number>({
        parallelLimit,
      });

      const items = new Array(20).fill(0).map((_, i) => i);

      items.forEach(q.enqueue);

      let maximumParallelCount = 0;
      const processedItems: number[] = [];
      let limitBroken = false;

      await new Promise<void>((resolve, reject) => {
        q.subscribe({
          next: async (i: number) => {
            maximumParallelCount++;
            processedItems.push(i);
            if (maximumParallelCount > parallelLimit) {
              limitBroken = true;
            }
            await delay(0);
            maximumParallelCount--;
          },
          error: reject,
          complete: () => {
            resolve();
          },
        });
      });

      expect(limitBroken).to.equal(false);
      expect(processedItems).to.deep.equal(items);
    });
    it("allows maximum parallelLimit promises to run in parallel (paralellLimit = 1)", async () => {
      const parallelLimit = 1;
      const q = createQueue<number>({
        parallelLimit,
      });

      const items = new Array(20).fill(0).map((_, i) => i);

      items.forEach(q.enqueue);

      let maximumParallelCount = 0;
      const processedItems: number[] = [];
      let limitBroken = false;

      await new Promise<void>((resolve, reject) => {
        q.subscribe({
          next: async (i: number) => {
            maximumParallelCount++;
            processedItems.push(i);
            if (maximumParallelCount > parallelLimit) {
              limitBroken = true;
            }
            await delay(0);
            maximumParallelCount--;
          },
          error: reject,
          complete: resolve,
        });
      });

      expect(limitBroken).to.equal(false);
      expect(processedItems).to.deep.equal(items);
    });
  });
});
