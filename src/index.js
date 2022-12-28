const process = require("process");
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const {server} = require("./server");
const port = process.env.PORT || 8081;
const ip = process.env.IP || "localhost";

server.listen(port, () => {
    console.log(`server listening at http://${ip}:${port}`);
    //
    const axios = require("axios");
    axios
        .get(`http://${ip}:${port}/v3/session/start-all`)
        .then((res) => {
            console.log(`### Start All Sessions - ${res.status}`);
        })
        .catch((err) => {
            console.log(`### Start All Sessions - ${err.message}`);
        });
});
