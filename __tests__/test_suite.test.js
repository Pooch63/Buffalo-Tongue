const { describe, test, expect } = require("@jest/globals");

const buffalo = require("../lib/db");

const db = new buffalo.Database();
db.create_table("test_types", {
  rows: [
    { name: "bool", type: buffalo.BOOLEAN },
    { name: "string", type: buffalo.STRING },
    { name: "int", type: buffalo.INT },
    { name: "double", tpye: buffalo.DOUBLE },

    { name: "dbool", type: buffalo.BOOLEAN, default: true },
    { name: "dstring", type: buffalo.STRING, default: "STRING" },
    { name: "dint", type: buffalo.INT, default: 1 },
    { name: "ddouble", type: buffalo.DOUBLE, default: 1.5 },
  ],
});

describe("Create Table", () => {
  const db = new buffalo.Database();
  db.create_table("TABLE", { rows: [] });

  /** Errors: */
  test("More than one unique column throws", () => {
    expect(() =>
      db.create_table("test", {
        rows: [
          { name: "a", type: buffalo.STRING, unique: true },
          { name: "b", type: buffalo.STRING, unique: true },
        ],
      })
    ).toThrow();
  });
  test("Did not provide name in row information to throw", () => {
    expect(() =>
      db.create_table("test", {
        rows: [{ type: buffalo.STRING }],
      })
    ).toThrow();
  });
  test("Did not provide type in row information should throw", () => {
    expect(() =>
      db.create_table("test", {
        rows: [{ name: "a" }],
      })
    ).toThrow();
  });
  test("Creating table with same name as another should throw", () => {
    expect(() => db.create_table("TABLE", { rows: [] })).toThrow();
  });
  test("Default's type does not match column type should throw", () => {
    expect(() =>
      db.create_table("test", {
        rows: [{ name: "row", type: buffalo.INT, default: 1.5 }],
      })
    );
  });

  /** Normal funcitonality */
  test("Normal create table should pass", () => {
    expect(() =>
      db.create_table("test", { rows: [{ name: "a", type: buffalo.STRING }] })
    ).not.toThrow();
  });
});

describe("Insert records", () => {});
