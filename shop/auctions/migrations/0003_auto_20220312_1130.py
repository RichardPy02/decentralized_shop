# Generated by Django 3.0 on 2022-03-12 10:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('auctions', '0002_auto_20220312_1123'),
    ]

    operations = [
        migrations.AlterField(
            model_name='auction',
            name='auctionEndTime',
            field=models.IntegerField(default=1647081026.1930933),
        ),
        migrations.AlterField(
            model_name='auction',
            name='txReceiptAuctionEnd',
            field=models.CharField(default='0x00000000000000000000000000000000000000000000000000000000000000', max_length=64),
        ),
    ]
