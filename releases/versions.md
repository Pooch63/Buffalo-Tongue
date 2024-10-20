- ### v0.2.2 - Minimal changes.

  - Neq now does the same thing as not_eq in query conditions.
  - An error is thrown if a column is described as non-nullable and with a default value.
  - You can specify another condition that MUST be true for a column within a condition with the "and" property.

- ### v0.2.1 - Very minimal version. Compiled project. Lib now accurately reflects the TypeScript.

- ### v0.2.0 - Minimal but breaking changes. Nullables columns now allowed.

  Creating a table now needs a "columns" array, not a "rows" array. It has now switched to:

  ```typescript
  db.create("table", {
    columns: [{ name: "Column", type: buffalo.INT }],
  });
  ```

- ### v0.1.4 - Fixed validation function bugs

- ### v0.1.3 - Custom validation functions, new aliases

  Query condition objects now allow vlaidation functions that are called for every record to ensure they are valid.
  Furthermore, a function can be specified for every column in a row to ensure that the column is valid as well.
  `create` new alias for `create_table`, `distinct` for `select_distinct`, `count` for `select_count`, `drop` for `drop_table`.

- ### v0.1.2 - Select Distinct, change to create table use

  Database now has select distinct function.
  Database.prototype.create_table now accepts parameters as normal arguments instead of an object.

- ### v0.1.1 - Update statement, booleans, better errors

  Now SQL-like update statement.
  Boolean support is finished.
  More errors have color, more info about what caused the errors.

- ### v0.1.0 - MAJOR NEW VERSION. Documentation, delete function

  Markdown file with all necessary documentation.
  Delete function added so that you can remove records that meet a certain condition.

- ### v0.0.3 - Colors when logging, custom validation functions

  You can add custom validation functions to a column in a schema. When you then insert a record, that function
  is called with the value and key,. If it returns false, that record is deemed invalid and an error is thrown.
  When an error is thrown, values are logged with different colors depending on their type.

- ### v0.0.2 - Irrelevant version

  Removed tests in main file. Works exactly the same as v0.0.1.

- ### v0.0.1 - Initial version
  You can create tables, insert records, select records, and select counts. Conditions are working with basic functionality.
