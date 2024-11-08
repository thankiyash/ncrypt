from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from app.core.config import settings
from pydantic import EmailStr

async def send_invitation_email(
    email_to: EmailStr,
    user_name: str,
    role_name: str,
    invitation_link: str
):
    """
    Send invitation email to new user
    """
    # Configure email client (you'll need to add SMTP settings to config.py)
    conf = ConnectionConfig(
        MAIL_USERNAME=settings.SMTP_USER,
        MAIL_PASSWORD=settings.SMTP_PASSWORD,
        MAIL_FROM=settings.SMTP_FROM,
        MAIL_PORT=settings.SMTP_PORT,
        MAIL_SERVER=settings.SMTP_HOST,
        MAIL_SSL_TLS=True,
        USE_CREDENTIALS=True
    )
    
    message = MessageSchema(
        subject=f"Invitation to Join Password Manager - {role_name} Role",
        recipients=[email_to],
        body=f"""
        Hello {user_name},

        You have been invited to join the Password Manager system as a {role_name}.
        
        Click the following link to accept the invitation and set up your account:
        {invitation_link}
        
        This invitation will expire in 48 hours.
        
        Best regards,
        Password Manager Team
        """,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message)