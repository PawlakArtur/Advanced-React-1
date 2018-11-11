const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

const mutations = {
	async createItem(parent, args, ctx, info) { 
		const item = await ctx.db.mutation.createItem({
			data: {
				...args
			}
		}, info);

		return item;
	},
	updateItem(parent, args, ctx, info) {
		// first take a copy of the updates
		const updates = { ...args };
		// remove the ID from the  updates
		delete updates.id;
		// run the update method
		return ctx.db.mutation.updateItem({
			data: updates,
			where: {
				id: args.id
			},
		}, info);
	},
	async deleteItem(parent, args, ctx, info) {
		const where = { id: args.id };
		const item = await ctx.db.query.item({ where }, `{ id, title }`);
		return ctx.db.mutation.deleteItem({ where }, info);
	},
	async signup(parent, args, ctx, info) {
		args.email = args.email.toLowerCase();
		// hash their password
		const password = await bcrypt.hash(args.password, 10);
		// create the user in the database
		const user = await ctx.db.mutation.createUser({
			data: {
				...args,
				password,
				permissions: { set: ['USER'] }
			}
		}, info);
		// create JWT token for them
		const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
		// we set the jwt as a cookie on the respone
		ctx.response.cookie('token', token, {
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 *365, // 1 year cookie
		});
		// return the user to the browser
		return user;
	}
};

module.exports = mutations;
