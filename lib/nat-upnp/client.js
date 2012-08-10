var nat = require('../nat-upnp');

var client = exports;

function Client() {
};

client.create = function create() {
  return new Client();
};

Client.prototype.portMapping = function portMapping(options, callback) {
  if (!callback) callback = function() {};

  this.findGateway(function(err, gateway, address) {
    if (err) return callback(err);

    var remote = typeof options.public === 'number' ?
          { port: options.public }
          :
          options.public,
        internal = typeof options.private === 'number' ?
          { port: options.private }
          :
          options.private;

    if (typeof options.public === 'number') {
      remote = { port: options.public };
    } else {
      remote = options.public;
    }

    gateway.run('AddPortMapping', [
      ['NewRemoteHost', remote.host],
      ['NewExternalPort', remote.port],
      ['NewProtocol', options.protocol ?
          options.protocol.toUpperCase() : 'TCP'],
      ['NewInternalPort', internal.port],
      ['NewInternalClient', internal.host || address],
      ['NewEnabled', 1],
      ['NewPortMappingDescription', options.description || 'node:nat:upnp'],
      ['NewLeaseDuration', options.ttl || 60 * 30]
    ], callback);
  });
};

Client.prototype.findGateway = function findGateway(callback) {
  var ssdp = nat.ssdp.create(),
      p = ssdp.search('urn:schemas-upnp-org:device:InternetGatewayDevice:1');

  p.on('device', function(info, address) {
    p.emit('end');
    ssdp.close();

    // Create gateway
    callback(null, nat.device.create(info.location), address);
  });
};
