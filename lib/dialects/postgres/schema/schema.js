// PostgreSQL Schema Builder & Compiler
// -------
module.exports = function(client) {

var _        = require('lodash');
var inherits = require('inherits');
var Schema   = require('../../../schema');

// Schema Builder
// -------

function SchemaBuilder_PG() {
  this.client = client;
  Schema.Builder.apply(this, arguments);
}
inherits(SchemaBuilder_PG, Schema.Builder);

_.each([
  'setSchema', 'setSearchPath'
], function(method) {
  SchemaBuilder_PG.prototype[method] = function() {
    this._sequence.push({
      method: method,
      args: _.toArray(arguments)
    });
    return this;
  };
});

// Schema Compiler
// -------

function SchemaCompiler_PG() {
  this.client = client;
  this.Formatter = client.Formatter;
  Schema.Compiler.apply(this, arguments);
}
inherits(SchemaCompiler_PG, Schema.Compiler);

// Check whether the current table
SchemaCompiler_PG.prototype.hasTable = function(tableName) {
  this.pushQuery({
    sql: 'select * from information_schema.tables where table_name = ?',
    bindings: [tableName],
    output: function(resp) {
      return resp.rows.length > 0;
    }
  });
};

// Compile the query to determine if a column exists in a table.
SchemaCompiler_PG.prototype.hasColumn = function(tableName, columnName) {
  this.pushQuery({
    sql: 'select * from information_schema.columns where table_name = ? and column_name = ?',
    bindings: [tableName, columnName],
    output: function(resp) {
      return resp.rows.length > 0;
    }
  });
};

// Compile a rename table command.
SchemaCompiler_PG.prototype.renameTable = function(from, to) {
  this.pushQuery('alter table ' + this.formatter.wrap(from) + ' rename to ' + this.formatter.wrap(to));
};

// compile a set schema command.
SchemaCompiler_PG.prototype.setSchema = function(schemaName, local) {
  var scope = '';
  if (local) scope = 'local ';
  this.pushQuery('set ' + scope + 'schema to ' + this.formatter.wrap(schemaName));
};

// compile a set search path command.
SchemaCompiler_PG.prototype.setSearchPath = function() {
  var scope = '',
      schemas = _.toArray(arguments),
      local = schemas.pop();

  if (local === true) {
    scope = 'local ';
  } else {
    schemas.push(local);
  }
  this.pushQuery('set ' + scope + 'search_path to ' + _.map(schemas, this.formatter.wrap.bind(this.formatter)).join(', '));
};

client.SchemaBuilder = SchemaBuilder_PG;
client.SchemaCompiler = SchemaCompiler_PG;

};
