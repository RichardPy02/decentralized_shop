from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import auth
from django.contrib import messages
from .forms import NewUserForm
from auctions.models import Auction


# user registration
def register(request):
    if request.method == 'POST':
        form = NewUserForm(request.POST)
        if form.is_valid():
            if form.match_password2():
                user = form.save(commit=False)
                user.save()
                return redirect('login')
            else:
                messages.info(request, "Passwords don't match, try again...")
                return render(request, "register.html")
        else:
            return render(request, "register.html")
    else:
        return render(request, "register.html")


# user login in
def login(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = auth.authenticate(request, username=username, password=password)
        if user is not None:
            auth.login(request, user)
            return redirect('index')
        else:
            messages.info(request, 'Invalid credentials')
            return render(request, 'login.html')
    else:
        return render(request, 'login.html')


# user log out
@login_required
def logout(request):
    auth.logout(request)
    return redirect('index')


# user profile
@login_required
def user_profile(request, pk):
    if request.method == 'POST':
        auctionID = request.POST['auctionID']
        numBids = request.POST['numBids']
        highestBid = request.POST['highestBid']
        highestBidder = request.POST['highestBidder']
        txReceiptAuctionEnd = request.POST['txReceipt']

        auction = Auction.objects.get(auctionID=auctionID)
        auction.completed = True
        auction.numBids = numBids
        auction.highestBid = highestBid
        auction.highestBidder = highestBidder
        auction.txReceiptAuctionEnd = txReceiptAuctionEnd
        auction.save()

    auctions = Auction.objects.filter().order_by('-auctionEndTime')

    return render(request, 'userProfile.html', {'auctions': auctions})
