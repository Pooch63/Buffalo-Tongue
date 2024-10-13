module.exports = function (ast, db) {
  let name = ast.name[0].table;
  if (ast.prefix?.toUpperCase() == "IF EXISTS") {
    try {
      db.get_table(name);
    } catch (e) {
      // The table didn't exist
      return;
    }
  }

  db.drop(name);
};
