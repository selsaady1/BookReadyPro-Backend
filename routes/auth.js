const Router = require('koa-router');
const passport = require('koa-passport');
const { User } = require('../models')
const bcrypt = require('bcryptjs');

const router = new Router();

router.get('/',async(ctx)=>{
    ctx.body = {success:true}
})

router.post('/auth/register', async (ctx) => {
    const salt = bcrypt.genSaltSync();
    const hash = bcrypt.hashSync(ctx.request.body.password, salt);
    const {name, email,utmMedium,utmSource,utmCampaign} = ctx.request.body
    const user = await User.create({name,email, password:hash ,utmCampaign,utmMedium,utmSource});

    return passport.authenticate('local', (err, user, info, status) => {
        const {name,email,credit} = user
        if (user) {
            ctx.login(user);
            ctx.body = { name,email,credit,isLoggedIn:true};
        } else {
            ctx.status = 400;
            ctx.body = { status: 'error' };
        }
    })(ctx);
});


router.post('/auth/login', async (ctx) => {
    return passport.authenticate('local', (err, user, info, status) => {
        if (user) {
            ctx.login(user);
            const {name,email,credit} = user
            ctx.body = { name,email,credit,isLoggedIn:true};
        } else {
            ctx.status = 400;
            ctx.body = { status: 'error',isLoggedIn: false };
        }
    })(ctx);
});

router.get('/auth/logout', async (ctx) => {
    if (ctx.isAuthenticated()) {
        ctx.logout();
        ctx.body = { success:true};
    } else {
        ctx.body = { success: false };
        ctx.throw(401);
    }
});

router.get('/auth/status', async (ctx) => {
    if (ctx.isAuthenticated()) {
        const {name,email,credit} = ctx.state.user
        ctx.body = {
            name,email,credit,isLoggedIn:true
        }
    } else {
        ctx.body = { isLoggedIn: false };
    }
});

module.exports = router;
