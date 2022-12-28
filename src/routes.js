const express = require("express");

const IndexController = require("./controllers/IndexController");

const InstanceController = require("./controllers/InstanceController");
const MessagesController = require("./controllers/MessagesController");
const ContactController = require("./controllers/ContactController");
const ChatController = require("./controllers/ChatController");
const GroupController = require("./controllers/GroupController");
const ProfileController = require("./controllers/ProfileController");

const routes = express.Router();

routes.get("/", IndexController.show);

// instance
routes.get("/v3/session/:session/qrcode", InstanceController.qrcode);
routes.get("/v3/session/:session/start", InstanceController.start);
routes.get("/v3/session/:session/status", InstanceController.status);
routes.get("/v3/session/start-all", InstanceController.startAllSessions);
routes.get("/v3/session/:session/getBatteryLevel", InstanceController.getBatteryLevel); // Get instance battery info
routes.get("/v3/session/:session/device", InstanceController.getHostDevice); 
routes.get("/v3/session/:session/connection", InstanceController.getConnectionState); 
routes.post("/v3/session/:session/reboot", InstanceController.restart); // Reboot your whatsapp instance
routes.post("/v3/session/:session/setName", InstanceController.setProfileName); // Change user name
routes.post("/v3/session/:session/setStatus", InstanceController.setProfileStatus); // Change user status
routes.post("/v3/session/:session/close", InstanceController.close); // close your whatsapp instance
routes.post("/v3/session/:session/logout", InstanceController.logout); // logout your whatsapp instance
routes.get("/v3/session", InstanceController.listSession); // close your whatsapp instance
routes.post("/v3/session/cleanSessions", InstanceController.cleanSessions); // clean unsued sessions
routes.post("/v3/session/:session/forceClose", InstanceController.forceCloseSession); // clean

routes.post("/v3/session/:session/deleteToken", InstanceController.deleteSessionToken); // clean

// contact
routes.get("/v3/session/:session/checkNumberStatus/phone/:phone", ContactController.checkNumberStatus); // Checks if a number is a valid WA number
routes.get("/v3/session/:session/getAllContacts", ContactController.getAllContacts); // Retrieves all contacts
routes.get("/v3/session/:session/getContact/phone/:phone", ContactController.getContact); // Retrieves contact detail object of given contact id
routes.get("/v3/session/:session/destinationCheck/phone/:phone", ContactController.destinationCheck);
// routes.get("/v3/session/:session/checkContact/", ContactController.checkContact); // Retrieves contact detail object of given contact id

// chat
routes.post("/v3/session/:session/pinChat", ChatController.pinChat); // Mark dialog or group as "pinned"
routes.post("/v3/session/:session/deleteChat", ChatController.deleteChat); // Delete message from WhatsApp
routes.post("/v3/session/:session/typing", ChatController.setTyping); // Send "Typing" status to chat // startTyping - stopTyping
routes.post("/v3/session/:session/recording", ChatController.setRecording); // Send "Typing" status to chat // startTyping - stopTyping
routes.post("/v3/session/:session/archiveChat", ChatController.archiveChat); // Add chat to archive
routes.post("/v3/session/:session/disappearingChat", ChatController.setTemporaryMessages); // Set disappearing messages mode on chat
routes.post("/v3/session/:session/clearChat", ChatController.clearChat); // Clear chat contents
routes.post("/v3/session/:session/archiveOldChat", ChatController.archiveOldChats); // Clear chat contents

// message
routes.post("/v3/session/:session/messages", MessagesController.sendMessage); // Send a message to a new or existing chat.
routes.delete("/v3/session/:session/messages", MessagesController.deleteMessage); // Get a list of messages (chats).
routes.get("/v3/session/:session/messages", MessagesController.getMessageById); // Get a list of messages (chats).


routes.post("/v3/session/:session/sendMentioned", MessagesController.sendMentioned); // Send a message to an array of numbers.

