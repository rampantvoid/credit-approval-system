const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "loans",
  columns: {
    loan_id: {
      primary: true,
      type: "int",
      generated: true,
    },

    loan_amount: {
      type: "float8",
    },

    interest_rate: {
      type: "float8",
    },
    tenure: {
      type: "numeric",
    },
    monthly_repayment: {
      type: "float8",
    },
    start_date: {
      type: "date",
    },
    end_date: {
      type: "date",
    },
    emis_paid_on_time: {
      type: "numeric",
      default: 0,
    },
  },

  relations: {
    customer: {
      type: "many-to-one",
      target: "customers",

      joinColumn: {
        name: "customer_id",
      },
    },
  },
});
