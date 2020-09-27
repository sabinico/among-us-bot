const nconf = require('nconf');
const Memory = nconf.file('memory.json');

class StatsManager {
	static get(_name) {
		const _value = Memory.get('stats:' + _name);
		return _value == undefined ? StatsManager.set(_name, 0) : _value;
	}
	static set(_name, _value) {
		Memory.set('stats:' + _name, _value);
		Memory.save();
		return _value;
	}
	static increment(_name) {
		const _value = StatsManager.get(_name) + 1;
		return StatsManager.set(_name, _value);
	}
}

module.exports.StatsManager = StatsManager;