
import React, {useState} from 'react';
import './backend'
import { basicGet, basicSocket } from './backend';



const LinkPullForm = () => {
  const [link, setLink] = useState('https://data.cityofnewyork.us/api/views/xubg-57si/rows.json');
  const[DBName, setDBName] = useState('table');
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('white');


  const handleChange = (event, setter) => {
    setter(event.target.value);
  };

  const handleSubmit = async(event) => {
    event.preventDefault();


    setMessageColor('#55FFFF')
    setMessage('Loading...')
    let [resOk, message] = await basicGet(link, DBName);
    setMessage(message)
    setMessageColor(resOk? '#55FF55':'#FF5555')
  };

  return (
    <form onSubmit={handleSubmit}>
      Enter link to dataset: 
      <input type="text" value={link} onChange={(event)=>handleChange(event, setLink)} /> <br/>
      Enter desired table name:
      <input type="text" value={DBName} onChange={(event)=>handleChange(event, setDBName)} /><br/>
      <button type="submit">Submit</button>
      {message && <p style={{ color: messageColor }}>{message}</p>}
    </form>
  );
};

export {LinkPullForm};