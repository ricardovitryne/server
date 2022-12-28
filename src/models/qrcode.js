const qrcode = require("qrcode");
const stream = require("./stream");
module.exports = class QRCode {
    static async generate(session, content) {
        try {
            let writeStream = new stream.WritableBufferStream();
            qrcode.toFileStream(writeStream, content, {
                type: "png",
                width: 600,
                height: 600,
                errorCorrectionLevel: "H",
                colorDark: "#000000",
                colorLight: "#ffffff",
            });
            return new Promise((resolve, reject) => {
                writeStream.on("finish", () => {
                    //console.log(writeStream.toBuffer().toString("base64"));
                    console.log(`### [${session}] session.qrcode: OK`);
                    resolve(writeStream.toBuffer());
                });
                writeStream.on("error", function (e) {
                    console.log(`### [${session}] session.qrcode: ${e}`);
                    reject(false);
                });
            });
        } catch (e) {
            return false;
        }
    }
};
