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
    
    const beepButton = document.getElementById('open_google')
    beepButton.addEventListener('click', () => socket.send(JSON.stringify({ event: 'opengoogle' })))
})