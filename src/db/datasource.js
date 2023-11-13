const { DataSource } = require('typeorm');
const entities = require('./entities');

const myDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWD,
  database: process.env.DB_NAME,
  entities,
  synchronize: true,
});

module.exports.initializeDatasource = async () => {
  try {
    console.log('[+] Datasource initializing');
    await myDataSource.initialize();
    console.log('[+] Datasource initialized');
  } catch (err) {
    console.log('[-] Error');
    console.log(err);
  }
};

module.exports.customersRepo = myDataSource.getRepository(entities[0]);
module.exports.loansRepo = myDataSource.getRepository(entities[1]);
