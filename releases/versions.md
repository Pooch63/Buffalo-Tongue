- ### v0.1.0 - MAJOR NEW VERSION. Documentation, delete function

  Markdown file with all necessary documentation.
  Delete function added so that you can remove records that meet a certain condition.

- ### v0.0.3 - Colors when logging, custom validation functions

  You can add custom validation functions to a column in a schema. When you then insert a record, that function
  is called with the value and key,. If it returns false, that record is deemed invalid and an error is thrown.
  When an error is thrown, values are logged with different colors depending on their type.

- ### v0.0.2 - Irrelevant version

  Removed tests in main file. Works exactly the same as v0.0.1.

- ### v0.0.1 - Initial version
  You can create tables, insert records, select records, and select counts. Conditions are working with basic functionality.
