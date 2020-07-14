const createSocket = (clientId) => {
    const socket = new WebSocket("ws://serverabhis.herokuapp.com/socket");
    
    socket.onopen = (event) => {
        socket.send(JSON.stringify({
            event: 'authentication',
            client_id: clientId,
            client_mode: 'controller',
        }))
        document.getElementById('status').textContent = `Connected`
        document.getElementById('client_id').textContent = clientId
        document.getElementById('stat').style.color = 'green'
    }
    socket.onmessage = (event) => {
        
        const message = JSON.parse(event.data)
        if (message.event === 'disconnect') {
            socket.close()
            document.getElementById('stat').style.color = 'red'
            document.getElementById('status').textContent = 'Disconnected'
            document.getElementById('value').textContent = ""
            document.getElementById('batt').textContent = ""
        }
        if (message.event === 'cpu') {
            document.getElementById('value').textContent = message.value
            var kj = " (Charging)"
            if(message.charging == false){
                kj = ""
            }
            document.getElementById('batt').textContent = message.battery + kj
        }
        if (message.event === 'notes') {
            $("textarea#notestxt").val(message.value)
        }
    }

    window.addEventListener('unload', (event) => socket.close())

    return socket
}

const disconnectSocket = (socket) => {
    socket.close()
    document.getElementById('stat').style.color = 'red'
    document.getElementById('status').textContent = `Disconnected`
}

const webopen = (socket) => {
    var k = document.getElementById('url').value
    if(k.length > 0){
        socket.send(JSON.stringify({ event: 'openweb', site:k }))
    }
}

const sendnotes = (socket) => {
    var k = $("textarea#notestxt").val()
    if(k.length > 0){
        socket.send(JSON.stringify({ event: 'notes_up', value:k }))
    }
}

document.addEventListener("DOMContentLoaded", () => {
    let socket

    const form = document.getElementById('connect_form')
    form.addEventListener('submit', (event) => {
        event.preventDefault()
        if (socket) {
            disconnectSocket(socket)
        }
        socket = createSocket(document.getElementById('client_id_input').value)
    })

    const disconnectButton = document.getElementById('disconnect_button')
    disconnectButton.addEventListener('click', () => disconnectSocket(socket))

    const webButton = document.getElementById('open_web')
    webButton.addEventListener('click', () => webopen(socket))

    const lockscreen = document.getElementById('lock_screen')
    lockscreen.addEventListener('click', () => socket.send(JSON.stringify({ event: 'lockscreen' })))

    const volp = document.getElementById('vol_plus')
    volp.addEventListener('click', () => socket.send(JSON.stringify({ event: 'vol', type:'plus' })))

    const volm = document.getElementById('vol_minus')
    volm.addEventListener('click', () => socket.send(JSON.stringify({ event: 'vol', type:'minus' })))

    const volmu = document.getElementById('vol_mu')
    volmu.addEventListener('click', () => socket.send(JSON.stringify({ event: 'vol', type:'mu' })))

    const notes = document.getElementById('notes_fetch')
    notes.addEventListener('click', () => socket.send(JSON.stringify({ event: 'notesf'})))

    const notesup = document.getElementById('note_up')
    notesup.addEventListener('click', () => sendnotes(socket))
})