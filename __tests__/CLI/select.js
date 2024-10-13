/**
 * @param {string} col
 * @param {Record<string, any>} columns
 */
const get_column = (col, columns) => {
  if (columns[col] != null) return col;
  throw new Error(`Error: Column `);
};

// Transform the parser's "where" object to a Buffalo Tongue operator
function sql_parse_to_native_where_obj(where, schema) {
  if (where == null) return where;
  let object;

  let columns = {};
  for (let col of schema.columns) columns[col.name] = true;

  console.log(where, schema);

  switch (
    where.type
    // case
  ) {
  }
}

module.exports = function (ast, db) {
  console.log(ast, db);

  let table = db.get_table(ast.from[0]?.table);
  let where = sql_parse_to_native_where_obj(ast.where, table.schema);
};
