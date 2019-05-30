const Koa = require('koa');
const serve = require('koa-static');
const Router = require('koa-router');
const koaBody = require('koa-body');
const path = require('path');

const port = process.env.port || 80;
const app = new Koa();
const router = new Router();

app.use(serve(path.resolve(__dirname, '..', 'page')));
app.use(koaBody());

router.get('/item/:id', ctx => {
    ctx.body = {
        id: ctx.params.id,
        name: 'Tom'
    };
});

router.post('/item/:id', ctx => {
    const body = ctx.request.body;
    ctx.body = {
        id: ctx.params.id,
        text: `Hi, ${body.name}`
    };
});

app.use(router.routes());
app.listen(port, () => {
    console.log(`example is running on port: ${port}`);
    process.send && process.send(port)
});