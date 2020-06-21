const createSocket = (clientId) => {
    const socket = new WebSocket("ws://localhost:8000/socket");
    
    socket.onopen = (event) => {
        socket.send(JSON.stringify({
            event: 'authentication',
            client_id: clientId,
            client_mode: 'controller',
        }))
        document.getElementById('status').textContent = `Connected`
        document.getElementById('client_id').textContent = clientId
    }
    socket.onmessage = (event) => {
        const message = JSON.parse(event.data)
        if (message.event === 'disconnect') {
            document.getElementById('status').textContent = 'Disconnected'
            document.getElementById('value').textContent = ""
        }
        if (message.event === 'cpu') {
            document.getElementById('value').textContent = message.value
        }
    }

    window.addEventListener('unload', (event) => socket.close())

    return socket
}

const disconnectSocket = (socket) => {
    socket.close()
    document.getElementById('status').textContent = `Disconnected`
}

const webopen = (socket) => {
    var k = document.getElementById('url').value
    if(k.length > 0){
        socket.send(JSON.stringify({ event: 'openweb', site:k }))
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
})