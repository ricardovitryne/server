const sessions = require("../models/sessions");

module.exports = {
    async pinChat(req, res) {
        try {
            const { phone, state } = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            await client.then(async (client) => {
                await client.pinChat(phone, state, false);
            });
            //
            return res.status(200).json({
                status: "success",
                message: "Chat fixed",
            });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: e.text || "Error on pin chat",
            });
        }
    },

    async deleteChat(req, res) {
        try {
            const { phone } = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            let result;
            //
            await client.then(async (client) => {
                result = await client.deleteChat(phone);
            });
            //
            return res.status(200).json({
                status: "success",
                message: result,
            });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error deleting conversation",
            });
        }
    },

    async setTyping(req,res){
        try{
            const {phone,duration,value} = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);

            if(duration || value){

                await client.then(async (client) => {
                    await client.startTyping(phone,duration).then((resp)=>{
                        return res.status(201).json({
                            status: "success",
                        });
                    });
                });
            }else{
                await client.then(async (client) => {
                    await client.stopTyping(phone,duration).then((resp)=>{
                        return res.status(201).json({
                            status: "success",
                        });
                    });
                });
            }

            
            
        }
        catch (e) {
            console.log(e);
            return res.status(500).json({
                status: "error",
                message: e,
            });
        }
    },

    async setRecording(req,res){
        try{
            const {phone,duration,value} = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);

            if(duration || value){

                await client.then(async (client) => {
                    await client.startRecording(phone,duration).then((resp)=>{
                        return res.status(201).json({
                            status: "success",
                        });
                    });
                });
            }else{
                await client.then(async (client) => {
                    await client.stopRecording(phone,duration).then((resp)=>{
                        return res.status(201).json({
                            status: "success",
                        });
                    });
                });
            }

            
            
        }
        catch (e) {
            console.log(e);
            return res.status(500).json({
                status: "error",
                message: e,
            });
        }
    },

    async archiveChat(req, res) {
        try {
            const { phone, value = true } = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            let result;
            //
            result = await client.then(async (client) => {
                result = await client.archiveChat(phone, value);
            });
            //
            return res.status(201).json({ status: "success", message: result });
        } catch (e) {
            return res
                .status(500)
                .json({ status: "error", message: "Error on archive chat" });
        }
    },

    async setTemporaryMessages(req, res) {
        try {
            const { phone, value = true } = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            let result;
            //
            await client.then(async (client) => {
                result = await client.setTemporaryMessages(phone, value);
            });

            //
            return res.status(200).json({ status: "success", message: result });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error on set temporary messages",
            });
        }
    },

    async clearChat(req, res) {
        try {
            const { phone } = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            let result;
            //
            await client.then(async (client) => {
                result = await client.clearChat(phone);
            });
            //
            return res.status(200).json({
                status: "success",
                message: result,
            });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error clearing conversation",
            });
        }
    },
    async archiveOldChats(req, res) {
        try {
            const { date } = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            let chats;
            let teste;
            let chatsArchived=[];
            //
            if (!date) {
                return res.status(401).send({
                    message: "The Date was not informed",
                });
            }
            //

            const dateEpoch = Math.floor(Date.parse(new Date(date))/1e3)
            await client.then(async (client) => {
                chats = await client.getAllChatsWithMessages(false);
                // caso a last message do chat não esteja na data nem precisa entrar no chat, ja delete ele todo
                chats.map( async (chat)=>{
                    if(chat.t <  dateEpoch){
                        if(!chat.archive){
                        await client.archiveChat(chat.id,true) 
                        chatsArchived.push(chat.id)
                    }
                    }
                    
                })


            });

            return res.status(200).json({
                status: "success",
                chatsArchived: chatsArchived
            });
        } catch (e) {
            return res
                .status(500)
                .json({ status: "error", message: "Error on Archivew message" });
        }
    },
};
