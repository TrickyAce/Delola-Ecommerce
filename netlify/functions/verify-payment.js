// This is a Netlify Serverless Function
// It will be accessible at /.netlify/functions/verify-payment

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    }
  }

  const { reference, customerEmail, cartItems, amount, shippingOption, orderNotes } = JSON.parse(event.body)

  if (!reference) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Transaction reference is required." }),
    }
  }

  // IMPORTANT: Use your Paystack Secret Key from environment variables
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

  if (!PAYSTACK_SECRET_KEY) {
    console.error("PAYSTACK_SECRET_KEY environment variable is not set.")
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server configuration error: Paystack Secret Key missing." }),
    }
  }

  try {
    // Call Paystack's verification endpoint
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    })

    const data = await paystackResponse.json()

    if (!paystackResponse.ok || !data.status || data.data.status !== "success") {
      console.error("Paystack verification failed:", data)
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Payment verification failed.", details: data }),
      }
    }

    // Payment is successfully verified!
    console.log("Payment successfully verified by server:", data.data)
    console.log("Customer Email:", customerEmail)
    console.log("Cart Items:", cartItems)
    console.log("Amount (Naira):", amount)
    console.log("Shipping Option:", shippingOption)
    console.log("Order Notes:", orderNotes)

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Payment verified successfully!",
        transaction: data.data,
        customerEmail,
        cartItems,
        amount,
        shippingOption,
        orderNotes,
      }),
    }
  } catch (error) {
    console.error("Error verifying payment:", error)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error during verification." }),
    }
  }
}
