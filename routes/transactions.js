const Router = require('koa-router');
const { User,Transaction} = require('../models');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


const router = new Router();


router.post('/pay',  async (ctx) => { 
    const user = ctx.state.user
    try{
    if(!user.stripeCustomerId){
        const customer = await stripe.customers.create({
          email:user.email
        });
        user.stripeCustomerId = customer.id
        await user.save()
    }
    const {amount} = ctx.request.body 
    if( Math.floor(amount / 39.99) == 0)
        ctx.throw(400,"not valid amount error")
    let metadata = {}
    if(user.utmSource)
      metadata.referred_from = user.utmSource
    const session = await stripe.checkout.sessions.create({
            line_items: [
              {
                // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                price: 'price_1KfUCEJvpmtTovjQBoFPkLMm',
                quantity: Math.floor(amount / 39.99),
              },
            ],
            metadata,
            payment_intent_data:{
              metadata
            },
            mode: 'payment',
            success_url: `https://app.bookreadypro.com/?success=true`,
            cancel_url: `https://app.bookreadypro.com/?canceled=true`,
            customer:user.stripeCustomerId
          });
    Transaction.create({
          paymentId:session.payment_intent,
          amount,
          status:'pending',
          userId:user.id
      })
    

    ctx.body ={ paymentIntentSecret:session.url }
    }
    catch (err){
        ctx.throw(404,'error')
    }
})


module.exports = router