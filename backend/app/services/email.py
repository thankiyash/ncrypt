# backend/app/services/email.py
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content, TemplateId
from app.core.config import settings
from pydantic import EmailStr
from typing import Dict, Any
import json

class EmailService:
    def __init__(self):
        self.client = SendGridAPIClient(settings.SENDGRID_API_KEY)
        self.from_email = Email(settings.SENDGRID_FROM_EMAIL)

    async def send_invitation_email(
        self,
        email_to: EmailStr,
        user_name: str,
        role_name: str,
        invitation_token: str,
    ) -> None:
        """
        Send invitation email using SendGrid
        """
        invitation_link = f"{settings.FRONTEND_URL}/accept-invite/{invitation_token}"
        
        # Create dynamic template data
        template_data = {
            "user_name": user_name,
            "role_name": role_name,
            "invitation_link": invitation_link,
            "company_name": settings.COMPANY_NAME,
            "expires_in_hours": 48
        }

        message = Mail(
            from_email=self.from_email,
            to_emails=To(email_to),
        )
        
        # Set SendGrid template ID
        message.template_id = TemplateId(settings.SENDGRID_INVITATION_TEMPLATE_ID)
        message.dynamic_template_data = template_data

        try:
            response = self.client.send(message)
            if response.status_code not in (200, 201, 202):
                raise Exception(f"SendGrid API returned status code {response.status_code}")
        except Exception as e:
            print(f"Failed to send invitation email: {str(e)}")
            raise Exception("Failed to send invitation email")

# Create a global instance
email_service = EmailService()