from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Auction
import json
from asgiref.sync import sync_to_async


# websockets consumer
class AuctionsConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        await self.accept()
        await self.send(text_data=json.dumps({'message': 'connection established'}))

    async def receive(self, text_data=None, bytes_data=None):
        auctions = await sync_to_async(list)(Auction.objects.filter(completed=False))
        auctionsIDs = [auction.auctionID for auction in auctions]
        await self.send(text_data=json.dumps({'auctionsIDs': auctionsIDs}))
