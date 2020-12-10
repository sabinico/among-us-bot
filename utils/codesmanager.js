const fs = require('fs');
const nconf = require('nconf');
const Memory = nconf.file('memory.json');
const say = require('say');
const Discord = require('discord.js');
const settings = require('../settings.json');
const { _ } = require('lodash');

class CodesManager {
	static exists(_code) {
		const _value = Memory.get('gamecodes:' + _code);
		return !(_value == undefined);
	}
	static get(_code) {
		const _value = Memory.get('gamecodes:' + _code);
		return _value;
	}
	static set(_code, _value) {
		Memory.set('gamecodes:' + _code, _value);
		Memory.save();
		return _value;
	}
	static delete(_code) {
		Memory.clear('gamecodes:' + _code);
		Memory.save();
	}
	static getCodeFromChannel(_channel) {
		const _gamecodes = Memory.get('gamecodes');
		const Indexes = _.keys(_.pickBy(_gamecodes, { channel: _channel }));
		if(Indexes.length > 1) {
			return Indexes[0];
		}
		console.log('CODE');
		console.log(Indexes);

		Object.keys(_gamecodes).forEach(key => {
			// console.log(key, _gamecodes[key].channel);
			console.log(`Channels: ${_gamecodes[key].channel} VS ${_channel}`);
			if(_gamecodes[key].channel == _channel) {
				console.log('OK OK OK: ' + key);
				return key;
			}
		});
		return false;
	}
	static generateCodeAnounce(_code, _channel) {
		const library = {
			'A': ['Albacete', 'Alpha'],
			'B': ['Barcelona', 'Beatriz', 'Bravo'],
			'C': ['Casa', 'Carlos', 'Caraculo', 'Charlie'],
			'D': ['Dinamarca', 'Dinosaurio', 'Delta'],
			'E': ['Espanya', 'Espanyita', 'Echo'],
			'F': ['Francia', 'Furcia', 'Foxtrot'],
			'G': ['Gato', 'Guarra', 'Golf'],
			'H': ['Helado', 'Huevo', 'Hotel'],
			'I': ['Italia', 'India'],
			'J': ['Jaen', 'Jamon', 'Juliett'],
			'K': ['Kilo', 'Khuruk'],
			'L': ['Lugo', 'Lima'],
			'M': ['Madrid', 'Mike', 'Mierda'],
			'N': ['Noruega', 'November'],
			'O': ['Oviedo', 'Oscar'],
			'P': ['Pamplona', 'Pelotudo', 'Papa'],
			'Q': ['Queso', 'Quesadilla', 'Quebec'],
			'R': ['Roma', 'Rata', 'Raton', 'Romeo'],
			'S': ['Sevilla', 'Sabinico', 'Sierra'],
			'T': ['Toledo', 'Tonto pa siempre', 'Tango'],
			'U': ['Ucrania', 'Uniform'],
			'V': ['Valencia', 'Victoria', 'Victor'],
			'W': ['Guasinton', 'Guisqui'],
			'X': ['Xilofono', 'Xray'],
			'Y': ['Iogurt', 'Yankee'],
			'Z': ['Zapato', 'Zopenca', 'Zulu'],
		};
		let frase_completa = 'El codigo de la sala es el siguiente. ';
		for (let i = 0; i < _code.length; i++) {
			let letter = _code.charAt(i);
			const city_array = library[letter.toUpperCase()];
			const city = city_array[Math.floor(Math.random() * city_array.length)];
			if(letter == 'Y') {
				letter = 'Igriega';
			}
			frase_completa += letter + ' de ' + city + '. ';
		}
		frase_completa = frase_completa + 'Repito. ' + frase_completa;

		CodesManager.tts(_channel, frase_completa);
	}
	static generateEmbed(_code, _owner) {
		const partidasChannel = _owner.guild.channels.cache.find(c => c.id === settings.codereader.channel);
		const _channel = _owner.voice.channel;
		const fields = [
			{ name: 'Owner', value: `${_owner.user}` },
			{ name: 'Code', value: `${_code}` },
			{ name: 'Channel', value: `\`${_channel.name}\`` },
		];
		const embed = new Discord.MessageEmbed()
			.setColor('#ff8e00')
			.setTitle('Nueva Partida de Among Us')
			.setThumbnail(_owner.user.avatarURL())
			.addFields(fields)
			.setTimestamp()
			.setFooter('Among Us - ESPAÑA | Buscador de partidas', 'https://cdn.discordapp.com/emojis/750737029096013924.png?v=1');
		partidasChannel.send(embed);
	}
	static tts(voiceChannel, text) {
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
						console.log('Speaking code...');
					});
					dispatcher.on('finish', () => {
						console.log('Finished speaking code!');
					});
				}).catch((err) => {
					console.error(err);
				});
			}
		});
	}
}

module.exports.CodesManager = CodesManager;