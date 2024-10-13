const buffalo = require("../../lib/db");

/**
 * @param {string} type
 */
function SQL_TYPE_TO_BUFFALO_TYPE(type) {
  if (
    [
      // Boolean is grouped with numbers because it is allowed to be 0 or 1.
      "BOOLEAN",
      "BIT",
      "TINYINT",
      "SMALLINT",
      "INT",
      "INTEGER",
      "BIGINT",
    ].includes(type)
  ) {
    return buffalo.INT;
  }

  // Technically numeric datatypes are different than doubles in SQLite, but because ALL numbers are doubles in JavaScript
  // and numeric types can be integers OR floats, it just makes sense to combine numerical and float types
  // TODO: If a transformation function is added as an option for a column, a numerical data type should be separate from doubles so that
  // TODO: floats can be rounded down to integers.
  if (
    //Doubles
    ["REAL", "DOUBLE", "FLOAT"].includes(type) ||
    ["NUMERIC"].includes(type)
  )
    return buffalo.DOUBLE;

  if (["CHAR", "VARCHAR", "TEXT"]) return buffalo.STRING;

  // No type found
  console.log(
    "Warning: Type was unsupported by simple testing CLI. Defaulted to INT."
  );
  return buffalo.INT;
}

module.exports = function (ast, db) {
  let columns = [];

  for (let col of ast.create_definitions) {
    let type = col.definition.dataType.toUpperCase();
    columns.push({
      name: col.column.column,
      type: SQL_TYPE_TO_BUFFALO_TYPE(type),
      unique: col.unique == "unique",
      nullable: col.nullable?.value != "not null",
      $validation: (value) => {
        if (value == null) return true;

        if (type == "BOOLEAN" || type == "BIT") return value == 0 || value == 1;
        if (type == "TINYINT") return 0 <= value && value <= 255;
        if (
          type == "SMALLINT" ||
          (type == "INT " && col.definition.length == 2)
        ) {
          return -32768 <= value && value <= 32767;
        }
        if (type == "INT" || type == "INTEGER") {
          return -2147483648 <= value && value <= 2147483647;
        }
        // We have not included this for now because big ints being allowed in the database has not been added yet,
        // so BIGINT could be literally anything now. Same thing for INT8
        // if (type == "BIGINT") return -9223372036854775808n <= value && value <= 9223372036854775807n;

        /** We don't have to check any length parameters for numbers or strings, because per SQLite standard (https://www.sqlite.org/datatype3.html#affinity_name_examples),
            SQLite does not do that itself.
          */
      },
    });
  }

  db.create(/* Table name */ ast.table[0].table, { columns });
};
