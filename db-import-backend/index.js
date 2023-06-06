const database = require('./database')
const express = require("express");
const ws = require("express-ws")
const fetch = require ('isomorphic-fetch');
const cors = require('cors');
const assert = require("assert")
const Sequelize = require('sequelize');
const expressWs = require('express-ws');

const port = 3000;
global.verbose = false; //global variable, prints interim data
let sequelize; //declared globally so that it can be initialized and used in different functions

const app = express();
expressWs(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: '*', "methods": "GET,HEAD,PUT,PATCH,POST,DELETE" }));


app.post("/", async(req, res) => {
  console.log("HTTP request received")

  try{  

    console.log('Payload: ', req.body);
    const {link, DBName, force} = req.body
    if (!DBName) throw new Error('table name cannot be blank');
    if (!(new URL(link))) throw new Error('link invalid');
   
    //connect to database
    let sequelize = await database.connect()
    sequelize.authenticate();

    //if force=false, then check last_updated times
    if (!force){
      const needsUpdate = await database.needsUpdate(sequelize, link);
      console.log("Needs update: ", needsUpdate)
      if (!needsUpdate){
        await database.disconnect(sequelize);
        res.status(302).send({message: "already up-to-date"});
        return;
      }
    }

    // if force=true or needs to be updated...
    await database.importTable(sequelize, link, DBName)

    //disconnect and send response
    await database.disconnect(sequelize);
    console.log("HTTP request completed successfully")
    res.status(200).send({message: "successfully loaded table and data into database"})
  }catch(error){
    console.log("HTTP request could not be completed, returning error: ", {error})
    res.status(500).send({message: 'Error: '+error.message})
  }
});

//boilerplate for websocket, but not currently used
app.ws("/", async(ws) => {
  console.log("established websocket connection")
  ws.on('message', (message) => {
    const payload = JSON.parse(message);
    console.log('Received payload:', payload);
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});
