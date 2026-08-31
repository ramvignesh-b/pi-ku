from datetime import UTC, datetime

import structlog
from apscheduler.schedulers.background import BackgroundScheduler
from django.core.mail import send_mail
from django.template.loader import render_to_string

from config import settings
from config.settings import FRONTEND_URLS
from letters.models import Letter

logger = structlog.get_logger(__name__)


def get_vault_letters_to_notify():
    """
    Identifies the sealed vault letters that have been recently unlocked and not notified
    """
    return Letter.objects.filter(
        type=Letter.Type.VAULT,
        status=Letter.Status.SEALED,
        unlock_at__lt=datetime.now(UTC),
        notified_at=None,
    )


def notify_unlocked_letter(letter):
    """
    Notifies the author of the letter via email and if successful, updates the notified_at field for the letter.
    """
    author = letter.user.get_username()
    try:
        letter_link = f"{FRONTEND_URLS[0]}/letter/{letter.public_id}"
        subject = "A letter. Written for this exact moment."
        context = {
            "pen_name": letter.user.full_name,
            "cta": {"title": "View what you wrote", "link": letter_link},
            "footnote": True,
        }
        plaint_content = render_to_string("email/vault_unlock.txt", context=context)
        html_content = render_to_string("email/vault_unlock.html", context=context)
        send_mail(
            subject=subject,
            message=plaint_content,
            from_email=settings.FROM_EMAIL,
            recipient_list=[author],
            fail_silently=False,
            html_message=html_content,
        )
        letter.notified_at = datetime.now(UTC)
        letter.save()
        logger.info(
            "vault_letter_notified",
            letter_id=str(letter.public_id),
            user_id=letter.user_id,
        )
    except Exception:
        logger.exception(
            "vault_notification_failed",
            letter_id=str(letter.public_id),
            user_id=letter.user_id,
        )


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
    logger.info("scheduler_started")
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        vault_unlock_notification_polling_scheduler,
        trigger="interval",
        minutes=1,
        id="letter_polling",
        replace_existing=True,
    )
    scheduler.start()
