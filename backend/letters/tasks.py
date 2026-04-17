import logging
from datetime import UTC, datetime

from django.core.mail import send_mail

from config import settings
from letters.models import Letter

logger = logging.getLogger(__name__)


def get_vault_letters_to_notify():
    """
    Identifies the vault letters that have been recently unlocked and not notified
    """
    letters = Letter.objects.filter(unlock_at__lt=datetime.now(UTC), notified_at=None)
    return letters


def notify_unlocked_letter(letter):
    """
    Notifies the author of the letter via email and if successful, updates the notified_at field for the letter.
    """
    author = letter.user.get_username()
    try:
        send_mail(subject="", message="", from_email=settings.FROM_EMAIL, recipient_list=[author], fail_silently=False)
        letter.notified_at = datetime.now(UTC)
        letter.save()
    except Exception:
        logger.exception(f"Failed to notify {author} of unlocked letter")


def vault_unlock_notification_polling_scheduler():
    logger.info("Starting vault_unlock_notification_polling_scheduler")
    letters_to_notify = get_vault_letters_to_notify()
    print("letters_to_notify", letters_to_notify)
    for letter in letters_to_notify:
        notify_unlocked_letter(letter)
