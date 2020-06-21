import asyncio
import json
import logging
import psutil
import sys
import websockets
import webbrowser 
import os
from ctypes import cast, POINTER
from comtypes import CLSCTX_ALL
from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume

logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

devices = AudioUtilities.GetSpeakers()
interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
volume = cast(interface, POINTER(IAudioEndpointVolume))

async def cpu_usage_reporter(websocket):
    psutil.cpu_percent()
    while (True):
        await asyncio.sleep(1)
        message = {
            'event': 'cpu',
            'value': psutil.cpu_percent(),
        }
        await websocket.send(json.dumps(message))
        logger.debug(f'Sent message to server: {message}')


async def consumer(message, websocket):
    json_message = json.loads(message)
    logger.debug(f'Server message received: {json_message}')

    if (json_message['event'] == 'openweb'):
        webbrowser.open(json_message['site']) 
        logger.debug(f"opened : {json_message['site']}")
    elif(json_message['event'] == 'lockscreen'):
        os.system('rundll32.exe user32.dll,LockWorkStation')
        logger.debug(f"System Locked")
    elif(json_message['event'] == 'vol'):
        if(json_message['type'] == 'minus'):
            volume.VolumeStepDown(None)
            logger.debug(f"Vol -")
        elif(json_message['type'] == 'plus'):
            volume.VolumeStepUp(None)
            logger.debug(f"Vol +")
        elif(json_message['type'] == 'mu'):
            state = volume.GetMute()
            volume.SetMute(1-state, None)
            logger.debug(f"Vol {state}")
    elif(json_message['event'] == 'notesf'):
        try:
            file = open("notes.txt", 'r')
            txt = file.read()
        except IOError:
            file = open("notes.txt", 'w')
            txt = ""
        file.close()
        message = {
            'event': 'notes',
            'value': txt,
        }
        await websocket.send(json.dumps(message))
        logger.debug(f"Sent File")
    elif(json_message['event'] == 'notes_up'):
        file = open("notes.txt", 'w')
        file.write(json_message['value'])
        logger.debug(f"File Updated")
    else:
        logger.debug(f"Invalid event")


async def consumer_handler(websocket):
    async for message in websocket:
        await consumer(message, websocket)


async def handler(url, client_id):
    async with websockets.connect(url) as websocket:
        message = {
            'event': 'authentication',
            'client_id': client_id,
            'client_mode': 'client'
        }
        await websocket.send(json.dumps(message))
        consumer_task = asyncio.ensure_future(consumer_handler(websocket))
        producer_task = asyncio.ensure_future(cpu_usage_reporter(websocket))
        done, pending = await asyncio.wait(
            [consumer_task, producer_task],
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()

if __name__ == '__main__':
    asyncio.get_event_loop().run_until_complete(
        handler('ws://serverabhis.herokuapp.com/socket', sys.argv[1])
    )
