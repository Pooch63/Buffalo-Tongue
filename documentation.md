# Buffalo Tongue Documentation

_Note that if you attempt to use a function not referenced in the documentation, Buffalo Tongue's behavior is undefined._

## Buffalo Enum/Type Definitions

### Schema Information:

type `Datatype`

`INT | DOUBLE | STRING`

These are the literal values. E.g., you would write `buffalo.INT`.

type `RowData`

`string | number | boolean`

type `Schema.ColumnInfo`

```typescript
{
  //Name of column
  name: string;
  //Datatype
  //If you try to insert some data and the data for this column does not match the type,
  //an error is thrown.
  type: Datatype;
  //Is the column unique? E.g., does each value HAVE to be different? If true and you
  //try to insert two values for this column that are the same, an error will be thrown.
  //More details further down.
  unique?: boolean = false;
  //Default value if you do not provide an explicit value when inserting a value.
  //More details further down.
  default?: RowData;
  //If provided, this function is called every time you insert a row with the value the user is trying to insert in this column.
  //If the function returns false, an error is thrown.
  //More details further down.
  validation?: (value: any) => boolean;
}
```

type `Schema.Table`

```ts
{
  rows: Schema.ColumnInfo[];
}
```

### Condition Information

type `QueryConditionObject`

```typescript
{
  //For every column in a row you try to insert
  //If that column name is a value in the QueryConditionObject,
  //it checks that value against the provided condition
  [name in string]: //Not equal, equal, <, >, <=, >=
  //If any value is defined in this object, it is tested against the row data.
  //E.g., if lte = 3, this only returns records in which the provided column is less than or equal to 3
  //You may define more than one of these conditions
  | {
        not_eq?: RowData;
        eq?: RowData;
        lt?: number;
        gt?: number;
        lte?: number;
        gte?: number;
      }
    //Or, if this value is simply row data, it checks whether or not the column is equal to this value.
    // It is equivalent to specifying the "eq" value in the object.
    | RowData;
}
```

class `QueryCondition`

- <span style="color:#9E4EF7">constructor</span>

  - <span style="color:#FF7F7F">@param</span> - condition (`QueryConditionObject`)

### Methods

- #### or

  - <span style="color:#FF7F7F">@param</span> - condition (`QueryCondition | QueryConditionObject`)

### Update Information

type `Update`

When you call an update function, if a record meets the provided condition, this is a record of the values the
columns should be set to. Each key is a column name, and each value is the column value.
This will throw an error if you provide an incorrect row type for the column.
`Record<string, RowData>`

## Buffalo Class Definitions

class `Database`

- Example:

  ```typescript
  let database = new buffalo.Database();
  ```

## Methods

- ### create_table

  - <span style="color:#FF7F7F">@param</span> - table (`string`)
    The table name

  - <span style="color:#FF7F7F">@param</span> - schema (`Schema.Table`)
    The table schema

  - <span style="color:#FF7F7F">@return</span> `null`

- ### insert

  - <span style="color:#FF7F7F">@param</span> - table (`string`)
    The table name
  - <span style="color:#FF7F7F">@param</span> - record (`TableRecord`)
    Record to insert

  - <span style="color:#FF7F7F">@return</span> `null`

- ### select

  - <span style="color:#FF7F7F">@param</span> - table (`string`)
    The table name

  - <span style="color:#FF7F7F">@param</span> - condition (`QueryCondition | QueryConditionObject |  null`)
    Condition to check records against. Only records that meet this condition are returned.

  - <span style="color:#FF7F7F">@return</span> `TableRecord[]`

- ### delete

  - <span style="color:#FF7F7F">@param</span> - table (`string`)
    The table name

  - <span style="color:#FF7F7F">@param</span> - condition (`QueryCondition | QueryConditionObject | null`)
    Condition to check records against. Only records that meet this condition are deleted.

  - <span style="color:#FF7F7F">@return</span> `null`

- ### update

  - <span style="color:#FF7F7F">@param</span> - table (`string`)
    The table name

  - <span style="color:#FF7F7F">@param</span> - update (`Update`)
    The update object that proides the values for each column that meets the condition.
    More info in definition.

  - <span style="color:#FF7F7F">@param</span> - condition (`QueryCondition | QueryConditionObject | null`)
    Condition to check records against. Only records that meet this condition are updated.

  - <span style="color:#FF7F7F">@return</span> `null`
