module.exports = function(grunt) {
  "use strict";

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',

    simplemocha: {
      all: {
        src: 'test/**/*.js',
        options: {
          globals: ['describe', 'it'],
          timeout: 20000,
          ignoreLeaks: false,
          ui: 'bdd',
          reporter: 'spec'
        }
      }
    },

    lint: {
      files: ['grunt.js', 'lib/**/*.js']
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'default'
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        node: true
      },
      globals: {
        exports: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.registerTask('test', 'simplemocha');

  // Default task.
  grunt.registerTask('default', 'lint simplemocha');

};