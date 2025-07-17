// This is a Netlify Serverless Function for sending emails
// It will be accessible at /.netlify/functions/send-email

import { Resend } from "resend"

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    }
  }

  const { customerEmail, cartItems, amount, shippingOption, orderNotes, transactionRef, customerName } = JSON.parse(
    event.body,
  )

  if (!customerEmail || !cartItems || !amount || !transactionRef || !customerName) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing required email data." }),
    }
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY environment variable is not set.")
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server configuration error: Resend API Key missing." }),
    }
  }

  const resend = new Resend(RESEND_API_KEY)

  // Build the professional email content for the customer
  const customerEmailSubject = `Your Delola's Closet Order #${transactionRef} is Confirmed! 🎉`
  const customerEmailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - Delola's Closet</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            .header { background-color: #f8f8f8; padding: 20px; text-align: center; border-bottom: 1px solid #eee; }
            .header h1 { margin: 0; color: #555; }
            .content { padding: 20px 0; }
            .order-summary { background-color: #f9f9f9; border: 1px solid #eee; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .order-summary ul { list-style: none; padding: 0; }
            .order-summary li { margin-bottom: 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 0.9em; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
            .button { display: inline-block; background-color: #007bff; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Delola's Closet</h1>
            </div>
            <div class="content">
                <p>Hello ${customerName},</p>
                <p>Thank you for your recent purchase from Delola's Closet! We're thrilled to confirm your order.</p>
                <p>Your order number is <strong>#${transactionRef}</strong> and it has been successfully placed.</p>

                <div class="order-summary">
                    <h2>Order Summary:</h2>
                    <ul>
                        ${cartItems.map((item) => `<li>${item.qty} x ${item.name} – ₦${item.price.toLocaleString()}</li>`).join("")}
                    </ul>
                    <p><strong>Subtotal:</strong> ₦${(amount - (shippingOption.includes("₦") ? Number.parseFloat(shippingOption.split("₦")[1].replace(/,/g, "")) : 0)).toLocaleString()}</p>
                    <p><strong>Shipping:</strong> ${shippingOption}</p>
                    <p><strong>Grand Total:</strong> ₦${amount.toLocaleString()}</p>
                    ${orderNotes ? `<p><strong>Order Notes:</strong> ${orderNotes}</p>` : ""}
                </div>

                <p>We're now preparing your items for shipment. You'll receive another email with tracking information once your order is on its way.</p>
                <p>In the meantime, if you have any questions, please don't hesitate to reply to this email or contact our support team.</p>
                <p>Thank you for choosing Delola's Closet!</p>
                <p>Warmly,<br>The Delola's Closet Team</p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Delola's Closet. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `

  // Build the email content for the client/admin (remains similar)
  const clientEmailSubject = `NEW ORDER: #${transactionRef} from ${customerName} (${customerEmail})`
  const clientEmailHtml = `
    <h1>New Order Received!</h1>
    <p><strong>Order Reference:</strong> #${transactionRef}</p>
    <p><strong>Customer Name:</strong> ${customerName}</p>
    <p><strong>Customer Email:</strong> ${customerEmail}</p>
    <p><strong>Total Amount:</strong> ₦${amount.toLocaleString()}</p>
    <p><strong>Shipping Option:</strong> ${shippingOption}</p>
    ${orderNotes ? `<p><strong>Order Notes:</strong> ${orderNotes}</p>` : ""}
    <h2>Items:</h2>
    <ul>
      ${cartItems.map((item) => `<li>${item.qty} x ${item.name} (₦${item.price.toLocaleString()})</li>`).join("")}
    </ul>
    <p>Please process this order.</p>
  `

  try {
    // Send email to customer
    await resend.emails.send({
      from: "Delola's Closet <onboarding@resend.dev>", // Using Resend's default
      to: customerEmail,
      subject: customerEmailSubject,
      html: customerEmailHtml,
    })
    console.log(`Confirmation email sent to customer: ${customerEmail}`)

    // Send email to client/admin
    await resend.emails.send({
      from: "Delola's Closet <onboarding@resend.dev>", // Using Resend's default
      to: "trickyacemagic@gamil.com", // <<< IMPORTANT: Replace with your client's actual email address
      subject: clientEmailSubject,
      html: clientEmailHtml,
    })
    console.log(`New order notification sent to client.`)

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Emails sent successfully!" }),
    }
  } catch (error) {
    console.error("Error sending emails:", error)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to send emails.", error: error.message }),
    }
  }
}
