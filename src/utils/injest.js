const ExcelJS = require("exceljs");
const { customersRepo, loansRepo } = require("../db/datasource");
const path = require("path");

// read excel file
const readExcel = async (path) => {
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.readFile(path);

  const worksheet = workbook.getWorksheet(1);
  const data = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber !== 1) {
      var values = row.values;
      data.push(values.splice(1, values.length));
    }
  });

  return data;
};

// Function to upload Customer Data
const uploadCustomers = async () => {
  try {
    const customers = await readExcel(
      path.join(__dirname, "../../data/customer_data.xlsx")
    );

    for (row of customers) {
      const [
        customer_id,
        first_name,
        last_name,
        age,
        phone_number,
        monthly_salary,
        approved_limit,
      ] = row;

      await customersRepo.save(
        await customersRepo.create({
          first_name,
          last_name,
          age,
          phone_number,
          monthly_salary,
          approved_limit,
        })
      );
    }
  } catch (e) {
    console.log(e.message);
  }
};

// Funtion to upload Loan Data
const uploadLoan = async () => {
  try {
    const loans = await readExcel(
      path.join(__dirname, "../../data/loan_data.xlsx")
    );

    for (row of loans) {
      const [
        customer_id,
        loan_id,
        loan_amount,
        tenure,
        interest_rate,
        emi,
        emis_paid_on_time,
        start_date,
        end_date,
      ] = row;

      await loansRepo.save(
        await loansRepo.create({
          customer: customer_id,
          loan_amount,
          tenure,
          interest_rate,
          monthly_repayment: emi,
          emis_paid_on_time,
          start_date,
          end_date,
        })
      );
    }
  } catch (e) {
    console.log(e.message);
  }
};

// Main function
const InjestData = async () => {
  try {
    await uploadCustomers();
    await uploadLoan();
    console.log("Successfully uploaded data");
  } catch (e) {
    console.error(e.message);
  }
};

module.exports = InjestData;
