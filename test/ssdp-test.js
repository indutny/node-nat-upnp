var assert = require('assert'),
    natUpnp = require('..');

describe('NAT-UPNP/Ssdp', function() {
  var c;
  beforeEach(function() {
    c = natUpnp.ssdp.create();
  });

  afterEach(function() {
    c.close();
  });

  it('should find router device', function(callback) {
    var p = c.search('urn:schemas-upnp-org:device:InternetGatewayDevice:1');

    p.on('device', function(device) {
      assert(typeof device.location === 'string');
      p.emit('end');
      callback();
    });
  });
});
