/**
 * @param {string} col
 * @param {Record<string, any>} columns
 */
const get_column = (col, columns) => {
  if (columns[col] != null) return col;
  throw new Error(`Error: Column "${col}" does not exist.`);
};

// Transform the parser's "where" object to a Buffalo Tongue operator
function sql_parse_to_native_where_obj(where, schema) {
  if (where == null) return where;
  let object;

  let columns = {};
  for (let col of schema.columns) columns[col.name] = true;

  console.log(where, schema);

  switch (where.type) {
    // TODO: If they do something like 1 > a, we should be able to handle that.
    case "binary_expr":
      if (where.left.type != "column_ref") {
        throw new Error(
          `Error: Where conditions must have column names to the left. E.g., 1 < a is not okay, but a > 1 is.`
        );
      }
      let col = left.column;
  }
}

module.exports = function (ast, db) {
  console.log(ast, ast.columns, db);

  let table_name = ast.from[0]?.table;
  let table = db.get_table(table_name);
  let where = sql_parse_to_native_where_obj(ast.where, table.schema);

  let cols = [];
  for (let col of ast.columns) {
    let name = col.expr.column;
    if (name != "*") {
      cols.push(name);
      continue;
    }
    cols.push(...table.schema.columns.map((col) => col.name));
  }

  console.log(cols);

  let rows;
  if (ast.distinct != null) {
    rows = db.distinct(table_name);
  }
};
