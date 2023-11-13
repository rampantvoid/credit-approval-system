const MAX_ALLOWED_LOANS = 10;
const MAX_ALLOWED_LOANS_PER_YEAR = 3;

module.exports.CS_Calculator = (loans, approved_limit) => {
  const checkPaidOnTime = () => {
    for (const loan of loans) {
      const hasPaid =
        loan.emis_paid_on_time * loan.monthly_repayment >= loan.loan_amount;
      if (hasPaid) continue;

      if (new Date() > new Date(loan.end_date)) {
        return false;
      }
    }

    return true;
  };

  const noOfLoansInYear = () => {
    let num = 0;

    for (const loan of loans) {
      const year = new Date(loan.start_date).getFullYear();

      const currentYear = new Date().getFullYear();

      if (year === currentYear) {
        num += 1;
      }
    }

    return num;
  };

  let creditScore = 0;

  if (checkPaidOnTime()) {
    creditScore += 25;
  }

  if (loans.length < MAX_ALLOWED_LOANS) {
    creditScore += 25;
  }

  if (noOfLoansInYear() < MAX_ALLOWED_LOANS_PER_YEAR) {
    creditScore += 25;
  }

  const unpaidTotal = loans.reduce((acc, val) => {
    if (val.emis_paid_on_time * val.monthly_repayment < val.loan_amount) {
      acc += val.loan_amount;
    }
    return acc;
  }, 0);

  if (unpaidTotal >= approved_limit) {
    return 0;
  } else {
    creditScore += 25;
  }

  return creditScore;
};
