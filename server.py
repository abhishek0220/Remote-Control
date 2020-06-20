from starlette.applications import Starlette
from starlette.websockets import WebSocketDisconnect
import json
import logging
import uvicorn

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

app = Starlette()

activesockets = {
    'controller': {},
    'client': {},
}


async def receive_json(websocket):
    message = await websocket.receive_text()
    return json.loads(message)


@app.websocket_route('/socket')
async def websocket_endpoint(websocket):
    await websocket.accept()
    message = await receive_json(websocket)
    client_mode = message['client_mode']
    client_id = message['client_id']
    activesockets[client_mode][client_id] = websocket
    # Get mirror mode to broadcast messages to the client on the other side
    mirror_mode = 'controller' if client_mode == 'client' else 'client'

    client_string = f'{client_id}[{client_mode}]'
    logger.info(f'Client connected: {client_string}')

    while (True):
        if(client_mode == 'controller'):
            if(client_id not in activesockets['client']):
                message = {
                    'event': 'disconnect'
                }
                await websocket.send_text(json.dumps(message))
                logger.info(f'Client not present: {client_id}')
                return
        try:
            # Wait for a message from the client
            message = await receive_json(websocket)
            logger.debug(f'Message received from {client_string}: {message}')

            try:
                # Broadcast it to the mirror client
                await activesockets[mirror_mode][client_id].send_text(
                    json.dumps(message)
                )
            except KeyError:
                logger.debug(
                    f'Client {client_id}[{mirror_mode}] not connected'
                )
        except WebSocketDisconnect:
            if(client_mode == 'client'):
                if(client_id in activesockets['controller']):
                    message = {
                        'event': 'disconnect'
                    }
                    mirror_socket = activesockets[mirror_mode][client_id]
                    await mirror_socket.send_text(json.dumps(message))
            break
    del activesockets[client_mode][client_id]
    await websocket.close()
    logger.info(f'Disconnected: {client_string}')

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8000)