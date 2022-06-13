import { expect } from "chai";
import { to } from "../utils/awaitTo";
import { delay } from "../utils/delay";
import { ensureMinProcessingTime } from "./withMinProcessingTime";

describe("ensureMinProcessingTime", () => {
  it("works when handler resolves (it waits for the min time when the handler processing is faster)", async () => {
    const handler = () => delay(100);

    const startTime = new Date().valueOf();
    await ensureMinProcessingTime(1000)(handler)(undefined);

    const endTime = new Date().valueOf();
    expect(endTime - startTime).to.be.greaterThanOrEqual(1000);
  });
  it("works when async handler throws an error (it waits for the min time and rethrows the error)", async () => {
    const expectedError = new Error("Test error");
    const handler = async () => {
      throw expectedError;
    };

    const startTime = new Date().valueOf();
    const [error] = await to(ensureMinProcessingTime(1000)(handler)(undefined));

    const endTime = new Date().valueOf();
    expect(endTime - startTime).to.be.greaterThanOrEqual(1000);
    expect(error).to.deep.equal(expectedError);
  });
});
