const process = require("process");
const wppconnect = require("@wppconnect-team/wppconnect");
const { executablePath } = require('puppeteer');
const axios = require("axios");
const utils = require("./utils");
const config = require("../config.json");
const enums = require("./enums");
const {MessageInterface} = require("../interfaces/messageInterface")

module.exports = class Sessions {
    static async start(sessionName, options = []) {
        Sessions.options = Sessions.options || options;
        Sessions.sessions = Sessions.sessions || [];

        let session = Sessions.getSession(sessionName);

        if (session == false) {
            //create new session
            session = await Sessions.addSesssion(sessionName);
        } else if (["CLOSED"].includes(session.state)) {
            //restart session
            console.log(`### [${sessionName}] session.state == CLOSED`);
            session.state = "STARTING";
            session.client = Sessions.initSession(sessionName);
        } else if (
            ["CONFLICT", "UNPAIRED", "UNLAUNCHED"].includes(session.state)
        ) {
            console.log(`### [${sessionName}] client.useHere()`);
            session.client.then((client) => {
                client.useHere();
            });
        } else {
            console.log(`### [${sessionName}] session.state: ${session.state}`);
        }
        return session;
    }

    static async startAllSessions() {
        try {

            const startAllSessions = config?.session?.startAllSessions;
            let session;
            if (startAllSessions) {
                const waitMilliseconds = config?.session?.waitMilliseconds
                ? config?.session?.waitMilliseconds
                : 100;

                // const apiSessions = await utils.getApiSessions();
                // // puxar do config.json as sessoes do auto start
                 const sessions = config?.session?.sessions;
                // puxar da API as sessoes do auto start
                // const sessions = apiSessions;

                if (sessions?.length) {
                    for (let i = 0; i < sessions?.length; i++) {
                        session = sessions[i];
                        await Sessions.start(session);
                        await this.sleep(waitMilliseconds);
                    }
                }

                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    static async addSesssion(sessionName) {
        const newSession = {
            name: sessionName,
            hook: null,
            qrcode: false,
            client: false,
            state: "STARTING",
        };
        Sessions.sessions.push(newSession);
        console.log(`### [${sessionName}] session.state: ${newSession.state}`);
        newSession.client = Sessions.initSession(sessionName);

        return newSession;
    }

    static async initSession(sessionName) {
        const session = Sessions.getSession(sessionName);
        let browserSessionToken = session.browserSessionToken;

        function onMessage(client) {
            console.log(`### [${sessionName}] session.webhook: OK`);
            client.onMessage(async (message) => {
                //
                let { from, to } = message;
                const {
                    id,
                    type,
                    timestamp,
                    mimetype,
                    isViewOnce,
                    isForwarded,
                    chatId,
                    sender,
                    body,
                } = message;

                // remove extra code from numbers
                // to = to.replace("@c.us", "");
                // from = from.replace("@c.us", "");
                to  = utils.removeContactSufix(to);
                from  = utils.removeContactSufix(from);

                let content;

                // when media
                let base64;
                if (mimetype) {
                    base64 = await client.downloadMedia(message);
                    content = {
                        mimetype: mimetype,
                        base64,
                    };
                } else {
                    content = {
                        body: body ? body : "",
                    };
                }

                // sending
                const payload = JSON.stringify({
                    to,
                    from,
                    timestamp,
                    sender,
                    messageId: id,
                    isMedia: mimetype ? true : false,
                    type,
                    isViewOnce,
                    isForwarded,
                    chatId,
                    content,
                });

                const config = {
                    method: "POST",
                    url: `https://bot-api.perfectpay.com.br/api/whatsapp-bot/receiveMessage`,
                    headers: {
                        "Content-Type": "application/json",
                        // "Api-token": `${process.env.WEBHOOK_TOKEN}`,
                    },
                    data: payload,
                };
                axios(config)
                    .then(() => {
                        console.log(
                            `### webhook onMessage => ${from} => ${to}`
                        );
                    })
                    .catch((e) => {
                        console.log(`[ERROR][onMessage] => ${e}`);
                        return false;
                    });
            });
        }

        function onAnyMessage(client) {
            // todo ver diferenca das mensagens de envio, recepcao, ver como vejo que foi mandado do cell.
            console.log(`### [${sessionName}] session.webhook: OK`);
            client.onAnyMessage(async (message) => {
                let content;
                let standardMessage;
                
                // when media
                let base64;
                if (message.mimetype) {
                    //it was sent from the bot, you don't need the file
                    base64 = (message.self === 'in')
                        ? await client.downloadMedia(message)
                        : '* download via id *';
                  
                    message.content = {
                        mimetype: message.mimetype,
                        caption: message.caption,
                        base64,
                    };
                }
                standardMessage = new MessageInterface(message);

                const config = {
                    method: "POST",
                     url: `https://bot-api.perfectpay.com.br/api/whatsapp-bot/receiveMessage`,
                   // url: `https://webhook.site/550ef88b-a9fe-4e65-8372-e14966e5ce7b`,
                    headers: {
                        "Content-Type": "application/json",
                        // "Api-token": process.env.WEBHOOK_TOKEN,
                    },
                    data: standardMessage,
                    maxContentLength:Infinity,
                    maxBodyLength: Infinity
                };
                axios(config)
                    .then(() => {
                        console.log(
                            `### webhook onMessage => ${standardMessage.from}  => ${standardMessage.to}`
                        );
                    })
                    .catch((e) => {
                        console.log(`[ERROR][onMessage] => ${e}`);
                        return false;
                    });
            });
        }

        function onStateChange(client) {
            client.onStateChange((state) => {
                //
                if (
                    state === "TIMEOUT" ||
                    (session.state === "CONNECTED" && state === "CONNECTED")
                )
                    return;
                //
                console.log(`### [${sessionName}] session.state: ${state}`);
                session.state = state;
                // sending
                const payload = JSON.stringify({
                    phone: sessionName,
                    status: state,
                    timestamp: Date.now(),
                    batery: "",
                    wifi_strength: "",
                });
                const config = {
                    method: "POST",
                    url: `https://bot-api.perfectpay.com.br/api/whatsapp-bot/updateStatus`,
                    headers: {
                        "Content-Type": "application/json",
                        // "Api-token": `${process.env.WEBHOOK_TOKEN}`,
                    },
                    data: payload,
                };
                axios(config)
                    .then(() => {
                        console.log(
                            `### webhook updateStatus => ${sessionName} => ${state}`
                        );
                    })
                    .catch((e) => {
                        console.log(`[ERROR][updateStatus] => ${e}`);
                        return false;
                    });
            });
        }

        // other states type
        function statusFind(statusSession) {
            if (statusSession === "inChat") session.state = "CONNECTED";
            console.log(`### [${sessionName}] session.state: ${statusSession}`);
        }

        const client = await wppconnect
            .create({
                session: sessionName,
                deviceName: `PerfectPay :: ${sessionName}`,
                // whatsappVersion: "2.2230.15",
                catchQR: (base64Qrimg, asciiQR, attempt, urlCode) => {
                    session.qrcode = base64Qrimg;
                    session.qrcodeURL = urlCode;
                },
                statusFind,
                headless: true,
                devtools: false,
                useChrome: false,
                debug: false,
                logQR: false,
                //browserWS: "",
                browserArgs: config.browserArgs,
                puppeteerOptions: {executablePath: executablePath()},
                disableWelcome: true,
                updatesLog: true,
                // 30 minutos para ler o QR se nao vai fechar a sessao
                autoClose: 1800000,
                tokenStore: "file",
                folderNameToken: config.storage.name,
                sessionToken: browserSessionToken,
            })
            .then((client) => {
                onStateChange(client);
                // onMessage(client);
                onAnyMessage(client);
                return client;
            });

        // archive old chats to free browser memory
        const everyMilliseconds = config?.archive?.everyMilliseconds
            ? config?.archive?.everyMilliseconds
            : 50000;
        //
        setInterval(() => {
            // utils.archiveChats(session);
            utils.deleteArchivedChats(session)
        }, everyMilliseconds);

        return client;
    }

    static getSession(sessionName) {
        let foundSession = false;
        if (Sessions?.sessions)
            Sessions.sessions.forEach((session) => {
                if (sessionName == session.name) {
                    foundSession = session;
                }
            });
        return foundSession;
    }

    static getSessions() {
        if (Sessions?.sessions) {
            return Sessions.sessions;
        } else {
            return [];
        }
    }

    static async getSessionClient(sessionName) {
        try {
            const session = Sessions.getSession(sessionName);
            if (session.state == "CONNECTED" && session != false) {
                return await session.client.then(async (client) => {
                    return client;
                });
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    static async getStatus(sessionName) {
        try {
            const session = Sessions.getSession(sessionName);
            if (session) {
                return session.state;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    static async sendText(sessionName, to, text,type=enums.contactEnum.user.value) {
        const session = Sessions.getSession(sessionName);
        // modificar aqui para verificar usando a funcao criada no utils e o enum se o contato é usuario ou gurpo
        const destinationContact = utils.traitNumber(to,enums.contactEnum.get(type).value); 
        
        if (session.state == "CONNECTED" && session != false) {
            
            return await session.client.then(async (client) => {
                return await client
                    .sendText(destinationContact, text)
                    .then(async (result) => {
                        console.log(`### send msg => ${sessionName} => ${to} (${enums.contactEnum.get(type).key})`);
                        console.log('sendMessage');
                        return result;
                    })
                    .catch((e) => {
                        console.log(
                            `### send msg error => ${sessionName} => ${to} => ${e}`
                        );
                        return false;
                    });
            });
        } else {
            return false;
        }
    }


    static async setTyping(sessionName, to, delay) {
        try{
        const session = Sessions.getSession(sessionName);
        
            await session.client.then(async (client) => {
                await client.openChat(to);

            });    

            await session.client.then(async (client) => {
                await client.startTyping(to,delay);

            });

            this.sleep(250);
            await session.client.then(async (client) => {
                await client.stopTyping(to);

            });
        }
        catch (e) {
            console.log(e);
            return false;
        }
    }

    static async getMessages(sessionName,chatId){
        const session = Sessions.getSession(sessionName);
        return await session.client.then(async (client) => {
            return await client.getMessages(chatId);
        });
        
    }
    
    static async archiveChat(sessionName, chatId, option) {
        try {
            const session = Sessions.getSession(sessionName);
            if (session.state == "CONNECTED" && session != false) {
                return await session.client.then(async (client) => {
                    return await client.archiveChat(chatId, option);
                });
            } else {
                return false;
            }
        } catch (e) {
            return false;
        }
    }

    static async deleteChat(sessionName, chatId) {
        try {
            const session = Sessions.getSession(sessionName);
            if (session.state == "CONNECTED" && session != false) {
                return await session.client.then(async (client) => {
                    return await client.deleteChat(chatId);
                });
            } else {
                return false;
            }
        } catch (e) {
            return false;
        }
    }

    static async checkNumberStatus(sessionName, number) {
        try {
            const session = Sessions.getSession(sessionName);
            if (session) {
                if (session.state == "CONNECTED") {
                    return await session.client.then(async (client) => {
                        // check if number is user
                        // result = await client.checkNumberStatus(number + "@c.us");
                        let result;
                         result = await client.checkNumberStatus(utils.traitNumber(number,"user"))
                        // if number is not user, check if is group
                        if (!(result.status == 200)) {
                            let groupMembers = await client.getGroupMembers(utils.traitNumber(number,"group"));
                            if(groupMembers){
                                result = {
                                    id: {
                                        server: 'g.us',
                                        user: number,
                                        _serialized: utils.traitNumber(number,"group")
                                    },
                                    isBusiness: false,
                                    canReceiveMessage: true,
                                    numberExists: true,
                                    isGroup: true,
                                    status: 200
                                }}
                            else{
                                // todo se nao for grupo, mandar pro broadcast. 
                                // todo desacoplar e criar nova funcao para verificar
                            }
                        }
                        return result;
                    });
                }
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    static async getNumberProfile(sessionName, number) {
        try {
            const session = Sessions.getSession(sessionName);
            if (session) {
                if (session.state == "CONNECTED") {
                    return await session.client.then(async (client) => {
                        return await client.getNumberProfile(number + "@c.us");
                    });
                }
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    static async getBatteryLevel(sessionName) {
        try {
            const session = Sessions.getSession(sessionName);
            if (session) {
                if (session.state == "CONNECTED") {
                    return await session.client.then(async (client) => {
                        console.log(client);
                        console.log(client.getBatteryLevel());

                        return await client.getBatteryLevel();
                    });
                }
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    static async restartSession(sessionName) {
        try {
            const session = Sessions.getSession(sessionName);
            if (session) {
                return await session.client.then(async (client) => {
                    return await client.restartService();
                });
            }
            return false;
        } catch (e) {
            return e;
        }
    }

    static async closeSession(sessionName) {
        try {
            const session = Sessions.getSession(sessionName);
            if (session) {
                return await session.client.then(async (client) => {
                    const close = await client.close();
                    if (close) {
                        session.state = "CLOSED";
                        session.client = false;
                        return true;
                    } else {
                        return false;
                    }
                });
            }
            throw new Error('failed CloseSession');
        } catch (e) {
            return e;
        }
    }

    static async logOutSession(sessionName) {
        try {
            const session = Sessions.getSession(sessionName);
            if (session) {
                return await session.client.then(async (client) => {
                    return await client.logout();
                });
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    static async isDestinationValid(sessionName,phone) {
        try {
            const session = Sessions.getSession(sessionName);
            if (session) {
                if (session.state == "CONNECTED") {
                    //caso nao coloque sufixo
                    if(phone.indexOf("@") <0){
                        let result=[];

                        result = await session.client.then(async (client) => {
                            return await client.getAllBroadcastList();
                        });
                        let broadcastIds = result.map((input)=>{return(input.id.user)})

                        result = await session.client.then(async (client) => {
                            return await client.getAllGroups();
                        });
                        let groupIds = result.map((input)=>{return(input.id.user)})
                        //todo remover o @g.us, c.us e broadcast do retorno do destination
                        if(broadcastIds.find((user)=>user==phone)){
                            let returnData = {
                                destination: phone,
                                contactType: "broadcast",
                                sufix: "@broadcast"
                            }
                            return returnData;
                        }
                        else if(groupIds.find((user)=>user==phone)){
                            let returnData = {
                                destination: phone,
                                contactType: "group",
                                sufix: "@g.us"
                            }
                            return returnData;
                        }
                        else {
                            let number =  await session.client.then(async (client) => {
                                return await client.checkNumberStatus(`${phone}`);
                            });
                            console.log(number);
                            if(!number.numberExists){
                                return false;
                            }
                            else{
                                let returnData = {
                                    destination: phone,
                                    contactType: "user",
                                    sufix: "@c.us"
                                }
                                return returnData;
                            }
                        }
                    } else{
                        // caso o número já esteja com o sufixo
                        let result=[];
                        let returnData=[];
                        const sufix = phone.substr(phone.indexOf("@"),phone.length)
                        switch (sufix) {
                            case "@c.us":
                                console.log("usuario");
                                result =  await session.client.then(async (client) => {
                                    return await client.checkNumberStatus(`${phone}`);
                                });

                                returnData = {
                                    destination: phone,
                                    contactType: "user",
                                    sufix: "@c.us"
                                }
                                return returnData;

                                break;
                            case "@g.us":
                                result = await session.client.then(async (client) => {
                                    return await client.getAllGroups();
                                });
                                let groupIds = result.map((input)=>{return(input.id._serialized)})

                                if(!groupIds.find((user)=>user==phone)){
                                    return false;
                                }
                                else {
                                    returnData = {
                                        destination: phone,
                                        contactType: "group",
                                        sufix: "@g.us"
                                    }
                                    return returnData;
                                }
                                break;

                            case "@broadcast":
                                console.log("broadcast");

                                result = await session.client.then(async (client) => {
                                    return await client.getAllBroadcastList();
                                });

                                let broadcastIds = result.map((input)=>{return(input.id._serialized)})

                                if(!broadcastIds.find((user)=>user==phone)){
                                    return false;
                                }
                                else {
                                    returnData = {
                                        destination: phone,
                                        contactType: "broadcast",
                                        sufix: "@broadcast"
                                    }
                                }
                                return returnData;
                                break;
                            default:
                                break;
                        }
                    }
                }
            }
        } catch (e) {
            return false;
        }
    }
    static async listAllSessions() {
        try {
            
            const sessions= Sessions.sessions;
           
            return sessions;
        } catch (e) {
            return false;
        }
    }
    static async forceCloseSession(sessionName) {
        try {
            // colocar um timeout aqui para poder dar uma vantagem de competicao ao close normal na corrida das promises
            
            const session = Sessions.getSession(sessionName);

            if (session) {
                    
                await session.client.then(async (client)=>{
                    await client.waPage.close();
                    await client.waPage.deleteCookie();
    
                    console.log(`force Close ${sessionName}`)
                    await this.closeSession(session);
                });
                    
                return true
            }
            throw new Error('failed CloseSession');
            
        } catch (e) {
            return e;
        }
    }

    static async sleep(milliseconds) {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    }
    

};
