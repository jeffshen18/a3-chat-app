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
let CSS_COLOR_NAMES = [
    "AliceBlue",
    "AntiqueWhite",
    "Aqua",
    "Aquamarine",
    "Azure",
    "Beige",
    "Bisque",
    "Black",
    "BlanchedAlmond",
    "Blue",
    "BlueViolet",
    "Brown",
    "BurlyWood",
    "CadetBlue",
    "Chartreuse",
    "Chocolate",
    "Coral",
    "CornflowerBlue",
    "Cornsilk",
    "Crimson",
    "Cyan",
    "DarkBlue",
    "DarkCyan",
    "DarkGoldenRod",
    "DarkGray",
    "DarkGrey",
    "DarkGreen",
    "DarkKhaki",
    "DarkMagenta",
    "DarkOliveGreen",
    "DarkOrange",
    "DarkOrchid",
    "DarkRed",
    "DarkSalmon",
    "DarkSeaGreen",
    "DarkSlateBlue",
    "DarkSlateGray",
    "DarkSlateGrey",
    "DarkTurquoise",
    "DarkViolet",
    "DeepPink",
    "DeepSkyBlue",
    "DimGray",
    "DimGrey",
    "DodgerBlue",
    "FireBrick",
    "FloralWhite",
    "ForestGreen",
    "Fuchsia",
    "Gainsboro",
    "GhostWhite",
    "Gold",
    "GoldenRod",
    "Gray",
    "Grey",
    "Green",
    "GreenYellow",
    "HoneyDew",
    "HotPink",
    "IndianRed",
    "Indigo",
    "Ivory",
    "Khaki",
    "Lavender",
    "LavenderBlush",
    "LawnGreen",
    "LemonChiffon",
    "LightBlue",
    "LightCoral",
    "LightCyan",
    "LightGoldenRodYellow",
    "LightGray",
    "LightGrey",
    "LightGreen",
    "LightPink",
    "LightSalmon",
    "LightSeaGreen",
    "LightSkyBlue",
    "LightSlateGray",
    "LightSlateGrey",
    "LightSteelBlue",
    "LightYellow",
    "Lime",
    "LimeGreen",
    "Linen",
    "Magenta",
    "Maroon",
    "MediumAquaMarine",
    "MediumBlue",
    "MediumOrchid",
    "MediumPurple",
    "MediumSeaGreen",
    "MediumSlateBlue",
    "MediumSpringGreen",
    "MediumTurquoise",
    "MediumVioletRed",
    "MidnightBlue",
    "MintCream",
    "MistyRose",
    "Moccasin",
    "NavajoWhite",
    "Navy",
    "OldLace",
    "Olive",
    "OliveDrab",
    "Orange",
    "OrangeRed",
    "Orchid",
    "PaleGoldenRod",
    "PaleGreen",
    "PaleTurquoise",
    "PaleVioletRed",
    "PapayaWhip",
    "PeachPuff",
    "Peru",
    "Pink",
    "Plum",
    "PowderBlue",
    "Purple",
    "RebeccaPurple",
    "Red",
    "RosyBrown",
    "RoyalBlue",
    "SaddleBrown",
    "Salmon",
    "SandyBrown",
    "SeaGreen",
    "SeaShell",
    "Sienna",
    "Silver",
    "SkyBlue",
    "SlateBlue",
    "SlateGray",
    "SlateGrey",
    "Snow",
    "SpringGreen",
    "SteelBlue",
    "Tan",
    "Teal",
    "Thistle",
    "Tomato",
    "Turquoise",
    "Violet",
    "Wheat",
    "White",
    "WhiteSmoke",
    "Yellow",
    "YellowGreen",
  ];

LOWER_CSS_COLOR_NAMES = CSS_COLOR_NAMES.map(v => v.toLowerCase());

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
            if (LOWER_CSS_COLOR_NAMES.includes(input[1].toLowerCase())) {
                socket.color = input[1];
                chatMessages.map(message => {
                    if (message.username === socket.username) {
                        message.color = input[1];
                    }
                })
                socket.emit('remove messages')
                socket.emit('show messages', chatMessages);
            } else {
                socket.emit('remove messages')
                socket.emit('show messages', chatMessages);
            }
        } else if (msg.startsWith("/")) {
            const formattedMessage = formatMessage("ChatBot", socket.color, "Invalid Shift Command.");
            if (chatMessages.length > 200) {
                chatMessages.shift();
            } 
            chatMessages.push(formattedMessage);
            socket.emit('bolded message', formattedMessage)
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

server.listen(process.env.PORT || 4000, process.env.IP, function() {
    console.log("Chat app server has started on port 4000");
})
