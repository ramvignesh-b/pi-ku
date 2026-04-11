from django.urls import path

from .views import LetterView

urlpatterns = [
    path("", LetterView.as_view(), name="letter-list-create"),
    path("<str:public_id>/", LetterView.as_view(), name="letter-create-retrieve-update-delete"),
]
