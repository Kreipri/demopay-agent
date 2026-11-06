import { app } from "./app.ts";
app.listen(Number(process.env.PORT ?? 3001), "127.0.0.1", () =>
  console.log("DemoPay API ready on http://127.0.0.1:3001"),
);
