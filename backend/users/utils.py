from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode


def send_activation_email(user):
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.public_id))
    activation_url = f"{settings.FRONTEND_URL}/activate/{uid}/{token}"
    subject = "Activate Your Piku Account"
    message = f"""Hi {user.full_name},

        Welcome to Pi Ku.

        Please click the link below to activate your account:
        >> {activation_url}

        If you did not create this account, please ignore this email."""
    send_mail(subject, message, settings.FROM_EMAIL, [user.email], fail_silently=False)
    return True


def set_response_cookies(response, refresh_token):
    _response = response
    if "refresh" in _response.data:
        del _response.data["refresh"]  # remove refresh token from response body
    _response.set_cookie(
        key=settings.SIMPLE_JWT["AUTH_COOKIE"],
        value=refresh_token,
        max_age=settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds(),
        httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTPONLY"],
        secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
        samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
        domain=settings.SIMPLE_JWT["AUTH_COOKIE_DOMAIN"],
    )
    return _response
