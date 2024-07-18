1. Allow database to be single table if you specify a schema in the constructor. If you do this, the following might happen:

   - When you try to run a function and specify the table, an error is thrown.

2. Database function overloads. E.g., as of now, the way you call a function is with a table name and a condition, e.g.
   `database.select("some_random_table_name", { random_column: { gte: 3 } });`
   But if you only want certain columns, you can call:
   `database.select("some_random_table_name", ["this_column", "and this column only"], { random_column: { gte: 3 } });`
   Or, if you only want one column
