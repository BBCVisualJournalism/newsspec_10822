module.exports = function (grunt) {
    grunt.config(['copy', 'cssFurniture'], {
        files: [{
            expand: true,
            cwd:    'source/scss/news_special/f/',
            src:    ['share_tools.png', 'bbc.png'],
            dest:   'content/<%= config.services.default %>/css/f'
        }]
    });

    grunt.registerTask('default', ['bump', 'generate_shared_config', 'data', 'css', 'js', 'html', 'copy:cssFurniture', 'clean:tmpFiles', 'lang_font:default']);
};
