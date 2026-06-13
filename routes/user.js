const Router = require('koa-router');
const router = new Router();

router.get('/user', async (ctx) => {
    if (ctx.isAuthenticated()) {
       const {name,email,credit} = ctx.state.user 
        ctx.body = {
                name,email,credit
        };
    } else {
        ctx.body = { success: false };
        ctx.throw(401);
    }
});


module.exports = router;
