module.exports = function (grunt) {

    grunt.registerTask('copy_js_minimum', ['copy:requirejs']);

    grunt.config(['copy', 'requirejs'], {
        files: [{
            expand: true,
            cwd:    'source/js/lib/vendors/require/',
            src:    ['*.js'],
            dest:   'content/<%= config.services.default %>/js/lib/vendors/require/'
        }]
    });

    grunt.config(['copy', 'd3'], {
        files: [{
            expand: true,
            cwd:    'source/js/lib/vendors/d3/',
            src:    ['**'],
            dest:   'content/<%= config.services.default %>/js/lib/vendors/d3/'
        }]
    });
    grunt.config(['copy', 'maps'], {
        files: [{
            expand: true,
            cwd:    'source/js/maps/',
            src:    ['**'],
            dest:   'content/<%= config.services.default %>/maps/'
        }]
    });
    
    grunt.config(['copy', 'jsAll'], {
        files: [{
            expand: true,
            cwd:    'source/js/',
            src:    ['**'],
            dest:   'content/<%= config.services.default %>/js/'
        }]
    });
    
    grunt.config('uglify', {
        options: {
            mangle: true
        },
        my_target: {
            files: {
                'tmp/iframemanager__host.js': ['source/js/lib/news_special/iframemanager__host.js']
            }
        }
    });

    grunt.registerTask('copyRequiredJs', function () {
        if (grunt.config.get('config').debug === 'true') {
            grunt.task.run('copy:jsAll'); 
        } else {
            grunt.task.run('copy_js_minimum'); 
        }
        grunt.task.run('uglify'); 
    });

    //var applicationJS = ['requirejs:jquery1', 'requirejs:jquery2', 'requirejs:jquery1-cymru', 'requirejs:jquery2-cymru'];
    var applicationJS = ['requirejs:jquery1', 'requirejs:jquery2'];
    if (grunt.config.get('config').scaffoldLite === 'true') {
        applicationJS = ['requirejs:lite'];
    }

    grunt.config(['concurrent', 'js'], {
        tasks: ['jshint'].concat(applicationJS)
    });
    grunt.registerTask('js', ['clean:allJs', 'overrideImagerImageSizes', 'copy:d3', 'copy:maps', 'concurrent:js', 'copyRequiredJs']);
};
