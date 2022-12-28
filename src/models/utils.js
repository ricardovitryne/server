const { default: axios } = require("axios");
const fs = require("fs");
const { promisify } = require("util");

const config = require("../config.json");
const enums = require("./enums");

module.exports.archiveChats = async (session) => {
    // start only when config is enabled
    if (!config?.archive?.enable) return;

    await session.client.then(async (client) => {
        try {
            //
            const daysToArchive = config?.archive?.daysToArchive
                ? config?.archive?.daysToArchive
                : 0;
            const waitMilliseconds = config?.archive?.waitMilliseconds
                ? config?.archive?.waitMilliseconds
                : 100;
            //
            const chats = await client.getAllChats();
            if (chats?.length) {
                for (let i = 0; i < chats?.length; i++) {
                    let date = new Date(chats[i].t * 1000);
                    if (DaysBetween(date) >= daysToArchive) {
                        const chat = chats[i];
                        const chatId = chat?.id?.id || chat?.id?._serialized;
                        const { unreadCount } = chat;
                        // only archive chats with read messages
                        if (unreadCount == 0) {
                            await client.archiveChat(chatId, true);
                            await sleep(waitMilliseconds);
                        }
                    }
                }
            }
        } catch (e) {
            return false;
        }
    });
};

module.exports.deleteArchivedChats = async (session) => {
    // start only when config is enabled
    if (!config.archive?.enable) return;

    try {
        //
        const daysToDelete = config?.archive?.daysToDelete
            ? config?.archive?.daysToDelete
            : 0;
        const waitMilliseconds = config?.archive?.waitMilliseconds
            ? config?.archive?.waitMilliseconds
            : 100;
        //
        await session.client.then(async (client) => {
            const chats = await client.getAllChats();
            if (chats.length > 0) {
                for (let i = 0; i < chats.length; i++) {
                    let date = new Date(chats[i].t * 1000);
                    if (DaysBetween(date) >= daysToDelete) {
                        const chat = chats[i];
                        const chatId = chat?.id?.id || chat?.id?._serialized;
                        const { unreadCount } = chat;
                        // only archive chats with read messages
                        // if (unreadCount == 0) {
                            // deletar apenas chat deu usuario, caso seja um grupo iria sair, logo dar apenas clear.
                            await client.clearChat(chatId);
                            if(chat.kind == 'chat'){
                            await client.deleteChat(chatId);
                            }
                            await sleep(waitMilliseconds);
                        // }
                    }
                }
            }
        });
    } catch (e) {
        return false;
    }
};

module.exports.contactToArray = (number, isGroup) => {
    try {
        let localArr = [];
        if (Array.isArray(number)) {
            for (let contact of number) {
                contact = contact.split("@")[0];
                if (contact !== "")
                    if (isGroup) localArr.push(`${contact}@g.us`);
                    else localArr.push(`${contact}@c.us`);
            }
        } else {
            let arrContacts = number.split(/\s*[,;]\s*/g);
            for (let contact of arrContacts) {
                contact = contact.split("@")[0];
                if (contact !== "")
                    if (isGroup) localArr.push(`${contact}@g.us`);
                    else localArr.push(`${contact}@c.us`);
            }
        }
        return localArr;
    } catch (e) {
        return [];
    }
};

module.exports.groupToArray = (group) => {
    try {
        let localArr = [];
        if (Array.isArray(group)) {
            for (let contact of group) {
                contact = contact.split("@")[0];
                if (contact !== "") localArr.push(`${contact}@g.us`);
            }
        } else {
            let arrContacts = group.split(/\s*[,;]\s*/g);
            for (let contact of arrContacts) {
                contact = contact.split("@")[0];
                if (contact !== "") localArr.push(`${contact}@g.us`);
            }
        }
        return localArr;
    } catch (e) {
        return [];
    }
};

module.exports.groupNameToArray = (group) => {
    try {
        let localArr = [];
        if (Array.isArray(group)) {
            for (const contact of group) {
                if (contact !== "") localArr.push(`${contact}`);
            }
        } else {
            let arrContacts = group.split(/\s*[,;]\s*/g);
            for (const contact of arrContacts) {
                if (contact !== "") localArr.push(`${contact}`);
            }
        }
        return localArr;
    } catch (e) {
        return [];
    }
};

function DaysBetween(StartDate) {
    let endDate = new Date();
    const oneDay = 1000 * 60 * 60 * 24;
    const start = Date.UTC(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
        endDate.getHours(),
    );
    const end = Date.UTC(
        StartDate.getFullYear(),
        StartDate.getMonth(),
        StartDate.getDate(),
        StartDate.getHours(),
    );
    return (start - end) / oneDay;
}

async function sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

module.exports.unlinkAsync = promisify(fs.unlink);

module.exports.removeContactSufix = (contact)=>{
    return (contact.substring(0,contact.indexOf("@")))
}

module.exports.traitNumber = (number,type=enums.contactEnum.user.value)=>{
    if (enums.contactEnum.user.is(type)) return(`${number}@c.us`)
    if (enums.contactEnum.group.is(type)) return(`${number}@g.us`)
    if (enums.contactEnum.broadcast.is(type)) return(`${number}@broadcast`)
}


module.exports.getImageTypeEnum = (image)=>{
    if(!image){return null}
    else if (image.substr(0,4)=="http"){return enums.imageTypeEnum.http}
    else if (image.substr(0,4)=="data"){return enums.imageTypeEnum.base64}
    else{return null;}
} 

module.exports.validateDateErrors = (string)=>{
    const regexExp = /([0-9]{4})[/.-]([0-9]{2})[/.-]([0-9]{2})(?:( ([0-9]{2}):([0-9]{2}):([0-9]{2}))?)/;
    let validation = string.match(regexExp);
        let [validated,valYear,valMonth,valDay,valTime,valHour,valMin,valSec] = validation??null
    let error = [];
    
    // error trait
    if (!validation){
        error.push("Formato de data: YYYY-MM-DD hh:mm:ss ou YYYY/MM/DD hh:mm:ss. Onde hh:mm:ss é opcional")
    }else{
    if(valMonth && (valMonth>12 || valMonth<1)){
        error.push("Valor do mês deve ser entre 1 e 12")
    }
    if(valDay && (valDay>31 || valDay<1)){
        error.push("Valor do dia deve ser entre 1 e 31")
    }
    if(valHour && (valHour>23 || valHour<0)){
        error.push("Valor das horas deve ser entre 0 e 23")
    }
    if(valMin && (valMin>59 || valMin<0)){z
        error.push("Valor dos minutos deve ser entre 0 e 59")
    }
    if(valSec && (valSec>59 || valSec<0)){
        error.push("Valor dos segundos deve ser entre 0 e 59")
    }
    }
    // retorna vetor de errors, se não houver errors retorna falso
    return  error.length>0?error:null
}

module.exports.getApiSessions = async ()=>{
    return await axios
                .get(`https://bot-api.perfectpay.com.br/api/whatsapp-bot/sessions`)
                .then((res) => res.data)
                .catch((err) => {
                    console.log(`### ERROR GETTING API SESSIONS - ${err.message}`);
                });
}