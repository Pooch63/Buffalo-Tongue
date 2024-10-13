function eval_expr(node) {
  switch (node.type) {
    case "binary_expr":
      switch (node.operator) {
        case "+":
          return eval_expr(node.left) + eval_expr(node.right);
        case "-":
          return eval_expr(node.left) - eval_expr(node.right);
        case "*":
          return eval_expr(node.left) * eval_expr(node.right);
        case "/":
          return eval_expr(node.left) / eval_expr(node.right);
        case "%":
          return eval_expr(node.left) % eval_expr(node.right);
      }
      return null;
    case "number":
      return node.value;
    case "single_quote_string":
    case "double_quote_string":
      return node.value;
  }
}

module.exports = function (ast, db) {
  let row = {};

  let table_name = ast.table[0].table;
  let table_columns = db.get_table(table_name).column_names();

  let values = ast.values[0].value;

  let columns = ast.columns ?? table_columns;

  // Buffalo Tongue does NOT care if a row value has garbage, so  { THIS_COL_DOES_NOT_EXIST: 1, name: "asd" } will be fine
  // So, we must explicitly warn the user that a column doesn't exist
  if (ast.columns) {
    for (let col of ast.columns) {
      if (!table_columns.includes(col)) {
        throw new Error(`Error: Column "${col}" does not exist.`);
      }
    }
  }

  for (let ind = 0; ind < columns.length; ind += 1) {
    let name = columns[ind];
    let expr = values[ind];
    let value = expr == null ? null : eval_expr(expr);
    row[name] = value;
  }

  db.insert(table_name, row);
};
