import bodyParser from 'body-parser';
import express from 'express';
import parseTgBody from "./middlewares/parseTgBody";
import newMessage from "./api/new-message";

const app = express();

app.use(express.static('/app'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.post('/new-message', parseTgBody, newMessage);

app.listen(process.env.PORT || 8080, () => {
    console.log(`listening on port ${process.env.PORT || 8080}`);
});
