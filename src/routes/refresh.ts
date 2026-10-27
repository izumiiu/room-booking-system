import  express  from "express";
const router = express.Router();
import handleRefresh from "../controllers/refreshController.js";

router.route('/').post(handleRefresh);

export default router;