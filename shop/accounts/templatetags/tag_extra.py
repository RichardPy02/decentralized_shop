from django import template
from datetime import datetime
import time

register = template.Library()


# convert unix timestamp to datetime object
@register.filter('timestamp_to_time')
def convert_timestamp_to_time(timestamp):
    return datetime.fromtimestamp(int(timestamp))


# check if timestamp has been passed or not
@register.filter('check_end')
def check_end(timestamp):
    if time.time() >= timestamp:
        return True
    else:
        return False
