const { describe, test, expect } = require("@jest/globals");

const buffalo = require("../lib/db");

const types_db = new buffalo.Database();
types_db.create_table("test_types", {
  rows: [
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
  // test("Did not provide name in row information to throw", () => {
  //   expect(() =>
  //     db.create_table("test", {
  //       rows: [{ type: buffalo.STRING }],
  //     })
  //   ).toThrow();
  // });
  // test("Did not provide type in row information should throw", () => {
  //   expect(() =>
  //     db.create_table("test", {
  //       rows: [{ name: "a" }],
  //     })
  //   ).toThrow();
  // });
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
      db.create_table("test", {
        rows: [{ name: "a", type: buffalo.STRING }],
      })
    ).not.toThrow();
  });
});

describe("Insert records", () => {
  test("Inserting bad type into boolean should throw", () => {
    expect(() => types_db.insert("test_types", { dbool: 1 })).toThrow();
    expect(() => types_db.insert("test_types", { dbool: "Hey!" })).toThrow();
    expect(() => types_db.insert("test_types", { dbool: 1.89 })).toThrow();
  });
  test("Inserting bad type into string should throw", () => {
    expect(() => types_db.insert("test_types", { dstring: false })).toThrow();
    expect(() => types_db.insert("test_types", { dstring: 1 })).toThrow();
    expect(() => types_db.insert("test_types", { dstring: 1.89 })).toThrow();
  });
  test("Inserting bad type into int should throw", () => {
    expect(() => types_db.insert("test_types", { dint: false })).toThrow();
    expect(() => types_db.insert("test_types", { dint: "Hey!" })).toThrow();
    expect(() => types_db.insert("test_types", { dint: 1.89 })).toThrow();
  });
  test("Inserting bad type into double should throw", () => {
    expect(() => types_db.insert("test_types", { ddouble: false })).toThrow();
    expect(() => types_db.insert("test_types", { ddouble: "Hey!" })).toThrow();
  });

  test("Not providing required columns should throw", () => {
    const db2 = new buffalo.Database();
    db2.create_table("table", {
      rows: [
        { name: "required", type: buffalo.STRING },
        { name: "optional", type: buffalo.STRING, default: "DEFAULT" },
      ],
    });
    expect(() => db2.insert("table", {})).toThrow();
  });
  test("Inserting two records with same value in unique column should throw", () => {
    const db3 = new buffalo.Database();
    db3.create_table("table", {
      rows: [{ name: "unique", type: buffalo.STRING, unique: true }],
    });

    db3.insert("table", { unique: "a" });
    expect(() => db3.insert("table", { unique: "a" })).toThrow();
  });

  test("Inserting valid type should be okay", () => {
    expect(() =>
      types_db.insert("test_types", {
        dbool: true,
        dstring: "",
        dint: 1,
        ddouble: 1.5,
      })
    ).not.toThrow();
  });
});

describe("Select records", () => {
  types_db.create_table("users", {
    rows: [
      { name: "username", type: buffalo.STRING, unique: false },
      { name: "age", type: buffalo.INT },
    ],
  });
  types_db.insert("users", { username: "Kiyaan", age: 12 });
  types_db.insert("users", { username: "Bobby", age: 10 });
  types_db.insert("users", { username: "Sam", age: 6 });

  test("Exact condition operations are evaluated correctly", () => {
    //Testing direct equality
    expect(types_db.select("users", { age: 10 })).toMatchObject([
      {
        username: "Bobby",
        age: 10,
      },
    ]);
    //Testing lte
    expect(types_db.select("users", { age: { lte: 11 } })).toMatchObject([
      {
        username: "Bobby",
        age: 10,
      },
      {
        username: "Sam",
        age: 6,
      },
    ]);
  });
  test("Custom validation functions are evaluated correctly", () => {
    //Testing validation function
    expect(
      types_db.select("users", { $validation: (row) => row.age != 6 })
    ).toEqual([
      { username: "Kiyaan", age: 12 },
      { username: "Bobby", age: 10 },
    ]);
    //Testing column-specific validation functions
    expect(
      types_db.select("users", {
        username: (name) => name.length < 6,
      })
    ).toEqual([
      { username: "Bobby", age: 10 },
      { username: "Sam", age: 6 },
    ]);
  });
});

describe("Delete Table", () => {
  const db = new buffalo.Database();
  db.create_table("TABLE", { rows: [] });

  db.drop("TABLE");

  test("Drop table successfully deletes the table", () => {
    expect(() => db.insert("TABLE", {})).toThrow();
  });

  test("Drop nonexistent table throws", () => {
    expect(() => db.drop("i_dont_exist")).toThrow();
  });
});
