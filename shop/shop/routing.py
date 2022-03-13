from django.urls import re_path
from auctions import consumer

websocket_urlpatterns = [
    re_path(r'ws/auctions/', consumer.AuctionsConsumer.as_asgi())
]