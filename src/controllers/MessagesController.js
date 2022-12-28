const sessions = require("../models/sessions");
const enums = require("../models/enums")
const utils = require("../models/utils");
const {MessageInterface} = require("../interfaces/messageInterface");
const axios = require("axios");

const port = process.env.PORT || 8080;
const ip = process.env.IP || "localhost";

module.exports = {
   
    async sendMessage(req, res) {
        try {
            const {chat, message, file, typingDuration} = req.body;
            const session = req.params?.session;
            let result;
            const vsession = await sessions.getStatus(session);
            const client = sessions.getSessionClient(session);

            if (!vsession || vsession !== 'CONNECTED') {
               return res.status(404).json({
                    status: "error",
                    message: `SESSION [${session}] NOT FOUND`,
                });
            }

            // sesion OK
            const vnumber = await sessions.checkNumberStatus(
                session,
                chat
            );

            if (!vnumber.numberExists) {
              return  res.status(400).json({
                    status: "error",
                    message: `NUMBER [${chat}] INVALID OR NOT WHATSAPP`,
                });
            }

            await sessions.setTyping(session, chat, typingDuration);

            if (message && !file) {
                result = await sessions.sendText(
                    session,
                    chat,
                    message,
                    1
                );
            } else if (file) {
                if (!file?.data) {
                    return res.status(401).send({
                        message: "The file was not informed",
                    });
                }

                await client.then(async (client) => {
                    result = await client.sendFile(
                        chat,
                        file.data,
                        file.filename ?? 'documento',
                        message
                    );
                })
            }

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
                message: e.text || "Error sending message",
            });
        }
    },

    async sendMentioned(req, res) {
        try {
            const {phone, message, mentions, contactType, delay} = req.body;
            const session = req.params?.session;
            //
            const vsession = await sessions.getStatus(session);
            if (vsession) {
                // sesion OK
                const client = sessions.getSessionClient(session);
                if (vsession == "CONNECTED") {
                    // number OK

                    // await axios.post(`http://${ip}:${port}/v3/session/${session}/typing`,
                    // {
                    //     phone:phone,
                    //     value:true,
                    //     duration:delay
                    // })

                    await client.then(async (client) => {
                        const result = await client.sendMentioned(
                            phone,
                            message,
                            mentions
                        );
                    });

                    if (result) {
                        // session OK / may be out right now
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
                } else if (vsession !== "CONNECTED") {
                    res.status(401).json({
                        result: "error",
                        message: `SESSIONS [${session}] NOT CONNECTED. RESCAN QRCODE!`,
                    });
                } else {
                    res.status(400).json({
                        result: "error",
                        message: `NUMBER [${phone}] INVALID OR NOT WHATSAPP`,
                    });
                }
            } else {
                res.status(404).json({
                    result: "error",
                    message: `SESSION [${session}] NOT FOUND`,
                });
            }
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: e.text || "Error sending message",
            });
        }
    },

    async sendMentionedToAllInGroup(req, res) {
        try {
            const {group, message, delay} = req.body;
            const session = req.params?.session;
            let groupMembers
            let result
            let members = [];
            //
            const vsession = await sessions.getStatus(session);
            if (vsession) {
                // sesion OK
                const client = sessions.getSessionClient(session);
                if (vsession == "CONNECTED") {
                    // number OK

                    // await axios.post(`http://${ip}:${port}/v3/session/${session}/typing`,
                    // {
                    //     phone:phone,
                    //     value:true,
                    //     duration:delay
                    // })

                    const to = utils.traitNumber(group, "group");
                    // puxar todos os membros do grupo
                    await client.then(async (client) => {
                        groupMembers = await client.getGroupMembers(utils.traitNumber(group, "group"));

                        members = groupMembers.map((member) => {
                            return member.id._serialized
                        })

                        result = await client.sendMentioned(
                            to,
                            message,
                            members
                        );
                    });

                    if (result) {
                        // session OK / may be out right now
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
                } else if (vsession !== "CONNECTED") {
                    res.status(401).json({
                        result: "error",
                        message: `SESSIONS [${session}] NOT CONNECTED. RESCAN QRCODE!`,
                    });
                } else {
                    res.status(400).json({
                        result: "error",
                        message: `NUMBER [${phone}] INVALID OR NOT WHATSAPP`,
                    });
                }
            } else {
                res.status(404).json({
                    result: "error",
                    message: `SESSION [${session}] NOT FOUND`,
                });
            }
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: e.text || "Error sending message",
            });
        }
    },

    async sendFileFromBase64(req, res) {
        try {
            const {base64, phone, filename = "file", message, contactType = enums.contactEnum.user.value} = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            const destinationContact = utils.traitNumber(phone, enums.contactEnum.get(contactType).value);
            //
            if (!base64) {
                return res.status(401).send({
                    message: "The base64 of the file was not informed",
                });
            }
            //

            await client.then(async (client) => {
                const result = await client.sendFileFromBase64(
                    destinationContact,
                    base64,
                    filename,
                    message
                ).then((resp) => {
                    return res.status(200).json({
                        status: "success",
                        message: resp,
                    });
                });
            });

        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: e.text || "Error sending file",
            });
        }
    },

    async sendPttFromBase64(req, res) {
        try {
            const {phone, base64: base64Ptt, message, contactType = enums.contactEnum.user.value, delay} = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            const destinationContact = utils.traitNumber(phone, enums.contactEnum.get(contactType).value);
            if (!base64Ptt) {
                return res.status(401).send({
                    message: "The base64 of the file was not informed",
                });
            }
            //
            
            await client.then(async (client) => {
                const result = await client.sendPttFromBase64(
                    destinationContact,
                    base64Ptt,
                    message
                ).then(async (resp) => {
                    return await res.status(200).json({
                        status: "success",
                        message: resp,
                    });
                });
            });
            //

        } catch (e) {
            console.log(e);
            return res.status(500).json({
                status: "error",
                message: e.code || "Error sending PTT",
            });
        }
    },

    async sendLinkPreview(req, res) {
        try {
            const {phone, url, caption} = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            if (!url) {
                return res.status(401).send({
                    message: "The url of the link was not informed",
                });
            }
            //
            let result;
            await client.then(async (client) => {
                result = await client.sendLinkPreview(
                    phone + "@c.us",
                    url,
                    caption
                );
            });
            //
            return res.status(200).json({
                status: "success",
                message: result,
            });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: e.text || "Error sending link",
            });
        }
    },

    async sendContactVcard(req, res) {
        try {
            const {phone, contactId, name = null} = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            if (!contactId) {
                return res.status(401).send({
                    message: "The contact was not informed",
                });
            }
            //
            let result;
            await client.then(async (client) => {
                result = await client.sendContactVcard(
                    phone + "@c.us",
                    contactId,
                    name
                );
            });
            //
            return res.status(200).json({
                status: "success",
                message: result,
            });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: e.text || "Error sending contact",
            });
        }
    },

    async sendLocation(req, res) {
        try {
            const {phone, lat, lng, title, contactType = enums.contactEnum.user.value} = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            const destinationContact = utils.traitNumber(phone, enums.contactEnum.get(contactType).value);
            //
            if (!lat || !lng) {
                return res.status(401).send({
                    message: "The geo location was not informed",
                });
            }
            //
            await client.then(async (client) => {
                const result = await client.sendLocation(
                    destinationContact,
                    lat,
                    lng,
                    title
                ).then((resp) => {
                    return res.status(200).json({
                        status: "success",
                        message: resp,
                    });
                });
            });
            //

        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: e.text || "Error sending location",
            });
        }
    },
    

    async forwardMessages(req, res) {
        try {
            //wip adicionar opcao especial de selecinar ultima mensagem, ultimas 3 5 10 mensagens etc...
            const {phone, messages, contactType = "user", skipMyMessages = null} = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            const destinationContact = utils.traitNumber(phone, enums.contactEnum.get(contactType).value);
            if (!messages) {
            }

            if (!messages || messages?.length < 1) {
                return res.status(404).json({
                    status: "error",
                    message: "You must mention at least one message to forward",
                });
            }

            await client.then(async (client) => {
                const result = await client
                    .forwardMessages(destinationContact, messages, skipMyMessages).then((resp) => {
                        return res.status(200).json({
                            status: "success",
                            message: resp,
                        });
                    });
            });
        } catch (e) {
            console.log(e)
            return res.status(500).json({
                status: "error",
                message: e.text || "Error forwarding Message",
            });
        }
    },

    async getAllChats(req, res) {
        try {
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            let result;
            //
            await client.then(async (client) => {
                result = await client.getAllChats();
            });
            //
            return res.status(200).json({
                status: "success",
                message: result,
            });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: e.text || "Error get all chats",
            });
        }
    },

    async deleteMessage(req, res) {
        try {
            const session = req.params?.session;
            const {chat, messages, onlyLocal, deleteMediaInDevice} = req.body;
            const client = sessions.getSessionClient(session);
            //
            if (!messages) {
                return res.status(401).send({
                    message: "The message id was not informed",
                });
            }
            //
            await client.then(async (client) => {
                await client.deleteMessage(`${chat}@c.us`, messages, onlyLocal, deleteMediaInDevice);
            });

            console.log(`### DELETE MSG`);

            return res.status(200).json({
                status: "success",
                message: "Message deleted",
            });
        } catch (e) {
            return res
                .status(500)
                .json({status: "error", message: "Error on delete message"});
        }
    },

    async getMessages(req, res) {
        try {
            const session = req.params?.session;
            const {chatId} = req.body;
            const client = sessions.getSessionClient(session);
            //
            let result;
            //
            await client.then(async (client) => {
                result = await client.getMessages(chatId);
            });
            //
            return res.status(200).json({
                status: "success",
                message: result,
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                status: "error",
                message: e.text || "Error get all chats",
            });
        }
    },

    async getMessageById(req, res) {
        try {
            const session = req.params?.session;
            const {messageId} = req.body;
            const client = sessions.getSessionClient(session);

            let message;
            let standardMessage;
            let base64;
            await client.then(async (client) => {
                message = await client.getMessageById(messageId);
                // verificar se é um arquivo/mídia.
                if (message.mimetype) {
                    base64 = await client.downloadMedia(message);
                    message.content = {
                        mimetype: message.mimetype,
                        base64,
                    };
                } else {
                    message.content = {
                        body: message.body ? message.body : "",
                    };
                }
            });
            standardMessage = new MessageInterface(message);
            return res.status(200).json({
                status: "success",
                message: standardMessage,
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                status: "error",
                message: e.text || "Error get all chats",
            });
        }
    },

    async getAllChatsWithMessages(req, res) {
        try {
            const session = req.params?.session;
            const {startDate = null, endDate = null, newOnly = false} = req.body;
            const client = sessions.getSessionClient(session);
            //
            let allMessages = [];
            let result = [];
            //
            await client.then(async (client) => {
                allMessages = await client.getAllChatsWithMessages(newOnly);
            });
            allMessages.forEach((chat) => {
                chat.msgs = chat.msgs.map((msg) => {
                    if (msg.type != 'chat') msg.body = ''
                    return msg
                })
            })

            // se nao for definido periodo de datas, retornar
            if (!(startDate || endDate)) {
                result = allMessages;
            } // filtrar o array de mensagens dentro do array de chats 
            else {
                // coverter a string de data em epocas, o wppconnect utiliza timestamp em segundos já o Date do JS converte para milisegundos.
                const startDateErrors = utils.validateDateErrors(startDate);
                if (startDateErrors) {
                    return res.status(422).json({
                        status: "error",
                        message: startDateErrors,
                    });
                }
                const endDateErrors = utils.validateDateErrors(endDate);
                if (endDateErrors) {
                    return res.status(422).json({
                        status: "error",
                        message: endDateErrors,
                    });
                }

                const startDateEpoch = Math.floor(Date.parse(new Date(startDate)) / 1e3)
                const endDateEpoch = Math.floor(Date.parse(new Date(endDate)) / 1e3)

                allMessages.forEach(item => {
                    if (startDateEpoch && !endDateEpoch) {
                        item.msgs = item.msgs.filter(c => c.t >= startDateEpoch)
                    } else if (!startDateEpoch && endDateEpoch) {
                        item.msgs = item.msgs.filter(c => c.t <= endDateEpoch)
                    } else if (startDateEpoch && endDateEpoch) {
                        item.msgs = item.msgs.filter(c => c.t >= startDateEpoch && c.t <= endDateEpoch)
                    }
                })

                // removing all chats that have no messages
                result = allMessages.filter(item => item.msgs.length > 0);

            }

            return res.status(200).json({
                status: "success",
                message: result,
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                status: "error",
                message: e.text || "Error get all chats",
            });
        }
    },

    async sendMessageNew(req, res) {
        try {
            //WIP adicionar ao modelo principal do sendMessage
            // Wip verificar sessao, e se o numero existe com a funcao nova
            const {phone, message, contactType = "user"} = req.body;
            let {quotedMessageId = null} = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            const destinationContact = utils.traitNumber(phone, enums.contactEnum.get(contactType).value);

            if (quotedMessageId < 0) {
                let allMessages = [];
                let contactMessages = [];
                let targetMessages = [];
                let contactMessageIds = [];
                await client.then(async (client) => {
                    allMessages = await client.getMessages(destinationContact);
                });
                // filtra para mostrar apenas as mensagens do contato em questão
                contactMessages = allMessages.filter((message) => (message.to == destinationContact));

                contactMessageIds = contactMessages.map((message) => message.id)
                console.log(contactMessageIds);
                // vai pegar o índice caso tenha sido referido. -1 = último, -2 = penúltimo e assim por diante
                console.log(quotedMessageId * -1)

                quotedMessageId = contactMessageIds[contactMessageIds.length + quotedMessageId * 1];

                console.log("===========");
                console.log(quotedMessageId);
            }

            await client.then(async (client) => {
                const result = await client
                    .sendText(destinationContact, message, quotedMessageId ? {
                        quotedMsg: quotedMessageId
                    } : null).then((resp) => {
                        return res.status(200).json({
                            status: "success",
                            message: resp,
                        });
                    });
            });

            //

        } catch (e) {
            console.log(e)
            return res.status(500).json({
                status: "error",
                message: e.text || "Error sending Message",
            });
        }
    },
    async deleteOldMessages(req, res) {
        try {
            const {date} = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            let chats;
            let chatsToDelete = [];
            let messagesToDeleteResponse = new Map();
            let messagesToDelete = [];
            let deletedMessages;
            //
            if (!date) {
                return res.status(401).send({
                    message: "The Date was not informed",
                });
            }
            //

            const dateEpoch = Math.floor(Date.parse(new Date(date)) / 1e3)
            await client.then(async (client) => {
                chats = await client.getAllChatsWithMessages(false);
                // caso a last message do chat não esteja na data nem precisa entrar no chat, ja delete ele todo
                chats.map(async (chat) => {
                    if (chat.t < dateEpoch) {
                        // chatsToDelete.push(chat.id)
                        await client.clearChat(chat.id)
                        await client.deleteChat(chat.id)
                    } else {
                        messagesToDeleteResponse[chat.id] = []
                        chat.msgs.map((msg) => {
                            if (msg.t < dateEpoch) {
                                messagesToDeleteResponse[chat.id].push(msg.id._serialized)
                                messagesToDelete.push(msg.id._serialized)
                            }
                        })
                    }
                    deletedMessages = await client.deleteMessage(chat.id, messagesToDelete, true, true)
                })

            });
            //

            return res.status(200).json({
                status: "success",
                messageDeleted: messagesToDeleteResponse,
                teste: deletedMessages
            });
        } catch (e) {
            return res
                .status(500)
                .json({status: "error", message: "Error on delete message"});
        }
    },
};
