'use strict';

// NPM Dependencies
//-----------------------------------------
var fs = require('fs'),

	path = require('path'),

	esprima = require('esprima'),

	_ = require('lodash'),


	// Local Dependencies
	//-----------------------------------------
	Lookup = require('./lookup.js'),


	// private variables
	//-----------------------------------------
	filename = process.argv[2],

	configFile = __dirname + '/.jsdoccerrc',

	config = JSON.parse(fs.readFileSync(configFile, 'utf8')),

	jsPath = config.js.src,

	astPath = config.ast.dest,
	
	jsonPath = config.json.dest,

	yamlPath = config.yaml.dest,

	filesToDocument = fs.readdirSync(jsPath),

	fileFilters = config.fileFilters,


	// Private functions
	//-----------------------------------------
	_getFullJsPath = function (filename) {

		return path.join(jsPath + filename);
	},



	_getFullAstPath = function (filename) {

		return path.join(astPath + path.basename(filename, '.js') + '.ast');
	},
	
	
	
	_getFullJsonPath = function (filename) {

		return path.join(jsonPath + path.basename(filename, '.js') + '.json');
	},



	_getFullYamlPath = function (filename) {

		return path.join(yamlPath + path.basename(filename, '.js') + '.yaml');
	},



	_createSyntaxTree = function (file) {
		var code = fs.readFileSync(file, 'utf8');


		return esprima.parse(code, {
			loc: false,
			range: false,
			raw: false,
			tokens: false,
			// TODO: if commets grab and insert into description.
			comment: false,
		});
	},


	_saveSyntaxTree = function (ast, filename) {
		var fullOutputPath = _getFullAstPath(filename);

		fs.writeFileSync(fullOutputPath, JSON.stringify(ast, null, 2));

		console.info('File AST: ' + fullOutputPath);
	},
	
	
	
	_saveDocJson = function (docJson, filename) {
		var fullOutputPath = _getFullJsonPath(filename);

		fs.writeFileSync(fullOutputPath, docJson);

		console.log('Doc JSON: ' + fullOutputPath);
	},



	_saveDocYaml = function (docYaml, filename) {
		var fullOutputPath = _getFullYamlPath(filename);

		fs.writeFileSync(fullOutputPath, docYaml);

		console.log('Doc YAML: ' + fullOutputPath);
	},



	_documentFile = function (filename) {
		var filterThis = false,

			syntaxTree, lookup, json, docYaml;


		_.each(fileFilters, function (fileFilter) {
			if (_.contains(fileFilter, filename)) {
				filterThis = true;
			}
		});

		if (filterThis) {
			return;
		}


		syntaxTree = _createSyntaxTree(_getFullJsPath(filename));

		_saveSyntaxTree(syntaxTree, filename);

		lookup = new Lookup({
			syntaxTree: syntaxTree,

			filename: filename
		});
		
		json = lookup.parse();

		_saveDocJson(JSON.stringify(json, null, 4), filename);

		docYaml = lookup.jsonToYaml(json);

		_saveDocYaml(docYaml, filename);

		// adding \n for readability
		console.log();
	};

		
	


// Main Logic
//-----------------------------------------
// check the input folder for target js files.
if (filesToDocument.length > 0) {

	filesToDocument.forEach(_documentFile);
}
// bad usage
else {
	console.warn('No js targets found to document in ' + jsPath);

	process.exit(1);
}
