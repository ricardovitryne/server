const utils = require("../models/utils");
const enums = require("../models/enums")

module.exports.MessageInterface = class{
    constructor(input){
        this.to = input.to;
        this.from = input.from;
        this.fromMe = input.fromMe;
        this.timestamp = input.t;
        this.sender = input.sender;
        this.self = input.self;
        this.recvFresh = input.recvFresh;
        this.messageId = input.id;
        this.isMedia = input.mimetype ? true : false;
        this.isGroupMsg = input.isGroupMsg;
        this.type = input.type;
        this.isViewOnce = input.isViewOnce;
        this.isForwarded = input.isForwarded;
        this.ack = input.ack;
        this.chatId = input.ack;
        this.quotedMsg = input.ack;
        this.quotedMsgId = input.quotedMsgId;
        this.content = input.content;
    }
    getContent = ()=>this.content;
    getDestination = ()=>this.to;
    getType = ()=>this.type;
}