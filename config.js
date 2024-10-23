import { Sequelize } from "sequelize";

let host = "103.156.143.43";
let username = "lccoud";
let password = "Lc_loc@72";
let database = "lccoud";

const sequelize = new Sequelize(database, username, password, {
  host,
  logging: false,
  dialect: "mysql",
  pool: {
    max: 10,
    min: 0,
    acquire: 10000, // 10 seconds
    idle: 10000, // 10 seconds
  },
});

async function connectWithRetry() {
  try {
    await sequelize.authenticate();
    console.log("Connected to Sequelize");
  } catch (err) {
    console.error("Unable to connect to Sequelize:", err);
    setTimeout(connectWithRetry, 2000); // Retry connection after 2 seconds
  }
}

connectWithRetry();

export { sequelize };
