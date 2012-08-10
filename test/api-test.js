var assert = require('assert'),
    natUpnp = require('..');

describe('NAT-UPNP/Client', function() {
  var c;
  beforeEach(function() {
    c = natUpnp.createClient();
  });

  it('should find router device', function(callback) {
    c.addMapping({
      remote: {
        port: ~~(Math.random() * 65536)
      },
      internal: {
        port: ~~(Math.random() * 65536)
      },
      ttl: 10
    }, function(err) {
      assert.equal(err, null);
      callback();
    });
  });
});
