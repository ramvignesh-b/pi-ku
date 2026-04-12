from django.urls import path

from .views import LetterDetailView, LetterView

urlpatterns = [
    path("", LetterView.as_view(), name="letter-list-create"),
    path("<str:public_id>/", LetterDetailView.as_view(), name="letter-detail"),
]
