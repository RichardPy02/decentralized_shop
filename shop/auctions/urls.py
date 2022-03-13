from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.index, name='index'),
    path('auctions/list', views.auctions_list, name='auctionsList'),
    path('auctions/new', views.auction_new, name='auctionNew'),
    path('auctions/<int:pk>/detail', views.auction_detail, name='auctionDetail'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)