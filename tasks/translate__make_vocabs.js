module.exports = function (grunt) {

    var env        = grunt.config.get('env'),
        config     = grunt.config.get('config'),
        worksheets = env.google.translations['newsspec_' + config.project_number];
    
    grunt.registerTask('check_spreadsheet_ids', 'Checks if the vocabs spreadsheet information has been configured.', function () {
        var done = this.async();
        if (worksheets === undefined) {
            done(false);
            grunt.log.warn('No worksheets defined. Edit your env.json!');
            grunt.log.writeln('You should have "spreadsheetId" and "worksheetId" properties under google.translations.newsspec_' + config.project_number);
        } else {
            done();
        }
    });

    grunt.config(['cloudfile_to_vocab', 'default'], {
        options: {
            output_directory:      'source/vocabs',
            google_spreadsheet_id: worksheets.spreadsheetId,
            username:              '<%= env.google.username %>',
            password:              '<%= env.google.password %>',
            worksheets:            worksheets.worksheetIds,
            whitelisted_services:  ['cymru', 'arabic', 'azeri', 'bengali', 'brasil', 'burmese', 'chinese_simp', 'chinese_trad', 'cymru', 'english', 'french', 'gahuza', 'hausa', 'hindi', 'indonesian', 'kyrgyz', 'mundo', 'nepali', 'pashto', 'persian', 'portuguese', 'russian', 'sinhala', 'somali', 'swahili', 'tamil', 'turkish', 'ukrainian', 'urdu' , 'uzbek', 'vietnamese']
        }
    });

    grunt.registerTask('make_vocabs', ['check_spreadsheet_ids', 'cloudfile_to_vocab']);
};