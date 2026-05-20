require("dotenv").config({ path: `${__dirname}/.env` });

const appPort = process.env.APP_PORT || "3001";

module.exports = {
  apps: [
    {
      name: "nalarin",
      script: "npm",
      args: `run start -- --port ${appPort}`,
      cwd: "/srv/nalarin",
      env: {
        NODE_ENV: "production",
        APP_PORT: appPort,
      },
    },
  ],
};
