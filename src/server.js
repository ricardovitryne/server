const os = require("os");
const express = require("express");
const routes = require("./routes");
const app = new express();

app.use(express.json({ limit: "20mb" }));
app.use(
    express.urlencoded({
        extended: true,
        limit: "20mb",
        parameterLimit: 100000,
    })
);

const tmpdir = os.tmpdir();
app.use(express.static(tmpdir));

app.use(routes);

const server = require("http").createServer(app);

module.exports = { server };

// await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
