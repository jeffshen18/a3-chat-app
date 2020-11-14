const path = require('path')
const http = require('http');
const express = require('express');

const app = express();
const server = http.createServer(app)
const io = require('socket.io')(server);

app.use(express.static(path.join(__dirname, 'public')));

const userList = []
const chatMessages = []
const map = {
    ":)" : "&#128513;",
    ":(" : "&#128577;",
    ":o" : "&#x1F632;"
}

io.on('connection', socket => {
    // set up chat app
    socket.on('set up', msg => {
        if (userList.includes(msg)) {
            socket.username = socket.id;
            io.emit('change username', socket.username);
        } else {
            socket.username = msg
        }
        userList.push(socket.username);
        // show active users
        io.emit('show users', userList);
        // show previous messages
        socket.emit('show messages', chatMessages);
        // Only emit to user connecting 
        socket.emit('identify', `You are ${socket.username}.`);
    })
    // runs when client disconnects
    socket.on('disconnect', () =>{
        removeElement(userList, socket.username);
        io.emit('show users', userList);
    })
    // send message
    socket.on('chatMessage', (msg) => {
        if (msg.startsWith("/name")) {
            const input = msg.split(' ');
            if (!userList.includes(input[1])) {
                removeElement(userList, socket.username);
                socket.username = input[1];
                userList.push(socket.username);
                io.emit('show users', userList);
                io.emit('change username', socket.username)
            } else {
                console.log("Username not available")
            }
        } else if (msg.startsWith("/color")) {
            const input = msg.split(' ');
            socket.color = input[1];
            chatMessages.map(message => {
                if (message.username === socket.username) {
                    message.color = input[1];
                }
            })
            socket.emit('remove messages')
            socket.emit('show messages', chatMessages);
        } else {
            for (let key in map) {
                const regex = new RegExp(escapeSpecialChars(key), 'gi');
                msg = msg.replace(regex, (match) => {
                    const emoji = map[match.toLowerCase()];
                    if (emoji != undefined) {
                        return emoji;
                    }
                })
            }
            
            const formattedMessage = formatMessage(socket.username, socket.color, msg);
            if (chatMessages.length > 200) {
                chatMessages.shift();
            } 
            chatMessages.push(formattedMessage);

            // emit bolded text to user only
            socket.emit('bolded message', formattedMessage)
            // emit for rest of users
            socket.broadcast.emit('message', formattedMessage)
        }
    })
})

function escapeSpecialChars(regex) {
    return regex.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

function formatMessage(username, color='green', message) {
    return {
        username: username,
        message: message,
        time: new Date().toLocaleTimeString(),
        color: color
    };
}

function removeElement(array, elem) {
    var index = array.indexOf(elem);
    if (index > -1) {
        array.splice(index, 1);
    }
}

const PORT = 3000 || process.env.PORT;

server.listen(3000, () => {
    console.log('listening on *:3000');
});