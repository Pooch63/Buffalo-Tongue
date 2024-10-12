const buffalo = require("../../lib/db");
const { Parser } = require("node-sql-parser");
const parser = new Parser();

const prompt = require("prompt-sync")();

const select = require("./select");
const create = require("./create");

const parse_opts = { database: "SQLite" };

const db = new buffalo.Database();

function run(command) {
  if (command == null || command == "quit") process.exit();

  let ast;
  try {
    ast = parser.astify(command, parse_opts);
  } catch (error) {
    console.log("Error:\n" + error.message);
    return;
  }

  try {
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
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

function repl() {
  while (true) {
    let command = prompt(">> ");
    run(command);
  }
}
repl();
