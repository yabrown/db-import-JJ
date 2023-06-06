var DataTypes = require("sequelize").DataTypes;
var _update_logs = require("./update_logs");

function initModels(sequelize) {
  var update_logs = _update_logs(sequelize, DataTypes);


  return {
    update_logs,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
