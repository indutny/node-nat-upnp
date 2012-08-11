var nat = require('../nat-upnp');

var client = exports;

function Client() {
  this.ssdp = nat.ssdp.create();
};

client.create = function create() {
  return new Client();
};

function normalizeOptions(options) {
  function toObject(addr) {
    if (typeof addr === 'number') return { port: addr };
    if (typeof addr === 'object') return addr;

    return {};
  }

  return {
    remote: toObject(options.public),
    internal: toObject(options.private)
  };
}

Client.prototype.portMapping = function portMapping(options, callback) {
  if (!callback) callback = function() {};

  this.findGateway(function(err, gateway, address) {
    if (err) return callback(err);

    var ports = normalizeOptions(options);

    gateway.run('AddPortMapping', [
      ['NewRemoteHost', ports.remote.host],
      ['NewExternalPort', ports.remote.port],
      ['NewProtocol', options.protocol ?
          options.protocol.toUpperCase() : 'TCP'],
      ['NewInternalPort', ports.internal.port],
      ['NewInternalClient', ports.internal.host || address],
      ['NewEnabled', 1],
      ['NewPortMappingDescription', options.description || 'node:nat:upnp'],
      ['NewLeaseDuration', options.ttl || 60 * 30]
    ], callback);
  });
};

Client.prototype.portUnmapping = function portMapping(options, callback) {
  if (!callback) callback = function() {};

  this.findGateway(function(err, gateway, address) {
    if (err) return callback(err);

    var ports = normalizeOptions(options);

    gateway.run('DeletePortMapping', [
      ['NewRemoteHost', ports.remote.host],
      ['NewExternalPort', ports.remote.port],
      ['NewProtocol', options.protocol ?
          options.protocol.toUpperCase() : 'TCP']
    ], callback);
  });
};

Client.prototype.externalIp = function externalIp(callback) {
  this.findGateway(function(err, gateway, address) {
    gateway.run('GetExternalIPAddress', [], function(err, data) {
      if (err) return callback(err);
      var key;

      Object.keys(data).some(function(k) {
        if (!/:GetExternalIPAddressResponse$/.test(k)) return false;

        key = k;
        return true;
      });

      if (!key) return callback(Error('Incorrect response'));
      callback(null, data[key].NewExternalIPAddress);
    });
  });
};

Client.prototype.findGateway = function findGateway(callback) {
  var p = this.ssdp.search(
    'urn:schemas-upnp-org:device:InternetGatewayDevice:1'
  );

  p.on('device', function(info, address) {
    p.emit('end');

    // Create gateway
    callback(null, nat.device.create(info.location), address);
  });
};

Client.prototype.close = function close() {
  this.ssdp.close();
};
