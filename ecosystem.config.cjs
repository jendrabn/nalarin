/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config({ path: `${__dirname}/.env` });

const appPort = process.env.APP_PORT || "3001";
const bunPath = process.env.HOME ? `${process.env.HOME}/.bun/bin` : "";
const processPath = [bunPath, process.env.PATH].filter(Boolean).join(":");

module.exports = {
  apps: [
    {
      name: "nalarin",
      script: "bun",
      args: `run start -- --port ${appPort}`,
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        APP_PORT: appPort,
        PATH: processPath,
      },
    },
    {
      name: "nalarin-email-worker",
      script: "bun",
      args: "run email:worker",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PATH: processPath,
      },
    },
  ],
};
