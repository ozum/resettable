import { diff, reset, mayChange } from "./";

const stubLogger = {
  error: () => {},
  warn: () => {},
  info: () => {},
  verbose: () => {},
};

describe("mayChange", () => {
  const a = { name: "Mike", color: "red", option: [1, 3] };
  const b = { name: "Julia", color: "red", option: [1, 2, 3], total: 23 };

  it("should return true for changed object value", () => {
    expect(mayChange(a, b, "name")).toBe(true);
  });

  it("should return false for non-changed object value", () => {
    expect(mayChange(a, b, "color")).toBe(false);
  });

  it("should return true for non-existing object entry", () => {
    expect(mayChange(a, b, "size.name")).toBe(true);
  });

  it("should return true for added object entry", () => {
    expect(mayChange(a, b, "total")).toBe(true);
  });

  it("should return false for non-changed array element", () => {
    expect(mayChange(a, b, "option.0")).toBe(false);
  });

  it("should return true for changed array element", () => {
    expect(mayChange(a, b, "option.1")).toBe(true);
  });

  it("should return true for added array element", () => {
    expect(mayChange(a, b, "option.2")).toBe(true);
  });

  it("should return true for non-existing array element", () => {
    expect(mayChange(a, b, "option.3")).toBe(true);
  });
});

