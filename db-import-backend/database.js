const database = require('./database')
const Sequelize = require('sequelize');
const SequelizeAuto = require('sequelize-auto');
const tedious = require('tedious');
const assert = require("assert")



//connect to database, leave connection open
async function connect(){
    try{ 
      const sequelize = await new Sequelize({
        dialect: 'mysql',
        //dialectModule: tedious, // Use the tedious module for MSSQL dialect
        host: 'localhost',
        database: 'Ari',
        username: 'root',
        password: 'password',
        logging: false
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


function removeRowsJson(link) {
  const rowsJson = '/rows.json';
  if (link.endsWith(rowsJson)) {
    return link.slice(0, -rowsJson.length);
  } else {
    return link;
  }
}
//take in link that ends in an 8 letter code of form "/xxxx-xxxx/last.thing", and returns the code
function extractCodeFromLink(link) {
  const parts = link.split('/');
  const codeWithDash = parts[parts.length - 2];
  const code = codeWithDash.replace('-', '');
  return code;
}

async function importUpdateLogs(sequelize){
  //import model
  const auto = new SequelizeAuto(sequelize, null, null, {tables: ['update_logs'], closeConnectionAutomatically: false});
  await auto.run((err) => {
    if (err) {
      console.error('Error importing update_logs model:', err);
      throw new Error('Error importing update_logs model:', {err})
    } else {
      console.log('imported update_logs model');
    }
  });
  return await require('./models/update_logs')(sequelize, Sequelize.DataTypes);
}

//returns true if the remote DB has been updated after the local one, otherwise returns false and the name of the table
async function needsUpdate(sequelize, link){
  //fetch metadata
  try{
    const modifiedLink = removeRowsJson(link);
    var meta = await fetch(modifiedLink);
    meta = await meta.json()
    if (!meta.rowsUpdatedAt) throw new Error('metadata doesn\'t have \'rowsUpdatedAt\' field')
    var remote_update_time = meta.rowsUpdatedAt;
    console.log("fetched metadata for ", extractCodeFromLink(link));
  }catch(error){
    console.log("COULDN'T FETCH METADATA")
    throw new Error("couldn't fetch metadata: ", {error})
  }
    
  const UpdateLogs = await importUpdateLogs(sequelize)
  await UpdateLogs.sync();
  //remote update time
  const row = await UpdateLogs.findOne({
    where: {
      code: extractCodeFromLink(link)
    },
    raw: true
  });
  if(!row) return true;  //if there's no row, needs to be updated
  const date_sql = row.last_updated;
  const date = new Date(date_sql)
  local_update_time = date.getTime()/1000;
  console.log("Remotely update at: ", remote_update_time, "; Locally updated at :", local_update_time)
  return remote_update_time>local_update_time;
}

async function setUpdateTime(sequelize, code, time) {
  //utcTime = unixTimestampToUTC(time)
  var timeAsDate = new Date(time);
  var timestamp = timeAsDate.toISOString().replace('T', ' ').replace('Z', '').substring(0,19);
  try {
    const UpdateLogs = await importUpdateLogs(sequelize);
    UpdateLogs.sync();
    // Check if the name already exists
    const existingInstance = await UpdateLogs.findOne({ where: { code: code } });

    if (existingInstance) {
      // Update the time attribute if the instance exists
      existingInstance.last_updated = timestamp;
      await existingInstance.save();
      console.log(`UpdateLogs: Updated time for table '${code}'`);
    } else {
      // Create a new instance with the provided name and time
      const newInstance = await UpdateLogs.create({ code: code, last_updated: timestamp });
      console.log(`UpdateLogs: Created new instance with code '${code}' and time '${timestamp}'`);
    }
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Failed to set time:', { error });
  }
}


async function importTable(sequelize, link, DBName) {
    try{
      sequelize.authenticate();
    }catch(error){
      throw new Error('database connection broken (top of importTable)', {error})
    }
    // fetch data, record time
    const data = await fetch(link);
    const dataset = await data.json();
    console.log("--fetched data--")
    const timeUpdated = Date.now();

    if (!dataset.meta.view.columns[0].dataTypeName || !dataset.data[0]){
      throw new Error("dataset does not have required fields 'meta.view.columns[0].dataTypeName' and 'data[0]'")
    }
    const cols = dataset.meta.view.columns.map(e => ({name: e.name, datatype: e.dataTypeName}));
   
    // define and create the new Model/table
    try{
      modelDefinition = {};
      cols.forEach((col) => {
        let type = Sequelize.DataTypes.STRING;
        if (col.datatype == "calendar_date") type = Sequelize.DataTypes.DATE;
        if (col.datatype == "number") type = Sequelize.DataTypes.INTEGER;
        modelDefinition[col.name] = {
          type: type,
          allowNull: true,
          primaryKey: (col.name=='id')
        };
      });
      console.log(modelDefinition)
      var table = sequelize.define(DBName, modelDefinition, {freezeTableName: true}); //must be var (allows hoisting, o/w would be O.O.S. in next try block)
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
        const colName = cols[index].name;
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
    //continue for all rows
    try{
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
              const colName = cols[j].name;
              rowObjects[i][colName] = element;
          });
        }
        await table.bulkCreate(rowObjects);
        start += size;

        const blockTime = Date.now()-blockStartTime;
        const cumulativeTime = Date.now()-startTime;
        console.log(start + " rows added in " + cumulativeTime/1000 + " seconds. Current block: " + size*1000/blockTime + " rows per second");
      }

      const endTime = Date.now();
      console.log("-added all rows to database-")
      console.log(`Time taken: ${(endTime - startTime)/1000} seconds`);
    }catch(error){
      console.log('---FAILED TO ADD ALL ROWS TO DATABASE---', error)
      throw new Error('Failed to add all rows to database', {error});
    }

    await setUpdateTime(sequelize, extractCodeFromLink(link), timeUpdated);
    
}

module.exports = {
    connect,
    disconnect,
    importTable,
    needsUpdate
}