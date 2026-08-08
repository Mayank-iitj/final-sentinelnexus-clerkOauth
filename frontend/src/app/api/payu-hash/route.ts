import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// PayU credentials — used server-side only, never exposed to browser
const PAYU_MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY || "JiZpKZ";
const PAYU_MERCHANT_SALT = process.env.PAYU_MERCHANT_SALT || "z0Meu5m4fu1MtiiJjuqGrMuKeTSCwled";
const PAYU_BASE_URL = process.env.PAYU_BASE_URL || "https://test.payu.in/_payment";
const FRONTEND_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sentinelnexus.mayyanks.app";

export async function POST(req: NextRequest) {
  try {
    const { amount, productinfo, firstname, email } = await req.json();

    if (!amount || !productinfo || !firstname || !email) {
      return NextResponse.json(
        { error: "Missing required fields: amount, productinfo, firstname, email" },
        { status: 400 }
      );
    }

    const txnid = crypto.randomUUID();

    // PayU hash format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
    const hashString = `${PAYU_MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${PAYU_MERCHANT_SALT}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    return NextResponse.json({
      key: PAYU_MERCHANT_KEY,
      txnid,
      amount: String(amount),
      productinfo,
      firstname,
      email,
      hash,
      payu_url: PAYU_BASE_URL,
      surl: `${FRONTEND_BASE_URL}/payment/success`,
      furl: `${FRONTEND_BASE_URL}/payment/failure`,
    });
  } catch (err: any) {
    console.error("PayU hash generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate payment hash", detail: err.message },
      { status: 500 }
    );
  }
}
