const fs = require('fs');
// const path = require('path');
// const moment = require('moment');
const settings = require('./settings.json');
const _ = require('lodash');

const Discord = require('discord.js');
const client = global.client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

const nconf = require('nconf');
const Memory = nconf.file('memory.json');

const { GameRoomManager } = require('./utils/gamemanager');
const { StatsManager } = require('./utils/statsmanager');

const say = require('say');

// settings.json checks
if (!settings.owners.length) {
	console.error('You have to enter at least one owner in the settings.json');
	process.exit(42);
}

if (!settings.token) {
	console.error('You forgot to enter your Discord super secret token! You can get this token from the following page: https://discordapp.com/developers/applications/');
	process.exit(42);
}

if (!settings.prefix) {
	console.error('You can\'t start the bot without setting a standard prefix');
	process.exit(42);
}

if (!settings.botMainDiscordServer) {
	console.error('You have to set the main Discord server id');
	process.exit(42);
}

// Ready
client.once('ready', () => {
	console.log('Bot Ready!');
	const updateSeconds = 5;
	setInterval(() => {
		const rooms = GameRoomManager.totalGameRooms();
		client.user.setPresence({
			activity: {
				name: `${rooms} Salas de juego`,
				type: 'WATCHING',
			},
			status: rooms == 0 ? 'idle' : 'online', // online | idle | invisible | dnd
		});
	}, updateSeconds * 1000);
});

// Helpers
function tts(voiceChannel, text) {
	if (!fs.existsSync('./temp')) {
		fs.mkdirSync('./temp');
	}
	const timestamp = new Date().getTime();
	const soundPath = `./temp/${timestamp}.wav`;
	const velocity = 1;
	say.export(text, null, velocity, soundPath, (err) => {
		if (err) {
			console.error(err);
			return;
		}
		else{
			voiceChannel.join().then((connection) => {
				const dispatcher = connection.play(soundPath).on('finish', () => {
					connection.disconnect();
					fs.unlinkSync(soundPath);
				});

				dispatcher.on('error', (err) => {
					console.error(err);
					connection.disconnect();
					fs.unlinkSync(soundPath);
				});
				dispatcher.on('start', () => {
					console.log('Scribe: Play Starting...');
				});
				dispatcher.on('finish', () => {
					console.log('Scribe: Finished playing!');
				});

				// connection.on('speaking', (user, speaking) => {
				//	console.log('here');
				// });
			}).catch((err) => {
				console.error(err);
			});
		}
	});
}

// Events
fs.readdir('./events/', (err, files) => {
	if (err) return console.error(err);
	files.forEach((file) => {
		const eventFunction = require(`./events/${file}`);
		if (eventFunction.disabled) return;
		const event = eventFunction.event || file.split('.')[0];
		const emitter = (typeof eventFunction.emitter === 'string' ? client[eventFunction.emitter] : eventFunction.emitter) || client;
		const { once } = eventFunction;
		try {
			emitter[once ? 'once' : 'on'](event, (...args) => eventFunction.run(...args));
		}
		catch (error) {
			console.error(error.stack);
		}
	});
});

