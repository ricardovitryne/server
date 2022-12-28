const { contactToArray } = require("../models/utils");
const sessions = require("../models/sessions");

module.exports = {
    async checkNumberStatus(req, res) {
        try {
            const phone = req.params?.phone;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            const result = await client.then(async (client) => {
                return await client.checkNumberStatus(`${phone}`);
            });
            return res.status(200).json({ status: "success", message: result });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error on check number status",
            });
        }
    },

    async getAllContacts(req, res) {
        try {
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            let result;
            await client.then(async (client) => {
                result = await client.getAllContacts();
            });
            //
            return res.status(200).json({ status: "success", message: result });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error on get all constacts",
            });
        }
    },

    async getContact(req, res) {
        const phone = req.params?.phone;
        const session = req.params?.session;
        const client = sessions.getSessionClient(session);
        try {
            let result;
            for (const contato of contactToArray(phone, false)) {
                await client.then(async (client) => {
                    result = await client.getContact(`${contato}`);
                });
            }
            //
            return res.status(200).json({ status: "success", message: result });
        } catch (e) {
            return res
                .status(500)
                .json({ status: "error", message: "Error on get contact" });
        }
    },

    async getStatus(req, res) {
        const phone = req.params?.phone;
        const session = req.params?.session;
        const client = sessions.getSessionClient(session);
        try {
            let result;
            for (const contato of contactToArray(phone, false)) {
                await client.then(async (client) => {
                    result = await client.getStatus(`${contato}`);
                });
            }
            return res.status(200).json({ status: "success", message: result });
        } catch (e) {
            return res
                .status(500)
                .json({ status: "error", message: "Error on  get status" });
        }
    },

    async destinationCheck(req, res) {
        const phone = req.params?.phone;
        const session = req.params?.session;
        try {
            const result = await sessions.isDestinationValid(session,phone);

            if (!result){
                return res.status(403).json({status: "error", message: "Número informado não é válido"});
            }
            else {
                return res.status(200).json({status: "success", message: result});
            }
        }
        catch (e) {
            return res
                .status(500)
                .json({ status: "error", message: "Error on  get status" });
        }
    },
};
