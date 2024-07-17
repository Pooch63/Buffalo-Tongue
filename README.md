# Buffalo Tongue DB

Buffalo Tongue DB is a fun, very small database that stores everything in memory. It does not store data in a file.
It provides type checking, an extremely useful feature in my opinion.

Using Buffalo Tongue is EXTREMELY simple. You can create a database by the following:

```typescript
let db = new Buffalo Tongue.Database();
```

Buffalo Tongue is structured like a traditional relational database, meaning that it has tables. Because it performs type checking,
you need to provide type information upon table creation. Here's a simple example:

```typescript
db.create_table({
  name: "users",
  schema: {
    rows: [
      { name: "username", type: Buffalo Tongue.STRING, unique: true },
      { name: "age", type: Buffalo Tongue.INT, unique: false },
    ],
  },
});
```

We've created a table to store some user information. Obviously, two users are allowed to be the same age, but each username MUST be unique.
We can see that with this example of inserting data:

```typescript
db.insert({ table: "users", record: { age: 1, username: "Kiyaan" } });
db.insert({ table: "users", record: { username: "Bob Smith", age: 1 } }); //Runs fine because age was not a unique column
db.insert({ table: "users", record: { age: 10, username: "Sam" } });
db.insert({ table: "users", record: { age: 100, username: "Kiyaan" } }); //Throws error because username "Kiyaan" already exists. For the rest of the demo, assume that we did not run this.
```

Getting data is just as easy. We can grab all the rows by executing:

```typescript
db.select({
  table: "users",
  condition: { age: { gte: 7 } },
});

//Which then returns:
[{ username: "Kiyaan", age: 10 }];
```

Buffalo TongueDB also supports default values. Here's an example where we store info about the items in a shop:

```typescript
db.create_table({
  name: "products",
  schema: {
    rows: [
      //Note that we aren't specifying unique: false here. Rows default to not being unique
      { name: "name", type: Buffalo Tongue.STRING },
      { name: "cost", type: Buffalo Tongue.DOUBLE, default: 5.0 },
    ],
  },
});
```

If we then store two products like so:

```typescript
db.insert({ table: "products", record: { name: "shoes", cost: 100 } });
db.insert({ table: "products", record: { name: "gloves" } });
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
