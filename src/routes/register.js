const express = require("express");
const router = express.Router();
const { customersRepo, loansRepo } = require("../db/datasource");
const catchAsync = require("../utils/catchAsync");
const { CS_Calculator } = require("../utils/creditScoreCalculator");
const { calculateInterest } = require("../utils/calculateInterest");

router.post("/register", async (req, res) => {
  console.log(req.body);

  const { first_name, last_name, age, monthly_income, phone_number } = req.body;

  try {
    const approved_limit = 36 * monthly_income;

    const created = await customersRepo.save(
      customersRepo.create({
        first_name,
        last_name,
        age,
        monthly_salary: monthly_income,
        phone_number,
        approved_limit,
      })
    );

    res.json(created);
  } catch (e) {
    console.log(e);
    res.status(500).send("Server error");
  }
});

router.get(
  "/view-loan/:loanId",
  catchAsync(async (req, res) => {
    const { loanId } = req.params;

    if (!loanId) {
      return res.status(400).send("Provide a loan id");
    }

    const loan = await loansRepo
      .createQueryBuilder("loans")
      .where("loans.loan_id=:loanId", { loanId })
      .leftJoinAndSelect("loans.customer", "customer")
      .getOne();

    if (!loan) {
      return res.status(404).send("Loan not found");
    }

    const { start_date, end_date, emis_paid_on_time, customer, ...rest } = loan;

    const { monthly_salary, current_debt, approved_limit, ...r } =
      loan.customer;

    res.json({
      ...rest,
      customer: r,
    });
  })
);

router.get(
  "/view-statement/:customerId/:loanId",
  catchAsync(async (req, res) => {
    const { loanId, customerId } = req.params;

    if (!customerId) {
      return res.status(400).send("Provide params");
    }

    if (!loanId) {
      const loans = await loansRepo
        .createQueryBuilder("loans")
        .leftJoinAndSelect("loans.customer", "customer")
        .where("customer.customer_id=:customerId", { customerId })
        .getMany();

      if (!loans.length) {
        return res.status(404).send("Loan not found");
      }

      const response = loans.map((loan) => {
        return {
          customer_id: loan.customer.customer_id,
          loan_id: loanId,
          principal: loan.loan_amount,
          interest_rate: loan.interest_rate,
          amount_paid: loan.monthly_repayment * loan.emis_paid_on_time,
          monthly_installment: loan.monthly_repayment,
          repayments_left:
            (loan.loan_amount / loan.monthly_repayment).toFixed(2) -
            loan.emis_paid_on_time,
        };
      });

      return res.json(response);
    }

    const loan = await loansRepo
      .createQueryBuilder("loans")
      .where("loans.loan_id=:loanId", { loanId })
      .leftJoinAndSelect("loans.customer", "customer")
      .getOne();

    if (!loan) {
      return res.status(404).send("Loan not found");
    }

    res.json({
      customer_id: loan.customer.customer_id,
      loan_id: loanId,
      principal: loan.loan_amount,
      interest_rate: loan.interest_rate,
      amount_paid: loan.monthly_repayment * loan.emis_paid_on_time,
      monthly_installment: loan.monthly_repayment,
      repayments_left:
        (loan.loan_amount / loan.monthly_repayment).toFixed(2) -
        loan.emis_paid_on_time,
    });
  })
);

router.post(
  "/check-eligibility",
  catchAsync(async (req, res) => {
    const { customerId, loanAmount } = req.body;

    if (!customerId) {
      return res.status(400).send("Provide Customer Id");
    }
    const customer = await customersRepo
      .createQueryBuilder("customers")
      .where("customers.customer_id=:customerId", { customerId })
      .getOne();

    if (!customer) {
      return res.status(404).send("Customer not found");
    }

    const { approved_limit, customer_id, monthly_repayment, tenure } = customer;

    if (loanAmount > approved_limit) {
      return res.status(400).send("Loan not possible!");
    }
    const results = await loansRepo
      .createQueryBuilder("loans")
      .where("loans.customer_id=:customerId", { customerId })
      .getMany();

    const creditScore = CS_Calculator(results, approved_limit);
    const interest = calculateInterest(creditScore);

    // daw

    res.status(400).json({
      customer_id,
      approval: interest === 0 ? false : true,
      interest_rate: interest,
      corrected_interest_rate: interest,
      tenure,
      monthly_installment: monthly_repayment,
    });
  })
);

router.post("/create-loan", async (req, res) => {
  const { customerId, loanAmount, interestRate, tenure } = req.body;

  if (!customerId) {
    return res.status(400).send("Provide Customer Id");
  }
  const customer = await customersRepo
    .createQueryBuilder("customers")
    .where("customers.customer_id=:customerId", { customerId })
    .getOne();

  if (!customer) {
    return res.send("Customer not found");
  }

  const { approved_limit, customer_id } = customer;

  const results = await loansRepo
    .createQueryBuilder("loans")
    .where("loans.customer_id=:customerId", { customerId })
    .getMany();

  const creditScore = CS_Calculator(results, approved_limit);
  if (loanAmount > approved_limit) {
    res.status(400).send("Loan not possible!");
  }

  if (creditScore === 0) {
    return res.json({
      loan_id: null,
      customer_id,
      loan_approved: false,
      message: "Credit score is not enough",
      monthly_installment: 2,
    });
  }

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + tenure);

  const created = await loansRepo.save(
    loansRepo.create({
      customer,
      loan_amount: loanAmount,
      interest_rate: interestRate,
      tenure,
      monthly_repayment: (loanAmount / (tenure * 12)).toFixed(1),
      start_date: new Date(),
      end_date: endDate,
    })
  );

  console.log(created);

  res.json({
    loan_id: created.loan_id,
    customer_id,
    loan_approved: true,
    message: "Loan approved",
    monthly_installment: 2,
  });
});

router.post(
  "/make-payment/:customerId/:loanId",
  catchAsync(async (req, res) => {
    const { customerId, loanId } = req.params;
    const { amount } = req.body;

    const loan = await loansRepo
      .createQueryBuilder("loans")
      .where("loans.loan_id=:loanId", { loanId })
      .where("loans.customer_id=:customerId", { customerId })
      .getOne();

    if (!loan) {
      return res.status(404).send("Loan not found");
    }

    if (loan.emis_paid_on_time * loan.monthly_repayment >= loan.loan_amount) {
      return res.status(400).send("Loan already paid");
    }

    const { monthly_repayment } = loan;

    if (amount !== monthly_repayment) {
      res.status(400).send("Amount is not same");
      return;
    }

    // await loansRepo
    //   .createQueryBuilder("loans")
    //   .set({ emis_paid_on_time: loan.emis_paid_on_time + 1 })
    //   .where("loans.loan_id = :id", { id: loan.loanId })
    //   .execute();

    await loansRepo.update(
      { loan_id: loan.loanId },
      {
        emis_paid_on_time: loan.emis_paid_on_time + 1,
      }
    );

    res.send("Success");
  })
);

module.exports = router;
