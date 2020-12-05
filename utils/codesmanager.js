const fs = require('fs');
const nconf = require('nconf');
const Memory = nconf.file('memory.json');
const say = require('say');

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
	static generateCodeAnounce(_code, _channel) {
		const library = {
			'A': ['Albacete', 'Andrea'],
			'B': ['Barcelona', 'Beatriz'],
			'C': ['Casa', 'Carlos'],
			'D': ['Dinamarca', 'Dinosaurio'],
			'E': ['Espanya', 'Espanyita'],
			'F': ['Francia', 'Furcia'],
			'G': ['Gato', 'Guarra'],
			'H': ['Helado', 'Huevo'],
			'I': ['Italia', 'Indiana'],
			'J': ['Jaen'],
			'K': ['Kilo', 'Khuruk'],
			'L': ['Lugo'],
			'M': ['Madrid'],
			'N': ['Noruega'],
			'O': ['Oviedo'],
			'P': ['Pamplona'],
			'Q': ['Queso'],
			'R': ['Roma', 'Rata', 'Raton'],
			'S': ['Sevilla', 'Sabinico'],
			'T': ['Toledo'],
			'U': ['Ucrania'],
			'V': ['Valencia'],
			'W': ['Guasinton'],
			'X': ['Xilofono'],
			'Y': ['griega de iogurt'],
			'Z': ['Zapato'],
		};
		let frase_completa = 'El codigo de la sala es el siguiente. ';
		for (let i = 0; i < _code.length; i++) {
			const letter = _code.charAt(i);
			const city_array = library[letter.toUpperCase()];
			const city = city_array[Math.floor(Math.random() * city_array.length)];
			frase_completa += letter + ' de ' + city + '. ';
		}
		frase_completa = frase_completa + 'Repito. ' + frase_completa;

		CodesManager.tts(_channel, frase_completa);
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