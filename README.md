# Buffalo Tongue DB

(go to documentation.md for documentation)

Buffalo Tongue DB is a fun, very small database that stores everything in memory. It does not store data in a file.
It provides type checking, an extremely useful feature in my opinion.

It also supports most database functions, including:

- Create Table
- Insert
- Select
- Select Distinct
- Select Count
- Update
- Delete

(and of course, conditions can be optionally included for every function).

Using Buffalo Tongue is EXTREMELY simple. Installation is just like any other pacakge:

```
npm install buffalo-tongue-db
```

You can create a database with the following:

```typescript
const buffalo = require("buffalo-tongue-db");
//OR
import * as buffalo from "buffalo-tongue-db";

let db = new buffalo.Database();
```

Buffalo Tongue is structured like a traditional relational database, meaning that it has tables. Because it performs type checking,
you need to provide type information upon table creation. Here's a simple example:

```typescript
db.create_table("users", {
  rows: [
    { name: "username", type: buffalo.STRING, unique: true },
    { name: "age", type: buffalo.INT, unique: false },
  ],
});
```

We've created a table to store some user information. Obviously, two users are allowed to be the same age, but each username MUST be unique.
We can see that with this example of inserting data:

```typescript
db.insert("users", { age: 1, username: "Kiyaan" });
//Runs fine because age was not a unique column
db.insert("users", { username: "Bob Smith", age: 1 });
db.insert("users", { age: 10, username: "Sam" });
//The following throws an error because username "Kiyaan" already exists.
db.insert("users", { age: 100, username: "Kiyaan" });
//The following throws an error because the column age was not provided
db.insert("users", { username: "Kaneshka" });
//The following is alright because even though there are unnecessary columns, all the required columns are there
db.insert("users", { garbage: true, age: 10, username: "Jane Doe" });
```

Getting data is just as easy. We can grab all the rows with ages greater than 6 by executing:

```typescript
db.select("users", { age: { gte: 7 } });

//Which then returns:
[{ username: "Kiyaan", age: 10 }];
```

Buffalo Tongue also supports default values. Here's an example where we store info about the items in a shop:

```typescript
db.create_table("products", {
  rows: [
    //Note that we aren't specifying unique: false here. Rows default to not being unique
    { name: "name", type: BuffaloTongue.STRING },
    { name: "cost", type: BuffaloTongue.DOUBLE, default: 5.0 },
  ],
});
```

If we then store two products like so:

```typescript
db.insert("products", { name: "shoes", cost: 100 });
db.insert("products", { name: "gloves" });
```

And log the records:

```typescript
console.log(
  db.select({
    table: "products",
  })
);
```

We see that the default of 5 activated for the gloves:

```typescript
[
  { name: "shoes", cost: 100 },
  { name: "gloves", cost: 5 },
];
```

Additional Features:

## Custom Validation Functions:

Say we want to make sure that usernames are not above some maximum length when inserting them into a database.
If we insert users in multiple places in the code, it can be a bit unmaintable to run this check every time.

Instead, Buffalo Tongue allows you to specify a custom validation that will be run every time an entry is inserted.
If the validation function returns false, an error is thrown.
Here's how we could implement that:

```typescript
db.create_table("users", {
  rows: [
    //Note that we aren't specifying unique: false here. Rows default to not being unique
    {
      name: "username",
      type: buffalo.STRING,
      validation: (value: string) => value.length <= 40,
    },
  ],
});
```

Now, let's insert some data!

```typescript
//This is inserted without a problem
db.insert("users", { username: "This is pretty darn short." });

//This throws an error
db.insert("users", {
  username:
    "This is an unnecessarily, egregiously, shockingly, utterly, DEVASTATINGLY long username. Seriously, you really can't let this happen.",
});
```
