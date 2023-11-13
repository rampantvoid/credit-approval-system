const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'customers',
  columns: {
    customer_id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    first_name: {
      type: 'varchar',
    },
    last_name: {
      type: 'varchar',
    },
    age: {
      type: 'numeric',
    },
    phone_number: {
      type: 'varchar',
      unique: true,
    },
    monthly_salary: {
      type: 'float8',
    },
    approved_limit: {
      type: 'float8',
    },
    current_debt: {
      type: 'float8',
      default: 0,
    },
  },

  relations: {
    loans: {
      type: 'one-to-many',
      target: 'loans',
    },
  },
});
