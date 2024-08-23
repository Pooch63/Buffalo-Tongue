const buffalo = require("../lib/db");

const db = new buffalo.Database();

db.create_table("users", {
  rows: [
    //Note that we aren't specifying unique: false here. Rows default to not being unique
    {
      name: "username",
      type: buffalo.STRING,
      validation: (value) => value.length <= 40,
    },
  ],
});

//This is inserted without a problem
db.insert("users", { username: "This is pretty darn short." });

//This throws an error
db.insert("users", {
  username: "This is also kinda short, ngl.",
});

// db.delete("users", { username: "This is also kinda short, ngl." });

// console.time();
// for (let i = 0; i < 1_000_000; i += 1) {
//   db.insert({
//     table: "products",
//     record: { name: "asd", cost: Math.random() },
//   });
// }
// console.timeEnd();

console.log(db.select("users"), db.select_count("users"));
