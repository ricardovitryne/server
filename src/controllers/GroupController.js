const sessions = require("../models/sessions");
const { contactToArray, unlinkAsync } = require("../models/utils");
const utils = require("../models/utils")

module.exports = {
    async getAllGroups(req, res) {
        try {
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            let result;
            await client.then(async (client) => {
                result = await client.getAllGroups();
            });
            //
            return res.status(200).json({ status: "success", message: result });
        } catch (e) {
            res.status(500).json({
                status: "error",
                message: "Error fetching groups",
            });
        }
    },

    async joinGroupByCode(req, res) {
        try {
            const { inviteCode } = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            if (!inviteCode)
                return res
                    .status(400)
                    .send({ message: "Invitation Code is required" });
            //
            await client.then(async (client) => {
                await client.joinGroup(inviteCode);
            });
            //
            res.status(201).json({
                status: "success",
                message: {
                    contact: inviteCode,
                },
            });
        } catch (e) {
            res.status(500).json({
                status: "error",
                message:
                    "The informed contact(s) did not join the group successfully",
            });
        }
    },

    async createGroup(req, res) {
        try {
            const { participants, name } = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            let result;
            let infoGroup = [];
            //
            await client.then(async (client) => {
                result = await client.createGroup(
                    name,
                    contactToArray(participants)
                );
                infoGroup.push({
                    name: name,
                    id: result.gid.user,
                    participants: result.participants.map((user) => {
                        return { user: Object.keys(user)[0] };
                    }),
                });
            });
            //
            return res.status(201).json({
                status: "success",
                message: {
                    group: name,
                    groupInfo: infoGroup,
                },
            });
        } catch (e) {
            return res
                .status(500)
                .json({ status: "error", message: "Error creating group(s)" });
        }
    },

    async leaveGroup(req, res) {
        try {
            const { groupId } = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            await client.then(async (client) => {
                await client.leaveGroup(`${groupId}@g.us`);
            });
            //
            return res.status(200).json({
                status: "success",
                message: {
                    group: groupId,
                },
            });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "error leaving group",
            });
        }
    },

    async getGroupMembers(req, res) {
        try {
            const { groupId } = req.params;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            let result;

            //
            await client.then(async (client) => {
                result = await client.getGroupMembers(utils.traitNumber(groupId,"group"));
            });
            //
            return res.status(200).json({ status: "success", message: result });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error on get group members",
            });
        }
    },

    async addParticipant(req, res) {
        try {
            const { groupId, phone } = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            
            let errorStatusCode = 0;
            
            if(! (await client)) {
                throw new Error('Invalid session');
            }

            const participantIsvalid = await client.then(async (client) => {
                const contact = await client.checkNumberStatus(`${phone}`);
                if (!(contact?.status == 200 && contact?.numberExists == true))
                    return  false
                else return true
            });
            

            if(!participantIsvalid){
                let errorStatusCode = 403
                throw new Error('Participant number is not a valid whatsapp contact');
            }
            
            await client.then(async (client) => {
                await client.addParticipant(`${groupId}@g.us`, phone);
            });
            //
            return res.status(200).json({
                status: "success",
                message: "Participant added successfully",
            });
            
        } catch (e) {
            console.log(e);
            return res.status(403).json({
                status: "error",
                message: `${e}`,
            });
        }
    },

    async removeParticipant(req, res) {
        try {
            const { groupId, phone } = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            await client.then(async (client) => {
                await client.removeParticipant(`${groupId}@g.us`, phone);
            });
            //
            return res.status(200).json({
                status: "success",
                message: "Participant removed successfully",
            });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error removing participant(s)",
            });
        }
    },

    async promoteParticipant(req, res) {
        try {
            const { groupId, phone } = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            await client.then(async (client) => {
                await client.promoteParticipant(`${groupId}@g.us`, phone);
            });
            //
            return res.status(200).json({
                status: "success",
                message: "Successful promoted participant",
            });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error promoting participant",
            });
        }
    },

    async demoteParticipant(req, res) {
        try {
            const { groupId, phone } = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            await client.then(async (client) => {
                await client.demoteParticipant(`${groupId}@g.us`, phone);
            });
            //
            return res.status(200).json({
                status: "success",
                message: "Admin of participant revoked successfully",
            });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error revoking participant admin",
            });
        }
    },

    async getGroupAdmins(req, res) {
        try {
            const { groupId } = req.params;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            let result;
            //
            await client.then(async (client) => {
                result = await client.getGroupAdmins(`${groupId}@g.us`);
            });
            //
            return res.status(200).json({
                status: "success",
                message: result,
            });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error retrieving group admin(s)",
            });
        }
    },

    async getGroupInviteLink(req, res) {
        try {
            const { groupId } = req.params;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            let result;
            //
            await client.then(async (client) => {
                result = await client.getGroupInviteLink(`${groupId}@g.us`);
            });
            //
            return res.status(200).json({
                status: "success",
                message: result,
            });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error on get group invite link",
            });
        }
    },

    async revokeGroupInviteLink(req, res) {
        try {
            const { groupId } = req.params;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            let result;
            //
            await client.then(async (client) => {
                result = await client.revokeGroupInviteLink(`${groupId}@g.us`);
            });
            //
            return res.status(200).json({
                status: "success",
                message: result,
            });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error on revoke group invite link",
            });
        }
    },

    async getAllBroadcastList(req, res) {
        try {
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            let result;
            //
            await client.then(async (client) => {
                result = await client.getAllBroadcastList();
            });
            //
            return res.status(200).json({
                status: "success",
                message: result,
            });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error on get all broad cast list",
            });
        }
    },

    async getGroupInfoFromInviteLink(req, res) {
        try {
            const { invitecode } = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            let result;
            //
            await client.then(async (client) => {
                result = await client.getGroupInfoFromInviteLink(invitecode);
            });
            //
            return res.status(200).json({
                status: "success",
                message: result,
            });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error on get group info from invite link",
            });
        }
    },

    async getGroupMembersIds(req, res) {
        try {
            const { groupId } = req.params;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            let result;
            //
            await client.then(async (client) => {
                result = await client.getGroupMembersIds(`${groupId}@g.us`);
            });
            //
            return res.status(200).json({
                status: "success",
                message: result,
            });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error on get group members ids",
            });
        }
    },

    async setGroupDescription(req, res) {
        try {
            const { groupId, description } = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            let result;
            //
            await client.then(async (client) => {
                result = await client.setGroupDescription(
                    `${groupId}@g.us`,
                    description
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
                message: "Error on set group description",
            });
        }
    },

    async setGroupProperty(req, res) {
        try {
            const { groupId, property, value = true } = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            let result;
            //
            await client.then(async (client) => {
                result = await client.setGroupProperty(
                    `${groupId}@g.us`,
                    property,
                    value
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
                message: "Error on set group property",
            });
        }
    },

    async setGroupSubject(req, res) {
        try {
            const { groupId, title } = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            let result;
            //
            await client.then(async (client) => {
                result = await client.setGroupSubject(`${groupId}@g.us`, title);
            });
            //
            return res.status(200).json({
                status: "success",
                message: result,
            });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error on set group subject",
            });
        }
    },

    async setMessagesAdminsOnly(req, res) {
        try {
            const { groupId, value = true } = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            let result;
            //
            await client.then(async (client) => {
                result = await client.setMessagesAdminsOnly(
                    `${groupId}@g.us`,
                    value
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
                message: "Error on set messages admins only",
            });
        }
    },

    async changePrivacyGroup(req, res) {
        try {
            const { groupId, status } = req.body;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            await client.then(async (client) => {
                await client.setMessagesAdminsOnly(
                    `${groupId}@g.us`,
                    status === true
                );
            });
            //
            return res.status(200).json({
                status: "success",
                message: "Group privacy changed successfully",
            });
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: "Error changing group privacy",
            });
        }
    },
    
    async getGroupStats(req, res) {
        try {
            const {groupId} = req.params;
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            await client.then(async (client) => {
                groupMembers = await client.getGroupMembers(`${groupId}@g.us`);
            });

            await client.then(async (client) => {
                allGroupsInfo = await client.getAllGroups();
            });

            const selectedGroupInfo = allGroupsInfo.find((item)=>{
                if(item.id.user == groupId)
                    return({item})
            });

            const groupName = selectedGroupInfo.name;
            const groupDesc = selectedGroupInfo.groupMetadata.desc;
            const groupCreationTimeStamp = selectedGroupInfo.groupMetadata.creation;
            const groupDescTimeStamp = selectedGroupInfo.groupMetadata.descTime;
            const groupOwnerId = selectedGroupInfo.groupMetadata.owner.user;

            let countAdmin =0;
            let countMembers=0;

            const adminsIdsInGroup = selectedGroupInfo.groupMetadata.participants.filter((item)=>{
                if(item.isAdmin){
                    countAdmin+=1;
                    return (item.id)
                }
            }).map((item)=>{
                return item.id.user
            });

            const membersIdsInGroup = selectedGroupInfo.groupMetadata.participants.filter((item)=>{
                if(!item.isAdmin){
                    countMembers+=1;
                    return (item.id)
                }
            }).map((item)=>{
                return item.id.user
            });

            adminsInGroup = groupMembers.filter((item)=>{
                if(adminsIdsInGroup.includes(item.id.user)){
                    return(item)
                }
            }).map((item)=>{
                return({
                    name: item.name,
                    shortName: item.shortName,
                    pushname: item.pushname,
                    formattedName: item.formattedName,
                    isBusiness: item.isBusiness,
                    isEnterprise: item.isEnterprise,
                    telephone: item.id.user
                })
            });
            membersInGroup = groupMembers.filter((item)=>{
                if(membersIdsInGroup.includes(item.id.user)){
                    return(item)
                }
            }).map((item)=>{
                return({
                    name: item.name,
                    shortName: item.shortName,
                    pushname: item.pushname,
                    formattedName: item.formattedName,
                    isBusiness: item.isBusiness,
                    isEnterprise: item.isEnterprise,
                    telephone: item.id.user
                })
            });

            groupOwner = groupMembers.filter((item)=>{
                if(groupOwnerId.includes(item.id.user)){
                    return(item)
                }
            }).map((item)=>{
                return({
                    name: item.name,
                    shortName: item.shortName,
                    pushname: item.pushname,
                    formattedName: item.formattedName,
                    isBusiness: item.isBusiness,
                    isEnterprise: item.isEnterprise,
                    telephone: item.id.user
                })
            });

            const result = {
                name: groupName,
                desc: groupDesc,
                creationTimeStamp: groupCreationTimeStamp,
                descEditTimeStamp: groupDescTimeStamp,
                membersCount:countMembers,
                adminCount: countAdmin,
                members:membersInGroup,
                admins:adminsInGroup,
                owner:groupOwner,
            }
            return res.status(200).json({status: "success", message: result});
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                status: "error",
                message: "Error on get group members",
            });
        }
    },

    async setGroupProfilePic(req, res) {
        try {

            const {groupId, filename = "file",base64} = req.body;
            //
            if (!req.body.base64)
                return res.status(400).json({
                    status: "error",
                    message: "File parameter is required!",
                });
            //
            const session = req.params?.session;
            const client = sessions.getSessionClient(session);
            //
            await client.then(async (client) => {
                await client.setProfilePic(base64, `${groupId}@g.us`);
            });
            //
            // await unlinkAsync(base64);
            //
            return res.status(201).json({
                status: "success",
                message: "Group profile photo successfully changed",
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                status: "error",
                message: "Error changing group photo",
            });
        }
    },
    
};
