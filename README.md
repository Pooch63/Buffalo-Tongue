# Buffalo Tongue DB

(go to documentation.md for documentation)

### Warning: Buffalo Tongue is still in beta. Features and API usage may be changed or removed at any time until this project reaches v1.

Buffalo Tongue DB is a fun, very small database with built-in type checking that stores everything in memory (not persistent).

It also supports certain database functions, including:

- Create Table
- Insert
- Select
- Select Distinct
- Select Count
- Update
- Delete

(and of course, conditions can be optionally included for select and update).

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
// We could also say db.create("users"...
db.create("users", {
  columns: [
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
db.insert("users", { age: 1, username: "Bob Smith" });
db.insert("users", { age: 10, username: "Sam" });
//The following throws an error because username "Kiyaan" already exists.
db.insert("users", { age: 100, username: "Kiyaan" });
//The following throws an error because the column age was not provided
db.insert("users", { username: "Kaneshka" });
//The following is alright because even though there are nonexistent columns, all the required columns are there
db.insert("users", { garbage: true, age: 10, username: "Jane Doe" });
```

Getting data is just as easy. We can grab all the rows with ages greater than 6 by executing:

```typescript
db.select("users", { age: { gte: 7 } });

//Which then returns:
[{ age: 100, username: "Kiyaan" }];
```

Buffalo Tongue also supports default values. Here's an example where we store info about the items in a shop:

```typescript
db.create("products", {
  columns: [
    //Note that we aren't specifying unique: false here. Columns default to not being unique
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
console.log(db.select("products"));
```

We see that the default of 5 activated for the gloves:

```typescript
[
  { name: "shoes", cost: 100 },
  { name: "gloves", cost: 5 },
];
```

Go to documentation.md to see all the neat features of Buffalo Tongue!
