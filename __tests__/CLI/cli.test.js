const buffalo = require("../../lib/db");
const { Parser } = require("node-sql-parser");
const parser = new Parser();

const prompt = require("prompt-sync")();

const create = require("./create");
const drop = require("./drop");
const insert = require("./insert");
const select = require("./select");

const parse_opts = { database: "SQLite" };

const db = new buffalo.Database();

const debug_start_commands = ["CREATE TABLE test ( ID int );"];

function run(command) {
  if (command == null || command == "quit") process.exit();

  // Debug command to preload a state.
  if (command == "debug-start") {
    for (let command of debug_start_commands) run(command);
    return;
  }

  let ast;
  try {
    ast = parser.astify(command, parse_opts);
  } catch (error) {
    console.log(error.message);
    return;
  }

  try {
    for (let tree of Array.isArray(ast) ? ast : [ast]) {
      switch (tree.type) {
        case "create":
          create(tree, db);
          break;
        case "drop":
          drop(tree, db);
          break;
        case "insert":
          insert(tree, db);
          break;
        case "select":
          select(tree, db);
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
