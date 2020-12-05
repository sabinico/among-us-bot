const Discord = require('discord.js');
const settings = require('../settings.json');
const nconf = require('nconf');
const Memory = nconf.file('memory.json');
const { CodesManager } = require('../utils/codesmanager');

module.exports = {
	run: async (oldPresence, newPresence) => {

		// Delete old codes
		if(oldPresence != undefined && oldPresence.activities.length != 0 && oldPresence.activities[0].party != null && oldPresence.activities[0].party.id != null) {
			const _code = oldPresence.activities[0].party.id;
			if(newPresence.activities.length == 0 || newPresence.activities[0].party == null || newPresence.activities[0].party.id == null) {
				if(CodesManager.exists(_code)) {
					const gamecode = CodesManager.get(_code);
					if(gamecode.owner === oldPresence.member.user.id) {
						console.log('DELETING ROOM CODE ' + _code);
						// DISABLED: Cuando el owner se va otra persona hostea y asi empieza a repetir sucesivamente el codigo de la sala
						// CodesManager.delete(_code);
					}
				}
			}
		}

		const guild = newPresence.guild;
		const member = newPresence.member;
		const user = newPresence.member.user;
		if(user.is_bot) return;
		// const logChannel = await guild.channels.cache.find(c => c.id === '754359601612456008');
		const logChannel = await guild.channels.cache.find(c => c.id === settings.codereader.channel);
		if(newPresence.activities.length == 0) return;
		const activity = newPresence.activities[0];
		const party = activity.party;
		if(activity.name !== 'Among Us') return;
		if(activity.details !== 'Hosting a game') return;
		// console.log(activity);

		// TESTING
		if(!CodesManager.exists(party.id)) {
			const data = {
				'owner': user.id,
				'party': party.size[0] + '/' + party.size[1],
				'channel': member.voice.channelID,
			};
			CodesManager.set(party.id, data);

			// Send Embed
			const fields = [
				{ name: 'Owner', value: `${user}` },
				{ name: 'Code', value: `${party != null ? party.id : 'NO_CODE'}` },
			];
			const embed = new Discord.MessageEmbed()
				.setColor('#ff8e00')
				.setTitle('Nueva Partida de ' + activity.name)
				.setThumbnail(user.avatarURL())
				.addFields(fields)
				.setTimestamp()
				.setFooter('Among Us - ESPAÑA | Buscador de partidas', 'https://cdn.discordapp.com/emojis/750737029096013924.png?v=1');
			logChannel.send(embed);

			// Send Audio code
			if(member.voice.channelID !== undefined) {
				CodesManager.generateCodeAnounce(party.id, member.voice.channel);
			}

		}
		else {
			const data = {
				'owner': user.id,
				'party': party.size[0] + '/' + party.size[1],
				'channel': member.voice.channelID,
			};
			CodesManager.set(party.id, data);
		}

		// EMBED

	},
};