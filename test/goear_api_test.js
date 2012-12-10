/*global describe:true, before:true, it:true */
var api = require('../lib/goear_api.js'),
    expect = require('chai').expect,
    util = require('util');

function filterTracks(tracks, quality) {
  return tracks.filter(function(t) {
    return quality <= t.quality;
  });
}


describe('GoEar API tests', function() {
  "use strict";
  
  describe('#search', function() {

    it("should return valid results", function(done) {
      api.search("David Guetta", function(err, data) {
        expect(err).to.be.null;
        expect(data).to.not.be.null;
        expect(data).to.be.an('object');
        expect(data).to.include.keys('tracks', 'totalCount');
        expect(data.tracks).to.be.a('array');
        expect(data.tracks).to.have.length.above(0);
        expect(data.totalCount).to.be.a('number');
        expect(data.tracks[0]).to.include.keys('id', 'title', 'quality', 'duration');
        done();
      });
    });

    it("should return an empty result when searching for an unknown value", function(done) {
      api.search("123lkj123lkj", function(err, data) {
        expect(err).to.be.null;
        expect(data).to.not.be.null;
        expect(data.tracks).to.be.empty;
        expect(data.totalCount).to.equals(0);
        done();
      });
    });

    it("should return valid values when using default options", function(done) {
      api.search("The Police", function(err, data) {
        expect(data.tracks).to.have.length(10);
        expect(data.tracks[0]).to.include.keys('id', 'title', 'quality', 'duration');
        expect(data.tracks[0]).to.not.have.keys('artist', 'link');
        var filteredTracks = filterTracks(data.tracks, 128);
        expect(filteredTracks).to.have.length(data.tracks.length);
        done();
      });
    });

    it("should respect minimum quality when specified in search options", function(done) {
      var minQuality = 192;
      api.search("U2", {
        minQuality: minQuality
      }, function(err, data) {
        var filteredTracks = filterTracks(data.tracks, minQuality);
        expect(filteredTracks).to.have.length(data.tracks.length);
        done();
      });
    });

    it("should respect resultsCount when specified in search options", function(done) {
      var resultsCount = 50;
      api.search("Eric Clapton", {
        resultsCount: resultsCount
      }, function(err, data) {
        expect(data.tracks).to.have.length(resultsCount);
        done();
      });
    });

    it("should respect offset when specified in search options", function(done) {
      var searchTerm = "Genesis",
          offset = 2;
      api.search(searchTerm, {
        resultsCount: 20
      }, function(err, data) {
        expect(err).to.be.null;
        expect(data.tracks).to.have.length(20);
        api.search(searchTerm, {
          offset: offset,
          resultsCount: 10
        }, function(secondErr, secondData) {
          expect(secondErr).to.be.null;
          expect(data.tracks[0]).to.not.be.eql(secondData.tracks[0]);
          expect(data.tracks[10]).to.be.eql(secondData.tracks[0]);
          done();
        });
      });
    });

    it("should return extended info when specified in search options", function(done) {
      api.search("Seal", {
        extendedInfo: true
      }, function(err, data) {
        var result = data.tracks.every(function(t) {
          return t.artist && t.link;
        });
        expect(result).to.be.true;
        done();
      });
    });
    
  });

  describe('#lookup', function() {
    it("Should return extended info for a known song", function(done) {
      var trackId = 'acd6d6d';
      api.lookup(trackId, function(err, data) {
        expect(err).to.be.null;
        expect(data).to.not.be.null;
        expect(data).to.be.a('object');
        expect(data).to.not.be.an('array');
        expect(data).to.include.keys('id', 'title', 'artist', 'link');
        expect(data.id).to.be.equal(trackId);
        done();
      });
    });
    it("Should return an error when no info is found", function(done) {
      var trackId = '----NONE----';
      api.lookup(trackId, function(err, data) {
        expect(err).to.not.be.null;
        expect(data).to.not.exist;
        expect(err.toString()).to.contain('No extended info found');
        done();
      });
    });
    it("Should return a single result when looking for a single song", function(done) {
      var trackId = 'acd6d6d';
      api.lookup(trackId, function(err, data) {
        expect(err).to.be.null;
        expect(data).to.be.an('object');
        expect(data.length).to.not.exist;
        expect(data).to.include.keys('id', 'title', 'artist', 'link');
        done();
      });
    });
    it("Should return several results when looking for several songs", function(done) {
      var tracksIds = ['acd6d6d', 'c6646df', '7d0e059'];
      api.lookup(tracksIds, function(err, data) {
        expect(data).to.be.instanceof(Array);
        expect(data.length).to.be.equal(3);
        data.forEach(function(track, index) {
          expect(track.id).to.be.equal(tracksIds[index]);
          expect(track.artist).to.exist;
          expect(track.link).to.exist;
        });
        done();
      });
    });
    it("Should return a valid result when using a track identifier", function(done) {
      var trackId = 'acd6d6d';
      api.lookup(trackId, function(err, data) {
        expect(data).to.be.an('object');
        expect(data.id).to.be.equal(trackId);
        expect(data).to.include.keys('id', 'title', 'artist', 'link');
        done();
      });
    });
    it("Should return a valid result when using a track object", function(done) {
      var searchTerm = "Iron Maiden - The Trooper";
      api.search(searchTerm, {
        resultsCount: 10
      }, function(err, data) {
        api.lookup(data.tracks[0], function(innerErr, innerData) {
          expect(innerData).to.be.an('object');
          expect(innerData).to.include.keys('id', 'title', 'artist', 'link');
          expect(innerData.id).to.be.equal(data.tracks[0].id);
          expect(innerData.title).to.be.equal(data.tracks[0].title);
          done();
        });
      });

    });
  });

});
