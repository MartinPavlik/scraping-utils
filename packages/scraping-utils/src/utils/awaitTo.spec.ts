import { expect } from "chai";
import { to } from "./awaitTo";

describe("utils/awaitTo", () => {
  it("handles rejected promises as well", async () => {
    const error = new Error("error");
    expect(await to(Promise.reject(error))).to.deep.equal([error, undefined]);
  });
});
