const { describe, test, expect } = require("@jest/globals");

const buffalo = require("../lib/db");

describe("Create Table", () => {
  const db = new buffalo.Database();
  db.create("TABLE", { columns: [] });

  /** Errors: */
  test("More than one unique column throws", () => {
    expect(() =>
      db.create_table("test", {
        columns: [
          { name: "a", type: buffalo.STRING, unique: true },
          { name: "b", type: buffalo.STRING, unique: true },
        ],
      })
    ).toThrow();
  });
  test("Creating table with same name as another should throw", () => {
    expect(() => db.create_table("TABLE", { columns: [] })).toThrow();
  });
  test("Default's type does not match column type should throw", () => {
    expect(() =>
      db.create_table("test", {
        columns: [{ name: "row", type: buffalo.INT, default: 1.5 }],
      })
    );
  });
  test("Default value for non-nullable column should throw", () => {
    const db = new buffalo.Database();
    expect(() =>
      db.create("table", {
        columns: [
          { name: "a", type: buffalo.STRING, default: "asd", nullable: false },
        ],
      })
    ).toThrow();
  });

  /** Normal funcitonality */
  test("Normal create table should pass", () => {
    expect(() =>
      db.create_table("test", {
        columns: [{ name: "a", type: buffalo.STRING }],
      })
    ).not.toThrow();
  });
});

describe("Insert records", () => {
  const types_db = new buffalo.Database();
  types_db.create_table("test_types", {
    columns: [
      { name: "dbool", type: buffalo.BOOLEAN, default: true },
      { name: "dstring", type: buffalo.STRING, default: "STRING" },
      { name: "dint", type: buffalo.INT, default: 1 },
      { name: "ddouble", type: buffalo.DOUBLE, default: 1.5 },
    ],
  });

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

  test("Not providing value to non-nullable column should throw", () => {
    const db2 = new buffalo.Database();
    db2.create_table("table", {
      columns: [{ name: "required", type: buffalo.STRING }],
    });
    expect(() => db2.insert("table", {})).toThrow();
  });
  test("Not providing column to nullable column should be fine", () => {
    const db2 = new buffalo.Database();
    db2.create_table("table", {
      columns: [{ name: "nullable", type: buffalo.INT, nullable: true }],
    });
    expect(() => db2.insert("table", {})).not.toThrow();
  });
  test("Default values should be inserted", () => {
    const db2 = new buffalo.Database();
    db2.create_table("table", {
      columns: [{ name: "default", type: buffalo.STRING, default: "asd" }],
    });
    db2.insert("table", {});
    expect(db2.select("table")[0]["default"]).toEqual("asd");
  });

  test("Inserting two records with same value in unique column should throw", () => {
    const db3 = new buffalo.Database();
    db3.create_table("table", {
      columns: [{ name: "unique", type: buffalo.STRING, unique: true }],
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
  test("Inserting value into nonexistent column should throw", () => {
    expect(() => types_db.insert("test_types", { GARBAGE: 1 })).toThrow();
  });

  test("Validation functions for row insertion works", () => {
    const db = new buffalo.Database();
    db.create_table("users", {
      columns: [
        { name: "username", type: buffalo.STRING },
        {
          name: "age",
          type: buffalo.INT,
          validation: (age) => 0 < age && age < 100,
        },
      ],
    });
    expect(() =>
      db.insert(
        "users",
        { age: 1, username: "Kiyaan" },
        { age: 2, username: "Hi!" }
      )
    ).not.toThrow();
    expect(() => db.insert("users", { age: -3, username: "Kiyaan" })).toThrow();
  });
});

describe("Select records", () => {
  const db = new buffalo.Database();
  db.create_table("users", {
    columns: [
      { name: "username", type: buffalo.STRING, unique: false },
      { name: "age", type: buffalo.INT },
    ],
  });

  let data = [
    { username: "Kiyaan", age: 12 },
    { username: "Bobby", age: 10 },
    { username: "Sam", age: 6 },
  ];

  db.insert("users", ...data);

  test("Exact condition operations are evaluated correctly", () => {
    //Testing direct equality
    expect(db.select("users", { age: 10 })).toMatchObject([
      {
        username: "Bobby",
        age: 10,
      },
    ]);
    //Testing lte
    expect(db.select("users", { age: { lte: 11 } })).toMatchObject([
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
    expect(db.select("users", { $validation: (row) => row.age != 6 })).toEqual([
      { username: "Kiyaan", age: 12 },
      { username: "Bobby", age: 10 },
    ]);
    //Testing column-specific validation functions
    expect(
      db.select("users", {
        username: (name) => name.length < 6,
      })
    ).toEqual([
      { username: "Bobby", age: 10 },
      { username: "Sam", age: 6 },
    ]);
  });
  test("No select condition results in all columns", () => {
    expect(db.select("users")).toEqual(data);
  });

  test("Select count works correctly", () => {
    expect(db.count("users")).toEqual(3);
    expect(db.count("users", { age: 12 })).toEqual(1);
    expect(db.count("users", { age: 100 })).toEqual(0);
  });

  test("Select distinct works correctly", () => {
    const db = new buffalo.Database();
    db.create("table", {
      columns: [{ name: "age", type: buffalo.INT }],
    });
    db.insert("table", { age: 12 }, { age: 13 }, { age: 13 });

    expect(db.distinct("table", "age").length).toEqual(2);
    expect(db.distinct("table", ["age"]).length).toEqual(2);
  });

  test("Selecting a compiled array of one column works", () => {
    expect(db.select("users", "age")).toEqual([12, 10, 6]);
  });
});

describe("Delete Table", () => {
  const db = new buffalo.Database();
  db.create_table("TABLE", { columns: [] });

  db.drop("TABLE");

  test("Drop table successfully deletes the table", () => {
    expect(() => db.insert("TABLE", {})).toThrow();
  });
  test("Drop nonexistent table throws", () => {
    expect(() => db.drop("i_dont_exist")).toThrow();
  });
});
