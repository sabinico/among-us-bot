const Discord = require('discord.js');
const { _ } = require('lodash');
const nconf = require('nconf');
const Memory = nconf.file('memory.json');
const settings = require('../settings.json');

class GameRoomManager {
	constructor(_guild) {
		this.guild = _guild;
	}
	static totalGameRooms() {
		return _.size(Memory.get('gamerooms'));
	}
	getGameRoom(_id) {
		const gamerooms = Memory.get('gamerooms');
		return _.find(gamerooms, _g => _g.id === _id);
	}
	getGameRoomByOwner(_user) {
		const gamerooms = Memory.get('gamerooms');
		return _.find(gamerooms, _g => _g.owner === _user.id);
	}
	saveGameRoom(_gameroom) {
		Memory.set('gamerooms:' + _gameroom.id, _gameroom);
		Memory.save();
	}
	isGameRoom(_channel) {
		return this.getGameRoom(_channel.parentID) !== null && this.getGameRoom(_channel.parentID) !== undefined;
	}
	async createGameRoom(_owner) {
		// AutoIncrement
		let _ai = Memory.get('gamerooms_ai');
		if(_ai === undefined) _ai = 0;
		_ai++;
		Memory.set('gamerooms_ai', _ai);
		Memory.save();
		// Create Category
		const nameCategory = `Game Room #${_.padStart(_ai, 2, '0')}`;
		const optionsCategory = {
			type: 'category',
			permissionOverwrites: [],
		};
		const categoryChannel = await this.guild.channels.create(nameCategory, optionsCategory);
		// Create Config Chat
		const nameConfig = `sala-${_.padStart(_ai, 2, '0')}`;
		const optionsConfig = {
			type: 'text',
			parent: categoryChannel,
			permissionOverwrites: [],
		};
		const configChannel = await this.guild.channels.create(nameConfig, optionsConfig);
		// Create Game Room Voice
		const nameGame = `Partida #${_.padStart(_ai, 2, '0')}`;
		const optionsGame = {
			type: 'voice',
			parent: categoryChannel,
			userLimit: 10,
			permissionOverwrites: [],
		};
		const gameChannel = await this.guild.channels.create(nameGame, optionsGame);
		// Create Lobby
		const nameLobby = `Lobby #${_.padStart(_ai, 2, '0')}`;
		const optionsLobby = {
			type: 'voice',
			parent: categoryChannel,
			permissionOverwrites: [],
		};
		const lobbyChannel = await this.guild.channels.create(nameLobby, optionsLobby);
		// Save rooms into memory
		const gameroom = {
			'id': categoryChannel.id,
			'title': nameCategory,
			'owner': _owner.id,
			'is_started': false,
			'is_voting': false,
			'channels': {
				'config': configChannel.id,
				'game': gameChannel.id,
				'lobby': lobbyChannel.id,
			},
			'messages': {
				'room_status': null,
				'players': null,
			},
			'config': {
				'unmute_ghosts_ingame': false,
				'mute_players_ingame': false,
				'mute_unknown_users': false,
				'move_unknown_users': true,
			},
			'players': [],
		};
		this.saveGameRoom(gameroom);
		// Move owner to Lobby
		const member = this.guild.member(_owner);
		member.voice.setChannel(lobbyChannel.id);

		// Init GameRoom
		await this.initGameRoom(gameroom.id);

		// permissionOverwrites: [
		// 	{
		// 		id: _owner.id,
		// 		allow: ['VIEW_CHANNEL', 'MANAGE_NICKNAMES', 'CREATE_INSTANT_INVITE', 'MUTE_MEMBERS'],
		// 	},
		// ],
	}
	async deleteGameRoom(_id) {
		const gameroom = this.getGameRoom(_id);
		const category = this.guild.channels.cache.find(_c => _c.id === _id);
		const config = this.guild.channels.cache.find(_c => _c.id === gameroom.channels.config);
		const game = this.guild.channels.cache.find(_c => _c.id === gameroom.channels.game);
		const lobby = this.guild.channels.cache.find(_c => _c.id === gameroom.channels.lobby);
		lobby.delete();
		game.delete();
		config.delete();
		category.delete();
		Memory.clear('gamerooms:' + _id);
		Memory.save();
		if(this.totalGameRooms() == 0) {
			Memory.set('gamerooms_ai', 0);
			Memory.save();
		}
	}
	async initGameRoom(_id) {
		// const gameroom = this.getGameRoom(_id);
		// Send Room Message
		await this.sendMessageRoomStatus(_id);
		// Send Players Message
		await this.sendMessagePlayers(_id);
		// Send Welcome and Instructions to the Owner
		// await this.sendMessageWelcomeOwner(_id);
	}
	async startGame(_id) {
		const gameroom = this.getGameRoom(_id);
		gameroom.is_started = true;
		this.saveGameRoom(gameroom);
		// move players into game voice
		const lobby = this.guild.channels.cache.find(_c => _c.id === gameroom.channels.lobby);
		lobby.members.forEach(async _member => {
			if(this.isPlayer(_id, _member.user.id)) {
				await _member.voice.setChannel(gameroom.channels.game);
			}
		});
		// mute all players after 5 seconds
		await new Promise(r => setTimeout(r, 5000));
		const gamevoice = this.guild.channels.cache.find(_c => _c.id === gameroom.channels.game);
		gamevoice.members.forEach(async _member => {
			await _member.voice.setMute(true);
		});
		await this.updateMessageRoom(_id);
	}
	async pauseGame(_id) {
		const gameroom = this.getGameRoom(_id);
		gameroom.is_voting = true;
		this.saveGameRoom(gameroom);
		// unmute all players
		const gamevoice = this.guild.channels.cache.find(_c => _c.id === gameroom.channels.game);
		gamevoice.members.forEach(async _member => {
			await _member.voice.setMute(false);
		});
		// mute death players
		await this.updateMessageRoom(_id);
	}
	async resumeGame(_id) {
		const gameroom = this.getGameRoom(_id);
		gameroom.is_voting = false;
		this.saveGameRoom(gameroom);
		// mute all players
		const gamevoice = this.guild.channels.cache.find(_c => _c.id === gameroom.channels.game);
		gamevoice.members.forEach(async _member => {
			await _member.voice.setMute(true);
		});
		// unmute death players
		await this.updateMessageRoom(_id);
	}
	async finishGame(_id) {
		const gameroom = this.getGameRoom(_id);
		gameroom.is_started = false;
		gameroom.is_voting = false;
		this.saveGameRoom(gameroom);
		// unmute all players and move players into lobby
		const gamevoice = this.guild.channels.cache.find(_c => _c.id === gameroom.channels.game);
		gamevoice.members.forEach(async _member => {
			await _member.voice.setMute(false);
			await _member.voice.setChannel(gameroom.channels.lobby);
		});
		await this.updateMessageRoom(_id);
	}
	// Players
	isPlayer(_id, _user) {
		const gameroom = this.getGameRoom(_id);
		const userID = typeof _user === 'string' ? _user : _user.id;
		return gameroom.players.find(_p => _p.id === userID) !== undefined;
	}
	isOwner(_id, _user) {
		const gameroom = this.getGameRoom(_id);
		const userID = typeof _user === 'string' ? _user : _user.id;
		return gameroom.owner === userID;
	}
	getPlayerByColor(_id, _color) {
		const gameroom = this.getGameRoom(_id);
		return gameroom.players.find(_p => _p.color === _color);
	}
	async addPlayer(_id, _user, _color) {
		const gameroom = this.getGameRoom(_id);
		const player = {
			id: _user.id,
			name: _user.username,
			color: _color,
			is_death: false,
		};
		gameroom.players.push(player);
		this.saveGameRoom(gameroom);
		await this.updateMessageRoom(_id);
		await this.updateMessagePlayers(_id);
	}
	async removePlayer(_id, _user) {
		const gameroom = this.getGameRoom(_id);
		const players = gameroom.players.filter(_p => _p.id !== _user.id);
		gameroom.players = players;
		this.saveGameRoom(gameroom);
		await this.updateMessageRoom(_id);
		await this.updateMessagePlayers(_id);
	}
	async resetPlayers(_id) {
		const gameroom = this.getGameRoom(_id);
		gameroom.players = [];
		this.saveGameRoom(gameroom);
		await this.updateMessageRoom(_id);
		await this.updateMessagePlayers(_id);
		await this.resetReactionsPlayers(_id);
	}
	// Colors
	getEmojiColor(_color) {
		return this.guild.emojis.cache.find(e => e.name === _color);
	}
	isColorInUse(_id, _color) {
		const gameroom = this.getGameRoom(_id);
		return gameroom.players.find(p => p.color === _color) !== undefined;
	}
	// Utils / Helpers
	async sendMessageToRoom(_id, _text) {
		const gameroom = this.getGameRoom(_id);
		const reply = await this.guild.channels.cache.find(c => c.id === gameroom.channels.config).send(_text);
		reply.delete({ timeout: 5000 });
	}
	// Embed Generators
	generateEmbedGameRoom(_id) {
		const gameroom = this.getGameRoom(_id);
		const statuses = {
			'started': '`⚠️ EN PARTIDA`',
			'paused': '`🧭 EN VOTACIONES`',
			'finished': '`🔎 ESPERANDO JUGADORES...`',
		};
		const currentStatus = (gameroom.is_voting ? statuses['paused'] : (gameroom.is_started ? statuses['started'] : statuses['finished']));
		const owner = this.guild.member(gameroom.owner);


		let players = '';
		if(gameroom.players.length > 0) {
			gameroom.players.forEach(_p => {
				players += `${this.getEmojiColor(_p.color)} ${this.guild.member(_p.id)} ${_p.is_death ? '☠️' : ''}\n\r`;
			});
		}
		else {
			players = 'No hay jugadores :(';
		}
		const fields = [
			{ name: 'Game Status', value: `${currentStatus}` },
			{ name: '👑 Owner', value: `${owner}` },
			{ name: `👥 Players ${gameroom.players.length}/10`, value: `${players}` },
		];


		const roomEmbed = new Discord.MessageEmbed()
			.setColor('#ff8e00')
			.setTitle('Game Room Status: ' + gameroom.title)
			.setDescription('Desde aquí podrás ver y gestionar el estado de la partida y realizar ajustes en la configuración de los canales y jugadores.')
			.setThumbnail('https://cdn.discordapp.com/emojis/750737029096013924.png?v=1')
			.addFields(fields)
			.setTimestamp()
			.setFooter(`Among Us - ESPAÑA | Partidas públicas - ${gameroom.title}`, 'https://cdn.discordapp.com/emojis/750737029096013924.png?v=1');
		return roomEmbed;
	}
	generateEmbedPlayers(_id) {
		const gameroom = this.getGameRoom(_id);

		const players = [{ name: `👥 Players ${gameroom.players.length}/10`, value: '-' }];
		if(gameroom.players.length > 0) {
			gameroom.players.forEach(_p => {
				players.push({
					name: `${this.getEmojiColor(_p.color)} ${_p.color} Player`,
					value: `${this.guild.member(_p.id)} ${_p.id == gameroom.owner ? '(*)' : ''} ${_p.is_death ? '☠️' : ''}`,
				});
			});
		}
		const playersEmbed = new Discord.MessageEmbed()
			.setColor('#ff8e00')
			.setTitle('Player Selection')
			.setDescription('Reacciona a los iconos para seleccionar un color, para poder reaccionar debes estar en el lobby, al seleccionar un color serás movido a la sala de juego, puedes cambiar tu color en cualquier momento')
			.setThumbnail('https://cdn.discordapp.com/emojis/750737029096013924.png?v=1')
			.addFields(players)
			.setTimestamp()
			.setFooter(`Among Us - ESPAÑA | Partidas públicas - ${gameroom.title}`, 'https://cdn.discordapp.com/emojis/750737029096013924.png?v=1');
		return playersEmbed;
	}
	// Send Messages
	async sendMessageRoomStatus(_id) {
		const gameroom = this.getGameRoom(_id);
		const roomEmbed = this.generateEmbedGameRoom(_id);
		const message = await this.guild.channels.cache.find(c => c.id === gameroom.channels.config).send(roomEmbed);
		gameroom.messages.room_status = message.id;
		this.saveGameRoom(gameroom);
		await this.updateReactionsRoomStatus(_id);
	}
	async sendMessagePlayers(_id) {
		const gameroom = this.getGameRoom(_id);
		const playersEmbed = this.generateEmbedPlayers(_id);
		const message = await this.guild.channels.cache.find(c => c.id === gameroom.channels.config).send(playersEmbed);
		gameroom.messages.players = message.id;
		this.saveGameRoom(gameroom);
		await this.updateMessagePlayers(_id);
	}
	/* async sendMessageWelcomeOwner(_id) {
		// const gameroom = this.getGameRoom(_id);
		// const playersEmbed = this.generateEmbedPlayers(_id);
		// const message = await this.guild.channels.cache.find(c => c.id === gameroom.channels.config).send(playersEmbed);
		// gameroom.messages.players = message.id;
		// this.saveGameRoom(gameroom);
	}*/
	// Update Messages
	async updateMessageRoom(_id) {
		const gameroom = this.getGameRoom(_id);
		const embed = this.generateEmbedGameRoom(_id);
		const message = await this.guild.channels.cache.find(c => c.id === gameroom.channels.config).messages.fetch(gameroom.messages.room_status);
		message.edit(embed);
	}
	async updateMessagePlayers(_id) {
		const gameroom = this.getGameRoom(_id);
		const embed = this.generateEmbedPlayers(_id);
		const message = await this.guild.channels.cache.find(c => c.id === gameroom.channels.config).messages.fetch(gameroom.messages.players);
		message.edit(embed);
		await this.updateReactionsPlayers(_id);
	}
	// Reactions Helpers
	async updateReactionsRoomStatus(_id) {
		const gameroom = this.getGameRoom(_id);
		const message = await this.guild.channels.cache.find(c => c.id === gameroom.channels.config).messages.fetch(gameroom.messages.room_status);
		const reactions = message.reactions;
		const default_emojis = ['✅', '📢', '🏁'];

		if(reactions.size > 0) {
			await reactions.removeAll();
		}

		default_emojis.forEach(async (_emoji) => {
			await message.react(_emoji);
		});
	}
	async updateReactionsPlayers(_id) {
		const gameroom = this.getGameRoom(_id);
		const message = await this.guild.channels.cache.find(c => c.id === gameroom.channels.config).messages.fetch(gameroom.messages.players);
		const reactions = message.reactions;
		const colors = settings.colors;
		const _colors_avaliable = [];
		const _colors_inuse = [];
		const emojis_detected = [];
		colors.forEach(_color => {
			if(!this.isColorInUse(_id, _color)) {
				_colors_avaliable.push(_color);
			}
			else {
				_colors_inuse.push(_color);
			}
		});

		// Eliminar todo si ya hay 10 jugadores
		if(_colors_inuse.length === 10) {
			return await reactions.removeAll();
		}

		// Eliminar reacciones de jugadores en uso
		reactions.cache.forEach(async (_reaction) => {
			if(_colors_inuse.includes(_reaction.emoji.name)) {
				await _reaction.remove();
			}
			else {
				emojis_detected.push(_reaction.emoji.name);
			}
		});

		// Añadir reacciones de jugadores disponibles
		colors.forEach(async (_color) => {
			if(_colors_avaliable.includes(_color) && !emojis_detected.includes(_color)) {
				const _emoji = this.getEmojiColor(_color);
				await message.react(_emoji);
			}
		});
	}
	async resetReactionsPlayers(_id) {
		const gameroom = this.getGameRoom(_id);
		const message = await this.guild.channels.cache.find(c => c.id === gameroom.channels.config).messages.fetch(gameroom.messages.players);
		await message.reactions.removeAll();
		settings.colors.forEach(async (color) => {
			const emoji = this.guild.emojis.cache.find(e => e.name === color);
			await message.react(emoji);
		});
	}
}

module.exports.GameRoomManager = GameRoomManager;