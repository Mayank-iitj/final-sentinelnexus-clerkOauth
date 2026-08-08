from fastapi import APIRouter, Depends, HTTPException, Request, Form
from sqlalchemy.orm import Session
from app.api.v1.deps import get_db, get_current_user
from app.models.user import User
from app.models.payment import Payment
from app.core.config import get_settings
import hashlib
import uuid

router = APIRouter(prefix="/payments", tags=["payments"])
settings = get_settings()

@router.post("/payu/hash")
def generate_payu_hash(
    amount: float,
    productinfo: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txnid = str(uuid.uuid4())
    
    # Store pending payment in DB
    payment = Payment(
        transaction_id=txnid,
        user_id=current_user.id,
        amount=amount,
        product_info=productinfo,
        status="PENDING"
    )
    db.add(payment)
    db.commit()

    # Generate PayU hash: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
    hash_sequence = f"{settings.PAYU_MERCHANT_KEY}|{txnid}|{amount}|{productinfo}|{current_user.username}|{current_user.email}|||||||||||{settings.PAYU_MERCHANT_SALT}"
    hash_value = hashlib.sha512(hash_sequence.encode('utf-8')).hexdigest()

    return {
        "key": settings.PAYU_MERCHANT_KEY,
        "txnid": txnid,
        "amount": amount,
        "productinfo": productinfo,
        "firstname": current_user.username,
        "email": current_user.email,
        "hash": hash_value,
        "surl": f"{settings.BACKEND_BASE_URL}/api/v1/payments/payu/success",
        "furl": f"{settings.BACKEND_BASE_URL}/api/v1/payments/payu/failure"
    }

from fastapi.responses import RedirectResponse
import starlette.status as http_status

@router.post("/payu/success")
async def payu_success(request: Request, db: Session = Depends(get_db)):
    form_data = await request.form()
    
    status = form_data.get("status")
    txnid = form_data.get("txnid")
    amount = form_data.get("amount")
    productinfo = form_data.get("productinfo")
    firstname = form_data.get("firstname")
    email = form_data.get("email")
    received_hash = form_data.get("hash")

    # Reverse hash for success: salt|status|||||||||||email|firstname|productinfo|amount|txnid|key
    hash_sequence = f"{settings.PAYU_MERCHANT_SALT}|{status}|||||||||||{email}|{firstname}|{productinfo}|{amount}|{txnid}|{settings.PAYU_MERCHANT_KEY}"
    expected_hash = hashlib.sha512(hash_sequence.encode('utf-8')).hexdigest()

    if received_hash != expected_hash:
        return RedirectResponse(
            url=f"{settings.FRONTEND_BASE_URL}/payment/failure?txnid={txnid}&error=invalid_hash",
            status_code=http_status.HTTP_303_SEE_OTHER
        )
    
    payment = db.query(Payment).filter(Payment.transaction_id == txnid).first()
    if not payment:
        return RedirectResponse(
            url=f"{settings.FRONTEND_BASE_URL}/payment/failure?txnid={txnid}&error=payment_not_found",
            status_code=http_status.HTTP_303_SEE_OTHER
        )
        
    payment.status = "SUCCESS"
    
    user = db.query(User).filter(User.id == payment.user_id).first()
    if user:
        user.subscription_tier = productinfo
        
    db.commit()
    
    return RedirectResponse(
        url=f"{settings.FRONTEND_BASE_URL}/payment/success?txnid={txnid}&plan={productinfo}",
        status_code=http_status.HTTP_303_SEE_OTHER
    )

@router.post("/payu/failure")
async def payu_failure(request: Request, db: Session = Depends(get_db)):
    form_data = await request.form()
    txnid = form_data.get("txnid")
    
    payment = db.query(Payment).filter(Payment.transaction_id == txnid).first()
    if payment:
        payment.status = "FAILED"
        db.commit()
        
    return RedirectResponse(
        url=f"{settings.FRONTEND_BASE_URL}/payment/failure?txnid={txnid}",
        status_code=http_status.HTTP_303_SEE_OTHER
    )
