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
  try{  
    console.log("HTTP request received")

    console.log('Payload: ', req.body);
    const url = new URL(req.body.link);
    const DBName = req.body.DBName;
    if (!DBName) throw new Error('table name cannot be blank');
   
    // fetch data
    const data = await fetch(url);
    const jsonData = await data.json();
    console.log("--fetched data--")
   
    //add to database
    const sequelize = await database.connect()
    await database.addTable(sequelize, jsonData, DBName)
    await database.disconnect(sequelize);
    console.log("HTTP request completed successfully")
    res.status(200).send({message: "successfully loaded table and data into database"})
  }catch(error){
    console.log("HTTP request could not be completed, returning error: ", error.message)
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
