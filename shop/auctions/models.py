from django.db import models
import time


# auction model
class Auction(models.Model):
    beneficiary = models.CharField(max_length=42)
    description = models.CharField(max_length=200)
    auctionEndTime = models.IntegerField(default=time.time())
    numBids = models.IntegerField(default=0)
    highestBid = models.FloatField(default=0)
    highestBidder = models.CharField(max_length=42, default='0x0000000000000000000000000000000000000000')
    completed = models.BooleanField(default=False)
    auctionID = models.IntegerField(default=0)
    imgShoe = models.ImageField(upload_to='shoesPics', default='missingPictures.jpg')
    txReceiptAuctionEnd = models.CharField(max_length=64,
                                           default='0x00000000000000000000000000000000000000000000000000000000000000')
