
import React, {useState} from 'react';
import '../backend'
import { basicGet, basicSocket } from '../backend';
import {ConfirmationPopup} from './Modal'

const ImportForm = () => {
  const [link, setLink] = useState('https://data.cityofnewyork.us/api/views/xubg-57si/rows.json');
  const[DBName, setDBName] = useState('table');
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('white');
  const [popup, setPopup] = useState(false);

  const handleChange = (event, setter) => {
    setter(event.target.value);
  };

  const handlePopupConfirm = (event) => {
    setPopup(false);
    handleSubmit(event, true);
  };

  const handlePopupCancel = (event) => {
    setPopup(false);
  };

  const handleSubmit = async(event, force) => {
    event.preventDefault();

    setMessageColor('#55FFFF')
    setMessage('Loading...')
    let [res, message] = await basicGet(link, DBName, force);
    if(res.status==302) setPopup(true)
    setMessage(message)
    setMessageColor(res.status==200? '#55FF55':'#FF5555')
  };

  return (
    <form onSubmit={(event)=>handleSubmit(event, false)}>
      Enter link to dataset: 
      <input type="text" value={link} onChange={(event)=>handleChange(event, setLink)} /> <br/>
      Enter desired table name:
      <input type="text" value={DBName} onChange={(event)=>handleChange(event, setDBName)} /><br/>
      {!popup && <button type="submit">Submit</button>}
      {message && <p style={{ color: messageColor }}>{message}</p>}
      {popup && (
        <div>
          <p>Are you sure you want to proceed?</p>
          <div className="popup-actions">
            <button onClick={handlePopupConfirm}>Yes</button>
            <button onClick={handlePopupCancel}>No</button>
          </div>
        </div>
      )}
    </form>
  );
};

export {ImportForm};