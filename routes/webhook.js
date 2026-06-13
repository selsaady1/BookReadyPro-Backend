const Router = require('koa-router');
const { User,Transaction} = require('../models');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const unparsed = require('koa-body/unparsed.js')
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const router = new Router();

router.post('/webhook', async(ctx)=>{
    let event = ctx.request.body;
    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    if (endpointSecret) {
      // Get the signature sent by Stripe
      const signature = ctx.request.headers['stripe-signature'];
      console.log('signature heeer ' ,signature)
      console.log('event ' ,ctx.request.body)

      try {
        event = stripe.webhooks.constructEvent(
        ctx.request.body[unparsed],
          signature,
          endpointSecret
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
        return ctx.throw(400);
      }
    }
    switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
          console.log(`PaymentIntent for ${paymentIntent.id} was successful!`);
         let transaction = await Transaction.findOne({
              where:{
                paymentId:paymentIntent.id
              }
          })
          console.log('transaction', transaction)
          transaction.status = "success"
          await transaction.save()

          const credits = Math.round((parseFloat(paymentIntent.amount) / 100) / 39.99)
          console.log("new credits", credits)
          let user = await User.findOne({
              where:{
                  id:transaction.userId
              }
          })
          user.credit = parseInt(user.credit) + parseInt(credits)
          await user.save()
          // Then define and call a method to handle the successful payment intent.
          // handlePaymentIntentSucceeded(paymentIntent);
          break;
        case 'payment_method.attached':
          const paymentMethod = event.data.object;
          // Then define and call a method to handle the successful attachment of a PaymentMethod.
          // handlePaymentMethodAttached(paymentMethod);
          break;
        default:
          // Unexpected event type
          console.log(`Unhandled event type ${event.type}.`);
      }
      ctx.body={success:true}
    
})

module.exports = router