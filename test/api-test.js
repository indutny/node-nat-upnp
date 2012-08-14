var assert = require('assert'),
    async = require('async'),
    net = require('net'),
    natUpnp = require('..');

describe('NAT-UPNP/Client', function() {
  var c;

  beforeEach(function() {
    c = natUpnp.createClient();
  });

  afterEach(function() {
    c.close();
  });

  it('should add port mapping/unmapping', function(callback) {
    var public = ~~(Math.random() * 65536);
    c.portMapping({
      public: public,
      private: ~~(Math.random() * 65536),
      ttl: 0
    }, function(err) {
      assert.equal(err, null);

      c.portUnmapping({ public: public }, function(err) {
        assert.equal(err, null);
        callback();
      });
    });
  });

  it('should find port after mapping', function(callback) {
    var public = ~~(Math.random() * 65536);
    c.portMapping({
      public: public,
      private: ~~(Math.random() * 65536),
      description: 'node:nat:upnp:search-test',
      ttl: 0
    }, function(err) {
      assert.equal(err, null);

      c.getMappings({ local: true, description: /search-test/ },
                    function(err, list) {
        assert.equal(err, null);
        assert(list.length > 0);

        async.forEach(list, function(item, callback) {
          c.portUnmapping(item, function(err) {
            assert.equal(err, null);
            callback();
          });
        }, callback);
      });
    });
  });

  it('should get external ip address', function(callback) {
    c.externalIp(function(err, ip) {
      assert.equal(err, null);
      assert(net.isIP(ip));
      callback();
    });
  });
});
