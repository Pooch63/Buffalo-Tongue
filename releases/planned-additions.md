0. Change rows to columns in create table function.

0.5. Maybe? In create table, it should just be { rows: { a: {type: buffalo.STRING} } } instead of { rows: [ { name: "a", type: buffalo.STRNIG } ] }

1. Allow database to be single table if you specify a schema in the constructor. If you do this, the following might happen:

   - When you try to run a function and specify the table, an error is thrown.

2. Database function overloads. As of now, the way you call a function is with a table name and a condition, e.g.
   `database.select("some_random_table_name", { random_column: { gte: 3 } });`
   But if you only want certain columns, you can call:
   `database.select("some_random_table_name", ["this_column", "and this column only"], { random_column: { gte: 3 } });`
   Or, if you only want one column, you just specify the string.

   ALTERNATIVELY, this could be an optional argument at the end, e.g.
   `database.select("some_random_table_name", { random_column: { gte: 3 } }, "this_column" | ["a", "b"] )`

3. Add objects as a datatype, and maybe the option to provide a schema for those two.

4. Maybe? In create table, allow overload with a simple array of column information.

5. Drop table.
6. add required field to column info that, if false, means a value can be null. This required field defaults to false, but it is always true
   if you specify a default value. If you try to say it's false AND provide a default, an error is thrown.