routes.post("/v3/session/:session/sendMessageToAllInGroup", MessagesController.sendMentionedToAllInGroup); // Send a message to an array of numbers.
routes.post("/v3/session/:session/sendFile", MessagesController.sendFileFromBase64); // Send a file to a new or existing chat.
routes.post("/v3/session/:session/sendPTT", MessagesController.sendPttFromBase64); // Send a ptt-audio to a new or existing chat.
routes.post("/v3/session/:session/sendLink", MessagesController.sendLinkPreview); // Send text with link and link's preview to a new or existing chat.
routes.post("/v3/session/:session/sendVCard", MessagesController.sendContactVcard); // Sending a contact or contact list to a new or existing chat.
routes.post("/v3/session/:session/sendLocation", MessagesController.sendLocation); // Sending a location to a new or existing chat.
routes.post("/v3/session/:session/forwardMessages", MessagesController.forwardMessages); // Forwarding one or more messages  to a new or existing chat.
routes.get("/v3/session/:session/messages", MessagesController.getAllChats); // Get a list of messages (chats).
routes.get("/v3/session/:session/getAllMessages", MessagesController.getAllChatsWithMessages); // Get a list of messages (chats).
routes.get("/v3/session/:session/getMessages", MessagesController.getMessages); // Clear chat contents
routes.post("/v3/session/:session/senMessageNew", MessagesController.sendMessageNew); // new send message function
routes.post("/v3/session/:session/deleteOldMessages", MessagesController.deleteOldMessages); // new send message function

// group
routes.get('/v3/session/:session/all-broadcast-list', GroupController.getAllBroadcastList);
routes.get('/v3/session/:session/all-groups', GroupController.getAllGroups);
routes.get('/v3/session/:session/group-members/:groupId', GroupController.getGroupMembers);
routes.get('/v3/session/:session/group-admins/:groupId', GroupController.getGroupAdmins);
routes.get('/v3/session/:session/group-invite-link/:groupId', GroupController.getGroupInviteLink);
routes.get('/v3/session/:session/group-revoke-link/:groupId',GroupController.revokeGroupInviteLink);
routes.get('/v3/session/:session/group-members-ids/:groupId',GroupController.getGroupMembersIds);
routes.get('/v3/session/:session/group-get-stats/:groupId', GroupController.getGroupStats);
routes.post('/v3/session/:session/create-group', GroupController.createGroup);
routes.post('/v3/session/:session/leave-group', GroupController.leaveGroup);
routes.post('/v3/session/:session/join-code', GroupController.joinGroupByCode);
routes.post('/v3/session/:session/add-participant-group', GroupController.addParticipant);
routes.post('/v3/session/:session/remove-participant-group', GroupController.removeParticipant);
routes.post('/v3/session/:session/promote-participant-group',GroupController.promoteParticipant);
routes.post('/v3/session/:session/demote-participant-group', GroupController.demoteParticipant);
routes.post('/v3/session/:session/group-info-from-invite-link', GroupController.getGroupInfoFromInviteLink);
routes.post('/v3/session/:session/group-description', GroupController.setGroupDescription);
routes.post('/v3/session/:session/group-property', GroupController.setGroupProperty);
routes.post('/v3/session/:session/group-subject', GroupController.setGroupSubject);
routes.post('/v3/session/:session/messages-admins-only', GroupController.setMessagesAdminsOnly);
routes.post('/v3/session/:session/change-privacy-group', GroupController.changePrivacyGroup);
routes.post('/v3/session/:session/set-group-pic', GroupController.setGroupProfilePic);

//profile
routes.post('/v3/session/:session/change-profile-name', ProfileController.setProfileName);
routes.post('/v3/session/:session/change-profile-status', ProfileController.setProfileStatus);
routes.post('/v3/session/:session/change-profile-pic', ProfileController.setProfilePic);

module.exports = routes;
