const sessions = require("../models/sessions");
const enums = require("../models/enums")
const utils = require("../models/utils");

module.exports = {
    async setProfileName(req,res){
        try{
            const {name} = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);

            await client.then(async (client) => {
                await client.setProfileName(name).then((resp)=>{
                    return res.status(201).json({
                        status: "success",
                        message: "Profile name successfully changed",
                    });
                });
            });
            
        }
        catch (e) {
            console.log(e);
            return res.status(500).json({
                status: "error",
                message: "Error changing profile name",
            });
        }
},

    async setProfileName(req,res){
        try{
            const {name} = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);

            await client.then(async (client) => {
                await client.setProfileName(name).then((resp)=>{
                    return res.status(201).json({
                        status: "success",
                        message: "Profile name successfully changed",
                    });
                });
            });
            
        }
        catch (e) {
            console.log(e);
            return res.status(500).json({
                status: "error",
                message: "Error changing profile name",
            });
        }
    },

    async setProfileStatus(req,res){
        try{
            const {status} = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
    
            await client.then(async (client) => {
                await client.setProfileStatus(status).then((resp)=>{
                    return res.status(201).json({
                        status: "success",
                        message: "Profile status successfully changed",
                    });
                });
            });
            
        }
        catch (e) {
            console.log(e);
            return res.status(500).json({
                status: "error",
                message: "Error changing profile status",
            });
        }
    },
    async setProfilePic(req,res){
        try{
            const {base64} = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
    
            await client.then(async (client) => {
                await client.setProfilePic(base64).then((resp)=>{
                    return res.status(201).json({
                        status: "success",
                        message: "Profile photo successfully changed",
                    });
                });
            });
            
        }
        catch (e) {
            console.log(e);
            return res.status(500).json({
                status: "error",
                message: "Error changing profile photo",
            });
        }
    } ,   

};