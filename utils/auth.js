
class UserError extends Error {
	constructor(message, fileName, lineNumber) {
		super(message, fileName, lineNumber);
		if (!this.message) {
			this.message = message; // fixes missing message in Edge
		}
		this._isUserError = true; // x instanceof UserError does not work due to babel transforms
	}

	static fromError(e) {
		return new UserError(e.message);
	}
}

async function checkAuthenticated(ctx, next) {
	if (!ctx.state.user) {
		ctx.body = {Error:"Not Logged in "}
        ctx.throw(401)
	}

	return next();
}

module.exports = checkAuthenticated