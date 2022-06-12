const express = require("express");
import { getURLs, createUrl, deleteUrl, updateUrl } from "./express-mongodb";
const bodyParser = require("body-parser");
import { isValidUrl } from "./validate";
const app = express();
app.use(bodyParser.json());

app.get("/", async (req: any, res: any) => {
  try {
    const data = await getURLs();
    res.status(200).send(data);
  } catch (err) {
    console.error(err);
  }
});
app.post("/", async (req: any, res: any) => {
  if (isValidUrl(req.body.url)) {
    try {
      const result = await createUrl(req.body.url);
      res.status(200).send(result);
    } catch (err) {
      console.error(err);
    }
  } else {
    res.send("Invalid URL");
  }
});

app.delete("/", async (req: any, res: any) => {
  if (isValidUrl(req.body.url)) {
    try {
      const result = await deleteUrl(req.body.url);
      res.status(200).send(result);
    } catch (err) {
      console.error(err);
    }
  } else {
    res.send("Invalid URL");
  }
});

app.put("/", async (req: any, res: any) => {
  console.log("in update phase");
  if (req.body.newUrl && req.body.oldUrl) {
    try {
      const result = await updateUrl(req.body.oldUrl, req.body.newUrl);
      res.status(200).send(result);
    } catch (err) {
      console.error(err);
    }
  } else {
    res.send("either newUrl or oldUrl is invalid");
  }
});
export default app;
