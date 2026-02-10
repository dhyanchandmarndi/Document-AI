module.exports = {
  development: {
    username: "postgres",
    password: "abc@123",
    database: "postgres",
    host: "127.0.0.1",
    dialect: "postgres",
    logging: true,
  },
  test: {
    username: "root",
    password: null,
    database: "database_test",
    host: "127.0.0.1",
    dialect: "mysql",
  },
  production: {
    username: "root",
    password: null,
    database: "database_production",
    host: "127.0.0.1",
    dialect: "mysql",
  },
};
