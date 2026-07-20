const koa = require('koa')
const json = require('koa-json')

const KoaRouter = require('koa-router')
var cors = require('koa2-cors');
const etag = require('koa-etag');
const conditional = require('koa-conditional-get');
require('dotenv').config()
const session = require('koa-session')
require('./database')
const passport = require('koa-passport')

const koaBody = require('koa-body');



const app = new koa()
const jobs = require('./jobs')
app.keys = [process.env.SESSION_SECRET || 'dev-only-change-me']
app.use(session({maxAge:365 * 24 * 60 * 60 * 1000}, app))


app.use(koaBody({
	includeUnparsed:true,
	multipart: true,
	urlencoded: true,
	json:true,
	jsonStrict:false,
	formLimit:'50mb',
	parsedMethods:['POST', 'PUT', 'PATCH','DELETE']
 }))
 app.use(cors({
	origin: process.env.CORS_ORIGIN || 'https://qnowconsulting.com',
	maxAge: 3600,
	credentials: true,
	allowMethods: ['GET', 'POST', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'],
	allowHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'ETag', 'Accept', 'Cache-Control', 'If-None-Match','Authorization'],
	exposeHeaders: ['ETag', 'Cache-Control', 'If-None-Match','WWW-Authenticate', 'Server-Authorization'],
}));
 app.use(conditional());
 app.use(etag());

app.use(async (ctx, next) => {
	if (ctx.method === 'GET' && ctx.path === '/health') {
		ctx.status = jobs.isReady() ? 200 : 503
		ctx.body = {
			status: jobs.isReady() ? 'ok' : 'starting',
			queue: jobs.isReady() ? 'ready' : 'starting',
			commit: process.env.RENDER_GIT_COMMIT || null,
		}
		return
	}
	await next()
})




require('./auth');
app.use(passport.initialize())
app.use(passport.session())

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user')
const fileRoutes = require('./routes/file')
const transactionRoutes = require('./routes/transactions')
const webhook = require("./routes/webhook")
const checkAuth = require('./utils/auth')
app.use(authRoutes.routes());
app.use(webhook.routes());
app.use(checkAuth)
app.use(userRoutes.routes());
app.use(fileRoutes.routes());
app.use(transactionRoutes.routes())
// app.use(async ctx=> ctx.body ={ welcome:"hello "})
async function start() {
	await jobs.init()
	app.listen(process.env.PORT || 8080, () => console.log('[bookreadypro] server started'))
}

start().catch((error) => {
	console.error('[bookreadypro] startup failed', error)
	process.exit(1)
})
