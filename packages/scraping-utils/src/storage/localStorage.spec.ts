import { expect } from "chai";
import { createLocalStorage } from "./localStorage";
import { to } from "../utils/awaitTo";

describe("localFileSystemStorage", () => {
  describe("createLocalStorage", () => {
    describe("read", () => {
      it("does not throw if the read file does not exist", async () => {
        const localStorage = createLocalStorage<any>("does-not-exist");

        const [error, result] = await to(localStorage.read());
        expect(error).to.be.undefined;
        expect(result).to.deep.equal([]);
      });
    });
    describe("clear", () => {
      it("does not throw if the read unlinked file does not exist", async () => {
        const localStorage = createLocalStorage<any>("does-not-exist");

        const [error, result] = await to(localStorage.clear());
        expect(error).to.be.undefined;
        expect(result).to.be.undefined;
      });
    });
    it("works", async () => {
      const localStorage = createLocalStorage<number>("my-first-crawler");

      await localStorage.clear();

      expect(await localStorage.doesExist()).to.equal(
        false,
        "local storage should not exist after it has been resetted"
      );

      const [error] = await to(localStorage.read());

      expect(error).to.be.undefined;

      await localStorage.write([1, 2, 3]);

      expect(await localStorage.doesExist()).to.equal(true);

      expect(await localStorage.read()).to.deep.equal([1, 2, 3]);

      await localStorage.write([4, 5, 6]);
      expect(await localStorage.read()).to.deep.equal([4, 5, 6]);

      await localStorage.clear();

      expect(await localStorage.doesExist()).to.equal(false);
    });
  });
});
