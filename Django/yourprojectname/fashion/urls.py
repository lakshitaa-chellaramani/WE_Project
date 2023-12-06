from django.urls import path
from .views import hello_world,recommendimage

urlpatterns = [
    path('', hello_world, name='home'),
    path('recommend', recommendimage, name='upload_file'),
    
]

