from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode


def send_activation_email(user):
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.public_id))
    activation_url = f"{settings.FRONTEND_URLS[0]}/activate/{uid}/{token}"
    subject = "Activate your pi. ku. account"
    context = {
        "pen_name": user.full_name,
        "footnote": True,
        "cta": {
            "title": "Onboard",
            "link": activation_url,
        },
    }
    html_content = render_to_string("email/activation.html", context)
    plain_content = render_to_string("email/activation.txt", context)
    send_mail(subject, plain_content, settings.FROM_EMAIL, [user.email], fail_silently=False, html_message=html_content)
    return True


def set_response_cookies(response, refresh_token):
    _response = response
    if "refresh" in _response.data:
        del _response.data["refresh"]  # remove refresh token from response body
    _response.set_cookie(
        key=settings.AUTH_COOKIE["NAME"],
        value=refresh_token,
        max_age=settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds(),
        httponly=settings.AUTH_COOKIE["HTTPONLY"],
        secure=settings.AUTH_COOKIE["SECURE"],
        samesite=settings.AUTH_COOKIE["SAMESITE"],
        domain=settings.AUTH_COOKIE["DOMAIN"],
    )
    return _response
