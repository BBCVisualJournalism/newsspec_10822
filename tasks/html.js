module.exports = function (grunt) {
    grunt.registerTask('html', ['sass:inline', 'uglify', 'jsonlint', 'perform_multi_lang_site_generator']);
};