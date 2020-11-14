const settings = require('../settings.json');
const { StatsManager } = require('../utils/statsmanager');

module.exports = {
	run: async (message, arguments) => {

		const pongs = StatsManager.increment('pongs');
		return msg.channel.send('Pong nº' + pongs + '!');

		const guild = newState.guild;
		const user = newState.member.user;

		// Memory management
		const nconf = require('nconf');
		const Memory = nconf.file('memory.json');

		// Load GameRoomManager
		const _GameRoomManager = new GameRoomManager(newState.guild);

		// Move all command
		const moveall_enabled = Memory.get('moveall:enabled');
		const moveall_target = Memory.get('moveall:target');
		if(moveall_enabled && moveall_target === newState.member.id) {
			oldState.channel.members.forEach(async (_member) => {
				await _member.voice.setChannel(newState.channel);
			});
			Memory.set('moveall:enabled', false);
			Memory.set('moveall:target', null);
			Memory.save();
		}

		// Game Creator
		if(newState.channel && newState.channel.id === settings.roomscreator.channel) {
			// Check if users is already owner of a room
			const _oldRoom = _GameRoomManager.getGameRoomByOwner(user);
			if(_oldRoom !== undefined) {
				// Move to his room
				await newState.member.voice.setChannel(_oldRoom.channels.lobby);
			}
			else {
				// Create new room for user
				await _GameRoomManager.createGameRoom(user);
			}
		}

		// IsGameRoom JOINED
		if(newState.channel && _GameRoomManager.isGameRoom(newState.channel)) {
			// console.log('EVENT voiceStateUpdate | IsGameRoom JOINED');
			const _gameroom = _GameRoomManager.getGameRoom(newState.channel.parentID);
			const _is_player = _GameRoomManager.isPlayer(_gameroom.id, user);

			// Game Voice
			if(newState.channel.id === _gameroom.channels.game) {
				// Prevent non players from joining
				if(_gameroom.config.move_unknown_users && !_is_player) {
					await _GameRoomManager.sendMessageToRoom(_gameroom.id, `${newState.member}, No puedes entrar en la sala hasta que te registres como jugador. Elige un color.`);
					newState.member.voice.setChannel(_gameroom.channels.lobby);
					return;
				}
			}
		}
		// IsGameRoom LEAVED
		if(oldState.channel && _GameRoomManager.isGameRoom(oldState.channel)) {
			// console.log('EVENT voiceStateUpdate | IsGameRoom LEAVED');
			const _gameroom = _GameRoomManager.getGameRoom(oldState.channel.parentID);
			const _configChannel = guild.channels.cache.find(c => c.id === _gameroom.channels.config);
			const _voiceChannel = guild.channels.cache.find(c => c.id === _gameroom.channels.game);
			const _lobbyChannel = guild.channels.cache.find(c => c.id === _gameroom.channels.lobby);

			// User exit outside gameroom
			if(!newState.channel || !_GameRoomManager.isGameRoom(newState.channel)) {
				// Autoremove players
				if(_GameRoomManager.isPlayer(_gameroom.id, user.id)) {
					await _GameRoomManager.removePlayer(_gameroom.id, user);
					const reply = await _configChannel.send(`Autoremoving ${oldState.member} as player: ha abandonado el lobby.`);
					reply.delete({ timeout: 5000 });
				}
				// Auto-owner change
				if(_GameRoomManager.isOwner(_gameroom.id, user) && (_voiceChannel.members.size > 0 || _lobbyChannel.members.size > 0)) {
					// TODO if players then first else random
				}
				// Delete Room if no players
				if(_voiceChannel.members.size === 0 && _lobbyChannel.members.size === 0) {
					await _GameRoomManager.deleteGameRoom(_gameroom.id);
				}
			}

		}
	},
};