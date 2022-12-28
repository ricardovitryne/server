const sessions = require("../models/sessions");
const qrcode = require("../models/qrcode");
const shell = require("shelljs");
const config = require("../config.json");

module.exports = {
    async qrcode(req, res) {
        try {
            const session = req.params?.session;
            if (!session) {
                return res.status(400).json({
                    status: "error",
                    message: "Need a session",
                });
            }
            const client = sessions.getSession(session);
            //
            if (
                client?.state === "QRCODE" ||
                client?.state === "UNPAIRED" ||
                client?.state === "STARTING"
            ) {
                /*
                    do not use the native form of qrcode generation.
                    does not work on some cell phones.
                    this way I'm generating a qrcode with a better quality.
                    */
                const img = await qrcode.generate(session, client?.qrcodeURL);
                // eslint-disable-next-line no-undef
                const imageBuffer = Buffer.from(img, "base64");
                res.writeHead(200, {
                    "Content-Type": "image/png",
                    "Content-Length": imageBuffer.length,
                });
                return res.end(imageBuffer);
            } else {
                return res.status(404);
            }
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error showing QRCode",
            });
        }
    },

    async start(req, res) {
        try {
            const session = req.params?.session;
            if (!session) {
                res.status(400).json({
                    status: "error",
                    message: "Need a session",
                });
                return;
            }
            const current = await sessions.start(session);
            if (
                [
                    "STARTING",
                    "UNPAIRED_IDLE",
                    "OPENING",
                    "PAIRING",
                    "UNPAIRED",
                    "CONNECTED",
                ].includes(current.state)
            ) {
                return res.status(200).json({
                    status: "success",
                    message: current.state,
                });
            }
            res.status(200).json({ status: "success", message: current.state });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error starting session",
            });
        }
    },

    async status(req, res) {
        try {
            const session = req.params?.session;
            if (!session) {
                res.status(400).json({
                    result: "error",
                    message: "Need a session",
                });
                return;
            }
            const status = await sessions.getStatus(session);
            if (status) {
                res.status(200).json({
                    status: "success",
                    message: status,
                });
            } else {
                res.status(404).json({
                    status: "error",
                    message: `SESSION [${session}] NOT FOUND`,
                });
            }
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error getting session status",
            });
        }
    },

    async restart(req, res) {
        try {
            const session = req.params?.session;
            //
            const result = await sessions.restartSession(session);
            if (result) {
                res.status(200).json({
                    status: "success",
                    message: result,
                });
            } else {
                res.status(404).json({
                    status: "error",
                    message: result,
                });
            }
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error restarting session",
            });
        }
    },

    async close(req, res) {
        try {
            const session = req.params?.session;
            //
            const result = await sessions.closeSession(session);
            if (result) {
                res.status(200).json({
                    status: "success",
                    message: result,
                });
            } else {
                res.status(404).json({
                    status: "error",
                    message: result,
                });
            }
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error close session",
            });
        }
    },

    async logout(req, res) {
        try {
            const session = req.params?.session;
            //
            const result = await sessions.logOutSession(session);
            if (result) {
                res.status(200).json({
                    status: "success",
                    message: result,
                });
            } else {
                res.status(404).json({
                    status: "error",
                    message: result,
                });
            }
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error logout session",
            });
        }
    },

    async startAllSessions(req, res) {
        try {
            const started = await sessions.startAllSessions();
            if (started) {
                res.status(200).json({
                    result: "success",
                    message: "Session(s) starting",
                });
            } else {
                res.status(200).json({
                    result: "error",
                    message: "Error starting session(s)",
                });
            }
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error starting session(s)",
            });
        }
    },

    async getBatteryLevel(req, res) {
        try {
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            const result = await client.then(async (client) => {
                return await client.getBatteryLevel();
            });
            if (result) {
                res.status(200).json({
                    status: "success",
                    message: result,
                });
            } else {
                res.status(404).json({
                    status: "error",
                    message: result,
                });
            }
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error retrieving battery status",
            });
        }
    },

    async setProfileName(req, res) {
        const { name } = req.body;

        if (!name)
            return res.status(400).json({
                status: "error",
                message: "Parameter name is required!",
            });

        try {
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            let result;
            await client.then(async (client) => {
                result = await client.setProfileName(name);
            });
            //
            return res.status(200).json({ status: "success", message: result });
        } catch (e) {
            res.status(500).json({
                status: "error",
                message: "Error on set profile name.",
            });
        }
    },

    async setProfileStatus(req, res) {
        const { status } = req.body;
        try {
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            let result;
            await client.then(async (client) => {
                result = await client.setProfileStatus(status);
            });
            //
            return res.status(200).json({ status: "success", message: result });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error on set profile status",
            });
        }
    },

    async getHostDevice(req, res) {
        try {
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            let result;
            await client.then(async (client) => {
                result = await client.getHostDevice();
            });
            //
            return res.status(200).json({ status: "success", message: result });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error on get host device",
            });
        }
    },

    async getConnectionState(req, res) {
        try {
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            let result;
            await client.then(async (client) => {
                result = await client.getConnectionState();
            });
            //
            return res.status(200).json({ status: "success", message: result });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error on get Connection State",
            });
        }
    },
    async listSession(req, res) {
        try {
            //
            const result = await sessions.listAllSessions();
            if (result) {
                res.status(200).json({
                    status: "success",
                    message: result,
                });
            } else {
                res.status(404).json({
                    status: "error",
                    message: result,
                });
            }
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error list sessions",
            });
        }
    },
    async cleanSessions(req, res) {
        let result;
        let sessionsToClose=[];
        try {
        

            // uma promisse com atraso para caso os recursos padroes nao derem certo, forcar a remocao do array

            const removeSessionArray = async (sessionName)=>{
                return new Promise((resolve,reject)=>{
                         setTimeout(()=>{
                sessions.sessions.forEach((element,index) => {
                    if(element.state !=="CONNECTED" && element.name == sessionName){
                        sessions.sessions.splice(index,1);
                    }
                });;
                result = true
                }, 5000,true);
                setTimeout(resolve, 5200, true);
                })
            }

              sessions.sessions.forEach(async(session,index) => {
                if(session.state !=="CONNECTED"){
                    sessionsToClose.push(session.name)
            result =  await Promise.race([ removeSessionArray(session.name),  sessions.forceCloseSession(session.name), sessions.closeSession(session.name)],(value)=>{
                return true
            })
        } else {
            result = false
        }
        });


            if (result) {
                res.status(200).json({
                    status: "success",
                    message: result,
                });
            } else if (sessionsToClose) {
                res.status(200).json({
                    status: "success",
                    message: sessionsToClose,
                });
            }else {
                res.status(404).json({
                    status: "error",
                    message: result,
                });
            }
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error Clean session",
            });
        }
    },

    async deleteSessionToken(req,res){
        
        const sessionName = req.params?.session;
        const tokensFolder = config.storage?.name
        try{
            shell.rm("-rf",`${tokensFolder}/${sessionName}*`)
            res.status(200).json({
                status: "success",
                message: "tokens deleted",
            });

        }
        catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error force close session",
            });
        }
        


    },

    async forceCloseSession(req, res) {
        let result;
        const allSessions = await sessions.listAllSessions();
        const sessionName = req.params?.session;
        const tokensFolder = config.storage?.name;
    
        
        try {

            const session = allSessions.reduce((session)=>{
                if(session?.name == sessionName){
                    return session
                }

            })
    

            const removeSessionArray = async (sessionName)=>{
                return new Promise((resolve,reject)=>{
                    setTimeout(()=>{
                        sessions.sessions.forEach((element,index) => {
                            if(element.name == sessionName){
                                sessions.sessions.splice(index,1);
                            }
                        });
                        let result = true
                    }, 5000,true);
                    setTimeout(resolve, 5200, true);
                })
            }
        

            // uma promisse com atraso para caso os recursos padroes nao derem certo, forcar a remocao do array

                   let result = await Promise.race([ removeSessionArray(sessionName),  sessions.forceCloseSession(sessionName), sessions.closeSession(sessionName)],(value)=>{
                    return true
                    })
                    
                    shell.rm("-rf",`${tokensFolder}/${sessionName}*`)

            
            if (result) {
                return res.status(200).json({
                    status: "success",
                    message: result,
                });
            }else {
                return res.status(404).json({
                    status: "error",
                    message: result,
                });
            }
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: e,
            });
        }
    },
    
};
