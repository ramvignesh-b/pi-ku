from django.urls import path

from .views import LetterView

urlpatterns = [
    path("", LetterView.as_view(), name="letter-list-create"),
]
