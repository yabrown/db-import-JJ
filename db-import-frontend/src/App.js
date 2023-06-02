import logo from './logo.svg';
import './App.css';
import React, {useState} from 'react';
import {LinkPullForm} from './Components'
import {createTable, basicGet} from './backend'


function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="App">
      <header className="App-header">
        Use this incrementer to check the reactivity of the site-- if the counter doesn't update, the site crashed.<br/>
        {count}
        <button onClick={()=>setCount(count+1)}>Update counter</button>
        <br/><br/><br/>
        <LinkPullForm/>
      </header>
    </div>
  );
}



export default App;
