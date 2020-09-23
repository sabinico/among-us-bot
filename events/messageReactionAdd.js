const { _ } = require('lodash');
const { GameRoomManager } = require('../utils/gamemanager');

module.exports = {
	removeReaction: async (reaction, user) => {
		await new Promise(r => setTimeout(r, 1000));
		const userReactions = reaction.message.reactions.cache.filter(_r => _r.users.cache.has(user.id));
		for (const _reaction of userReactions.values()) {
			await new Promise(r => setTimeout(r, 1000));
			await _reaction.users.remove(user.id);
		}
	},
	run: async (reaction, user) => {

		// Ignore bot reactions
		if(user.bot) return;

		// Load partials
		if (reaction.partial) {
			try {
				await reaction.fetch();
			}
			catch (error) {
				console.log('Something went wrong when fetching the message: ', error);
				return;
			}
		}

		// Load GameRoomManager
		const _GameRoomManager = new GameRoomManager(reaction.message.guild);

		// Game Room Reactions
		if(_GameRoomManager.isGameRoom(reaction.message.channel)) {
			const _gameroom = _GameRoomManager.getGameRoom(reaction.message.channel.parentID);

			// GameRoom Status
			if(reaction.message.id === _gameroom.messages.room_status) {

				// Delete user reaction
				await module.exports.removeReaction(reaction, user);

				// Player needs to be in voice chat
				if(reaction.message.guild.member(user).voice.channelID === undefined) {
					const reply = await reaction.message.channel.send(`${reaction.message.guild.member(user)}, primero tienes que estar dentro de un canal de voz.`);
					await module.exports.removeReaction(reaction, user);
					reply.delete({ timeout: 5000 });
					return;
				}

				// Emojis ['✅', '📢', '🏁']
				let reply;
				switch (reaction.emoji.name) {
				case '✅':
					if(!_gameroom.is_started) {
						reply = await reaction.message.channel.send('✅ Arrancando motores de la nave... **¡COMIENZA LA PARTIDA!** .');
						reply.delete({ timeout: 15000 });
						return await _GameRoomManager.startGame(_gameroom.id);
					}
					reply = await reaction.message.channel.send('✅ Votaciones finalizadas... **¡LA PARTIDA CONTINUA!** _Todo el mundo en silencio_.');
					reply.delete({ timeout: 15000 });
					await _GameRoomManager.resumeGame(_gameroom.id);
					return;

				case '📢':
					reply = await reaction.message.channel.send('📢 Requesting meeting... **¡EMERGENCY MEETING!**');
					reply.delete({ timeout: 15000 });
					await _GameRoomManager.pauseGame(_gameroom.id);
					return;

				case '🏁':
					reply = await reaction.message.channel.send('🏁 Finalizando partida... **¡LA PARTIDA HA FINALIZADO!** GG WP _(Volviendo al lobby...)_');
					reply.delete({ timeout: 15000 });
					await _GameRoomManager.finishGame(_gameroom.id);
					return;

				default:
					reply = await reaction.message.channel.send(`${reaction.message.guild.member(user)} Unknown reaction: ${reaction.emoji.name} ${reaction.emoji}`);
					reply.delete({ timeout: 5000 });
					return;
				}


				// Debug auto-delete message
				// const reply = await reaction.message.channel.send(`${reaction.message.guild.member(user)} ha seleccionado ${reaction.emoji} en GameRoom Status!`);
				// reply.delete({ timeout: 5000 });
				// return;
			}

			// Players
			if(reaction.message.id === _gameroom.messages.players) {

				await _GameRoomManager.updateReactionsPlayers(_gameroom.id);

				// Player needs to be in voice chat
				if(reaction.message.guild.member(user).voice.channelID === undefined) {
					const reply = await reaction.message.channel.send(`${reaction.message.guild.member(user)}, primero tienes que estar dentro de un canal de voz.`);
					await module.exports.removeReaction(reaction, user);
					reply.delete({ timeout: 5000 });
					return;
				}

				// Game is not started
				if(_gameroom.is_started) {
					const reply = await reaction.message.channel.send(`${reaction.message.guild.member(user)}, la partida esta en curso esperate a que acabe.`);
					await module.exports.removeReaction(reaction, user);
					reply.delete({ timeout: 5000 });
					return;
				}

				// User can only select one player
				const _player = _.find(_gameroom.players, _p => { return _p.id === user.id;});
				if(_player !== undefined) {
					const reply = await reaction.message.channel.send(`${reaction.message.guild.member(user)}, no puedes elegir otro jugador, anteriormente elegiste ${_player.color}.`);
					await module.exports.removeReaction(reaction, user);
					reply.delete({ timeout: 5000 });
					return;
				}

				// Color is avaliable
				if(_GameRoomManager.isColorInUse(_gameroom.id, reaction.emoji.name)) {
					const reply = await reaction.message.channel.send(`${reaction.message.guild.member(user)}, el color ${reaction.emoji} esta ocupado por otro jugador.`);
					await module.exports.removeReaction(reaction, user);
					reply.delete({ timeout: 5000 });
					return;
				}

				// Set Player
				await _GameRoomManager.addPlayer(_gameroom.id, user, reaction.emoji.name);

				// Confirmation auto-delete message
				const reply = await reaction.message.channel.send(`${reaction.message.guild.member(user)} ha elegido al jugador ${reaction.emoji}`);
				reply.delete({ timeout: 5000 });
				return;
			}
		}
		// -- End / Game Room Reactions


		// Now the message has been cached and is fully available
		// console.log(`${reaction.message.author}'s message "${reaction.message.content}" gained a reaction!`);
		// The reaction is now also fully available and the properties will be reflected accurately:
		// console.log(`${reaction.count} user(s) have given the same reaction to this message!`);

	},
};