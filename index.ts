import express, { Application, Request, Response } from "express";
import { PORT } from "./app/config/env.js";

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/", (req: Request, res: Response) => {
    res.send("Hello World!");
});

app.listen(PORT || 8000, () => {
    console.log(`Server started on port http://localhost:${PORT || 8000}`);
});
