from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Dict, Any
from ..core.email_service import email_service

router = APIRouter(prefix="/inquiry", tags=["Direct Inquiry & Admin Notification"])

class InquiryRequest(BaseModel):
    property_id: str
    property_title: str
    society_name: str
    user_name: str
    user_email: str
    user_phone: str
    message: str

@router.post("/submit")
def submit_direct_inquiry(payload: InquiryRequest) -> Dict[str, Any]:
    """
    Submits user inquiry and notifies Rihaish Admin via email (abdullahkh1298@gmail.com)
    and WhatsApp (+92 03122677981).
    """
    res = email_service.send_inquiry_alert_to_admin(
        property_id=payload.property_id,
        property_title=payload.property_title,
        society_name=payload.society_name,
        user_name=payload.user_name,
        user_email=payload.user_email,
        user_phone=payload.user_phone,
        message=payload.message
    )
    return res