describe("reset", () => {
  describe("with basic object", () => {
    it("should reset added prop", () => {
      const a = { name: "Mike" };
      const b = { name: "Julia", language: "en" };
      const unApplied = reset(b, diff(b, a));
      expect(b).toEqual(a);
      expect(unApplied.length).toBe(0);
    });

    it("should reset deleted prop", () => {
      const a = { name: "Mike" };
      const b = {};
      const unApplied = reset(b, diff(b, a));
      expect(b).toEqual(a);
      expect(unApplied.length).toBe(0);
    });

    it("should reset replaced prop", () => {
      const a = { name: "Mike" };
      const b = { name: "Julia" };
      const unApplied = reset(b, diff(b, a));
      expect(b).toEqual(a);
      expect(unApplied.length).toBe(0);
    });

    it("should reset added/deleted/replaced prop", () => {
      const a = { name: "Mike", language: "en" };
      const b = { name: "Julia", favorite: "blue" };
      const unApplied = reset(b, diff(b, a));
      expect(b).toEqual(a);
      expect(unApplied.length).toBe(0);
    });

    it("should reset undefined", () => {
      const a = undefined;
      const b = { name: "Julia", favorite: "blue" };
      const unApplied = reset(b, diff(b, a));
      expect(b).toEqual({});
      expect(unApplied.length).toBe(0);
    });

    it("should reset with history undefined", () => {
      const b = { name: "Julia", favorite: "blue" };
      const unApplied = reset(b);
      expect(b).toEqual({ name: "Julia", favorite: "blue" });
      expect(unApplied.length).toBe(0);
    });

    it("should reset both data and history undefined", () => {
      const unApplied = reset();
      expect(unApplied.length).toBe(0);
    });
  });

  describe("with basic array", () => {
    it("should reset added prop", () => {
      const a = { option: [0, 1, 2, 3] };
      const b = { option: [0, 1, 2, 3, 4] };
      const unApplied = reset(b, diff(b, a));
      expect(b).toEqual(a);
      expect(unApplied.length).toBe(0);
    });

    it("should reset deleted prop", () => {
      const a = { option: [0, 1, 2, 3] };
      const b = { option: [0, 1, 2] };
      const unApplied = reset(b, diff(b, a));
      expect(b).toEqual(a);
      expect(unApplied.length).toBe(0);
    });

    it("should reset replaced prop", () => {
      const a = { option: [0, 1, 2, 3] };
      const b = { option: [9, 9, 9, 9] };
      const unApplied = reset(b, diff(b, a));
      expect(b).toEqual(a);
      expect(unApplied.length).toBe(0);
    });

    it("should reset added/deleted/replaced prop", () => {
      const a = { option: [0, 1, 2, 3] };
      const b = { option: [1, 9, 3, 5, 4] };
      const unApplied = reset(b, diff(b, a));
      expect(b).toEqual(a);
      expect(unApplied.length).toBe(0);
    });

    it("should delete added prop if in exact position (options.exact = true)", () => {
      const a = { option: [0, 1, 2, 3] };
      const b = { option: [0, 1, 2, 3, 4] };
      const unApplied = reset(b, diff(b, a), { exact: true });
      expect(b).toEqual(a);
      expect(unApplied.length).toBe(0);
    });

    it("should delete added prop when target array has no more elements", () => {
      const a = { option: [1] };
      const b = { option: [] };
      const unApplied = reset(b, diff(b, a));
      expect(b).toEqual(a);
      expect(unApplied.length).toBe(0);
    });

    it("sould clean object by default", () => {
      const a = { option: { id: [[]], code: {} }, list: [], person: { detail: { name: "mike" } }, fav: [[1]] };
      const b = { option: [1], code: { a: 1 } };
      const unApplied = reset(b, diff(b, a));
      expect(b).toEqual({ person: { detail: { name: "mike" } }, fav: [[1]] });
      expect(unApplied.length).toBe(0);
    });

    it("sould not clean object (options.clean = false)", () => {
      const a = { option: { id: [[]], code: {} }, list: [], person: { detail: { name: "mike" } }, fav: [[1]] };
      const b = { option: [1], code: { a: 1 } };
      const unApplied = reset(b, diff(b, a), { clean: false });
      expect(b).toEqual(a);
      expect(unApplied.length).toBe(0);
    });
  });

  describe("with combined object", () => {
    it("should reset added prop", () => {
      const a = {
        name: "mike",
        color: "blue",
        address: { street: "bell", no: 12, option: [1, 2, 3, 4] },
        size: [{ s: 1, n: "s" }, { s: 2, n: "m" }],
      };
      const b = { name: "susan", address: { street: "other", no: [1, 2], option: [1, 9, 3, 4, 12] }, size: [{ x: 3, s: 1, n: "s" }] };
      const unApplied = reset(b, diff(b, a));
      expect(b).toEqual(a);
      expect(unApplied.length).toBe(0);
    });
  });

  describe("user modified object", () => {
    it("should continue to work if if prop to delte does not exist", () => {
      const a = { name: "Mike" };
      const b = { name: "Julia", color: "red" };
      const modifiedB = { name: "Julia" };
      const unApplied = reset(modifiedB, diff(b, a));
      expect(modifiedB).toEqual({ name: "Mike" });
      expect(unApplied.length).toBe(0);
    });

    it("should add replaced data even old data is modified", () => {
      const a = { color: { id: 1, detail: { lang: "en", name: "red" } } };
      const b = { color: { id: 2 } };
      const modifiedB = { name: "Julia" };
      const unApplied = reset(modifiedB, diff(b, a));
      expect(modifiedB).toEqual({ color: { id: 1, detail: { lang: "en", name: "red" } }, name: "Julia" });
      expect(unApplied.length).toBe(0);
    });

    it("should not remove added prop if it is modified by user", () => {
      const a = { name: "Mike" };
      const b = { name: "Mike", color: "blue" };
      const modifiedB = { name: "Mike", color: "red" };
      const unApplied = reset(modifiedB, diff(b, a));
      expect(modifiedB).toEqual({ name: "Mike", color: "red" });
      expect(unApplied.length).toBe(1);
    });

    it("should not replace prop if prop does not exist (options.addNotFound = false)", () => {
      const a = { name: "Mike" };
      const b = { name: "Julia" };
      const modifiedB = { color: "red" };
      const unApplied = reset(modifiedB, diff(b, a), { addNotFound: false });
      expect(modifiedB).toEqual({ color: "red" });
      expect(unApplied.length).toBe(1);
    });

    it("should not replace prop if user modified", () => {
      const a = { name: "Mike" };
      const b = { name: "Julia" };
      const modifiedB = { name: "Tanja" };
      const unApplied = reset(modifiedB, diff(b, a));
      expect(modifiedB).toEqual({ name: "Tanja" });
      expect(unApplied.length).toBe(1);
    });

    it("should replace prop if user modified (options.force = true)", () => {
      const a = { name: "Mike" };
      const b = { name: "Julia" };
      const modifiedB = { name: "Tanja" };
      const unApplied = reset(modifiedB, diff(b, a), { force: true });
      expect(modifiedB).toEqual({ name: "Mike" });
      expect(unApplied.length).toBe(0);
    });

    it("should not add prop if user deleted", () => {
      const a = { name: "Mike", color: "red" };
      const b = { name: "Mike" };
      const modifiedB = { name: "Mike", color: "blue" };
      const unApplied = reset(modifiedB, diff(b, a));
      expect(modifiedB).toEqual({ name: "Mike", color: "blue" });
      expect(unApplied.length).toBe(1);
    });

    it("should log reset operation with name", () => {
      const a = { name: "Mike" };
      const b = { name: "Julia", color: "red" };
      const modifiedB = { name: "George" };
      const unApplied = reset(modifiedB, diff(b, a), { logger: stubLogger, name: "name.js" });
      expect(modifiedB).toEqual({ name: "George" });
      expect(unApplied.length).toBe(1);
    });

    it("should log reset operation without name", () => {
      const a = { name: "Mike" };
      const b = { name: "Julia", color: "red" };
      const modifiedB = { name: "George" };
      const unApplied = reset(modifiedB, diff(b, a), { logger: stubLogger });
      expect(modifiedB).toEqual({ name: "George" });
      expect(unApplied.length).toBe(1);
    });
  });

  describe("user modified array", () => {
    it("should not delete user added prop", () => {
      const a = { option: [0, 1, 2, 3] };
      const b = { option: [0, 1, 2, 3, 4] };
      const modifiedB = { option: [0, 999, 1, 2, 3, 4] };
      const unApplied = reset(modifiedB, diff(b, a));
      expect(modifiedB).toEqual({ option: [0, 999, 1, 2, 3] });
      expect(unApplied.length).toBe(0);
    });

    it("should delete added prop even modified position by user", () => {
      const a = { option: [0, 1, 2, 3] };
      const b = { option: [0, 1, 2, 3, 4] };
      const modifiedB = { option: [4, 0, 1, 2, 3] };
      const unApplied = reset(modifiedB, diff(b, a));
      expect(modifiedB).toEqual({ option: [0, 1, 2, 3] });
      expect(unApplied.length).toBe(0);
    });

    it("should delete added prop in nearest position", () => {
      const a = { option: [0, 1, 2, 3] };
      const b = { option: [0, 1, 2, 3, 4] };
      const modifiedB = { option: [4, 0, 1, 2, 3, 4] };
      const unApplied = reset(modifiedB, diff(b, a));
      expect(modifiedB).toEqual({ option: [4, 0, 1, 2, 3] });
      expect(unApplied.length).toBe(0);
    });

    it("should not delete added prop if not in exact position (options.exact = true)", () => {
      const a = { option: [0, 1, 2, 3] };
      const b = { option: [0, 1, 2, 3, 4] };
      const modifiedB = { option: [4, 0, 1, 2, 3, 4] };
      const unApplied = reset(modifiedB, diff(b, a), { exact: true });
      expect(modifiedB).toEqual({ option: [4, 0, 1, 2, 3, 4] });
      expect(unApplied.length).toBe(1);
    });

    it("should add replaced value even added value not found (options.force = true)", () => {
      const a = { option: [0, 1, 2, 3] };
      const b = { option: [0, 1, 2, 99] };
      const modifiedB = { option: [0, 1, 2, 11] };
      const unApplied = reset(modifiedB, diff(b, a), { force: true });
      expect(modifiedB).toEqual({ option: [0, 1, 2, 3, 11] });
      expect(unApplied.length).toBe(1);
    });

    it("should not add deleted value if it is added by user (duplicated value)", () => {
      const a = { option: [0, 1, 2, 3] };
      const b = { option: [0, 1, 2, 99] };
      const modifiedB = { option: [0, 1, 2, 3, 99] };
      const unApplied = reset(modifiedB, diff(b, a));
      expect(modifiedB).toEqual({ option: [0, 1, 2, 3] });
      expect(unApplied.length).toBe(1);
    });

    it("should not add deleted value if it is added by user (options.checkDuplicate = false)", () => {
      const a = { option: [0, 1, 2, 3] };
      const b = { option: [0, 1, 2, 99] };
      const modifiedB = { option: [0, 1, 2, 3, 99] };
      const unApplied = reset(modifiedB, diff(b, a), { checkDuplicate: false });
      expect(modifiedB).toEqual({ option: [0, 1, 2, 3, 3] });
      expect(unApplied.length).toBe(0);
    });

    it("should not create array if there isn't", () => {
      const a = { option: [0, 1, 2, 3] };
      const b = { option: [0, 1, 2, 99] };
      const modifiedB = {};
      const unApplied = reset(modifiedB, diff(b, a));
      expect(modifiedB).toEqual({});
      expect(unApplied.length).toBe(1);
    });

    it("should create array if there isn't (options.force = true)", () => {
      const a = { option: [0, 1, 2, 3] };
      const b = { option: [0, 1, 2, 99] };
      const modifiedB = {};
      const unApplied = reset(modifiedB, diff(b, a), { force: true });
      expect(modifiedB).toEqual({ option: [3] });
      expect(unApplied.length).toBe(0);
    });
  });

  describe("diff", () => {
    it("should accept undefined", () => {
      const ops = diff();
      expect(ops).toEqual([]);
    });
  });
});
