const colors = require("colors/safe");
const TAFFY = require("taffydb");

//@jest-ignore
const buffalo = require("../lib/db");

var product_db = TAFFY.taffy([
  { item: 1, name: "Blue Ray Player", price: 99.99 },
  { item: 2, name: "3D TV", price: 1799.99 },
]);

const db = new buffalo.Database();

db.create_table("catalog", {
  rows: [
    //Note that we aren't specifying unique: false here. Rows default to not being unique
    {
      name: "name",
      type: buffalo.STRING,
    },
    {
      name: "item",
      type: buffalo.INT,
    },
    {
      name: "price",
      type: buffalo.DOUBLE,
    },
  ],
});

//This is inserted without a problem
db.insert(
  "catalog",
  { name: "Blue Ray Player", item: 1, price: 99.99 },
  { item: 2, name: "3D TV", price: 1799.99 }
);

//TaffyDB
console.log(colors.bold(colors.underline("Performance:")));

let tests = [
  {
    name: "Insert",
    buffalo: (i) =>
      db.insert("catalog", {
        item: i,
        name: "asd" + i.toString(),
        price: Math.random(),
      }),
    taffy: (i) =>
      product_db.insert({
        item: i,
        name: "asd" + i.toString(),
        price: Math.random(),
      }),
    iter: 1_000_000,
  },
  {
    name: "Select",
    buffalo: (i) => {
      let z = db.select("catalog", {
        // $validation: (row) => row.item < 500_000,
        item: { lt: 500_000 },
        name: "asd100000",
      });
    },
    taffy: (i) => {
      let z = product_db({
        item: { lt: 500_000 },
        name: { like: "asd100000" },
      });
    },
    iter: 1_000,
  },
];

function test(buffalo_test, taffy_test, iter) {
  let start_buffalo = performance.now();
  for (let i = 0; i < iter; i += 1) {
    buffalo_test(i);
  }
  let buffalo_time = performance.now() - start_buffalo;

  let start_taffy = performance.now();
  for (let i = 0; i < iter; i += 1) {
    taffy_test(i);
  }
  let taffy_time = performance.now() - start_taffy;

  let taffy_won = taffy_time < buffalo_time;
  let tie = taffy_time == buffalo_time;

  let taffy_color = tie ? "yellow" : taffy_won ? "green" : "white";
  let buffalo_color = tie ? "yellow" : taffy_won ? "white" : "green";

  let taffy_stat =
    taffy_won && !tie
      ? `( ${Math.floor((100 * buffalo_time) / taffy_time) / 100}x faster)`
      : "";
  let buffalo_stat =
    taffy_won && !tie
      ? ""
      : `(${Math.floor((100 * taffy_time) / buffalo_time) / 100}x faster)`;

  console.log(
    colors[buffalo_color](`   Buffalo: ${buffalo_time}ms ${buffalo_stat}`)
  );
  console.log(colors[taffy_color](`   TaffyDB: ${taffy_time}ms ${taffy_stat}`));
}

for (let perf_test of tests) {
  console.log(colors.bold(perf_test.name));
  test(perf_test.buffalo, perf_test.taffy, perf_test.iter);
}
