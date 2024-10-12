const buffalo = require("../../lib/db");
const { Parser } = require("node-sql-parser");
const parser = new Parser({ database: "MySQL" });

const prompt = require("prompt-sync")();

const select = require("./select");
const create = require("./create");

// console.log(parser.astify("CREATE TABLE asd (  );"));

const db = new buffalo.Database();

function run(command) {
  if (command == null || command == "quit") process.exit();

  console.log(command);

  let ast;
  try {
    ast = parser.astify(command);
  } catch (error) {
    console.log("Error:\n" + error.message);
    return;
  }

  console.log(ast);

  for (let tree of Array.isArray(ast) ? ast : [ast]) {
    switch (tree.type) {
      case "select":
        select(tree, db);
        break;
      case "create":
        create(tree, db);
        break;
    }
  }
}

function repl() {
  while (true) {
    let command = prompt(">> ");
    run(command);
  }
}
repl();
