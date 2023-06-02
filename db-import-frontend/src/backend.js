
import { Sequelize, Model, DataTypes } from 'sequelize';

const PORT = 'http://localhost:3000'
const SOCKETPORT = 'ws://localhost:3000'

// connects to DB, creates test model, attempts to sync it. 
// Prints whether or not succeeded
async function createTableOther(){
    /*const sequelize = new Sequelize('TempTables', 'abraun', 'j43H^zcf$4d1AS8&', {
        host: '174.143.110.218',
        dialect: 'mssql', 
        dialectModule: 'tedious', 
        encrypt: true,
        dialectOptions: {
            requestTimeout: 5000 // timeout = 30 seconds
        },
        pool: {
            max: 2,
            min: 0,
            idle: 10000
        }
    });*/
    const sequelize = new Sequelize({dialect: 'sqlite', storage: './reg.sqlite'});

    try{
        await sequelize.authenticate();
        console.log("connected successfully");
    }catch(error){
        console.log("didn't connect successfully: ", error)
    }

    //AriTestTable as a model
    const newTable = sequelize.define('AriTestTable', {
        firstField:{
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        secondField:{
            type: DataTypes.STRING,
        }
    });

    // Adds the model as table to the database
    try {
        await newTable.sync({force: true});
        console.log("test table synced successfully")
    }catch(error){
        console.error("Problem syncing test table: ", error);
    }
}

function createTable(){
    var Connection = require('tedious').Connection;
    
    var config = {
        server: "174.143.110.218", // or "localhost"
        options: {},
        authentication: {
          type: "default",
          options: {  
            userName: "abraun",
            password: "j43H^zcf$4d1AS8",
          }
        }
    };

    var connection = new Connection(config);

    // Setup event handler when the connection is established. 
    connection.on('connect', function(err) {
    if(err) {
        console.log('Error: ', err)
    }
    // If no error, then good to go...
    
    });

    // Initialize the connection.
    connection.connect();
}


async function basicGet(link, DBName){
    const res = await fetch(PORT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
          },
        body: JSON.stringify({link: link, DBName: DBName})
    }
    );
    const body = await res.json()
    return [res.ok, body.message];
}


async function basicSocket(link, DBName){
    const socket = new WebSocket(SOCKETPORT);

    socket.onopen = () => {
        console.log('WebSocket connection established');

        const payload = { link, DBName};

        socket.send(JSON.stringify(payload));
    };

    socket.onmessage = (event) => {
        const text = JSON.parse(event.data);
        console.log(text);
        console.log('word');
    };

    socket.onclose = () => {
        console.log('WebSocket connection closed');
    };
}


export {
    createTable, 
    basicGet,
    basicSocket
};
