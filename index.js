import server from "./config/server";
import "./config/database";

const PORT = process.env.PORT || 3500;
server.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});
