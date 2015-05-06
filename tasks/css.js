module.exports = function (grunt) {

    grunt.config('cssmin', {
        minify: {
            expand: true,
            cwd: 'content/<%= config.services.default %>/css/',
            src: ['*.css'],
            dest: 'content/<%= config.services.default %>/css/'
        }
    });
    
    grunt.registerTask('css', ['clean:sasscache', 'sass:main', 'sass:inline', 'csslint', 'cssmin']);
};