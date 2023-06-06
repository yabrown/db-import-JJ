
import { Sequelize, Model, DataTypes } from 'sequelize';

const PORT = 'http://localhost:3000'
const SOCKETPORT = 'ws://localhost:3000'



async function basicGet(link, DBName, force){
    const res = await fetch(PORT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
          },
        body: JSON.stringify({link: link, DBName: DBName, force: force})
    }
    );
    const body = await res.json()
    console.log(res);
    return [res, body.message];
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
    basicGet,
    basicSocket
};
