const database = require('./database')
const Sequelize = require('sequelize');
const tedious = require('tedious');
const assert = require("assert")



//connect to database, leave connection open
async function connect(){
    try{ 
      const sequelize = await new Sequelize({
        dialect: 'mssql',
        dialectModule: tedious, // Use the tedious module for MSSQL dialect
        host: '174.143.110.218',
        port: '1433',
        database: 'TempTables',
        username: 'abraun',
        password: 'j43H^zcf$4d1AS8&',
        logging: false,
        dialectOptions: {
          options: { "requestTimeout": 300000 }
        }
      });
      await sequelize.authenticate();
      console.log("--CONNECTED TO DATABASE--");
      return sequelize;
    }catch(error){
      console.log("--CONNECTION FAILED-- ", error)
      throw new Error("server couldn't connect to database", {error})
    }
}
  
async function disconnect(sequelize){
    try{
      await sequelize.close();
      console.log("--DISCONNECTED FROM DATABASE--");
    }catch(error){
      console.log("--DISCONNECTION FAILED-- ", error)
      throw new Error("server couldn't disconnect from database", {error})
    }
}



async function addTable(sequelize, dataset, DBName) {
    if (!dataset.meta.view.columns || !dataset.data){
      throw new Error("dataset does not have required fields 'meta.view.columns' and 'data'")
    }

    const colNames = dataset.meta.view.columns.map(e => e.fieldName);
   
    // define and create the new Model
    try{
      modelDefinition = {};
      colNames.forEach((name) => {
        modelDefinition[name] = {
          type: Sequelize.DataTypes.STRING,
          allowNull: true,
        };
      });
      var table = sequelize.define(DBName, modelDefinition); //must be var (allows hoisting, o/w would be O.O.S. in next try block)
      await table.sync({force:true});
      console.log("-created table-")
      if (verbose) console.log(modelDefinition);
      if (verbose) console.log(table);
    }catch(error){
      console.log("---FAILED TO CREATE TABLE---", error)
      throw new Error('Failed to create table: ', {error});
    }
    //test on first row
    try{
      let modelRow = {};
      const rows = dataset.data;
      let row = rows[0];
      row.forEach((item, index) => {
        const colName = colNames[index];
        modelRow[colName] = item;
      });
      if (verbose) console.log(modelRow.toJSON());
      const test = await table.create(modelRow);
      await test.destroy()
      console.log("-test row successful-");
    }catch(error){
      console.log("---TEST ROW FAILED---", error);
      throw new Error('Test row failed: ', {error});
    }

    

    try{
//////////////////
      const rows = dataset.data;
      let start = 0;

      const startTime = Date.now();
      //Each iteration creates+saves a block of 1000 instances/rows
      while(start<rows.length){
        const blockStartTime = Date.now();

        const size = Math.min(5000, rows.length-start);
        const rowObjects = []
        //create block of row objects
        for (let i = 0; i < size; i++) {
          const row = rows[start+i];  //absolute index
          rowObjects[i] = {};         //index in this block (relative)
          //create a single row object (structure)
          row.forEach((element, j) => {
              const colName = colNames[j];
              rowObjects[i][colName] = element;
          });
        }
        await table.bulkCreate(rowObjects);
        start += size;

        const time = Date.now()-blockStartTime;
        console.log(start + " rows added in " + time + " seconds. Current block: " + size*1000/time + " rows per second");
      }
      const endTime = Date.now();
      console.log("-added all rows to database-")
      console.log(`Time taken: ${endTime - startTime}ms`);
////////////////////
    }catch(error){
      console.log('---FAILED TO ADD ALL ROWS TO DATABASE---', error)
      throw new Error('Failed to add all rows to database', {error});
    }
}

module.exports = {
    connect,
    disconnect,
    addTable
}