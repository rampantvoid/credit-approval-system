module.exports.calculateInterest = (creditScore) => {
  if (creditScore > 50) return 10;

  if (creditScore > 30 && creditScore <= 50) {
    return 12;
  }

  if (creditScore > 10 && creditScore <= 30) return 16;

  if (creditScore <= 10) return false;

  return 0;
};
