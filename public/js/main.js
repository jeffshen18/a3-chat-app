const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector('.messages');

const socket = io();

socket.on('connect', () => { 
    if (document.cookie.split(';').some((item) => item.trim().startsWith('username='))) {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('username'))
            .split('=')[1];
        socket.username = cookieValue;
    }
    else {
        socket.username = socket.id
        document.cookie = "username=" + socket.id
    }
    socket.emit('set up', socket.username)
 });

socket.on('change username', message => {
    document.cookie = "username=" + message;
})

socket.on('identify', message => {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `
    <p class="text">
        ${message}
    </p>`;
    document.querySelector('.messages').appendChild(div);
})

socket.on('message', message => {
    outputMessage(message);

    chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('bolded message', message => {
    outputBoldedMessage(message);

    chatMessages.scrollTop = chatMessages.scrollHeight;
})

socket.on('show users', users => {
    document.getElementById('users').innerHTML = users.map( (user) => {
        return '<li>' + user + '</li>';
    }).join('');
});

socket.on('remove messages', () => {
    const myNode = document.querySelector('.messages')
    myNode.innerHTML = '';
})

socket.on('show messages', messages => {
    messages.map(message => {
        if (message.username === localStorage.getItem('sessionUsername')) {
            outputBoldedMessage(message)
        } else {
            outputMessage(message)
        }
    })
});

// Message Submit
chatForm.addEventListener('submit', (e) =>{
    e.preventDefault();
    const msg = document.getElementById('msg').value;
    socket.emit('chatMessage', msg)
    document.getElementById('msg').value = '';
    document.getElementById('msg').focus();
})

function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p style="display:inline"> ${message.time} </p>
    <p style="color:${message.color}; display:inline"> ${message.username} </p>
     : ${message.message} ` 
    document.querySelector('.messages').appendChild(div);
}

function outputBoldedMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<strong> <p style="display:inline"> ${message.time} </p>
    <p style="color:${message.color}; display:inline"> ${message.username} </p>
     : ${message.message} </strong>` 
    document.querySelector('.messages').appendChild(div);
}

