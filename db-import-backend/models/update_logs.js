const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('update_logs', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    code: {
      type: DataTypes.STRING(8),
      allowNull: true
    },
    last_updated: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'update_logs',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__update_l__3213E83F4941D583",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
