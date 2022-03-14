from django.shortcuts import render, get_object_or_404
from .models import Auction
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required
from django.conf import settings
from django.core.cache import cache
from django.core.cache.backends.base import DEFAULT_TIMEOUT
import redis

# set cache time to leave
CACHE_TTL = getattr(settings, 'CACHE_TTL', DEFAULT_TIMEOUT)

# connect to redis server
client = redis.StrictRedis(host='localhost', port=6379, db=0)


def index(request):
    return render(request, 'index.html')


# show auctions
def auctionsList(request):
    auctions = Auction.objects.filter(completed=False).order_by('auctionEndTime')

    return render(request, 'auctionsList.html', {'auctions': auctions})


# create a new auction
@staff_member_required
def auctionNew(request):
    if request.method == 'POST':
        beneficiary = request.POST['beneficiary']
        description = request.POST['description']
        startingPrice = int(request.POST['startingPrice'])
        auctionEndTime = int(request.POST['auctionEndTime'])
        auctionID = int(request.POST['auctionID'])
        img = request.FILES['image']

        auction = Auction(beneficiary=beneficiary, description=description,
                          highestBid=startingPrice, auctionEndTime=auctionEndTime,
                          auctionID=auctionID, imgShoe=img)
        auction.save()

        return render(request, 'auctionsList.html')

    else:
        return render(request, 'auctionNew.html')


# show details about auction
@login_required
def auctionDetail(request, pk):
    if cache.get(pk):
        auction = cache.get(pk)
        print("from redis")
    else:
        auction = get_object_or_404(Auction, pk=pk)
        cache.set(pk, auction)
        print("from db")

    return render(request, 'auctionDetail.html', {'auction': auction})
