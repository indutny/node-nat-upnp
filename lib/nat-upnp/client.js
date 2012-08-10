var nat = require('../nat-upnp');

var client = exports;

function Client() {
};

client.create = function create() {
  return new Client();
};

Client.prototype.addMapping = function addMapping(options, callback) {
  if (!callback) callback = function() {};

  this.findGateway(function(err, gateway, address) {
    if (err) return callback(err);

    gateway.run('AddPortMapping', [
      ['NewRemoteHost', options.remote.host],
      ['NewExternalPort', options.remote.port],
      ['NewProtocol', options.protocol || 'tcp'],
      ['NewInternalPort', options.internal.port],
      ['NewInternalClient', options.internal.host || address],
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
