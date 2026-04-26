from datetime import UTC, datetime

import structlog
from apscheduler.schedulers.background import BackgroundScheduler
from django.core.mail import send_mail

from config import settings
from letters.models import Letter

logger = structlog.get_logger(__name__)


def get_vault_letters_to_notify():
    """
    Identifies the vault letters that have been recently unlocked and not notified
    """
    return Letter.objects.filter(unlock_at__lt=datetime.now(UTC), notified_at=None)


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
    """
    Orchestrates the vault polling logic.
    """
    letters_to_notify = get_vault_letters_to_notify()
    for letter in letters_to_notify:
        notify_unlocked_letter(letter)


def start_scheduler():
    """
    Starts the background scheduler for polling and notifying vault letters.
    """
    logger.info("Starting vault polling scheduler...")
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        vault_unlock_notification_polling_scheduler,
        trigger="interval",
        minutes=1,
        id="letter_polling",
        replace_existing=True,
    )
    scheduler.start()