client.on('message', async msg => {
	const args = msg.content.slice(settings.prefix.length).trim().split(' ');
	const command = args.shift().toLowerCase();
	const member = msg.guild.member(msg.author);

	const _GameRoomManager = new GameRoomManager(msg.guild);

	// CODEREADER
	if(settings.codereader.enabled && msg.channel.id === settings.codereader.channel) {
		// Check for codes (6 chars) && user in-voice
		if(msg.content.length == 6 && member.voice.channelID !== undefined) {
			const code = msg.content;
			const library = {
				'A': ['Albacete'],
				'B': ['Barcelona'],
				'C': ['Casa'],
				'D': ['Dinamarca'],
				'E': ['España'],
				'F': ['Francia', 'Furcia'],
				'G': ['Gato'],
				'H': ['Helado'],
				'I': ['Italia'],
				'J': ['Jaen'],
				'K': ['Kilo'],
				'L': ['Lugo'],
				'M': ['Madrid'],
				'N': ['Noruega'],
				'O': ['Oviedo'],
				'P': ['Pamplona'],
				'Q': ['Queso'],
				'R': ['Roma'],
				'S': ['Sevilla'],
				'T': ['Toledo'],
				'U': ['Ucrania'],
				'V': ['Valencia'],
				'W': ['Washington'],
				'X': ['Xilofono'],
				'Y': ['Yogurt'],
				'Z': ['Zapato'],
			};
			let frase_completa = '';
			for (let i = 0; i < code.length; i++) {
				const letter = code.charAt(i);
				const city_array = library[letter.toUpperCase()];
				const city = city_array[Math.floor(Math.random() * city_array.length)];
				frase_completa += letter + ' de ' + city + '. ';
			}

			tts(member.voice.channel, frase_completa);
		}
	}

	// COMMANDS
	{
		if(_.startsWith(msg.content, settings.prefix)) {
			console.log(`Command detected: ${command} (${args})`);

			// Command: PING
			if (command === 'ping') {
				const pongs = StatsManager.increment('pongs');
				return msg.channel.send('Pong nº' + pongs + '!');
			}

			// Server Info
			if (command === 'serverinfo') {
				return msg.reply('Server ID: `' + msg.guild.id + '`');
			}

			// Command: GAMEMANAGER | Listado de salas de juego activas, stados, owners y acciones
			if(command === 'gamemanager') {

				const vccEmbed = new Discord.MessageEmbed()
					.setColor('#ff8e00')
					.setTitle('Game Room Manager')
					.setDescription('Listado de salas disponibles para jugar')
					.setThumbnail('https://cdn.discordapp.com/emojis/750737029096013924.png?v=1')
					.addFields(
						{ name: '\u200B', value: '\u200B' },
						{ name: member.voice.channel.name, value: '`' + member.voice.channelID + '`' },
						{ name: '\u200B', value: '\u200B' },
						{ name: '➕ Crear nueva sala', value: 'Crea un nuevo conjunto de salas', inline: true },
						{ name: 'Move to channel', value: 'Mueve a todos los usuarios de la sala contigo', inline: true },
						{ name: 'Inline field title', value: 'Some value here', inline: true },
					)
					.setTimestamp()
					.setFooter('Among Us - ESPAÑA', 'https://cdn.discordapp.com/emojis/750737029096013924.png?v=1');
				const message = await msg.channel.send(vccEmbed);

				await message.react('➕');
				await message.react('🍊');
				await message.react('🍇');

				return;
			}

			// Command: ROOM | Embed para mostrar el estado de una Game Room
			if(command === 'room') {

				msg.delete();

				// Required to be in a voice channel
				if(member.voice.channelID === undefined) {
					const reply = await msg.channel.send(`${msg.author}, primero tienes que estar dentro de un canal de voz.`);
					reply.delete({ timeout: 5000 });
					return;
				}

				if(!_GameRoomManager.isGameRoom(member.voice.channel)) {
					const reply = await msg.reply('La sala en la que estas no es una sala de juego');
					reply.delete({ timeout: 5000 });
					return;
				}

				const game_room = _GameRoomManager.getGameRoom(member.voice.channel.parentID);

				// Arguments mode
				if(args.length > 0) {
					if(args[0] === 'delete') {
						msg.reply('Deleting game room...');
						await _GameRoomManager.deleteGameRoom(game_room.id);
						return;
					}
				}

				await _GameRoomManager.sendMessageRoomStatus(game_room.id);
				return;
			}

			// Command: PLAYER | Embed para la selección (registro) del jugador
			if(command === 'players') {

				msg.delete();

				// Required to be in a voice channel
				if(member.voice.channelID === undefined) {
					const reply = await msg.channel.send(`${msg.author}, primero tienes que estar dentro de un canal de voz.`);
					reply.delete({ timeout: 5000 });
					return;
				}

				if(!_GameRoomManager.isGameRoom(member.voice.channel)) {
					const reply = await msg.reply('La sala en la que estas no es una sala de juego');
					reply.delete({ timeout: 5000 });
					return;
				}

				const game_room = _GameRoomManager.getGameRoom(member.voice.channel.parentID);

				if(args.length > 0) {
					if(args[0] === 'reset') {
						const reply = await msg.reply('Resetting players...');
						await _GameRoomManager.resetPlayers(game_room.id);
						reply.delete({ timeout: 5000 });
						return;
					}
				}


				_GameRoomManager.sendMessagePlayers(game_room.id);

				// Add Reactions
				// await _GameRoomManager.resetReactionsPlayers(game_room.id);
				return;
			}

			// Command: moveall
			if(command === 'moveall') {

				// Required to be in a voice channel
				if(member.voice.channelID === undefined) {
					return msg.reply('Primero tienes que estar dentro de un canal de voz.');
				}
				const enabled = Memory.get('moveall:enabled');
				if(enabled) {
					const target = Memory.get('moveall:target');
					return msg.reply(`Este comando esta en uso por ${msg.guild.member(target)}`);
				}

				Memory.set('moveall:enabled', true);
				Memory.set('moveall:target', msg.author.id);
				Memory.save();

				return msg.reply('Todo listo, muevete a otro canal y yo me encargo de los demás!');
			}

			// Command: muteall
			if(command === 'muteall') {

				const sala_roja = '753653471479332905';
				if(member === null) {
					const mute_state = args[0] == 1 ? true : false;
					const channel = msg.guild.channels.cache.get(sala_roja);
					channel.members.forEach(async (_member) => {
						await _member.voice.setMute(mute_state);
					});
					return;
				}

				// Required to be in a voice channel
				if(member.voice.channelID === undefined) {
					return msg.reply('Primero tienes que estar dentro de un canal de voz.');
				}

				// Argumentos
				if(args.length !== 1) {
					return msg.reply('Falta el argumento 1 o 0');
				}
				const mute_state = args[0] == 1 ? true : false;

				member.voice.channel.members.forEach(async (_member) => {
					await _member.voice.setMute(mute_state);
				});
			}

			if(command === 'say') {
				// Required to be in a voice channel
				if(member.voice.channelID === undefined) {
					return msg.reply('Primero tienes que estar dentro de un canal de voz.');
				}
				tts(member.voice.channel, args.join(' '));
			}

			// Command: VCT
			if(command === 'vct') {

				// Required to be in a voice channel
				if(member.voice.channelID === undefined) {
					return msg.channel.send(`${msg.author}, primero tienes que estar dentro de un canal de voz.`);
				}

				const vccEmbed = new Discord.MessageEmbed()
					.setColor('#ff8e00')
					.setTitle('Voice Chat Tools')
					.setDescription('Herramientas para gestionar de forma masiva los usuarios del canal en el que te encuentras.')
					.setThumbnail('https://cdn.discordapp.com/emojis/750737029096013924.png?v=1')
					.addFields(
						{ name: '\u200B', value: '\u200B' },
						{ name: member.voice.channel.name, value: '`' + member.voice.channelID + '`' },
						{ name: '\u200B', value: '\u200B' },
						{ name: 'Mute all users', value: 'Mutea/Desmutea a todos los usuarios de la sala', inline: true },
						{ name: 'Move to channel', value: 'Mueve a todos los usuarios de la sala contigo', inline: true },
						{ name: 'Inline field title', value: 'Some value here', inline: true },
					)
					.setTimestamp()
					.setFooter('Among Us - ESPAÑA', 'https://cdn.discordapp.com/emojis/750737029096013924.png?v=1');
				const message = await msg.channel.send(vccEmbed);

				await message.react('🔇');
				await message.react('🔊');
				await message.react('♻️');

				const filter = (reaction, user) => {
					return ['🔇', '🔊', '♻️'].includes(reaction.emoji.name) && user.id === msg.author.id;
				};

				message.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
					.then(collected => {
						const reaction = collected.first();

						if (reaction.emoji.name === '🔇') {
							msg.reply('Muteando a todos en el canal');
							member.voice.channel.members.forEach(async (_member) => {
								await _member.voice.setMute(true);
							});
						}
						if (reaction.emoji.name === '🔊') {
							msg.reply('Permitiendo hablar a todos en el canal');
							member.voice.channel.members.forEach(async (_member) => {
								await _member.voice.setMute(false);
							});
						}
						if (reaction.emoji.name === '♻️') {
							msg.reply('UNDER_DEVELOPMENT');
						}
					})
					.catch(() => {
						message.reply(`Tiempo de espera agotado ${msg.author}`);
					});

				return;
			}
		}
	}

});

// login to Discord with your app's token
client.login(settings.token);